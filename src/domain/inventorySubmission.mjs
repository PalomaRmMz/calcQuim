export const INVENTORY_ATTEMPTS_KEY = 'calcquim.inventory.attempts.v1';
export function createInventoryAttemptStorage(storage) {
  let queue = Promise.resolve();
  async function read() {
    const raw = await storage.getItem(INVENTORY_ATTEMPTS_KEY);
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (value?.schema !== 1 || !Array.isArray(value.attempts) || value.attempts.some(a =>
      !a.key || !a.server || !a.body || !a.credentialFingerprint || !a.baseline?.product || !a.baseline?.snapshot || !a.form ||
      !['prepared','unknown','confirmed','rejected'].includes(a.phase)))
      throw new Error('El registro local de inventario requiere revisión. No se sobrescribió.');
    return value.attempts;
  }
  return { async all() { await queue; return read(); }, save(attempt) {
    const task = queue.then(async () => {
      const attempts = await read(), index = attempts.findIndex(a => a.key === attempt.key && a.server === attempt.server);
      if (index < 0) attempts.push(attempt); else attempts[index] = attempt;
      await storage.setItem(INVENTORY_ATTEMPTS_KEY, JSON.stringify({ schema: 1, attempts }));
    });
    queue = task.catch(() => {});
    return task;
  } };
}
export const unresolvedInventory = attempts => attempts.filter(a => ['prepared','unknown'].includes(a.phase));

export async function resolveInventoryAttempt({ attempt, api, credentialFingerprint, persist, allowSend = false }) {
  if (attempt.server !== api.identity || attempt.credentialFingerprint !== credentialFingerprint)
    throw new Error('Consulta la operación con la conexión y credencial originales.');
  const save = async value => { await persist(value); return value; };
  // Persist before any network traffic; restart must recover the same key/body.
  await save({ ...attempt, phase: 'unknown' });
  let sending = false;
  try {
    let result = await api.inventoryStatus(attempt.key);
    if (result.status === 'not_found') {
      if (!allowSend) return save({ ...attempt, phase: 'prepared', error: 'El servidor no tiene registro de esta operación. Puedes revisar y reintentar el mismo conteo.' });
      sending = true;
      result = await api.saveInventory(attempt.key, attempt.body);
    }
    if (result.status !== 'confirmed' || result.operationId !== attempt.key || !result.movementId)
      throw new Error('La respuesta no contiene evidencia de guardado.');
    return save({ ...attempt, phase: 'confirmed', result, error: '' });
  } catch (e) {
    let rejected = false;
    if (sending && e.definitive) {
      try {
        const status = await api.inventoryStatus(attempt.key);
        if (status.status === 'confirmed' && status.operationId === attempt.key && status.movementId)
          return save({ ...attempt, phase: 'confirmed', result: status, error: '' });
        rejected = status.status === 'not_found';
      } catch { /* No proof of absence: keep locked and query again explicitly. */ }
    }
    return save({ ...attempt, phase: rejected ? 'rejected' : 'unknown', error: e.message,
      conflict: e.status === 412, errorCode: e.code });
  }
}
