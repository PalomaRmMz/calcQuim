import test from 'node:test';
import assert from 'node:assert/strict';
import {businessTimestamp} from '../src/domain/businessTime.mjs';
test('business timestamps keep Mexico City date across UTC midnight regardless of device timezone',()=>{
 const options={year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'};
 const before=businessTimestamp('2026-11-15T00:50:00Z',options);
 assert.match(before,/14\/11\/2026/);assert.match(before,/18:50/);
 const after=businessTimestamp('2026-11-15T15:14:00Z',options);
 assert.match(after,/15\/11\/2026/);assert.match(after,/09:14/);
});
