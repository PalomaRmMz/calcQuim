import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { openInventoryQa } from '../integration/inventory-qa-context.mjs';
import { createMobileApi } from '../src/services/mobileApi.mjs';
import { captureBody } from '../src/domain/inventoryCapture.mjs';

test('iniciales, conteos, auditoría y paquetes sobre PostgreSQL QA existente', async t => {
  const { service, pool, base, token, qa } = await openInventoryQa();
  const api = createMobileApi(base, token), fixtures = {};
  const original = await service.operations();
  const stamp = randomUUID().slice(0, 8);
  async function native(name, ...args) {
    const s = await service.read();
    return service.command({ name, args, revision: s.revision, generation: s.generation, requestKey: `qa-android-seed:${randomUUID()}` });
  }
  async function seed(label, factor = null) {
    const name = `QA Android ${stamp} · ${label}`, packId = randomUUID(), unitId = randomUUID();
    await native('saveHardwareProductBundle', { product: { name, unit: 'pieza', active: true }, presentations: [
      { id: unitId, name: 'Individual QA Android', unit: 'pieza', factor: 1, price: 6, integerOnly: true, active: true },
      ...(factor ? [{ id: packId, name: `Paquete QA de ${factor}`, unit: 'paquete', factor, price: factor * 5, integerOnly: true, active: true }] : []),
    ] });
    const p = (await service.read()).data.products.find(p => p.name === name);
    return { id: p.id, name, packId, unitId, factor };
  }
  async function body(id, form) {
    const s = await api.inventory(), p = s.products.find(p => p.productId === id);
    return captureBody(s, p, form);
  }
  const send = (b, key = randomUUID()) => api.saveInventory(key, b);
  try {
    assert.equal((await api.inventory()).permissions.initial, true);
    fixtures.simple = await seed('Fibra pruebas'); fixtures.zero = await seed('Cero pruebas');
    fixtures.pack4 = await seed('Paquete cuatro pruebas', 4); fixtures.pack6 = await seed('Paquete seis pruebas', 6);
    const fixtureFile = new URL('../.artifacts/inventory-android-fixtures.private.json', import.meta.url);
    let previous;
    try { previous = JSON.parse(await readFile(fixtureFile, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    fixtures.manual = previous?.fixtures.manual || await seed('Fibra captura emulador');
    fixtures.manualPack = previous?.fixtures.manualPack || await seed('Rollos captura emulador', 4);
    await t.test('producto pendiente, vacío, negativo y cero sin confirmación se rechazan', async () => {
      const p = (await api.inventory()).products.find(p => p.productId === fixtures.simple.id);
      assert.equal(p.initialMovementId, null); assert.equal(p.quantity, null);
      const b = await body(fixtures.simple.id, { quantity: '12' });
      await assert.rejects(send({ ...b, quantity: '' }), e => e.status === 422);
      await assert.rejects(send({ ...b, quantity: '-1' }), e => e.status === 422);
      await assert.rejects(send({ ...b, quantity: '0' }), e => e.code === 'ZERO_CONFIRMATION_REQUIRED');
    });
    await t.test('inicial positiva y reintento no duplican; contenido distinto con misma clave se rechaza', async () => {
      const b = await body(fixtures.simple.id, { quantity: '12' }), key = randomUUID();
      const first = await send(b, key), replay = await send(b, key);
      assert.equal(first.movementId, replay.movementId); assert.equal(replay.replayed, true);
      assert.equal((await api.inventoryStatus(key)).movementId, first.movementId);
      await assert.rejects(send({ ...b, quantity: '13' }, key), e => e.status === 409);
      const current = await body(fixtures.simple.id, { quantity: '12' });
      await assert.rejects(send({ ...current, operation: 'initial' }), e => e.code === 'INITIAL_ALREADY_EXISTS');
      assert.equal((await api.inventoryHistory(fixtures.simple.id)).history.length, 1);
    });
    await t.test('inicial cero explícita mantiene cero distinto de desconocido', async () => {
      await send({ ...await body(fixtures.zero.id, { quantity: '0' }), zeroConfirmed: true });
      const p = (await api.inventory()).products.find(p => p.productId === fixtures.zero.id);
      assert.equal(p.quantity, '0'); assert.ok(p.initialMovementId);
    });
    await t.test('dos solicitudes concurrentes de la misma clave confirman un único movimiento', async () => {
      const b = await body(fixtures.simple.id, { quantity: '12' }), key = randomUUID();
      const before = (await api.inventoryHistory(fixtures.simple.id)).history.length;
      const results = await Promise.all([send(b, key), send(b, key)]);
      assert.equal(results[0].movementId, results[1].movementId);
      assert.equal((await api.inventoryHistory(fixtures.simple.id)).history.length, before + 1);
    });
    await t.test('conteos igual, mayor y menor conservan historial y responsable', async () => {
      for (const quantity of ['12','15','9']) await send(await body(fixtures.simple.id, { quantity, reason: 'Reconteo físico QA' }));
      const p = (await api.inventory()).products.find(p => p.productId === fixtures.simple.id);
      assert.equal(p.quantity, '9');
      const h = (await api.inventoryHistory(fixtures.simple.id)).history;
      assert.equal(h.length, 5); assert.equal(h[0].previousQuantity, '15');
      assert.equal(h[0].audit.responsibleId, 'qa-android-inventory');
      assert.equal(h[0].note, 'Reconteo físico QA');
      const b = await body(fixtures.simple.id, { quantity: '10', reason: 'Reconteo' });
      await assert.rejects(send({ ...b, reason: '' }), e => e.code === 'REASON_REQUIRED');
    });
    await t.test('revisión concurrente rechaza saldo desactualizado y conserva el conteo ganador', async () => {
      const a = await body(fixtures.simple.id, { quantity: '8', reason: 'Primer contador' });
      const b = await body(fixtures.simple.id, { quantity: '7', reason: 'Segundo contador' });
      const results = await Promise.allSettled([send(a), send(b)]);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(results.find(r => r.status === 'rejected').reason.status, 412);
    });
    await t.test('paquetes, sueltos y mixtos respetan factores 4 y 6 sin aperturas', async () => {
      for (const fixture of [fixtures.pack4, fixtures.pack6]) {
        for (const [closed, loose] of [['4','0'], ['0','2'], ['4','2']]) {
          const b = await body(fixture.id, { presentationId: fixture.packId, closedPackages: closed, looseUnits: loose, reason: 'Conteo físico de paquetes' });
          const key = randomUUID(), first = await send(b, key), replay = await send(b, key);
          assert.equal(first.movementId, replay.movementId);
          const p = (await api.inventory()).products.find(p => p.productId === fixture.id);
          assert.equal(p.quantity, String(Number(closed) * fixture.factor + Number(loose)));
          assert.equal(p.composition.closedPackages, closed); assert.equal(p.composition.looseUnits, loose);
        }
      }
      const b = await body(fixtures.pack4.id, { presentationId: fixtures.pack4.packId, closedPackages: '1', looseUnits: '0', reason: 'Prueba' });
      await assert.rejects(send({ ...b, physicalComposition: { ...b.physicalComposition, factor: '999' } }), e => e.status === 422);
      await assert.rejects(send({ ...b, physicalComposition: { ...b.physicalComposition, presentationId: fixtures.pack6.packId } }), e => e.status === 422);
      await assert.rejects(send({ ...b, unit: 'litro' }), e => e.code === 'INVALID_UNIT');
      const view = await service.inventory();
      assert.equal(view.packInventory.events.filter(e => [String(fixtures.pack4.id),String(fixtures.pack6.id)].includes(e.product_id)).some(e => e.action === 'automatic_open'), false);
    });
    await t.test('autenticación, productos de Limpieza y rutas comerciales quedan bloqueados', async () => {
      const path = base + '/api/mobile/v1/inventory/operations';
      assert.equal((await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
      const b = await body(fixtures.simple.id, { quantity: '6', reason: 'Permisos' });
      const cleaning = original.data.products.find(p => p.activity !== 'JARCERIA');
      await assert.rejects(send({ ...b, productId: cleaning.id }), e => e.code === 'HARDWARE_ONLY');
      assert.equal((await fetch(base + '/api/mobile/v1/sales', { method: 'POST' })).status, 405);
      assert.equal((await fetch(base + '/api/v1/commands/inventoryCount', { method: 'POST' })).status, 405);
    });
    await t.test('artículos históricos y operación web permanecen intactos; mismo servicio de inventario', async () => {
      const after = await service.operations();
      for (const p of original.data.products) assert.deepEqual(after.data.products.find(r => r.id === p.id), p);
      for (const p of original.inventory.products) assert.deepEqual(after.inventory.products.find(r => r.productId === p.productId), p);
      assert.deepEqual(after.data.sales, original.data.sales);
      assert.deepEqual(after.data.procurement.purchases, original.data.procurement.purchases);
      assert.equal(after.inventory.products.find(p => p.productId === fixtures.pack4.id).quantity, '18');
    });
    const result = JSON.stringify({ qa, fixtures, stamp, recordedAt: new Date().toISOString() }, null, 2);
    await writeFile(new URL(`../.artifacts/inventory-qa-run-${stamp}.private.json`, import.meta.url), result);
    if (!previous) await writeFile(fixtureFile, result);
  } finally { await pool.end(); }
});
