import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { installMobileInventoryRoute } from '../integration/mobile-inventory-route.mjs';
import { createMobileApi } from '../src/services/mobileApi.mjs';
import { searchInventory, validateInventory } from '../src/domain/inventory.mjs';
const require = createRequire(new URL('file:///D:/ReactApps/calcQuim-admin/server/package.json'));
const express = require('express');
const { mobileRouter } = await import('file:///D:/ReactApps/calcQuim-admin/server/src/mobile/router.mjs');
const fixture = { enabled: true, environment: 'synthetic', generatedAt: new Date().toISOString(), products: [
  { productId: 1, name: 'Escobillón', unit: 'pieza', status: 'estimated', quantity: '0', composition: null },
  { productId: 2, name: 'Fibra', unit: 'pieza', status: 'unknown', quantity: null, composition: { known: false } },
] };
test('consulta distingue cero/desconocido, busca sin acentos y rechaza composición inventada', () => {
  assert.equal(validateInventory(fixture).products[0].quantity, '0');
  assert.equal(searchInventory(fixture.products, 'escobillon')[0].productId, 1);
  const broken = structuredClone(fixture);
  broken.products[0].composition = { known: true, factor: '4', closedPackages: '1', looseUnits: '0' };
  assert.throws(() => validateInventory(broken), /inconsistentes/);
  broken.products[0].quantity = '4';
  assert.doesNotThrow(() => validateInventory(broken));
  broken.products[0].quantity = '4.5';
  assert.throws(() => validateInventory(broken));
});
test('búsqueda bajo demanda oculta todo al vaciar y filtra parcial, mayúsculas y acentos', () => {
  const products = [...fixture.products, { productId: 3, name: 'Mr. Big 600 hojas' }, { productId: 4, name: 'Mr. Big 800 hojas' }];
  assert.deepEqual(searchInventory(products, ''), []);
  assert.deepEqual(searchInventory(products, '   '), []);
  assert.deepEqual(searchInventory(products, 'ESCOBILLON').map(p => p.productId), [1]);
  assert.deepEqual(searchInventory(products, 'fÍb').map(p => p.productId), [2]);
  assert.deepEqual(searchInventory(products, 'big').map(p => p.productId), [3,4]);
  assert.deepEqual(searchInventory(products, 'sin coincidencias'), []);
  assert.deepEqual(searchInventory(products, ''), []);
});
test('ruta de lectura usa autenticación existente y excluye compras, costos y movimientos', async () => {
  let reads = 0;
  const token = 'synthetic-local-demo-token-not-production';
  const service = { operations: async () => { reads++; return {
    revision: 7, data: { products: [{ id: 1, activity: 'JARCERIA' }, { id: 3, activity: 'LIMPIEZA' }] },
    inventory: { enabled: true, products: [...fixture.products, { productId: 3 }], movements: ['private'], purchases: ['private'] },
    purchases: ['private'],
  }; } };
  const app = express();
  app.use('/api/mobile/v1', installMobileInventoryRoute(mobileRouter(service, { enabled: true, token }), service));
  app.use((e, _req, res, _next) => res.status(e.status || 500).json({ error: { message: e.message } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const headers of [{}, { Authorization: 'Bearer wrong' }]) assert.equal((await fetch(base + '/api/mobile/v1/inventory', { headers })).status, 401);
    assert.equal(reads, 0);
    const value = validateInventory(await createMobileApi(base, token).inventory());
    assert.equal(value.products.length, 1);
    assert.equal(value.products[0].quantity, '0');
    assert.equal(JSON.stringify(value).includes('private'), false);
    assert.equal(reads, 1);
    assert.equal((await fetch(base + '/api/mobile/v1/inventory/operations', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'initial' }) })).status, 403);
    assert.equal(reads, 1);
  } finally { server.closeIdleConnections(); await new Promise(resolve => server.close(resolve)); }
});
test('permiso de inicial no autoriza conteos y las operaciones se consultan con el responsable autenticado', async () => {
  const token = 'synthetic-local-demo-token-not-production';
  let statusReads = 0;
  const service = { inventoryOperationStatus: async key => { statusReads++; assert.match(key, /^mobile-inventory:initial-only:/); return null; } };
  const app = express();
  // The deployed router already owns inventory routes with its operational policy.
  // Exercise the reusable adapter's narrower principal independently; authentication
  // against the real router is covered by the preceding test.
  const scopedRouter = express.Router();
  scopedRouter.use((req,res,next)=>req.get('Authorization')===`Bearer ${token}`?next():res.sendStatus(401),express.json());
  app.use('/api/mobile/v1', installMobileInventoryRoute(scopedRouter, service, {
    writeEnabled: true, principal: { id: 'initial-only', name: 'Inicial QA', permissions: ['inventory:initial'] },
  }));
  app.use((e, _req, res, _next) => res.status(e.status || 500).json({ error: { code: e.code } }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/mobile/v1/inventory`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(base + '/operations', { method: 'POST', headers, body: JSON.stringify({ operation: 'count' }) })).status, 403);
    assert.equal(statusReads, 0);
    assert.deepEqual(await (await fetch(base + '/operations/known-key-123', { headers })).json(), { status: 'not_found' });
    assert.equal(statusReads, 1);
  } finally { server.closeIdleConnections(); await new Promise(resolve => server.close(resolve)); }
});
