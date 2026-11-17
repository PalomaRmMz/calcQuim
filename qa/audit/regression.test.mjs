import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareCreationBundle} from '../../src/domain/hardwareCreation.mjs';
import {catalogChoices} from '../../src/domain/catalog.mjs';
import {makeLine,requestBody} from '../../src/domain/sale.mjs';
import {openStability as openQa} from './runtime.mjs';
const form={name:'QA',saleMode:'both',packSize:'8',piecePrice:'5',packPrice:'21',initialEnabled:true,closedPackages:'4',looseUnits:'0'};
test('rechaza contenido ambiguo, cantidades vacias y fracciones de paquetes',()=>{
 for(const patch of [{packSize:'1'},{packSize:'1.5'},{closedPackages:''},{closedPackages:'-1'},{looseUnits:'1.5'}])assert.throws(()=>hardwareCreationBundle({...form,...patch}));
 assert.equal(hardwareCreationBundle({...form,saleMode:'pack'}).presentations.length,1);
 assert.equal(hardwareCreationBundle({...form,saleMode:'piece',quantity:'3'}).initialInventory.quantity,'3');
});
test('tres modalidades, pendiente, compra separada, concurrencia y Mr Big en PostgreSQL QA',async t=>{
 const q=await openQa();
 async function create(name,patch={}){const b=hardwareCreationBundle({...form,name,...patch});return (await q.command('saveHardwareProductBundle',b)).result.id;}
 async function stock(id){const i=await q.service.inventory();return {...i.products.find(p=>p.productId===id),pack:i.packInventory.products.find(p=>p.productId===id)};}
 async function sale(id,unit,count){const s=await q.service.read();const data={...s.data,...s.data.procurement},choice=catalogChoices(data).find(c=>c.tariffs[0].presentation?.productId===id&&c.tariffs[0].unit===unit);assert.ok(choice);const line=makeLine(choice,choice.tariffs[0],'quantity',String(count),'test');const body=requestBody({lines:[line],payment:'Efectivo'},{...s,pricingVersion:'admin-sales-normal-v1'});return q.command('createCommercialSale',body);}
 try{
  await t.test('solo pieza rechaza negativos sin alterar venta',async()=>{const id=await create('Fibra QA',{saleMode:'piece',quantity:'2'});await sale(id,'pieza',2);assert.equal((await stock(id)).quantity,'0');await assert.rejects(sale(id,'pieza',1),{code:'INSUFFICIENT_STOCK'});});
  await t.test('solo paquete no crea venta individual y conserva cerrado',async()=>{const id=await create('Solo paquetes QA',{saleMode:'pack'});await sale(id,'paquete',1);assert.equal((await stock(id)).pack.closedPackages,'3');const s=await q.service.read();assert.equal(catalogChoices({...s.data,...s.data.procurement}).filter(c=>c.tariffs[0].presentation?.productId===id).length,1);});
  await t.test('precio pendiente conserva dos presentaciones y composición, sin venta',async()=>{const id=await create('Pendiente QA',{pricePending:true});const s=await q.service.read();assert.equal(s.data.procurement.presentations.filter(p=>p.productId===id).length,2);assert.equal((await stock(id)).pack.closedPackages,'4');assert.equal(catalogChoices({...s.data,...s.data.procurement}).some(c=>c.tariffs[0].presentation?.productId===id),false);});
  await t.test('Mr Big 600 y 800 hojas: cuatro rollos, apertura única',async()=>{for(const size of ['600','800']){const id=await create(`Mr Big ${size} hojas QA`,{packSize:'4'});await sale(id,'pieza',1);const p=await stock(id);assert.equal(p.pack.closedPackages,'3');assert.equal(p.pack.looseUnits,'3');assert.equal(p.quantity,'15');}});
  await t.test('dos dispositivos: una sola venta gana y no hay descuento parcial',async()=>{const id=await create('Concurrencia QA',{closedPackages:'1'});const s=await q.service.read(),p=s.data.procurement.presentations.find(p=>p.productId===id&&p.unit==='pieza');const args=[{commerceVersion:'fullclean-commerce-v1',payment:'Efectivo',items:[{reference:{kind:'presentation',id:p.id},tariffKey:'commerce:'+p.id,price:5,unit:'pieza',entryMode:'quantity',value:'6'}]}];const results=await Promise.allSettled(['one','two'].map(key=>q.service.command({name:'createCommercialSale',args,revision:s.revision,generation:s.generation,requestKey:'qa-concurrent-'+key})));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'STALE_DATA');assert.equal((await stock(id)).quantity,'2');await assert.rejects(sale(id,'pieza',6));assert.equal((await stock(id)).quantity,'2');});
  await t.test('compra recibida agrega paquetes y no duplica por reintento',async()=>{
    const id=await create('Reposicion QA');
    await q.command('configurePurchaseInventory',{acknowledgeHistorical:true});
    const supplier=(await q.command('saveSupplier',{name:'Proveedor QA',active:true,businessActivity:'JARCERIA'})).data.procurement.suppliers[0];
    const s=await q.service.read(),p=s.data.procurement.presentations.find(p=>p.productId===id&&p.unit==='paquete');
    const args=[{supplierId:supplier.id,date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'}),presentationId:p.id,quantity:'2',cost:'15'}];
    const state=await q.service.read();const request={name:'savePresentationPurchase',args,revision:state.revision,generation:state.generation,requestKey:'qa-purchase-retry'};
    await q.service.command(request);await q.service.command(request);
    const balance=await stock(id);assert.equal(balance.quantity,'48');assert.equal(balance.pack.closedPackages,'6');assert.equal(balance.pack.looseUnits,'0');
    const view=await q.service.operations();assert.equal(view.purchases.rows.filter(r=>String(r.product_id)===String(id)&&r.state==='applied').length,1);
  });
  await t.test('varios contenidos conservan el factor del paquete elegido',async()=>{
    const id=await create('Varios paquetes QA',{saleMode:'advanced',unit:'pieza',autoOpenPackages:true,initialPresentationIndex:1,closedPackages:'2',looseUnits:'3',presentations:[{name:'Paquete cuatro',unit:'paquete',factor:'4',price:'15'},{name:'Paquete ocho',unit:'paquete',factor:'8',price:'21'},{name:'Pieza',unit:'pieza',factor:'1',price:'5'}]});
    const p=await stock(id);assert.equal(p.quantity,'19');assert.equal(p.pack.factor,'8');assert.equal(p.pack.closedPackages,'2');assert.equal(p.pack.looseUnits,'3');
  });
  await t.test('sin apertura habilitada no abre paquetes para una pieza',async()=>{
    const id=await create('No abrir QA',{saleMode:'advanced',unit:'pieza',autoOpenPackages:false,initialPresentationIndex:0,closedPackages:'1',looseUnits:'0',presentations:[{name:'Paquete',unit:'paquete',factor:'8',price:'21'},{name:'Pieza',unit:'pieza',factor:'1',price:'5'}]});
    await assert.rejects(sale(id,'pieza',1));assert.equal((await stock(id)).quantity,'8');await sale(id,'paquete',1);assert.equal((await stock(id)).quantity,'0');
  });
  await t.test('una presentación de compra no queda habilitada para venta',async()=>{const id=await create('Compra caja QA',{saleMode:'advanced',unit:'pieza',autoOpenPackages:true,presentations:[{name:'Caja 12',unit:'paquete',factor:'12',price:'',saleEnabled:false},{name:'Pieza',unit:'pieza',factor:'1',price:'5'}],initialEnabled:false});const s=await q.service.read();assert.equal(s.data.procurement.presentations.filter(p=>p.productId===id).length,2);assert.equal(catalogChoices({...s.data,...s.data.procurement}).filter(c=>c.tariffs[0].presentation?.productId===id).length,1);});
 }finally{await q.close();}
});

