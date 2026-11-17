import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
const state=JSON.parse(await readFile(new URL('state.private.json',import.meta.url),'utf8'));
const phase=JSON.parse(await readFile(new URL('functional-state.private.json',import.meta.url),'utf8'));
const baseline=JSON.parse(await readFile(new URL('before-ui.json',phase.directory),'utf8'));
const planned=JSON.parse(await readFile(new URL('planned-oracle.json',phase.directory),'utf8'));
assert.equal(state.database.host,'127.0.0.1');assert.equal(state.database.port,55439);assert.equal(state.database.database,'nexo_audit_test');assert.equal(state.database.user,'nexo_audit_app');assert.match(state.schema,/^calcquim_test_audit_[a-f0-9]{20}$/);
const dir=new URL('verified-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'/',phase.directory);await mkdir(dir);
const canonical=x=>x&&typeof x==='object'?Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const money=v=>{const text=String(v);assert.match(text,/^\d+(?:\.\d{1,2})?$/);const[w,f='']=text.split('.');return BigInt(w)*100n+BigInt(f.padEnd(2,'0'));};
const micro=v=>{const text=String(v);assert.match(text,/^-?\d+(?:\.\d+)?$/);const negative=text.startsWith('-'),[w,f='']=(negative?text.slice(1):text).split('.');assert.ok(f.length<=6||/^0*$/.test(f.slice(6)));return (negative?-1n:1n)*(BigInt(w)*1000000n+BigInt(f.slice(0,6).padEnd(6,'0')));};
const pool=new pg.Pool({...state.database,max:1,options:'-c default_transaction_read_only=on'});
try{
 const identity=(await pool.query("SELECT current_database() db,current_user role,inet_server_port() port,current_setting('transaction_read_only') readonly")).rows[0];assert.deepEqual(identity,{db:'nexo_audit_test',role:'nexo_audit_app',port:55439,readonly:'on'});
 const databases=(await pool.query('SELECT datname FROM pg_database')).rows.map(r=>r.datname);assert.ok(!databases.some(n=>n.startsWith('calcquim')));
 const d=await fetch(state.base+'/api/v1/dataset').then(r=>r.json()),i=await fetch(state.base+'/api/v1/inventory').then(r=>r.json()),report=await fetch(state.base+'/api/v1/reports/operations?activity=GENERAL').then(r=>r.json());
 assert.equal(d.generation,state.generation);assert.equal(d.generation,baseline.dataset.generation);
 assert.equal(d.data.products.length,119);assert.equal(d.data.procurement.services.length,5);assert.equal(d.data.procurement.suppliers.length,8);assert.equal(d.data.procurement.purchases.length,9);assert.equal(d.data.sales.length,15);
 for(const old of baseline.dataset.data.sales)assert.equal(canonical(d.data.sales.find(s=>s.id===old.id)),canonical(old),'Historical sale changed: '+old.folio);
 for(const old of baseline.dataset.data.procurement.purchases)assert.equal(canonical(d.data.procurement.purchases.find(p=>p.id===old.id)),canonical(old),'Historical purchase changed: '+old.id);
 for(const old of baseline.dataset.data.procurement.presentations)assert.equal(canonical(d.data.procurement.presentations.find(p=>p.id===old.id)),canonical(old),'Original presentation changed: '+old.name);
 const original12=JSON.parse(await readFile(new URL('android-mixed-confirmed.json',phase.directory),'utf8')).sale;
 const sale12=d.data.sales.find(s=>s.folio==='V-00012');assert.equal(canonical(sale12.originalReceipt),canonical(original12.originalReceipt));assert.equal(sale12.commercialVersion,2);assert.equal(sale12.total,88.5);assert.equal(sale12.monetarySettlement.lastConfirmedCollectedCents,6850);assert.equal(sale12.monetarySettlement.differenceCents,2000);
 const ledger=(await pool.query(`SELECT product_id,sum(quantity)::text quantity FROM ${state.schema}.inventory_movements GROUP BY product_id`)).rows;
 for(const account of i.products){if(account.quantity==null)continue;assert.ok(micro(account.quantity)>=0n);assert.equal(micro(account.quantity),micro(ledger.find(r=>r.product_id===String(account.productId)).quantity),account.name);}
 for(const p of i.packInventory.products){if(!p.known)continue;assert.ok(Number(p.closedPackages)>=0&&Number(p.looseUnits)>=0&&Number(p.looseUnits)<Number(p.factor));assert.equal(Number(p.total),Number(p.closedPackages)*Number(p.factor)+Number(p.looseUnits));assert.equal(micro(p.total),micro(i.products.find(a=>a.productId===p.productId).quantity));}
 const stockExpected=new Map([[31,'91.934'],[32,'99'],[43,'110'],[49,'120'],[42,'110'],[71,'104'],[72,'24'],[73,'36'],[119,'41']]);
 for(const[id,qty]of stockExpected)assert.equal(micro(i.products.find(p=>p.productId===id).quantity),micro(qty));
 let commercial=0n,due=0n,rounding=0n,purchaseTotal=0n;const activities={LIMPIEZA:0n,JARCERIA:0n,LAVANDERIA:0n};
 const live=d.data.sales.filter(s=>!s.voidedAt);assert.equal(live.length,14);
 for(const sale of live){const sum=sale.items.reduce((n,line)=>n+money(line.amount),0n);commercial+=sum;due+=money(sale.total);for(const line of sale.items)activities[line.activity]+=money(line.amount);
  if(sale.monetary){const expected=sale.payment==='Efectivo'&&sum>0n?(sum<25n?50n:((sum+25n)/50n)*50n):sum;assert.equal(money(sale.total),expected);assert.equal(BigInt(sale.monetary.calculatedCents),sum);assert.equal(BigInt(sale.monetary.roundingCents),expected-sum);rounding+=expected-sum;}else assert.equal(money(sale.total),sum);
 }
 for(const purchase of d.data.procurement.purchases){assert.equal(money(purchase.total),purchase.items.reduce((n,row)=>n+money(row.total),0n));purchaseTotal+=money(purchase.total);}
 assert.equal(commercial,money(planned.expectedFinal.commercial));assert.equal(due,money(planned.expectedFinal.documentDue));assert.equal(rounding,money(planned.expectedFinal.rounding));assert.equal(purchaseTotal,money(planned.purchasesFinal));
 for(const[k,v]of Object.entries(planned.expectedFinal.byActivity))assert.equal(activities[k],money(v));
 assert.equal(report.payments.commercial,487.16);assert.equal(report.payments.rounding,0.6);assert.equal(report.payments.confirmedCollected,457.76);assert.equal(report.payments.collected,null);assert.equal(report.payments.voidedCharge,0.5);assert.equal(report.pendingPurchases.length,0);assert.equal(i.pending.filter(p=>p.state==='pending').length,0);
 const wash=d.data.procurement.services.find(s=>s.name==='Lavado por carga'),oldWash=baseline.dataset.data.procurement.services.find(s=>s.id===wash.id);assert.equal(canonical(wash.loadPricing),canonical(oldWash.loadPricing));assert.equal(canonical(wash.addons),canonical(oldWash.addons));assert.equal(wash.price,60);assert.equal(wash.active,true);assert.equal(d.data.procurement.services.find(s=>s.name==='Servicio a medida').descriptionRequired,true);
 const sql=(await pool.query(`SELECT sum(s.total)::text due,sum((SELECT sum(amount) FROM ${state.schema}.sale_items si WHERE si.sale_id=s.id))::text commercial FROM ${state.schema}.sales s WHERE NULLIF(s.record->>'voidedAt','') IS NULL`)).rows[0];assert.equal(money(sql.due),due);assert.equal(money(sql.commercial),commercial);
 const result={at:new Date().toISOString(),generation:d.generation,revision:d.revision,identity,originalSalesUnchanged:baseline.dataset.data.sales.length,originalPurchasesUnchanged:baseline.dataset.data.procurement.purchases.length,originalReceipt12Unchanged:true,accounts:ledger.length,sales:d.data.sales.length,liveSales:live.length,purchases:9,purchaseTotal:Number(purchaseTotal)/100,commercial:Number(commercial)/100,rounding:Number(rounding)/100,documentDue:Number(due)/100,knownCollected:report.payments.confirmedCollected,finalCollected:null,byActivity:Object.fromEntries(Object.entries(activities).map(([k,v])=>[k,Number(v)/100])),stock:i.products.filter(p=>stockExpected.has(p.productId)),packComposition:i.packInventory.products.filter(p=>[72,73,119].includes(p.productId)),pendingSales:0,pendingPurchases:0,scope:'synthetic QA only; no financial settlement events recorded'};
 await writeFile(new URL('summary.json',dir),JSON.stringify(result,null,2),{flag:'wx'});await writeFile(new URL('report.json',dir),JSON.stringify(report,null,2),{flag:'wx'});await writeFile(new URL('ports.txt',dir),execFileSync('netstat',['-ano','-p','tcp'],{encoding:'utf8'}),{flag:'wx'});
 console.log(JSON.stringify({directory:dir.href,revision:d.revision,accounts:119,sales:15,liveSales:14,purchases:9,commercial:487.16,documentDue:487.76,knownCollected:457.76,historicalDataUnchanged:true}));
}catch(e){await writeFile(new URL('failure.json',dir),JSON.stringify({at:new Date().toISOString(),error:e.message},null,2),{flag:'wx'});throw e;}finally{await pool.end();}
