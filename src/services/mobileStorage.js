import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMobileStorage } from '../domain/persistence.mjs';
export { emptyDraft, initialState } from '../domain/persistence.mjs';
const storage=createMobileStorage(AsyncStorage);
export const loadMobileState=storage.load;
export const saveMobileState=storage.save;
export const readLegacyData=storage.legacy;
