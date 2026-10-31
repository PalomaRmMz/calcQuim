import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const admin = new URL('file:///D:/ReactApps/calcQuim-admin/');
const require = createRequire(new URL('server/package.json', admin));
const pg = require('pg');
const { loadOperationalConfig } = await import(new URL('server/src/config/operational.mjs', admin));
const { migrate } = await import(new URL('server/src/db/migrate.mjs', admin));
const { createDatasetService } = await import(new URL('server/src/services/dataset.mjs', admin));
const { createApp } = await import(new URL('server/src/app.mjs', admin));
const { catalogChoices } = await import(new URL('server/src/mobile/catalog.mjs', admin));

test('integración PostgreSQL aislada: móvil, desglose, origen, reinicio, idempotencia e inventario', async t => {
  const config = await loadOperationalConfig('calcquim_activation_test');
  assert.equal(config.database.database, 'calcquim_activation_test');
  const pool = new pg.Pool(config.database), schema = `calcquim_test_mobile_${randomUUID().replaceAll('-', '')}`;
  let server, service, state, base;
  const token = randomUUID(), key = randomUUID();
  const command = async (name, ...args) => state = await service.command({ name, args, revision: state.revision, generation: state.generation, requestKey: randomUUID() });
  const api = async (path, options = {}, auth = token) => {
    const response = await fetch(`${base}/api/mobile/v1${path}`, { ...options, headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json', ...options.headers } });
    return { status: response.status, body: await response.json() };
  };
  const stock = async id => (await service.inventory()).products.find(p => p.productId === id).quantity;
  const start = async () => {
    service = createDatasetService(pool, schema);
    server = createApp({ ping: async () => true }, service, 'synthetic').listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`;
  };
  try {
    await migrate(pool, schema);
    service = createDatasetService(pool, schema); state = await service.read();
    await command('addCategory', { name: 'Limpieza sintética', active: true });
    await command('addProductLine', { name: 'Carisma sintético', categoryId: 1, active: true });
    await command('addPriceGroup', { name: 'Lavatrastes sintético', price: 20, active: true });
    for (const name of ['Limón sintético', 'Lavanda sintética']) await command('addProduct', { name, unit: 'litro', priceGroupId: 1, price: null, lineId: 1, categoryId: 1, active: true, available: true });
    await command('addProduct', { name: 'Individual sintético', unit: 'litro', price: 25, lineId: 1, categoryId: 1, active: true, available: true });
    for (const productId of [1, 2, 3]) await command('inventoryEstimate', { productId, quantity: '100', unit: 'litro', reason: 'Estimación de pruebas aislada' });
    process.env.CALCQUIM_MOBILE_ENABLED = 'yes'; process.env.CALCQUIM_MOBILE_TOKEN = token;
    await start();
    await t.test('autenticación y catálogo sin ventas ni credenciales', async () => {
      assert.equal((await api('/catalog', {}, 'invalid')).status, 401);
      const result = await api('/catalog'); assert.equal(result.status, 200); assert.equal(result.body.data.products.length, 3); assert.equal(result.body.data.sales, undefined);
      assert.equal(result.body.commercialOptionsVersion,'official-relations-v1');assert.equal(result.body.commercialOptions.length,2);assert.ok(result.body.commercialOptions.every(c=>c.tariffs.length===1));
      assert.equal((await api(`/sales/status/${key}`)).body.status, 'not_found');
    });
    let body;
    await t.test('línea mixta y grupo, importe y cantidad: respuesta concurrente única', async () => {
      state = await service.read();
      const choices = catalogChoices(state.data), line = choices.find(c => c.key === 'line:1');
      assert.equal(line.tariffs.length, 2);
      body = { revision: state.revision, generation: state.generation, payment: 'Efectivo', origin: 'WEB', items: [
        { reference: { kind: 'line', id: 1 }, tariffKey: '20:litro', price: 20, unit: 'litro', entryMode: 'quantity', value: '3' },
        { reference: { kind: 'priceGroup', id: 1 }, tariffKey: '20:litro', price: 20, unit: 'litro', entryMode: 'amount', value: '1.01' },
        { reference: { kind: 'product', id: 3 }, tariffKey: '25:litro', price: 25, unit: 'litro', entryMode: 'quantity', value: '1' },
      ] };
      const options = { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) };
      const [a, b] = await Promise.all([api('/sales', options), api('/sales', options)]);
      assert.equal(a.status, 200); assert.equal(b.status, 200); assert.deepEqual(a.body.receipt, b.body.receipt); assert.equal(a.body.receipt.total, 86.01);
      state = await service.read(); assert.equal(state.data.sales.length, 1); assert.equal(state.data.sales[0].origin, 'MOVIL'); assert.equal(state.data.sales[0].items[0].productId, null);
      assert.equal(await stock(1), '100'); assert.equal(await stock(3), '99');
      assert.equal((await api('/sales', { ...options, body: JSON.stringify({ ...body, payment: 'Tarjeta' }) })).status, 409);
    });
    await t.test('reinicio del servidor conserva evidencia de COMMIT y no vuelve a descontar', async () => {
      await new Promise(resolve => server.close(resolve)); await start();
      const status = await api(`/sales/status/${key}`); assert.equal(status.body.receipt.total, 86.01);
      const retry = await api('/sales', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) }); assert.equal(retry.status, 200); assert.equal(await stock(3), '99');
    });
    let original, saleId;
    await t.test('desglose exacto histórico, incompatible rechazado, una sola afectación', async () => {
      state = await service.read(); const sale = state.data.sales[0]; saleId = sale.id; original = structuredClone(sale.originalReceipt);
      const pending = (await service.inventory()).pending.find(p => p.sale_id === sale.id && p.ordinal === 0);
      const allocate = allocations => command('inventoryAllocate', { pendingId: pending.id, allocations, reason: 'Desglose sintético validado' });
      await assert.rejects(allocate([{ productId: 3, quantity: '3', unit: 'litro' }]));
      await assert.rejects(allocate([{ productId: 1, quantity: '2', unit: 'litro' }]));
      state = await service.read();
      await allocate([{ productId: 1, quantity: '2', unit: 'litro' }, { productId: 2, quantity: '1', unit: 'litro' }]);
      assert.equal(await stock(1), '98'); assert.equal(await stock(2), '99');
      await assert.rejects(allocate([{ productId: 1, quantity: '3', unit: 'litro' }]));
      state = await service.read(); const updated = state.data.sales.find(s => s.id === saleId);
      assert.deepEqual(updated.originalReceipt, original); assert.equal(updated.origin, 'MOVIL'); assert.equal(updated.total, 86.01); assert.equal(updated.breakdowns[0].length, 2); assert.equal(updated.history.at(-1).channel, 'WEB');
    });
    await t.test('revisión comercial conserva folio, precio y original; nuevo desglose sin doble inventario', async () => {
      const prior=state.data.sales.find(s=>s.id===saleId), folio=prior.folio;
      await assert.rejects(command('correctMobileSale',saleId,{values:['4','1.01','2'],reason:'',physicalTreatment:'apply_difference'}));
      state=await service.read();
      await command('correctMobileSale',saleId,{values:['4','1.01','2'],reason:'Corrección comercial sintética explícita',physicalTreatment:'apply_difference'});
      const corrected=state.data.sales.find(s=>s.id===saleId);
      assert.equal(corrected.folio,folio); assert.equal(corrected.origin,'MOVIL'); assert.equal(corrected.items[0].price,20); assert.equal(corrected.total,131.01);
      assert.deepEqual(corrected.originalReceipt,original); assert.equal(corrected.updatedReceipt.version,2); assert.equal(corrected.revisions[0].total,86.01);
      assert.equal(await stock(1),'100'); assert.equal(await stock(2),'100'); assert.equal(await stock(3),'98');
      const pending=(await service.inventory()).pending.filter(p=>p.sale_id===saleId&&p.state==='pending'); assert.equal(pending.length,2);
      const group=pending.find(p=>p.ordinal===0);
      await command('inventoryAllocate',{pendingId:group.id,allocations:[{productId:1,quantity:'3',unit:'litro'},{productId:2,quantity:'1',unit:'litro'}],reason:'Nuevo desglose de revisión sintético'});
      assert.equal(await stock(1),'97'); assert.equal(await stock(2),'99');
      assert.deepEqual((await api(`/sales/status/${key}`)).body.receipt,original);
    });
    await t.test('anulación trazable y reposición única, origen web fijado por servidor', async () => {
      await command('voidSale', saleId, { inventoryReturn: 'returned', reason: 'Anulación sintética validada' });
      assert.equal(await stock(1), '100'); assert.equal(await stock(2), '100'); assert.equal(await stock(3), '100');
      await assert.rejects(command('voidSale', saleId, { inventoryReturn: 'returned', reason: 'No duplicar' }));
      state = await service.read();
      assert.deepEqual(state.data.sales[0].originalReceipt, original); assert.equal(state.data.sales[0].history.at(-1).action, 'voided');
      await command('createSale', { date: new Date().toLocaleDateString('en-CA'), payment: 'Efectivo', origin: 'MOVIL', items: [{ productId: 3, price: 25, unit: 'litro', quantity: 1 }] });
      assert.equal(state.data.sales[0].origin, 'WEB');
    });
    await t.test('canal móvil bloqueado en comando administrativo y revisión obsoleta rechazada', async () => {
      await assert.rejects(service.command({ name: 'createMobileSale', args: [body], revision: state.revision, generation: state.generation, requestKey: randomUUID() }), { code: 'CHANNEL_FORBIDDEN' });
      assert.equal((await api('/sales', { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body: JSON.stringify(body) })).status, 412);
    });
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    // The target is a generated schema in the explicitly isolated test database only.
    assert.equal(config.database.database, 'calcquim_activation_test');
    if (/^calcquim_test_mobile_[a-f0-9]{32}$/.test(schema)) await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.end(); delete process.env.CALCQUIM_MOBILE_ENABLED; delete process.env.CALCQUIM_MOBILE_TOKEN;
  }
});
