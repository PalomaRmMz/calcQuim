import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { openInventoryQa } from '../integration/inventory-qa-context.mjs';
import { createMobileApi } from '../src/services/mobileApi.mjs';
import { captureBody } from '../src/domain/inventoryCapture.mjs';
const prepared = new URL('file:///D:/ReactApps/calcQuim-admin/artifacts/web-paquetes-20261107/source/');
const { catalogChoices } = await import(new URL('server/src/mobile/catalog.mjs', prepared));
const { makeLine, requestBody, repriceLines } = await import(new URL('server/src/mobile/sale.mjs', prepared));
const { wholesaleEnabled, WHOLESALE_VERSION } = await import(new URL('src/domain/wholesalePricing.mjs', prepared));

test('conteo Android y ventas web comparten stock y apertura automática solo en ventas, en QA existente', async () => {
  const q = await openInventoryQa();
  try {
    const fixture = JSON.parse(await readFile(new URL('../.artifacts/inventory-android-fixtures.private.json', import.meta.url), 'utf8')).fixtures.pack4;
    assert.match(fixture.name, /^QA Android /);
    const api = createMobileApi(q.base, q.token), before = await q.service.operations();
    assert.equal(before.data.products.find(p => p.id === fixture.id).name, fixture.name);
    const count = async (closed, loose) => {
      const s = await api.inventory(), p = s.products.find(p => p.productId === fixture.id);
      await api.saveInventory(randomUUID(), captureBody(s, p, { presentationId: fixture.packId, closedPackages: closed, looseUnits: loose, reason: 'Compatibilidad web QA' }));
    };
    const sell = async id => {
      const s = await q.service.read(), c = catalogChoices(s.data).find(c => c.refId === id);
      assert.ok(c);
      const line = makeLine(c, c.tariffs[0], 'quantity', '1', randomUUID());
      const body = requestBody({ lines: repriceLines([line]), payment: 'Efectivo' }, { ...s, pricingVersion: wholesaleEnabled(s.data) ? WHOLESALE_VERSION : 'admin-sales-normal-v1' });
      await q.service.command({ name: 'createCommercialSale', args: [body], revision: s.revision, generation: s.generation, requestKey: `qa-android-web:${randomUUID()}`, channel: 'WEB' });
    };
    await count('4','0');
    const eventsBefore = (await q.service.inventory()).packInventory.events.filter(e => e.product_id === String(fixture.id) && e.action === 'automatic_open').length;
    await sell(fixture.unitId);
    let p = (await api.inventory()).products.find(p => p.productId === fixture.id);
    assert.equal(p.quantity, '15'); assert.equal(p.composition.closedPackages, '3'); assert.equal(p.composition.looseUnits, '3');
    await sell(fixture.packId);
    p = (await api.inventory()).products.find(p => p.productId === fixture.id);
    assert.equal(p.quantity, '11'); assert.equal(p.composition.closedPackages, '2'); assert.equal(p.composition.looseUnits, '3');
    const after = await q.service.operations();
    assert.equal(after.inventory.packInventory.events.filter(e => e.product_id === String(fixture.id) && e.action === 'automatic_open').length, eventsBefore + 1);
    for (const sale of before.data.sales) assert.deepEqual(after.data.sales.find(s => s.id === sale.id), sale);
    assert.deepEqual(after.data.procurement.purchases, before.data.procurement.purchases);
    for (const product of before.inventory.products.filter(p => p.productId !== fixture.id))
      assert.deepEqual(after.inventory.products.find(p => p.productId === product.productId), product);
    assert.equal(after.data.sales.length, before.data.sales.length + 2);
  } finally { await q.pool.end(); }
});
