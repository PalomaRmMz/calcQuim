import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createServer} from '../qa/integrated/admin/node_modules/vite/dist/node/index.js';
import react from '../qa/integrated/admin/node_modules/@vitejs/plugin-react/dist/index.js';
const require=createRequire(new URL('../qa/integrated/admin/package.json',import.meta.url));
const React=require('react'),{renderToString}=require('react-dom/server');
test('recreated laundry service honors configured half-load minimum independently of its identifier',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../qa/integrated/admin/',import.meta.url)),configFile:false,plugins:[react()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{
  const {default:Fields}=await server.ssrLoadModule('/src/components/LaundrySaleFields.jsx');
  for(const step of [0.5,1]){
   const service={id:'new-service-id',name:'QA laundry',unit:'carga',priceMode:'fixed',price:60,addons:[],loadPricing:{version:'laundry-loads-v1',step,options:[{key:'solo',label:'Solo lavado',addons:[],full:60,half:step===0.5?30:null}]}};
   const html=renderToString(React.createElement(Fields,{service,value:String(step),addons:[],onValue:()=>{},onAddons:()=>{},onDescription:()=>{},preview:{amount:step*60}}));
   assert.match(html,new RegExp(`min="${step}"`));assert.match(html,new RegExp(`step="${step}"`));
  }
 }finally{await server.close();}
});
