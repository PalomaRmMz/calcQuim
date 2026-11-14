import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url);
async function edit(name,changes){const file=new URL(name,root);let text=(await readFile(file,'utf8')).replaceAll('\r\n','\n');for(const [from,to] of changes){if(!text.includes(from)&&to&&text.includes(to))continue;assert.ok(text.includes(from),name+': '+from.slice(0,70));text=text.replace(from,to);}await writeFile(file,text);}
await edit('src/domain/persistence.mjs',[["EMULATOR_QA?'nexo_stability_qa_v1'","EMULATOR_QA?'nexo_integrated_qa_v1'"]]);
await edit('src/hooks/useMobileSale.js',[["nexo.stability.token.qa","nexo.integrated.token.qa"]]);
await edit('src/services/saleChangesStorage.js',[["nexo.stability.sale.changes.qa.v1","nexo.integrated.sale.changes.qa.v1"]]);
// Preserve production storage keys; separate every QA operation journal as well.
for(const file of ['src/services/inventoryStorage.js','src/services/productCreationStorage.js'])await edit(file,[["'nexo.qa.'","'nexo.integrated.qa.'"]]);
await edit('src/domain/hardwareCreation.mjs',[["/tocador|shampoo|manos/","/tocador|shampoo|manos|naturella|toalla sanitaria/"]]);
await edit('src/screens/HardwareCreateScreen.js',[
 ["name:'',variant:'',unit:","name:'',unit:"],
 ['Jarcería · Cada talla conserva su existencia independiente.','Nombre comercial completo · Un producto, varias presentaciones.'],
 ['  <Field label="Variante o talla (opcional)" value={form.variant} editable={!disabled} onChangeText={v=>set(\'variant\',v)}/>\n',''],
 ['label="Nombre del producto"','label="Nombre comercial completo"'],
 ['placeholder=""','placeholder=""'],
].filter(([from])=>from!=='placeholder=""'));
await edit('src/screens/HardwareCreateScreen.js',[
 ['contentContainerStyle={styles.page}','contentContainerStyle={[styles.page,{gap:10}]}'],
 ['<View style={styles.card} key={i}>','<View style={[styles.card,{padding:12,gap:8}]} key={i}>'],
 ['<ItemSelect enabled={!disabled} selectedValue={p.unit}','<ItemSelect label="Unidad de presentación" enabled={!disabled} selectedValue={p.unit}'],
 ['keyboardType="decimal-pad" editable={!disabled} value={form.quantity}',"keyboardType={['kg','gramo'].includes(form.unit)?'decimal-pad':'number-pad'} editable={!disabled} value={form.quantity}"],
 ['<Text style={styles.label}>Categoría</Text><ItemSelect','<ItemSelect label="Categoría"'],
]);
await edit('src/components/ItemSelect.js',[
 ["<Text style={{flex:1,fontSize:16,color:C.ink}}>","<Text style={{flex:1,fontSize:16,fontWeight:'600',color:C.ink}}>"],
 ["<Text style={{fontSize:16,color:C.ink,fontWeight:c.props.value===selectedValue?'700':'400'}}>{c.props.label}</Text>","<View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name={c.props.value===selectedValue?'check-circle':'circle'} size={21} color={c.props.value===selectedValue?C.primary:C.muted}/><Text style={{flex:1,fontSize:16,color:C.ink,fontWeight:c.props.value===selectedValue?'700':'500'}}>{c.props.label}</Text></View>"],
]);
await edit('src/screens/HomeScreen.js',[["                    Nexo\n","                    Nexo · Ventas\n"]]);
await edit('app.json',[[ '"name": "calcQuim"','"name": "Nexo · Ventas"' ]]);
await edit('app.config.js',[["'Nexo QA'","'Nexo · Ventas'"],["'Nexo QA'","'Nexo · Ventas'"]]);
await edit('qa/integrated/admin/src/components/QuickHardwareCreate.jsx',[
 ["name:'',variant:'',saleMode:","name:'',saleMode:"],
 ["{field('name','Nombre del producto')}{field('variant','Variante o talla (opcional)')}","{field('name','Nombre comercial completo')}"],
 ['type={type} value={form[key]}',"type={type} min={type==='number'?'0':undefined} step={type==='number'?'1':undefined} inputMode={type==='number'?'numeric':key.includes('Price')?'decimal':undefined} value={form[key]}"],
]);
await edit('qa/integrated/admin/src/pages/HardwareProductsPage.jsx',[
 ['<small className="d-block text-muted">{row.original.characteristics}</small>',''],
 ["${draft.variant?' · '+draft.variant:''}",''],
 ["name:draft.name+(!product.id&&draft.variant?' · '+draft.variant:'')","name:draft.name"],
 ['<Field label="Características" maxLength={1000} value={draft.characteristics||\'\'} onChange={e=>setDraft({...draft,characteristics:e.target.value})}/>',''],
 ['{!product.id&&<Field label="Variante o talla (existencia independiente)" value={draft.variant||\'\'} onChange={e=>setDraft({...draft,variant:e.target.value})}/>}',''],
 ['value={p.price} onChange=', 'disabled={draft.pricePending||p.saleEnabled===false} value={p.price} onChange='],
 ['row g-3','row g-2'],
 ['border rounded p-3 mb-3','border rounded p-2 mb-2'],
]);
await edit('qa/integrated/admin/src/components/CommercialSaleForm.jsx',[
 ['const paymentPolicy=',"const integerQuantity=mode!=='amount'&&['pieza','rollo','paquete','envase','botella','bolsa'].includes(captureUnit(tariff));\n const paymentPolicy="],
 ['<input className="form-control" inputMode="decimal" value={value}', '<input className="form-control" type="number" min={integerQuantity?"1":"0.000001"} step={integerQuantity?"1":"0.000001"} inputMode={integerQuantity?"numeric":"decimal"} value={value}'],
 ['</label>}\n </div>', '</label>}\n {commercial&&<button disabled={busy||!tariff||!value.trim()} className="btn btn-primary align-self-end" onClick={add}>Agregar a la venta</button>}</div>'],
 ['<button disabled={busy||!tariff||!value.trim()||Boolean(tariff?.service&&!servicePreview)}','{!commercial&&<button disabled={busy||!tariff||!value.trim()||Boolean(tariff?.service&&!servicePreview)}'],
 ['onClick={add}>Agregar a la venta</button></section>}', 'onClick={add}>Agregar a la venta</button>}</section>}'],
]);
await edit('qa/integrated/admin/src/components/SaleFormModal.jsx',[
 ['data-positive="true" step="any"','data-positive="true" step={item.entryMode!=="amount"&&["pieza","rollo","paquete","envase","botella","bolsa"].includes(item.unit)?"1":"any"}'],
]);
await edit('qa/integrated/admin/src/styles/components/SaleFormModal.css',[
 ['.sale-price-information {', '.sale-modal .sale-capture-hardware { display:flex; flex-wrap:wrap; gap:10px; align-items:end; }\n.sale-modal .sale-capture-quantity { max-width:12rem; }\n.sale-modal .sale-capture-quantity input { width:8rem; }\n.sale-modal .sale-section { margin-bottom:10px; }\n.sale-price-information {'],
]);
// Change visible branding, preserving backup formats, storage and technical identifiers.
for(const [file,changes] of Object.entries({
 'ApplicationRoot.jsx':[['Administración de datos de CalcQuim','Administración de datos de Nexo'],['CalcQuim está listo','Nexo está listo'],['volver a abrir CalcQuim','volver a abrir Nexo']],
 'App.jsx':[['<h1>CalcQuim</h1>','<h1>Nexo · Administración</h1>'],['ventas de CalcQuim','ventas de Nexo']],
 'PostgresApplication.jsx':[["'CalcQuim · PostgreSQL local'","'Nexo · Administración'"],['CalcQuim · PostgreSQL de ensayo','Nexo · Administración · QA']],
 'pages/DataManagementPage.jsx':[['Respaldo de CalcQuim','Respaldo de Nexo'],['restaurar CalcQuim','restaurar Nexo'],['datos de CalcQuim','datos de Nexo']],
}))await edit('qa/integrated/admin/src/'+file,changes);
console.log('Integrated UI refinements applied; historical product fields retained in data.');
