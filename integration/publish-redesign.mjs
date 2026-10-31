// Solo publica código: no abre PostgreSQL ni modifica datos operativos.
import fs from 'node:fs/promises';
import path from 'node:path';
const mobile=path.resolve('D:/ReactApps/calcQuim'),admin=path.resolve('D:/ReactApps/calcQuim-admin');
const copy=async(source,target)=>{const destination=path.join(admin,target);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.copyFile(path.join(mobile,source),destination);};
await copy('src/domain/commercial.mjs','server/src/mobile/commercial.mjs');
await copy('integration/admin-saleAuditView.mjs','src/services/saleAuditView.mjs');
for(const name of ['brand.mjs','logo.mjs','ticket.mjs'])await copy(`src/domain/${name}`,`src/domain/mobileReceipt/${name}`);
await fs.writeFile(path.join(admin,'src/domain/mobileReceipt/sale.mjs'),"export { money } from '../../utils/salesUtils.js';\n");
await fs.writeFile(path.join(admin,'src/services/saleReceipt.js'),"export { ticketHtml, escapeHtml, ticketModel } from '../domain/mobileReceipt/ticket.mjs';\n");
const routerFile=path.join(admin,'server/src/mobile/router.mjs');let router=await fs.readFile(routerFile,'utf8');
if(!router.includes("from './commercial.mjs'"))router=router.replace("import { PRICING_VERSION } from './catalog.mjs';","import { PRICING_VERSION } from './catalog.mjs';\nimport { commercialChoices } from './commercial.mjs';");
if(!router.includes('commercialOptions:'))router=router.replace('res.json({ data: Object.fromEntries','res.json({ commercialOptions: commercialChoices(s.data), commercialOptionsVersion: \'official-relations-v1\', data: Object.fromEntries');
await fs.writeFile(routerFile,router);
const salesFile=path.join(admin,'src/pages/SalesPage.jsx');let sales=await fs.readFile(salesFile,'utf8');
if(!sales.includes('saleAuditView.mjs')){
 sales="import {saleCapturedAt,saleLastChangedAt,saleMoment} from '../services/saleAuditView.mjs';\n"+sales;
 sales=sales.replace('{ accessorKey: "origin", header: "Origen", Cell: ({ cell }) => cell.getValue() || "Sin dato histórico" },','{ accessorKey: "origin", header: "Origen", Cell: ({ cell }) => ({MOVIL:"Móvil",WEB:"Web"}[cell.getValue()]||"Sin dato histórico") },');
 sales=sales.replace('{ accessorKey: "date", header: "Fecha", Cell: ({ cell }) => new Date(`${cell.getValue()}T12:00:00`).toLocaleDateString("es-MX") },','{ id:"capturedAt", header:"Fecha y hora", accessorFn:sale=>saleCapturedAt(sale)||sale.date, Cell:({row})=>saleMoment(saleCapturedAt(row.original),row.original.date) },\n        { id:"lastChangedAt", header:"Última modificación", accessorFn:sale=>saleLastChangedAt(sale)||"", Cell:({row})=>saleMoment(saleLastChangedAt(row.original)) },');
 await fs.writeFile(salesFile,sales);
}
console.log('Publicados módulos de opciones oficiales y ticket en Admin. Sin conexión a bases de datos.');
const breakdownFile=path.join(admin,'src/components/MobileSaleBreakdown.jsx');let breakdown=await fs.readFile(breakdownFile,'utf8');
if(!breakdown.includes('setBaselines')){
 breakdown=breakdown.replace('export default function MobileSaleBreakdown({ sale, persistence, products }) {','export default function MobileSaleBreakdown({ sale, persistence, products }) {\n  const [baselines,setBaselines]=useState({});');
 breakdown=breakdown.replace('quantity: quantities[p.id], unit: p.unit }','quantity: quantities[p.id], unit: p.unit, baselineTreatment: baselines[p.id] || undefined }');
 breakdown=breakdown.replace("setSelected(''); setQuantities({}); setPhysical('');","setSelected(''); setQuantities({}); setPhysical(''); setBaselines({});");
 breakdown=breakdown.replace('setSelected(e.target.value); setQuantities({});','setSelected(e.target.value); setQuantities({}); setBaselines({});');
 const before='<label className="d-block" key={p.id}>{p.name} ({p.unit})<input className="form-control" inputMode="decimal" value={quantities[p.id] || \'\'} onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })} /></label>';
 const after='<div className="my-2" key={p.id}><label className="d-block">{p.name} ({p.unit})<input className="form-control" inputMode="decimal" value={quantities[p.id] || \'\'} onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })} /></label><label className="d-block">Respecto a la última estimación<select className="form-select" value={baselines[p.id] || \'\'} onChange={e=>setBaselines({...baselines,[p.id]:e.target.value})}><option value="">Sin confirmar: revisar si es anterior a la estimación</option><option value="already_included">Ya estaba incluida: no volver a descontar</option><option value="apply_now">Debe descontarse ahora del saldo</option></select></label></div>';
 if(!breakdown.includes(before))throw new Error('Cambió el formulario de desglose. Revisar antes de publicar.');
 breakdown=breakdown.replace(before,after);await fs.writeFile(breakdownFile,breakdown);
}
