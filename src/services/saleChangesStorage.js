import AsyncStorage from '@react-native-async-storage/async-storage';
import {EMULATOR_QA} from '../domain/persistence.mjs';
const storageKey=EMULATOR_QA?'nexo.integrated.sale.changes.qa.v1':'nexo.sale.changes.v1';
let writes=Promise.resolve();
export const readAttempts=async()=>{const raw=await AsyncStorage.getItem(storageKey);if(raw===null)return [];const rows=JSON.parse(raw);if(!Array.isArray(rows))throw Error('El registro de revisiones requiere recuperación; no se sobrescribió.');return rows;};
export function persist(attempt){const task=writes.then(async()=>{const rows=await readAttempts(),i=rows.findIndex(a=>a.key===attempt.key&&a.server===attempt.server);if(i<0)rows.push(attempt);else rows[i]=attempt;await AsyncStorage.setItem(storageKey,JSON.stringify(rows));});writes=task.catch(()=>{});return task;}
