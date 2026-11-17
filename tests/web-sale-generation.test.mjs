import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSaleDraftGeneration} from '../qa/integrated/admin/src/domain/saleDraftGuard.mjs';
test('catalog refresh may advance revision but cannot move a draft into another generation',()=>{assert.doesNotThrow(()=>assertSaleDraftGeneration('same',{generation:'same',revision:9}));assert.throws(()=>assertSaleDraftGeneration('old',{generation:'new',revision:9}),/conjunto de datos cambió/);assert.throws(()=>assertSaleDraftGeneration(undefined,{generation:'new'}));});
