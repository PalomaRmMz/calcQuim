import test from 'node:test';
import assert from 'node:assert/strict';
import {qaStorageKey} from '../src/domain/qaNamespace.mjs';
test('QA runs preserve historical keys and isolate credentials, drafts and attempts',()=>{
 for(const key of ['nexo_integrated_qa_v1','nexo.integrated.token.qa','nexo.integrated.sale.changes.qa.v1','nexo.integrated.qa.attempt']){
  assert.equal(qaStorageKey(key),key);
  assert.notEqual(qaStorageKey(key,'audit_a'),qaStorageKey(key,'audit_b'));
  assert.notEqual(qaStorageKey(key,'audit_a'),key);
  assert.match(qaStorageKey(key,'audit_a'),/^[\w.-]+$/);
 }
 for(const bad of ['a/b','a b','../','a'.repeat(81)])assert.throws(()=>qaStorageKey('key',bad));
});
