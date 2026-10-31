import { createRequire } from 'node:module';
const root=new URL('file:///D:/ReactApps/calcQuim-admin/');
const require=createRequire(new URL('server/package.json',root));
const {Pool}=require('pg');
const {loadOperationalConfig,requireActivation}=await import(new URL('server/src/config/operational.mjs',root));
await requireActivation();
const config=await loadOperationalConfig();
if(config.database.database!=='calcquim_operational'||config.database.host!=='127.0.0.1')throw new Error('Destino no autorizado.');
const pool=new Pool({...config.database,options:'-c default_transaction_read_only=on'});
try{
  const c=await pool.connect();
  try{
    await c.query('BEGIN READ ONLY');await c.query('SET LOCAL search_path TO calcquim_operational,pg_catalog');
    const identity=(await c.query("SELECT current_database() AS database,current_setting('transaction_read_only') AS read_only")).rows[0];
    const versions=(await c.query('SELECT version FROM schema_migrations ORDER BY version')).rows.map(r=>r.version);
    const counts={};
    for(const name of ['products','categories','product_lines','price_groups','sales','inventory_movements'])counts[name]=Number((await c.query(`SELECT count(*) AS n FROM ${name}`)).rows[0].n);
    console.log(JSON.stringify({...identity,versions,counts}));
    await c.query('ROLLBACK');
  }finally{c.release();}
}finally{await pool.end();}
