import test from 'node:test';
import assert from 'node:assert/strict';
import { captureQuantity, captureBody } from '../src/domain/inventoryCapture.mjs';
import { createInventoryAttemptStorage, resolveInventoryAttempt } from '../src/domain/inventorySubmission.mjs';
const product = { productId: 1, unit: 'pieza', quantity: '15', initialMovementId: 'initial', packVersion: null, packOptions: [] };
const snapshot = { revision: 1, generation: 'qa-generation' };
test('captura distingue vacío/cero, calcula diferencias exactas y exige motivo', () => {
  assert.throws(() => captureQuantity(product, { quantity: '' }), /vacío/);
  assert.equal(captureQuantity(product, { quantity: '0' }).quantity, '0');
  assert.throws(() => captureQuantity(product, { quantity: '1.1' }), /entera/);
  assert.throws(() => captureBody(snapshot, product, { quantity: '12' }), /motivo/);
  assert.equal(captureBody(snapshot, product, { quantity: '12', reason: 'Reconteo' }).expectedQuantity, '15');
  assert.equal(captureBody(snapshot, product, { quantity: '15' }).operation, 'count');
});
test('paquetes usan exclusivamente el factor autorizado, con ambos campos explícitos', () => {
  const p = { ...product, packOptions: [{ id: 'pack4', factor: '4' }, { id: 'pack6', factor: '6' }] };
  assert.throws(() => captureQuantity(p, { presentationId: 'pack4', closedPackages: '4', looseUnits: '' }));
  assert.equal(captureQuantity(p, { presentationId: 'pack4', closedPackages: '4', looseUnits: '2', factor: '99' }).quantity, '18');
  assert.equal(captureQuantity(p, { presentationId: 'pack6', closedPackages: '4', looseUnits: '2' }).quantity, '26');
  assert.throws(() => captureQuantity(p, { presentationId: 'foreign', closedPackages: '1', looseUnits: '0' }));
});
test('respuesta perdida se recupera tras reinicio sin duplicar ni reenviar automáticamente', async () => {
  let raw = null, posts = 0, committed = false;
  const storage = createInventoryAttemptStorage({ getItem: async () => raw, setItem: async (_k, value) => { raw = value; } });
  const attempt = { key: 'operation-123', server: 'http://127.0.0.1:57712', credentialFingerprint: 'hash', body: { quantity: '12' }, phase: 'prepared', baseline: { product, snapshot }, form: { quantity: '12' } };
  const api = { identity: attempt.server, inventoryStatus: async () => committed ? { status: 'confirmed', operationId: attempt.key, movementId: 'move1' } : { status: 'not_found' },
    saveInventory: async () => { assert.ok(raw); posts++; committed = true; throw Object.assign(new Error('Respuesta perdida'), { offline: true }); } };
  const first = await resolveInventoryAttempt({ attempt, api, persist: storage.save, credentialFingerprint: 'hash', allowSend: true });
  assert.equal(first.phase, 'unknown'); assert.equal(posts, 1);
  const loaded = (await storage.all())[0];
  const recovered = await resolveInventoryAttempt({ attempt: loaded, api, persist: storage.save, credentialFingerprint: 'hash' });
  assert.equal(recovered.phase, 'confirmed'); assert.equal(posts, 1);
});
test('consulta not_found permite solo reintento explícito, conflictos y credencial distinta se conservan', async () => {
  const attempt = { key: 'operation-123', server: 'http://127.0.0.1:57712', credentialFingerprint: 'hash', body: {}, phase: 'unknown' };
  let posts = 0, saved;
  const api = { identity: attempt.server, inventoryStatus: async () => ({ status: 'not_found' }), saveInventory: async () => { posts++; throw Object.assign(new Error('Los datos cambiaron'), { status: 412, definitive: true }); } };
  const args = { attempt, api, persist: async v => { saved = v; }, credentialFingerprint: 'hash' };
  assert.equal((await resolveInventoryAttempt(args)).phase, 'prepared'); assert.equal(posts, 0);
  const rejected = await resolveInventoryAttempt({ ...args, allowSend: true });
  assert.equal(rejected.phase, 'rejected'); assert.equal(rejected.conflict, true);
  await assert.rejects(resolveInventoryAttempt({ ...args, credentialFingerprint: 'other' }), /originales/);
  assert.equal(saved.body, attempt.body);
});
test('almacenamiento corrupto bloquea captura sin sobrescribirlo', async () => {
  let writes = 0;
  const storage = createInventoryAttemptStorage({ getItem: async () => '{bad', setItem: async () => { writes++; } });
  await assert.rejects(storage.save({})); assert.equal(writes, 0);
});
test('un conflicto aparente consulta nuevamente la clave antes de habilitar otra captura', async () => {
  let reads = 0;
  const attempt = { key: 'operation-race', server: 'http://127.0.0.1:57712', credentialFingerprint: 'hash', body: {}, phase: 'unknown' };
  const api = { identity: attempt.server, inventoryStatus: async () => ++reads === 1 ? { status: 'not_found' } : { status: 'confirmed', operationId: attempt.key, movementId: 'concurrent-commit' },
    saveInventory: async () => { throw Object.assign(new Error('Los datos cambiaron'), { status: 412, definitive: true }); } };
  const result = await resolveInventoryAttempt({ attempt, api, persist: async () => {}, credentialFingerprint: 'hash', allowSend: true });
  assert.equal(result.phase, 'confirmed'); assert.equal(result.result.movementId, 'concurrent-commit');
});
test('escrituras locales simultáneas conservan ambos registros de operación', async () => {
  let raw = null;
  const storage = createInventoryAttemptStorage({ getItem: async () => raw, setItem: async (_k, value) => { raw = value; } });
  const base = { server: 'http://127.0.0.1:57712', credentialFingerprint: 'hash', body: {}, baseline: { product, snapshot }, form: {}, phase: 'prepared' };
  await Promise.all([storage.save({ ...base, key: 'operation-one' }), storage.save({ ...base, key: 'operation-two' })]);
  assert.equal((await storage.all()).length, 2);
});
