import {readFileSync,writeFileSync} from 'node:fs';
const root='D:/ReactApps/calcQuim-admin/';
let commands=readFileSync(root+'server/src/services/commands.mjs','utf8');
const point="  validateSales(data.sales);";
if(!commands.includes(point))throw new Error('No coincide dominio');
commands=commands.replace(point,point+`
  for(const sale of data.sales)for(const item of sale.items) {
    if(item.reference&&item.reference.kind!=='product') {
      const collection=({line:'productLines',category:'categories',priceGroup:'priceGroups'})[item.reference.kind];
      if(!collection||!data[collection].some(row=>String(row.id)===String(item.reference.id)))throw new ApiError(422,'INVALID_RELATION','La agrupación tiene historial comercial; conserva su identificador.');
    }
    if(item.eligibleProductIds?.some(id=>!data.products.some(p=>String(p.id)===String(id))))throw new ApiError(422,'INVALID_RELATION','Un producto tiene compatibilidad comercial histórica; conserva su identificador.');
  }`);
writeFileSync('integration/admin/server/src/services/commands.mjs',commands);
let audit=readFileSync(root+'src/services/dataAudit.js','utf8');
audit=audit.replace('const entry = maps[collection].get(String(value));','if (!maps[collection]) { add("ALTO", entity, id, field, "Tipo de referencia desconocido", value); return null; }\n        const entry = maps[collection].get(String(value));');
writeFileSync('integration/admin/src/services/dataAudit.js',audit);
