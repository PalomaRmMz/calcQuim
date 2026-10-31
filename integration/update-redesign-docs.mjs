import fs from 'node:fs/promises';
const guide='docs/APK_Y_WIFI.md';let text=await fs.readFile(guide,'utf8');
text=text.replace('https://expo.dev/artifacts/eas/mXjzQwq4H8xHqHSMKxK7gh2UjJpLnOiPOKhIGny1Y-A.apk','https://expo.dev/artifacts/eas/btq6xg67-4CKNmPVj_QeD_cEAUCkvFshAza09wzUyDQ.apk').replaceAll('CalcQuim-Pruebas-WiFi.apk','CalcQuim-Pruebas-WiFi-v2.apk').replace('código 1;','código 2;').replace('dff656a31eb35b9f9ce565028e077d124591c04ce7f391e463e5a8c7c4185bb0','9ed240a75738b813c5b1b63e53cf249ce0d79a7cc27108a155e6deb2301989a2').replaceAll('**Registrar venta real**','**Registrar venta**').replace('Deben aparecer los productos oficiales y el indicador **Base real**.','Debe aparecer **Admin conectado** y la fecha de sincronización; las opciones aparecen al escribir en el buscador.');
if(!text.includes('REDISENO_Y_TICKET.md'))text=text.replace('# APK de pruebas y conexión Wi-Fi','# APK de pruebas y conexión Wi-Fi\n\nEl código 2 incluye el [rediseño definitivo, ticket PNG/PDF y pruebas](REDISENO_Y_TICKET.md).');
await fs.writeFile(guide,text);
const integration='docs/INTEGRACION_MOVIL.md';let previous=await fs.readFile(integration,'utf8');
if(!previous.includes('REDISENO_Y_TICKET.md')){previous=previous.replace('# CalcQuim móvil y Admin','# CalcQuim móvil y Admin\n\n**Guía vigente:** [Rediseño definitivo, APK 2, ticket y verificaciones](REDISENO_Y_TICKET.md). Las etapas previas que siguen se conservan como referencia histórica.');await fs.writeFile(integration,previous);}
console.log('Documentación enlazada al APK 2 y a la guía vigente.');
