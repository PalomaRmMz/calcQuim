import {readAttempts as readSaleChanges} from '../services/saleChangesStorage';
import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import {randomUUID} from 'expo-crypto';
import {loadMobileState,saveMobileState,readLegacyData} from '../services/mobileStorage';
import {createMobileApi} from '../services/mobileApi.mjs';
import {createMobileSession} from '../domain/mobileSession.mjs';
import {EMULATOR_QA} from '../domain/persistence.mjs';
import {productCreationAttempts} from '../services/productCreationStorage';
import {pendingProductCreation} from '../domain/productCreationSubmission.mjs';
import {inventoryAttempts} from '../services/inventoryStorage';
import {unresolvedInventory} from '../domain/inventorySubmission.mjs';
const credentialKey=EMULATOR_QA?'nexo.integrated.token.qa':'calcquim.mobile.token';
export function useMobileSale(){
 const session=useRef(null),[view,setView]=useState({state:null,token:'',busy:false,error:'',activity:'',connectionStatus:'cached'}),[legacy,setLegacy]=useState(null);
 useEffect(()=>{
  let alive=true;
  const model=createMobileSession({storage:{load:loadMobileState,save:saveMobileState},credentials:{get:()=>SecureStore.getItemAsync(credentialKey),set:value=>SecureStore.setItemAsync(credentialKey,value)},apiFactory:createMobileApi,uuid:randomUUID,qaToken:EMULATOR_QA?process.env.EXPO_PUBLIC_NEXO_QA_TOKEN||'':'',
   beforeConfigure:async(url,secret,state,token)=>{if(url!==state.baseUrl||secret!==token){if(pendingProductCreation(await productCreationAttempts.all())||unresolvedInventory(await inventoryAttempts.all()).length||(await readSaleChanges()).some(a=>a.server===state.baseUrl&&['prepared','unknown'].includes(a.phase)))throw Error('Resuelve las operaciones de inventario o altas con su conexión original.');}},
  });session.current=model;
  const unsubscribe=model.subscribe(value=>{if(alive)setView(value);});
  model.load().then(()=>{if(alive)model.resume();}).catch(e=>{if(alive)setView(v=>({...v,error:e.message}));});
  (EMULATOR_QA?Promise.resolve({}):readLegacyData()).then(v=>{if(alive)setLegacy(v);}).catch(e=>{if(alive)setView(v=>({...v,error:e.message}));});
  let last=null;
  const network=NetInfo.addEventListener(n=>{if(n.isConnected!==last){last=n.isConnected;model.network(last);}});
  const lifecycle=AppState.addEventListener('change',next=>{if(next==='active')model.resume();else model.suspend();});
  return()=>{alive=false;network();lifecycle.remove();unsubscribe();model.dispose();};
 },[]);
 const call=name=>(...args)=>session.current?.[name](...args);
 return {...view,legacy,...Object.fromEntries(['capture','configure','sync','mode','payment','add','remove','cancel','submit','newSale','checkPending','reconcile','lookupWebSale'].map(name=>[name,call(name)]))};
}
