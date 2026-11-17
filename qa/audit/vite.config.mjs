import {defineConfig} from '../integrated/admin/node_modules/vite/dist/node/index.js';
import react from '../integrated/admin/node_modules/@vitejs/plugin-react/dist/index.js';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('../integrated/admin/',import.meta.url)),cacheDir:fileURLToPath(new URL('../../.artifacts/audit/vite-cache/',import.meta.url)),plugins:[react()],define:{'import.meta.env.CALCQUIM_OPERATIONAL':'false'},server:{host:'127.0.0.1',port:5207,strictPort:true,fs:{allow:[fileURLToPath(new URL('../../',import.meta.url))]},proxy:{'/api':{target:'http://127.0.0.1:63337',changeOrigin:true}}}});
