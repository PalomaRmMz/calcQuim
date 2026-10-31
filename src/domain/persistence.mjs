export const EMULATOR_QA=typeof __DEV__!=='undefined'&&__DEV__&&process.env.EXPO_PUBLIC_CALCQUIM_QA==='1';
export const MOBILE_KEY = EMULATOR_QA?'calcquim_mobile_qa_20261030':'calcquim_mobile_v1';
export const LEGACY_KEYS = ['currentSale', 'calcquim_products', 'calcquim_products_version'];
export const emptyDraft = () => ({ lines: [], status: 'draft', payment: 'Efectivo' });
export const initialState = () => ({ schema: 1, baseUrl: process.env.EXPO_PUBLIC_CALCQUIM_API_URL || 'http://127.0.0.1:3016', catalog: null, draft: emptyDraft(), mode: 'quantity', usage: {}, receipts: [] });
export function validateState(state) {
  const d=state?.draft;
  if(state?.schema!==1||!Array.isArray(d?.lines)||!Array.isArray(state.receipts)||!state.usage||typeof state.baseUrl!=='string'||!['quantity','amount'].includes(state.mode)||!['draft','sending','confirmed','offline','unknown','rejected'].includes(d.status))throw new Error('El almacenamiento necesita revisión. No se sobrescribió.');
  if(['sending','unknown','offline','rejected'].includes(d.status)&&(!d.attempt?.key||!d.attempt.body||!d.attempt.server))throw new Error('El intento guardado está incompleto. Se conservó para revisión.');
  if(d.status==='confirmed'&&(!d.receipt?.id||d.receipt.status!=='confirmed'))throw new Error('No hay evidencia de confirmación guardada.');
  const ids=new Set();
  for(const line of d.lines){if(!line.id||ids.has(line.id)||!line.reference||!Number.isFinite(line.amount)||!Number.isFinite(line.price)||!Number.isFinite(line.quantity)||line.quantity<=0||typeof line.capturedValue!=='string')throw new Error('El borrador guardado necesita revisión.');ids.add(line.id);}
  return state;
}
export function createMobileStorage(storage) {
  return {
    async load() {
      const raw=await storage.getItem(MOBILE_KEY);
      if(raw===null)return initialState();
      const state=validateState(JSON.parse(raw));
      if(state.draft.status==='sending')state.draft.status='unknown';
      return state;
    },
    save: state=>storage.setItem(MOBILE_KEY,JSON.stringify(validateState(state))),
    async legacy(){return Object.fromEntries(await storage.multiGet(LEGACY_KEYS));},
  };
}
