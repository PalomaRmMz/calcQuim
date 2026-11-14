import {createRequire} from 'node:module';import {writeFile,readFile} from 'node:fs/promises';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const {Pool}=createRequire(new URL('./admin/server/package.json',import.meta.url))('pg');const cfg=await loadOperationalConfig('calcquim_activation_test');
if(cfg.database.database!=='calcquim_activation_test')throw Error('QA required');const pool=new Pool({...cfg.database,application_name:'nexo-stability-inspection'});
try{const identity=(await pool.query('SELECT current_database() AS database,current_user AS role')).rows[0];const activity=(await pool.query("SELECT pid,datname,application_name,client_addr::text,state FROM pg_stat_activity WHERE datname IN ('calcquim_operational','calcquim_activation_test') ORDER BY datname,pid")).rows;const evidence={identity,activity};await writeFile(new URL('./postgres-baseline.json',import.meta.url),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));}finally{await pool.end();}

