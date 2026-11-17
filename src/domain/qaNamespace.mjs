export function qaStorageKey(key, runId = '') {
  if (!runId) return key;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(runId)) throw new Error('Identificador de ejecución QA inválido.');
  return `nexo.audit.${runId}.${key}`;
}
