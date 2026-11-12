import AsyncStorage from '@react-native-async-storage/async-storage';
import {createProductAttemptStorage} from '../domain/productCreationSubmission.mjs';
export const productCreationAttempts=createProductAttemptStorage(AsyncStorage);
