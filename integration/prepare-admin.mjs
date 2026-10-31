import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const target = 'D:/ReactApps/calcQuim-admin', stage = resolve('integration/admin');
const put = (path, text) => { mkdirSync(dirname(join(stage, path)), { recursive: true }); writeFileSync(join(stage, path), text); };
function edit(path, replacements) {
  let text = readFileSync(join(target, path), 'utf8').replaceAll('\r\n', '\n');
  for (const [before, after] of replacements) {
    if (!text.includes(before)) throw new Error(`No coincide el archivo ${path}: ${before.slice(0, 70)}`);
    text = text.replace(before, after);
  }
  put(path, text);
}
edit('server/src/services/commands.mjs', [
  ["import { createCatalogActions", "import { createMobileSale } from '../mobile/domain.mjs';\nimport { createCatalogActions"],
  ["'createSale','voidSale'];", "'createSale','createMobileSale','voidSale'];"],
  ["i=>!data.products.some(p=>p.id===i.productId)", "i=>i.productId!=null&&!data.products.some(p=>p.id===i.productId)"],
  ["case 'createSale': data.sales=createSale(data.sales,args[0],catalog,counters.sales??0); break;", "case 'createMobileSale': data.sales=createMobileSale(data.sales,args[0],catalog,counters.sales??0); result={ok:true,receipt:data.sales[0].originalReceipt}; break;\n      case 'createSale': data.sales=createSale(data.sales,args[0],catalog,counters.sales??0); break;"],
]);
edit('src/services/salesStorage.js', [
  ['item.productId == null || products.has(String(item.productId))', "(item.productId == null && !(['line','category','priceGroup'].includes(item.reference?.kind) && item.reference?.id != null)) || products.has(item.id || String(item.productId))"],
  ['products.add(String(item.productId));', 'products.add(item.id || String(item.productId));'],
  ['notes: input.notes?.trim() || "", items,', 'notes: input.notes?.trim() || "", origin: "WEB", history: [{ action: "created", channel: "WEB", at: new Date().toISOString() }], items,'],
]);
edit('server/src/services/dataset.mjs', [
  ['async command({name,args,revision,generation,requestKey}) {', `mobileStatus:key=>transaction(async c=>{
      const row=(await c.query('SELECT response FROM idempotency_requests WHERE request_key=$1',['mobile:'+key])).rows[0];
      return row?.response?.receipt?{receipt:row.response.receipt}:{status:'not_found'};
    },true),
    async command({name,args,revision,generation,requestKey,channel='WEB'}) {
      if(name==='createMobileSale'&&channel!=='MOVIL')throw new ApiError(403,'CHANNEL_FORBIDDEN','Canal no autorizado.');`],
  ["if(inventoryCommands.includes(name))await c.query('UPDATE dataset_state SET revision=revision+1 WHERE singleton=true');", "if(inventoryCommands.includes(name)) { if(JSON.stringify(before.sales)!==JSON.stringify(current.data.sales))await writeDataset(c,current.data,current.counters); else await c.query('UPDATE dataset_state SET revision=revision+1 WHERE singleton=true'); }"],
  ['await syncInventory(c,before,current.data,name,args);', `await syncInventory(c,before,current.data,name,args);
          if(name==='voidSale') {
            const sale=current.data.sales.find(s=>s.id===args[0]);
            sale.history=[...(sale.history||[]),{action:'voided',channel,at:new Date().toISOString()}];
            await c.query('UPDATE sales SET record=$2 WHERE id=$1',[String(sale.id),JSON.stringify({...sale,items:[]})]);
          }`],
]);
edit('server/src/services/inventory.mjs', [
  ["if(name==='createSale'){", "if(name==='createSale'||name==='createMobileSale'){"],
  ['const product=findProduct(data,item.productId),intent=intents[String(item.productId)]??{};', `if(item.reference&&item.reference.kind!=='product'){
        await addPending(c,sale,ordinal,item,{scope:item.reference.kind,scopeId:item.reference.id,reason:item.entryMode==='amount'?'amount':'group'});continue;
      }
      const product=findProduct(data,item.productId),intent=intents[String(item.productId)]??{};`],
  ['String(item.productId),scope,String(scopeId)', 'item.productId==null?null:String(item.productId),scope,String(scopeId)'],
  ["const baseline=await checkBaseline(c,product,{createdAt:pending.created_at.toISOString(),date:sale.date},item.baselineTreatment??input.baselineTreatment);", `const captured=sale.items[pending.ordinal];
    if(captured.eligibleProductIds&&!captured.eligibleProductIds.some(id=>String(id)===String(product.id)))fail('Producto incompatible con la tarifa histórica aplicada.');
    if(pending.scope==='priceGroup'&&!captured.eligibleProductIds)fail('No hay evidencia de compatibilidad histórica.');
    const baseline=await checkBaseline(c,product,{createdAt:pending.created_at.toISOString(),date:sale.date},item.baselineTreatment??input.baselineTreatment);`],
  ["await inventoryChange(c,'allocation',{pendingId:pending.id,confirmedQuantity:expected,unit:pending.unit,reason:why.text,...why.metadata});return {};", `await inventoryChange(c,'allocation',{pendingId:pending.id,confirmedQuantity:expected,unit:pending.unit,reason:why.text,...why.metadata});
  if(sale.origin==='MOVIL') {
    sale.breakdowns={...(sale.breakdowns||{}),[pending.ordinal]:rows.map(row=>({productId:row.product.id,name:row.product.name,quantity:row.physical,unit:row.product.unit}))};
    sale.history=[...(sale.history||[]),{action:'breakdown',channel:'WEB',at:new Date().toISOString(),ordinal:pending.ordinal,allocations:sale.breakdowns[pending.ordinal]}];
  }
  return {};`],
]);
edit('server/src/app.mjs', [
  ["import express from 'express';", "import express from 'express';\nimport { mobileRouter } from './mobile/router.mjs';"],
  ["if (dataService) {", `if (dataService) {
    app.use('/api/mobile/v1',mobileRouter(dataService,{mode,enabled:process.env.CALCQUIM_MOBILE_ENABLED==='yes',token:process.env.CALCQUIM_MOBILE_TOKEN||''}));`],
]);
edit('src/pages/SalesPage.jsx', [
  ["import ModalHeader", "import MobileSaleBreakdown from '../components/MobileSaleBreakdown';\nimport ModalHeader"],
  ['const [to, setTo] = useState("");', 'const [to, setTo] = useState("");\n    const [origin, setOrigin] = useState("");\n    const [onlyPending, setOnlyPending] = useState(false);'],
  ['const filtered = sales.filter((sale) =>', 'const filtered = sales.filter((sale) => (!origin || sale.origin === origin) && (!onlyPending || sale.items.some((i,n) => i.pendingBreakdown && !sale.breakdowns?.[n])) &&'],
  ['const columns = [', 'const columns = [\n        { accessorKey: "origin", header: "Origen", Cell: ({ cell }) => cell.getValue() || "Sin dato histórico" },\n        { id: "breakdown", header: "Desglose", accessorFn: sale => sale.items.some((i,n) => i.pendingBreakdown && !sale.breakdowns?.[n]) ? "Pendiente" : "Completo" },'],
  ['<div className="filter-bar">', '<div className="filter-bar"><label>Origen<select className="form-select" value={origin} onChange={e=>setOrigin(e.target.value)}><option value="">Todos</option><option value="MOVIL">Móvil</option><option value="WEB">Web</option></select></label><label><input type="checkbox" checked={onlyPending} onChange={e=>setOnlyPending(e.target.checked)}/> Solo pendientes de desglose</label>'],
  ['</section>{selected.notes', `</section>{selected.origin==='MOVIL'&&persistence&&!selected.voidedAt&&<MobileSaleBreakdown sale={sales.find(s=>s.id===selected.id)||selected} persistence={persistence} products={products}/>}<details className="sale-section"><summary>Historial de modificaciones</summary>{(sales.find(s=>s.id===selected.id)?.history||selected.history||[]).map((h,i)=><p key={i}>{h.at} · {h.channel} · {h.action}</p>)}</details>{selected.notes`],
  ['key={item.productId}', 'key={item.id || item.productId}'],
]);
// New native-independent modules use exactly the existing Admin calculations.
put('server/src/mobile/adminSales.mjs', "export { calculateItems } from '../../../src/utils/salesUtils.js';\n");
put('server/src/mobile/adminUnits.mjs', "export { normalizeUnit } from '../../../src/utils/units.js';\n");
if (process.argv.includes('--apply')) {
  cpSync(stage,target,{recursive:true});
  console.log('Archivos de integración aplicados. No se ejecutaron migraciones ni se inició Express.');
} else console.log('Integración preparada para revisión en integration/admin.');
