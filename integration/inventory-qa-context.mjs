import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { withInventoryOperationStatus } from './inventory-operation-status.mjs';
export async function openInventoryQa() {
  const admin = new URL('file:///D:/ReactApps/calcQuim-admin/');
  const require = createRequire(new URL('server/package.json', admin));
  const { Pool } = require('pg');
  const qa = JSON.parse(await readFile(new URL('artifacts/web-paquetes-20261107/qa-preview-state.json', admin), 'utf8'));
  assert.equal(qa.database, 'calcquim_activation_test');
  assert.match(qa.schema, /^calcquim_test_packui_[a-f0-9]{16}$/);
  const { loadOperationalConfig } = await import(new URL('server/src/config/operational.mjs', admin));
  const { createDatasetService } = await import(new URL('artifacts/web-paquetes-20261107/source/server/src/services/dataset.mjs', admin));
  const cfg = await loadOperationalConfig(qa.database);
  assert.equal(cfg.database.database, 'calcquim_activation_test');
  assert.equal(cfg.database.host, '127.0.0.1');
  const pool = new Pool(cfg.database);
  assert.equal((await pool.query('SELECT current_database() AS db')).rows[0].db, qa.database);
  return { qa, pool, service: withInventoryOperationStatus(createDatasetService(pool, qa.schema), pool, qa.schema),
    base: `http://127.0.0.1:${qa.apiPort}`, token: 'synthetic-local-demo-token-not-production' };
}
