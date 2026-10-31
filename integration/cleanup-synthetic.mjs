import { createRequire } from 'node:module';
const root=new URL('file:///D:/ReactApps/calcQuim-admin/');
const require=createRequire(new URL('server/package.json',root));
const {Pool}=require('pg');
const {loadOperationalConfig}=await import(new URL('server/src/config/operational.mjs',root));
const config=await loadOperationalConfig('calcquim_activation_test');
if(config.database.database!=='calcquim_activation_test')throw new Error('Solo base de pruebas.');
const pool=new Pool(config.database);
try {
  const schemas=(await pool.query("SELECT nspname FROM pg_namespace WHERE nspname LIKE 'calcquim_test_mobile_%'")).rows.map(r=>r.nspname).filter(n=>/^calcquim_test_mobile_[a-f0-9]{32}$/.test(n));
  const matches=[];
  for(const name of schemas){
    const products=(await pool.query(`SELECT record->>'name' AS name FROM "${name}".products ORDER BY position`)).rows.map(r=>r.name);
    const sales=(await pool.query(`SELECT folio,total::text FROM "${name}".sales ORDER BY position`)).rows;
    if(JSON.stringify(products)===JSON.stringify(['Limón de prueba','Lavanda de prueba','Individual de prueba'])&&sales.length===1&&sales[0].folio==='V-00001'&&Number(sales[0].total)===60)matches.push(name);
  }
  if(process.argv[2]){
    if(matches.length!==1||matches[0]!==process.argv[2])throw new Error('El objetivo no coincide inequívocamente con la fixture revisada.');
    await pool.query(`DROP SCHEMA "${matches[0]}" CASCADE`);console.log('Esquema de la prueba manual eliminado.');
  }else console.log(JSON.stringify(matches));
}finally{await pool.end();}
