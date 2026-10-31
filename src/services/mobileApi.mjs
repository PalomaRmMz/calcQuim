export function serverUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Usa solamente la URL base del servidor.');
  const host = url.hostname;
  if (!/^(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/.test(host)) throw new Error('Configura una dirección de red local.');
  return url.origin;
}
export function createMobileApi(base, token, fetcher = fetch) {
  base = serverUrl(base);
  async function call(path, options = {}) {
    if (!token) throw new Error('Introduce la credencial móvil autorizada.');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetcher(`${base}/api/mobile/v1${path}`, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
      const body = await response.json();
      if (!response.ok) {
        const error = new Error(body.error?.message || `Error del servidor (${response.status}).`);
        error.definitive = [400, 401, 403, 412, 422].includes(response.status);
        throw error;
      }
      return body;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError || /fetch failed|network request failed|unexpected end of stream/i.test(error.message||'')) { error.offline = true; error.message = 'Sin respuesta de Admin. Conservamos la venta; verifica la conexión y consulta el estado antes de reintentar.'; }
      throw error;
    } finally { clearTimeout(timer); }
  }
  return { identity: base, catalog: () => call('/catalog'), status: key => call(`/sales/status/${encodeURIComponent(key)}`), register: (key, body) => call('/sales', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) }) };
}
