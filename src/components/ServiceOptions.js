import {View,Text} from 'react-native';
import ItemSelect from './ItemSelect';
import {Field,ToggleField,styles} from './BrandUI';
import {laundryOptions} from '../domain/laundryPricing.mjs';

export default function ServiceOptions({service,addons,onAddons,description,onDescription,disabled=false,prefix=''}){
 const options=service.priceMode==='fixed'?laundryOptions(service):[];
 const selected=options.find(o=>o.addons.length===addons.length&&o.addons.every(id=>addons.includes(id)));
 return <View style={{gap:8}}>
 {service.loadPricing&&<>{options.length>1&&<ItemSelect label={prefix+'Tipo de lavado'} enabled={!disabled} selectedValue={selected?.key||''} onValueChange={key=>onAddons(options.find(o=>o.key===key)?.addons||[])}>{options.map(o=><ItemSelect.Item key={o.key} value={o.key} label={o.label}/>)}</ItemSelect>}<Text style={styles.muted}>{service.loadPricing.step===0.5?'Admite cargas completas y medias cargas.':'Solo cargas completas; no admite media carga.'}</Text></>}
 {!service.loadPricing&&service.priceMode==='fixed'&&(service.addons||[]).map(a=><ToggleField key={a.id} label={prefix+a.name} value={addons.includes(a.id)} disabled={disabled} onValueChange={v=>onAddons(v?[...addons,a.id]:addons.filter(id=>id!==a.id))}/>)}
 {(service.priceMode==='custom'||service.descriptionRequired)&&<Field label={prefix+'Descripción del trabajo'} accessibilityLabel={prefix+'Descripción del trabajo'} value={description} maxLength={200} editable={!disabled} onChangeText={onDescription}/>}
 </View>;
}
