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
        error.status = response.status;
        error.code = body.error?.code;
        throw error;
      }
      return body;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError || /fetch failed|network request failed|unexpected end of stream/i.test(error.message||'')) { error.offline = true; error.message = path.startsWith('/inventory')
        ? 'Sin respuesta de Admin. Consulta el resultado del inventario antes de reintentar.'
        : path.startsWith('/sales/history') ? 'Historial no disponible. Los tickets y datos locales siguen conservados; vuelve a consultar al recuperar la conexión.'
        : path.startsWith('/hardware') ? 'Sin respuesta de Admin. Conservamos el intento de alta; consulta su resultado antes de reintentar.'
        : 'Sin respuesta de Admin. Conservamos la venta; verifica la conexión y consulta el estado antes de reintentar.'; }
      throw error;
    } finally { clearTimeout(timer); }
  }
  const query=o=>Object.entries(o||{}).filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
  return { identity: base, salesHistory:o=>call('/sales/history?'+query(o)), officialSale:(id,o)=>call('/sales/history/'+encodeURIComponent(id)+'?'+query(o)), hardwareCreationOptions:()=>call('/hardware/creation-options'), productCreationStatus:key=>call('/hardware/operations/'+encodeURIComponent(key)), createHardware:(key,body)=>call('/hardware/products',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(body)}), catalog: () => call('/catalog'), inventory: () => call('/inventory'),
    inventoryHistory: id => call(`/inventory/products/${encodeURIComponent(id)}/history`),
    inventoryStatus: key => call(`/inventory/operations/${encodeURIComponent(key)}`),
    saveInventory: (key, body) => call('/inventory/operations', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) }),
    status: key => call(`/sales/status/${encodeURIComponent(key)}`), register: (key, body) => call('/sales', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) }) };
}
