import {rmdir,symlink,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const link=fileURLToPath(new URL('./admin/node_modules',import.meta.url));
assert.ok(link.startsWith('D:\\ReactApps\\calcQuim\\qa\\integrated\\'));
assert.ok((await lstat(link)).isSymbolicLink());
// Remove only this newly-created junction, never its target or any files.
await rmdir(link);
await symlink('D:/ReactApps/calcQuim/qa/admin/node_modules',link,'junction');
