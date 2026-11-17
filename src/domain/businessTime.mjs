export function businessTimestamp(value, options = {}) {
  return new Date(value).toLocaleString('es-MX', {...options, timeZone:'America/Mexico_City'});
}
