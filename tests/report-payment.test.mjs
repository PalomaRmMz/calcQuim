import test from 'node:test';
import assert from 'node:assert/strict';
import {reportedCollection} from '../qa/integrated/admin/src/domain/reportPayment.mjs';
import {operationsReport} from '../qa/integrated/admin/src/domain/operationsReport.mjs';
test('legacy commercial correction cannot invent collection of its revised difference',()=>{
 const sale={id:'qa',folio:'QA',date:'2026-11-14',total:15,commercialVersion:3,originalReceipt:{total:5},items:[]};
 const input={data:{products:[],categories:[],productLines:[],sales:[sale],procurement:{purchases:[]}},inventory:{products:[],movements:[],pending:[]},purchases:{rows:[]}};
 const p=operationsReport(input,{activity:'GENERAL',today:'2026-11-15'}).payments;
 assert.equal(p.commercial,15);assert.equal(p.confirmedCollected,5);assert.equal(p.collected,null);assert.equal(p.rows[0].settlement,'not_recorded');
 assert.deepEqual(reportedCollection({...sale,originalReceipt:undefined}),{confirmed:null,collected:null,status:'not_recorded'});
 assert.deepEqual(reportedCollection({total:20}),{confirmed:2000,collected:2000,status:null});
 assert.deepEqual(reportedCollection({...sale,monetary:{collectedCents:1500},monetarySettlement:{lastConfirmedCollectedCents:500,status:'not_recorded'}}),{confirmed:500,collected:null,status:'not_recorded'});
});
