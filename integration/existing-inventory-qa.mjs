import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { installMobileInventoryRoute } from './mobile-inventory-route.mjs';
import { withInventoryOperationStatus } from './inventory-operation-status.mjs';

const admin = new URL('file:///D:/ReactApps/calcQuim-admin/');
const prepared = new URL('artifacts/web-paquetes-20261107/source/', admin);
const require = createRequire(new URL('server/package.json', admin));
const express = require('express'), { Pool } = require('pg');
const { loadOperationalConfig } = await import(new URL('server/src/config/operational.mjs', admin));
const { createDatasetService } = await import(new URL('server/src/services/dataset.mjs', prepared));
const { mobileRouter } = await import(new URL('server/src/mobile/router.mjs', prepared));
const qa = JSON.parse(await readFile(new URL('artifacts/web-paquetes-20261107/qa-preview-state.json', admin), 'utf8'));
assert.equal(qa.database, 'calcquim_activation_test');
assert.match(qa.schema, /^calcquim_test_packui_[a-f0-9]{16}$/);
const config = await loadOperationalConfig(qa.database);
assert.equal(config.database.database, 'calcquim_activation_test');
const pool = new Pool(config.database);
assert.equal((await pool.query('SELECT current_database() AS db')).rows[0].db, qa.database);
const service = withInventoryOperationStatus(createDatasetService(pool, qa.schema), pool, qa.schema);
const writeEnabled = process.argv.includes('--write-authorized');
const principal = { id: 'qa-android-inventory', name: 'Operador QA Android', permissions: ['inventory:initial', 'inventory:count'] };
const token = 'synthetic-local-demo-token-not-production';
const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
// Only the explicit inventory command can write to the verified existing QA schema.
// Sales, purchases and administrative commands remain inaccessible here.
app.use((req, res, next) => ['GET', 'HEAD'].includes(req.method) || (writeEnabled && req.method === 'POST' && req.path === '/api/mobile/v1/inventory/operations')
  ? next() : res.status(405).json({ error: { code: 'READ_ONLY', message: 'Operación no permitida en este QA.' } }));
app.use('/api/mobile/v1', installMobileInventoryRoute(mobileRouter(service, { enabled: true, token }), service, { writeEnabled, principal }));
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }));
app.use((e, _req, res, _next) => res.status(e.status || 503).json({ error: { code: e.code || 'INVENTORY_UNAVAILABLE', message: e.status < 500 ? e.message : 'Inventario no disponible.' } }));
const server = app.listen(qa.apiPort, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
console.log(`QA existente: http://127.0.0.1:${qa.apiPort}; ${qa.database}/${qa.schema}; captura de inventario ${writeEnabled ? 'autorizada en QA' : 'deshabilitada'}.`);
async function close() { server.closeIdleConnections(); await new Promise(resolve => server.close(resolve)); await pool.end(); }
process.once('SIGINT', () => close().then(() => process.exit(0)));
process.once('SIGTERM', () => close().then(() => process.exit(0)));
