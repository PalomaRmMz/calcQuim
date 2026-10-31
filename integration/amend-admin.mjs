import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const target = 'D:/ReactApps/calcQuim-admin', stage = resolve('integration/admin');
function edit(path, replacements) {
  let text = readFileSync(join(target, path), 'utf8').replaceAll('\r\n', '\n');
  for (const [before, after] of replacements) {
    if (!text.includes(before)) throw new Error(`No coincide ${path}: ${before.slice(0,60)}`);
    text = text.replace(before, after);
  }
  mkdirSync(dirname(join(stage,path)),{recursive:true}); writeFileSync(join(stage,path),text);
}
edit('server/src/services/commands.mjs', [
  ["import { createMobileSale }", "import { createMobileSale, correctMobileSale }"],
  ["'createMobileSale','voidSale'];", "'createMobileSale','correctMobileSale','voidSale'];"],
  ["case 'createMobileSale':", "case 'correctMobileSale': data.sales=correctMobileSale(data.sales,args[0],args[1]); break;\n      case 'createMobileSale':"],
]);
edit('server/src/services/inventory.mjs', [
  ["if(!current||digest(current.items)!==digest(old.items)||current.total!==old.total||", "if(!current||(name!=='correctMobileSale'&&(digest(current.items)!==digest(old.items)||current.total!==old.total))||"],
  ["if(name==='createSale'||name==='createMobileSale'){", `if(name==='correctMobileSale') {
    const sale=data.sales.find(s=>s.id===args[0]);
    if((await c.query("SELECT 1 FROM inventory_movements WHERE sale_id=$1 AND kind='return' LIMIT 1",[sale.id])).rowCount)fail('La venta tiene devoluciones: requiere revisión física específica antes de corregir.');
    const outputs=(await c.query("SELECT m.* FROM inventory_movements m WHERE sale_id=$1 AND kind='sale' AND NOT EXISTS(SELECT 1 FROM inventory_movements r WHERE r.reversal_of=m.id)",[sale.id])).rows;
    for(const output of outputs) {
      const baseline=await checkBaseline(c,findProduct(data,output.product_id),{seq:output.seq,createdAt:sale.createdAt,date:sale.date},args[1].baselineTreatment);
      await appendInventoryMovement(c,findProduct(data,output.product_id),{kind:'reversal',quantity:inventoryText(-inventoryDecimal(output.quantity)),reason:args[1].reason,saleId:sale.id,saleOrdinal:output.sale_ordinal,reversalOf:output.id,originKey:'correction-reverse:'+output.id,reference:{commercialVersion:sale.commercialVersion,...baseline}});
    }
    await c.query("UPDATE inventory_pending SET state='cancelled' WHERE sale_id=$1 AND state IN ('pending','resolved')",[sale.id]);
    for(const [ordinal,item] of sale.items.entries()) {
      if(item.reference.kind!=='product'||item.entryMode==='amount')await addPending(c,sale,ordinal,item,{scope:item.reference.kind,scopeId:item.reference.id,reason:item.entryMode==='amount'?'amount':'group'});
      else {
        const product=findProduct(data,item.productId);
        const baseline=await checkBaseline(c,product,{createdAt:sale.createdAt,date:sale.date},args[1].baselineTreatment);
        const physical=inventoryConvert(item.quantity,item.unit,product.unit);
        await appendInventoryMovement(c,product,{kind:'sale',quantity:inventoryText(-inventoryDecimal(physical)),reason:args[1].reason,saleId:sale.id,saleOrdinal:ordinal,originKey:'correction:'+sale.id+':'+sale.commercialVersion+':'+ordinal,reference:{commercialVersion:sale.commercialVersion,...baseline}});
      }
    }
    await inventoryChange(c,'commercial_correction',{saleId:sale.id,version:sale.commercialVersion,channel:'WEB',reason:args[1].reason});
  }
  if(name==='createSale'||name==='createMobileSale'){`],
]);
edit('src/pages/SalesPage.jsx', [
  ["import MobileSaleBreakdown", "import MobileSaleCorrection from '../components/MobileSaleCorrection';\nimport MobileSaleBreakdown"],
  ["</section>{selected.origin==='MOVIL'", "</section>{selected.origin==='MOVIL'&&persistence&&<MobileSaleCorrection sale={sales.find(s=>s.id===selected.id)||selected} persistence={persistence}/>} {selected.origin==='MOVIL'"],
]);
if(process.argv.includes('--apply')) { cpSync(stage,target,{recursive:true}); console.log('Revisiones comerciales aplicadas al código; sin migrar operativo.'); }
else console.log('Revisiones comerciales preparadas.');
