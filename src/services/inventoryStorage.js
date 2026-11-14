import {EMULATOR_QA} from '../domain/persistence.mjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInventoryAttemptStorage } from '../domain/inventorySubmission.mjs';
export const inventoryAttempts = createInventoryAttemptStorage(EMULATOR_QA?{getItem:key=>AsyncStorage.getItem('nexo.integrated.qa.'+key),setItem:(key,value)=>AsyncStorage.setItem('nexo.integrated.qa.'+key,value)}:AsyncStorage);
