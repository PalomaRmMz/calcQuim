import {EMULATOR_QA} from '../domain/persistence.mjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createProductAttemptStorage} from '../domain/productCreationSubmission.mjs';
export const productCreationAttempts=createProductAttemptStorage(EMULATOR_QA?{getItem:key=>AsyncStorage.getItem('nexo.integrated.qa.'+key),setItem:(key,value)=>AsyncStorage.setItem('nexo.integrated.qa.'+key,value)}:AsyncStorage);
