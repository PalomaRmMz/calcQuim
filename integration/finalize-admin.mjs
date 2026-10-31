import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const target = 'D:/ReactApps/calcQuim-admin', stage = resolve('integration/admin');
function edit(path, replacements) {
  let text=readFileSync(join(target,path),'utf8').replaceAll('\r\n','\n');
  for(const [before,after] of replacements){if(!text.includes(before))throw new Error(`No coincide ${path}`);text=text.replace(before,after);}
  mkdirSync(dirname(join(stage,path)),{recursive:true});writeFileSync(join(stage,path),text);
}
edit('src/services/procurementStorage.js', [['[item.productId, item.outputProductId, item.directProductId,', '[item.productId, item.outputProductId, item.directProductId, ...(item.eligibleProductIds || []),']]);
edit('src/services/dataAudit.js', [
  ['purchase ? item.id ?? index : item.productId', 'purchase ? item.id ?? index : item.id ?? item.productId'],
  ['ref("products", productId, child, id, "productId", !purchase);', 'ref("products", productId, child, id, "productId", !purchase && !item.reference);\n            if (!purchase && item.reference && item.productId == null) ref(({line:"productLines",category:"categories",priceGroup:"priceGroups"})[item.reference.kind], item.reference.id, child, id, "reference", true);'],
]);
edit('src/services/dataExport.js', [
  ['ctx.lookup("products", item.productId, "SaleItem", sale.id, "productId", true)?.displayName || "No encontrado"', 'item.productId == null && item.reference ? `Agrupación: ${item.name}` : ctx.lookup("products", item.productId, "SaleItem", sale.id, "productId", true)?.displayName || "No encontrado"'],
  ['col("folio", "Folio"), col("state", "Estado")', 'col("folio", "Folio"), col("origin", "Origen de captura"), col("commercialVersion", "Versión comercial"), col("state", "Estado")'],
]);
edit('server/src/services/dataset.mjs', [
  ['const current=await read(c,true);', `const current=await read(c,true);
        if(['createMobileSale','correctMobileSale'].includes(name)&&!(await c.query('SELECT 1 FROM schema_migrations WHERE version=7')).rowCount)throw new ApiError(503,'MOBILE_SCHEMA_PENDING','La integración móvil requiere una migración autorizada.');`],
]);
// The UI detail follows the authoritative revision returned by the server.
edit('src/pages/SalesPage.jsx', [
  ['const [selected, setSelected] = useState(null);', 'const [selected, setSelected] = useState(null);\n    useEffect(()=>{if(selected){const fresh=sales.find(s=>s.id===selected.id);if(fresh&&fresh!==selected)setSelected(fresh);}},[sales,selected]);'],
]);
// Commercial revisions retain document metadata for audits and exports.
const domainPath=join(stage,'server/src/mobile/domain.mjs');
let domain=readFileSync(domainPath,'utf8');
domain=domain.replace('version: version - 1, items: previous.items,','version: version - 1, id: previous.id, date: previous.date, payment: previous.payment, origin: previous.origin, items: previous.items,');
writeFileSync(domainPath,domain);
if(process.argv.includes('--apply')){cpSync(stage,target,{recursive:true});console.log('Validaciones finales aplicadas al código.');}else console.log('Validaciones finales preparadas.');
