// Operación explícita: ejecutar solo tras autorización del propietario.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('file:///D:/ReactApps/calcQuim-admin/');
const require=createRequire(new URL('server/package.json',root));
const {Pool}=require('pg');
const {loadOperationalConfig,requireActivation}=await import(new URL('server/src/config/operational.mjs',root));
const {readDataset}=await import(new URL('server/src/repositories/dataset.mjs',root));
const {readInventory}=await import(new URL('server/src/repositories/inventory.mjs',root));
const {canonical}=await import(new URL('server/src/services/dataset.mjs',root));
const {sha256}=await import(new URL('server/src/services/reconciliation.mjs',root));
const {verifyPgArchive}=await import(new URL('server/src/db/pgTools.mjs',root));
const {migrate}=await import(new URL('server/src/db/migrate.mjs',root));
if(!process.argv.includes('--authorize-operational'))throw new Error('Autorización operativa requerida.');
await requireActivation();
const config=await loadOperationalConfig();
if(config.database.database!=='calcquim_operational'||config.database.host!=='127.0.0.1'||config.schema!=='calcquim_operational')throw new Error('Destino inválido.');
const migrationFiles=(await readdir(new URL('server/migrations/',root))).filter(n=>/^\d+_.+\.up\.sql$/.test(n)).sort();
if(migrationFiles.length!==7||migrationFiles.at(-1)!=='007_mobile_sales.up.sql')throw new Error('Cambió el alcance de las migraciones; revisar antes de aplicar.');
const pool=new Pool(config.database),c=await pool.connect();
const evidence={at:new Date().toISOString(),database:'calcquim_operational',applied:false};
try{
  await c.query('BEGIN');await c.query('SET LOCAL search_path TO calcquim_operational,pg_catalog');
  await c.query("SET LOCAL lock_timeout='5s'");
  const before=await readDataset(c,true,'operational');
  const versions=(await c.query('SELECT version FROM schema_migrations ORDER BY version')).rows.map(r=>r.version);
  if(!['[1,2,3,4,5,6]','[1,2,3,4,5,6,7]'].includes(JSON.stringify(versions)))throw new Error('Versión de esquema inesperada.');
  const datasetHash=sha256(canonical(before));
  const inventoryHash=sha256(canonical(JSON.parse(JSON.stringify(await readInventory(c,before.data)))));
  console.log('Creando respaldo operativo con los comandos comerciales serializados durante la operación…');
  const backup=spawnSync(process.execPath,[fileURLToPath(new URL('server/scripts/backup-operational.mjs',root))],{windowsHide:true,encoding:'utf8',timeout:300000});
  if(backup.status!==0)throw new Error('Falló el respaldo: no se aplicó la migración.');
  const directory=new URL('server/artifacts/operational/backups/',root);
  const names=(await readdir(directory)).filter(n=>/^postgres-.*\.private\.json$/.test(n)).sort();
  const manifest=JSON.parse(await readFile(new URL(names.at(-1),directory),'utf8'));
  if(!/^[a-zA-Z0-9_-]+\.dump$/.test(manifest.file))throw new Error('Nombre de respaldo inválido.');
  const dump=new URL(manifest.file,directory),bytes=await readFile(dump);
  if(manifest.snapshotSha256!==datasetHash||manifest.inventorySha256!==inventoryHash||manifest.sha256!==sha256(bytes)||manifest.bytes!==bytes.length)throw new Error('El respaldo no coincide con el estado bloqueado.');
  verifyPgArchive(fileURLToPath(dump));
  evidence.backupFile=manifest.file;evidence.backupSha256=manifest.sha256;evidence.backupVerified=true;
  console.log('Respaldo verificado. Aplicando exclusivamente la migración móvil pendiente…');
  await migrate(pool,'calcquim_operational','up',{client:c});
  const after=await readDataset(c,false,'operational');
  if(sha256(canonical(after))!==datasetHash||sha256(canonical(JSON.parse(JSON.stringify(await readInventory(c,after.data)))))!==inventoryHash)throw new Error('Cambió información comercial; se revierte la operación.');
  await c.query('COMMIT');evidence.applied=true;evidence.businessDataUnchanged=true;
  evidence.products=after.data.products.length;evidence.sales=after.data.sales.length;
  console.log(JSON.stringify({code:'MOBILE_OPERATIONAL_SCHEMA_READY',products:evidence.products,sales:evidence.sales,businessDataUnchanged:true,backupVerified:true}));
}catch(error){await c.query('ROLLBACK');throw error;}
finally{
  c.release();await pool.end();await mkdir(new URL('../.artifacts/',import.meta.url),{recursive:true});
  await writeFile(new URL('../.artifacts/mobile-operational-activation.private.json',import.meta.url),JSON.stringify(evidence,null,2),{mode:0o600});
}
