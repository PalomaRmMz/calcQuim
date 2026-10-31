import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogChoices, searchChoices, validateCatalog } from '../src/domain/catalog.mjs';
import { makeLine, total } from '../src/domain/sale.mjs';
import { submitSale } from '../src/domain/submission.mjs';
import { ticketHtml } from '../src/domain/ticket.mjs';
import { serverUrl } from '../src/services/mobileApi.mjs';
import { createMobileStorage, initialState, MOBILE_KEY } from '../src/domain/persistence.mjs';
export const catalog = { generation: 'synthetic-generation', revision: 1, pricingVersion: 'admin-sales-v1', data: {
  categories: [{ id: 1, name: 'Limpieza', active: true }, { id: 2, name: 'Lavandería', active: true }],
  productLines: [{ id: 10, name: 'Carisma', categoryId: 1, active: true }, { id: 20, name: 'Carisma', categoryId: 2, active: true }],
  priceGroups: [{ id: 30, name: 'Lavatrastes', price: 20, active: true }],
  products: [{ id: 100, name: 'Limón', lineId: 10, categoryId: 1, priceGroupId: 30, unit: 'litro', active: true }, { id: 101, name: 'Lavanda', lineId: 10, categoryId: 1, price: 25, unit: 'litro', active: true }, { id: 102, name: 'Limón', lineId: 20, categoryId: 2, price: 30, unit: 'kg', active: true }],
} };
const choices = catalogChoices(catalog.data), choice = choices.find(c => c.key === 'product:100');
const line = (mode, value) => makeLine(choice, choice.tariffs[0], mode, value, 'line1');
test('catálogo oficial completo y versión de precios requerida', () => { assert.equal(validateCatalog(catalog), catalog); assert.throws(() => validateCatalog({ ...catalog, pricingVersion: 'other' })); assert.throws(() => validateCatalog({ ...catalog, data: {} })); });
test('búsqueda sin acentos, por contexto y por los cuatro tipos', () => {
  assert.equal(searchChoices(choices, 'CARISMA LIMON').length, 2);
  for (const kind of ['line', 'priceGroup', 'category', 'product']) assert.ok(searchChoices(choices, '').some(c => c.kind === kind));
  assert.equal(searchChoices(choices, 'lavanderia limon')[0].refId, 102);
  assert.equal(searchChoices(choices, 'Limón', { 'product:102': { count: 10 } })[0].refId, 102);
});
test('precio individual, grupo y línea mixta requieren tarifa explícita', () => {
  assert.equal(choice.tariffs[0].price, 20); assert.equal(choices.find(c => c.key === 'product:101').tariffs[0].price, 25);
  const mixed = choices.find(c => c.key === 'line:10'); assert.equal(mixed.tariffs.length, 2);
  assert.throws(() => makeLine(mixed, null, 'quantity', '3', 'id'));
  const general = makeLine(mixed, mixed.tariffs[0], 'quantity', '3', 'id'); assert.equal(general.reference.id, 10); assert.equal(general.reference.kind, 'line'); assert.deepEqual(general.eligibleProductIds, [100]);
});
test('cantidad exacta, pesos originales, umbral de mayoreo y centavos', () => {
  assert.equal(line('quantity', '3.123456').quantity, 3.123456);
  assert.equal(line('quantity', '10').amount, 170);
  assert.equal(line('amount', '170').quantity, 10);
  assert.equal(line('amount', '169.99').discountRate, 0);
  assert.equal(line('amount', '1.01').amount, 1.01);
  assert.equal(total([line('amount', '.01'.replace('.', '0.')), line('amount', '1.01')]), 1.02);
  for (const v of ['NaN', 'Infinity', '-1', '0', '1.001', '1e3']) assert.throws(() => line('amount', v));
  assert.throws(()=>line('quantity','999999999999.123456'));
  assert.throws(()=>line('amount','90071992547409.91'));
});
const receipt = { id: 'sale-id', folio: 'V-00001', createdAt: '2026-10-30T12:00:00Z', status: 'confirmed', total: 60, items: [{ ...line('quantity', '3'), name: 'Carisma <Limón>' }] };
test('envío persiste antes de red y recupera COMMIT sin duplicar después de reiniciar', async () => {
  let saved, calls = 0, registered = false;
  const api = { identity: 'server', status: async () => registered ? { receipt } : { status: 'not_found' }, register: async () => { calls++; registered = true; throw new TypeError('respuesta perdida'); } };
  const first = await submitSale({ draft: { lines: [line('quantity', '3')], payment: 'Efectivo' }, catalog, api, uuid: () => 'stable-key', persist: async d => { saved = structuredClone(d); } });
  assert.equal(saved.attempt.key, 'stable-key'); assert.equal(first.status, 'unknown');
  const second = await submitSale({ draft: JSON.parse(JSON.stringify(saved)), catalog, api, uuid: () => { throw new Error('no generar otra clave'); }, persist: async d => { saved = d; } });
  assert.equal(second.status, 'confirmed'); assert.equal(calls, 1); assert.deepEqual(second.receipt, receipt);
});
test('fallo local de persistencia impide transmitir', async () => {
  let called = false;
  await assert.rejects(submitSale({ draft: { lines: [line('amount', '10')] }, catalog, api: { identity: 'server', status: async () => { called = true; } }, uuid: () => 'key', persist: async () => { throw new Error('Disco lleno'); } }));
  assert.equal(called, false);
});
test('no confirmar respuesta incompleta ni cambiar de servidor en un reintento', async () => {
  const draft = { lines: [line('amount', '10')], attempt: { key: 'key', body: {}, server: 'original' } };
  await assert.rejects(submitSale({ draft, catalog, api: { identity: 'other' }, persist: async () => {} }));
  const result = await submitSale({ draft, catalog, api: { identity: 'original', status: async () => ({}), register: async () => ({ receipt: {} }) }, persist: async () => {} });
  assert.equal(result.status, 'unknown');
});
test('ticket escapado conserva nombre capturado y excluye IDs y credenciales', () => {
  const html = ticketHtml(receipt); assert.ok(html.includes('Carisma &lt;Limón&gt;')); assert.ok(!html.includes('sale-id')); assert.ok(!html.includes('eligibleProductIds')); assert.throws(() => ticketHtml({ status: 'draft' }));
});
test('URL solo local sin credenciales ni parámetros', () => {
  assert.equal(serverUrl('http://192.168.1.10:3003'), 'http://192.168.1.10:3003');
  for (const url of ['https://example.com', 'http://u:p@localhost:3003', 'http://localhost:3003?token=secret']) assert.throws(() => serverUrl(url));
});
test('una consulta de estado rechazada no libera un intento desconocido', async () => {
  const result=await submitSale({draft:{lines:[line('quantity','1')],attempt:{key:'known-key',body:{},server:'original'}},catalog,api:{identity:'original',status:async()=>{const e=new Error('Credencial vencida');e.definitive=true;throw e;}},persist:async()=>{}});
  assert.equal(result.status,'unknown');assert.equal(result.attempt.key,'known-key');
});
test('reinicio conserva borrador y claves anteriores; corrupción no se sobrescribe', async () => {
  const data=new Map([['currentSale','legacy-sale'],['calcquim_products','legacy-products']]);let writes=0;
  const storage=createMobileStorage({getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{writes++;data.set(k,v);},multiGet:async keys=>keys.map(k=>[k,data.get(k)??null])});
  const state=await storage.load();state.draft.lines=[line('quantity','2')];await storage.save(state);
  assert.deepEqual((await storage.load()).draft.lines,state.draft.lines);assert.equal((await storage.legacy()).currentSale,'legacy-sale');assert.equal(data.get('calcquim_products'),'legacy-products');
  data.set(MOBILE_KEY,'{corrupt');const before=writes;await assert.rejects(storage.load());assert.equal(writes,before);assert.equal(data.get(MOBILE_KEY),'{corrupt');
  const interrupted=initialState();interrupted.draft.status='sending';interrupted.draft.attempt={key:'key',body:{},server:'original'};data.set(MOBILE_KEY,JSON.stringify(interrupted));assert.equal((await storage.load()).draft.status,'unknown');
});
test('tarifa oficial cero solo admite cantidad física', () => {
  const c={...choice,tariffs:[{key:'0:litro',price:0,unit:'litro',productIds:[100]}]};
  assert.equal(makeLine(c,c.tariffs[0],'quantity','2','zero').amount,0);
  assert.throws(()=>makeLine(c,c.tariffs[0],'amount','1','zero'));
});
test('paridad con motor real de Admin en unidades, umbrales y redondeos', async () => {
  const {calculateItems}=await import('file:///D:/ReactApps/calcQuim-admin/src/utils/salesUtils.js');
  for(const unit of ['litro','kg','pieza'])for(const price of [0.01,13.33,20,99.99])for(const mode of ['quantity','amount'])for(const value of ['0.01','9.999999','10','10.01','169.99','170']){
    if(mode==='amount'&&value==='9.999999')continue;
    const t={key:`${price}:${unit}`,price,unit,productIds:[100]},c={...choice,tariffs:[t]};
    let actual;try{actual=makeLine(c,t,mode,value,'test');}catch{continue;}
    const expected=calculateItems([{price,unit,entryMode:mode,quantity:Number(value),requestedAmount:mode==='amount'?Number(value):null}])[0];
    for(const field of ['quantity','amount','subtotal','discountRate','discount'])assert.equal(actual[field],expected[field]);
  }
});
