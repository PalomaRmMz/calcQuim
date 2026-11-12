import { normalizeText } from './text.mjs';

export function validateInventory(value) {
  const decimal = v => typeof v === 'string' && /^-?\d+(?:\.\d+)?$/.test(v);
  if (!value || typeof value.enabled !== 'boolean' || !Array.isArray(value.products) ||
      !['operational', 'synthetic'].includes(value.environment) || !Number.isFinite(Date.parse(value.generatedAt)))
    throw new Error('La respuesta de inventario no es válida.');
  const ids = new Set();
  const writable = value.permissions?.initial || value.permissions?.count;
  if (writable && (!Number.isSafeInteger(value.revision) || typeof value.generation !== 'string' || !value.generation))
    throw new Error('No hay revisión de inventario válida para guardar.');
  for (const p of value.products) {
    const c = p.composition;
    if (writable && (!Array.isArray(p.packOptions) || (p.initialMovementId !== null && typeof p.initialMovementId !== 'string') ||
        p.packOptions.some(o => !o.id || typeof o.name !== 'string' || !/^\d+$/.test(o.factor) || BigInt(o.factor) <= 1n)))
      throw new Error('Las presentaciones autorizadas del inventario no son válidas.');
    if (p.productId == null || ids.has(String(p.productId)) || typeof p.name !== 'string' || !p.name ||
        typeof p.unit !== 'string' || !['unknown', 'estimated', 'calculated'].includes(p.status) ||
        (p.quantity !== null && !decimal(p.quantity)) ||
        (p.status === 'unknown' && p.quantity !== null) || (p.status !== 'unknown' && p.quantity === null) ||
        (c && (typeof c.known !== 'boolean' || (c.known &&
          (!/^\d+$/.test(p.quantity) || ![c.closedPackages, c.looseUnits, c.factor].every(v => /^\d+$/.test(String(v))) ||
           BigInt(c.factor) <= 1n || BigInt(c.closedPackages) * BigInt(c.factor) + BigInt(c.looseUnits) !== BigInt(p.quantity))))))
      throw new Error('El inventario contiene cantidades o composición inconsistentes.');
    ids.add(String(p.productId));
  }
  return value;
}

export function searchInventory(products, query) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return products.filter(p => terms.every(term => normalizeText(`${p.name} ${p.productId}`).includes(term)));
}
