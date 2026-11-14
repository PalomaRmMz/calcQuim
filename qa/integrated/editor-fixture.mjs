// Create only the additional synthetic cleaning sale used to exercise the editor.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createMobileApi} from '../../src/services/mobileApi.mjs';
import {catalogChoices} from '../../src/domain/catalog.mjs';
import {makeLine,requestBody} from '../../src/domain/sale.mjs';
const state=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
assert.equal(state.database,'calcquim_activation_test');assert.equal(state.base,'http://127.0.0.1:63327');assert.match(state.schema,/^calcquim_test_integrated_[a-f0-9]{20}$/);
const api=createMobileApi(state.base,state.token),catalog=await api.catalog();assert.equal(catalog.environment,'synthetic');
const dataset=await(await fetch(state.base+'/api/v1/dataset')).json();assert.equal(dataset.generation,catalog.generation);
assert.equal(catalog.data.products.find(p=>p.id===1)?.name,'Limpiador QA estabilidad');
const choice=catalogChoices(catalog.data).find(c=>c.kind==='product'&&c.refId===1);assert.ok(choice);
const key='integrated-editor-cleaning-fixture-v1';let result=await api.status(key);
if(result.status==='not_found')result=await api.register(key,requestBody({lines:[makeLine(choice,choice.tariffs[0],'quantity','1','editor-fixture-line')],payment:'Efectivo'},catalog));
assert.equal(result.receipt?.status,'confirmed');
await writeFile(new URL('../../.artifacts/integrated/editor-fixture.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({id:result.receipt.id,folio:result.receipt.folio,total:result.receipt.total,source:'synthetic HTTP fixture'}));
