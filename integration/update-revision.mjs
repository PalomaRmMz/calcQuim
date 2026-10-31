import {readFileSync,writeFileSync,cpSync} from 'node:fs';
const target='D:/ReactApps/calcQuim-admin/server/src/services/dataset.mjs';
let text=readFileSync(target,'utf8');
text=text.replace("return row?.response?.receipt?{receipt:row.response.receipt}:{status:'not_found'};", "const snapshot=await read(c);\n      return row?.response?.receipt?{receipt:row.response.receipt,revision:snapshot.revision,generation:snapshot.generation}:{status:'not_found'};");
writeFileSync('integration/admin/server/src/services/dataset.mjs',text);
