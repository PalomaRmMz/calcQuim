import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { validateInventory } from '../src/domain/inventory.mjs';
import { createMobileApi } from '../src/services/mobileApi.mjs';
const admin = new URL('file:///D:/ReactApps/calcQuim-admin/');
const require = createRequire(new URL('server/package.json', admin));
const { Pool } = require('pg');
const { loadOperationalConfig } = await import(new URL('server/src/config/operational.mjs', admin));
const { createDatasetService } = await import(new URL('artifacts/web-paquetes-20261107/source/server/src/services/dataset.mjs', admin));
const qa = JSON.parse(await readFile(new URL('artifacts/web-paquetes-20261107/qa-preview-state.json', admin), 'utf8'));
assert.equal(qa.database, 'calcquim_activation_test');
assert.match(qa.schema, /^calcquim_test_packui_[a-f0-9]{16}$/);
const pool = new Pool((await loadOperationalConfig(qa.database)).database);
try {
  assert.equal((await pool.query('SELECT current_database() AS db')).rows[0].db, qa.database);
  const service = createDatasetService(pool, qa.schema);
  const digest = async () => createHash('sha256').update(JSON.stringify(await service.operations())).digest('hex');
  const before = await digest(), base = `http://127.0.0.1:${qa.apiPort}`;
  const value = validateInventory(await createMobileApi(base, 'synthetic-local-demo-token-not-production').inventory());
  assert.ok(value.products.length > 0);
  assert.equal((await fetch(base + '/api/mobile/v1/inventory')).status, 401);
  assert.equal((await fetch(base + '/api/mobile/v1/inventory', { method: 'POST' })).status, 405);
  assert.equal(await digest(), before);
  const result = { database: qa.database, schema: qa.schema, products: value.products.length,
    knownComposition: value.products.filter(p => p.composition?.known).length,
    unknownBalance: value.products.filter(p => p.quantity === null).length,
    authenticatedRead: true, unauthorizedStatus: 401, writeStatus: 405, unchanged: true,
    checkedAt: new Date().toISOString() };
  await writeFile(new URL('../.artifacts/inventory-qa-verified-20261110.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await pool.end(); }
