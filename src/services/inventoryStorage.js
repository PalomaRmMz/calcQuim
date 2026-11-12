import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInventoryAttemptStorage } from '../domain/inventorySubmission.mjs';
export const inventoryAttempts = createInventoryAttemptStorage(AsyncStorage);
