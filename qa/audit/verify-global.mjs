import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {operationsReport} from '../integrated/admin/src/domain/operationsReport.mjs';
const s=JSON.parse(await readFile(new URL('state.private.json',import.meta.url),'utf8'));
const run=JSON.parse(await readFile(new URL('latest.private.json',import.meta.url),'utf8'));
assert.equal(s.database.port,55439);assert.equal(s.database.database,'nexo_audit_test');assert.equal(s.database.user,'nexo_audit_app');assert.match(s.schema,/^calcquim_test_audit_[a-f0-9]{20}$/);
const dir=new URL('global-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'/',run.directory);await mkdir(dir);
const pool=new pg.Pool({...s.database,max:1,options:'-c default_transaction_read_only=on'});
const cents=v=>BigInt(Math.round(Number(v)*100));
try{
 const identity=(await pool.query("SELECT current_database() db,inet_server_port() port,current_setting('transaction_read_only') readonly")).rows[0];assert.deepEqual(identity,{db:'nexo_audit_test',port:55439,readonly:'on'});
 const d=await fetch(s.base+'/api/v1/dataset').then(r=>r.json()),i=await fetch(s.base+'/api/v1/inventory').then(r=>r.json());assert.equal(d.generation,s.generation);
 const ledger=(await pool.query(`SELECT product_id,sum(quantity)::text quantity FROM ${s.schema}.inventory_movements GROUP BY product_id`)).rows;
 for(const p of i.products){if(p.quantity==null)continue;assert.equal(Number(p.quantity),Number(ledger.find(r=>r.product_id===String(p.productId))?.quantity),p.name);assert.ok(Number(p.quantity)>=0,p.name);}
 for(const p of i.packInventory.products){if(!p.known)continue;assert.equal(Number(p.total),Number(p.closedPackages)*Number(p.factor)+Number(p.looseUnits));assert.equal(Number(p.total),Number(i.products.find(x=>x.productId===p.productId).quantity));assert.ok(Number(p.closedPackages)>=0&&Number(p.looseUnits)>=0&&Number(p.looseUnits)<Number(p.factor));}
 const expected=new Map([[31,94.607],[32,99],[72,24],[73,23],[119,42],[49,120],[42,110],[71,104]]);
 for(const[id,qty]of expected)assert.equal(Number(i.products.find(p=>p.productId===id).quantity),qty);
 const sales=d.data.sales;assert.equal(new Set(sales.map(s=>s.id)).size,sales.length);assert.equal(new Set(sales.map(s=>s.folio)).size,sales.length);
 let commercial=0n,rounding=0n,due=0n;
 for(const sale of sales.filter(s=>!s.voidedAt)){
  const items=sale.items.reduce((n,x)=>n+cents(x.amount),0n);commercial+=items;due+=cents(sale.total);
  if(sale.monetary){assert.equal(BigInt(sale.monetary.calculatedCents),items);const want=sale.payment==='Efectivo'&&items>0n?(items<25n?50n:((items+25n)/50n)*50n):items;assert.equal(cents(sale.total),want);rounding+=BigInt(sale.monetary.roundingCents);}
  else assert.equal(cents(sale.total),items);
 }
 assert.equal(commercial,23493n);assert.equal(rounding,45n);assert.equal(due,23538n);
 for(const p of d.data.procurement.purchases.filter(p=>!p.voidedAt))assert.equal(cents(p.total),p.items.reduce((n,x)=>n+cents(x.total),0n));
 const purchases=(await pool.query(`SELECT sum(total)::text total,count(*)::int count FROM ${s.schema}.purchases`)).rows[0];assert.equal(purchases.count,7);assert.equal(Number(purchases.total),317);
 const salvo=d.data.productLines.find(l=>l.name==='Salvo');assert.equal(d.data.categories.find(c=>c.id===salvo.categoryId).name,'Lavatrastes');
 const supply=d.data.procurement;
 const pview=await fetch(s.base+'/api/v1/inventory/purchases').then(r=>r.json());
 const report=operationsReport({data:d.data,inventory:i,purchases:pview},{activity:'GENERAL'});
 const summary={at:new Date().toISOString(),generation:s.generation,revision:d.revision,identity,products:d.data.products.length,ledgerAccounts:ledger.length,sales:sales.length,liveSales:sales.filter(s=>!s.voidedAt).length,purchases,commercial:Number(commercial)/100,rounding:Number(rounding)/100,due:Number(due)/100,stock:i.products.filter(p=>expected.has(p.productId)),pending:i.pending.filter(p=>p.state==='pending'),supply:{articles:supply.purchasedItems.length,sources:supply.supplyItems.length,conversions:supply.supplyConversions.length,quotes:supply.supplierPrices.length},salvo:'Lavatrastes',payments:report.payments};
 assert.equal(summary.pending.length,0);assert.equal(report.payments.confirmedCollected,225.38);assert.equal(report.payments.collected,null);
 await writeFile(new URL('summary.json',dir),JSON.stringify(summary,null,2),{flag:'wx'});await writeFile(new URL('report.json',dir),JSON.stringify(report,null,2),{flag:'wx'});
 await writeFile(new URL('ports.txt',dir),execFileSync('netstat',['-ano','-p','tcp'],{encoding:'utf8'}),{flag:'wx'});
 console.log(JSON.stringify({directory:dir.href,...summary},null,2));
}finally{await pool.end();}
