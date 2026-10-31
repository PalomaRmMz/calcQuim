// Persist BEFORE transmission. An interrupted process always recovers as unknown.
export async function submitSale({ draft, catalog, api, persist, uuid }) {
  const { requestBody } = await import('./sale.mjs');
  const attempt = draft.attempt || { key: uuid(), body: requestBody(draft, catalog), server: api.identity };
  if (attempt.server !== api.identity) throw new Error('Consulta el resultado en el servidor original antes de cambiar de conexión.');
  const sending = { ...draft, status: 'unknown', attempt };
  await persist(sending);
  let registrationStarted = false;
  try {
    // Always consult first; this also recovers a response lost after COMMIT.
    const previous = await api.status(attempt.key);
    let evidence = previous;
    let receipt = previous?.receipt;
    if (!receipt) {
      if (previous?.status !== 'not_found') throw new Error('No se pudo determinar el estado anterior.');
      registrationStarted = true;
      evidence = await api.register(attempt.key, attempt.body);
      receipt = evidence.receipt;
    }
    if (!receipt?.id || !receipt.folio || receipt.status !== 'confirmed' || !Array.isArray(receipt.items) || !Number.isFinite(receipt.total)) throw new Error('Respuesta sin evidencia de confirmación.');
    const confirmed = { ...sending, status: 'confirmed', receipt, serverRevision: evidence.revision, serverGeneration: evidence.generation };
    await persist(confirmed);
    return confirmed;
  } catch (error) {
    // A definite validation rejection allows explicit review, but never silently retries a changed body.
    const next = { ...sending, status: registrationStarted && error.definitive ? 'rejected' : error.offline ? 'offline' : 'unknown', error: error.message };
    await persist(next);
    return next;
  }
}
