// Persist BEFORE transmission. An interrupted process always recovers as unknown.
export async function submitSale({ draft, catalog, api, persist, uuid }) {
  const { requestBody } = await import('./sale.mjs');
  let attempt = draft.attempt || { delivery:'prepared',key: uuid(), body: requestBody(draft, catalog), server: api.identity };
  if (attempt.server !== api.identity) throw new Error('Consulta el resultado en el servidor original antes de cambiar de conexión.');
  let sending = { ...draft, status: 'unknown', attempt };
  await persist(sending);
  let registrationStarted = false;
  try {
    // Always consult first; this also recovers a response lost after COMMIT.
    const previous = await api.status(attempt.key);
    let evidence = previous;
    let receipt = previous?.receipt;
    if(previous?.status==='cancelled'){const cancelled={...sending,status:'cancelled'};await persist(cancelled);return cancelled;}
    if (!receipt) {
      if (previous?.status !== 'not_found') throw new Error('No se pudo determinar el estado anterior.');
      if (!['admin-sales-normal-v1','admin-sales-wholesale-v2'].includes(attempt.body?.pricingVersion) || catalog.pricingVersion !== attempt.body.pricingVersion) {
        const error = new Error('El intento anterior no fue registrado. Actualiza el catálogo y revisa el borrador; no se enviará con el descuento fijo.');
        error.definitive = true;
        registrationStarted = true;
        throw error;
      }
      if(attempt.delivery==='rejected'&&['STALE_DATA','MOBILE_PAYMENT_CLIENT_UPDATE_REQUIRED'].includes(attempt.rejectionCode)){attempt={...attempt,body:requestBody(draft,catalog),delivery:'prepared'};sending={...sending,attempt};await persist(sending);}
      registrationStarted = true;
      attempt={...attempt,delivery:'sent'};sending={...sending,attempt};await persist(sending);
      evidence = await api.register(attempt.key, attempt.body);
      receipt = evidence.receipt;
    }
    if (!receipt?.id || !receipt.folio || receipt.status !== 'confirmed' || !Array.isArray(receipt.items) || !Number.isFinite(receipt.total)) throw new Error('Respuesta sin evidencia de confirmación.');
    const confirmed = { ...sending, status: 'confirmed', receipt, inventoryPending:evidence.inventoryPending??[], serverRevision: evidence.revision, serverGeneration: evidence.generation };
    await persist(confirmed);
    return confirmed;
  } catch (error) {
    // A definite validation rejection allows explicit review, but never silently retries a changed body.
    if(registrationStarted&&error.definitive) sending={...sending,attempt:{...sending.attempt,delivery:'rejected',rejectionCode:error.code||null}};
    const next = { ...sending, status: registrationStarted && error.definitive ? 'rejected' : error.offline ? 'offline' : 'unknown', error: error.message };
    await persist(next);
    return next;
  }
}
