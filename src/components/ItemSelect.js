import {useState} from 'react';
import {Children} from 'react';
import {Modal,Pressable,ScrollView,Text,View,Keyboard} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {styles} from './BrandUI';
import {COLORS as C} from '../domain/brand.mjs';
export default function ItemSelect({label,enabled=true,selectedValue,onValueChange,children}){
 const [open,setOpen]=useState(false),items=Children.toArray(children).flatMap(c=>c.props?.children?Children.toArray(c.props.children):[c]).filter(c=>c.props?.label);
 const selected=items.find(c=>c.props.value===selectedValue)?.props.label||'Seleccionar';
 return <View style={{gap:7}}>{label&&<Text style={styles.price}>{label}</Text>}
 <Pressable accessibilityRole="button" accessibilityLabel={label||selected} accessibilityState={{disabled:!enabled,expanded:open}} disabled={!enabled} onPress={()=>{Keyboard.dismiss();setOpen(true);}} style={[styles.input,styles.row,{borderColor:enabled?C.primary:C.line,backgroundColor:enabled?C.white:C.pale,opacity:enabled?1:0.65}]}>
 <Text style={{flex:1,fontSize:16,fontWeight:'600',color:C.ink}}>{selected}</Text><Feather name="chevron-down" size={22} color={C.primary}/></Pressable>
 <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
 <View style={{flex:1,backgroundColor:'#0008',justifyContent:'center',padding:20}}><View accessibilityViewIsModal style={[styles.card,{maxHeight:'80%'}]}>
 <Text style={styles.heading}>{label||'Selecciona una opción'}</Text><ScrollView keyboardShouldPersistTaps="handled">{items.map((c,i)=><Pressable key={i} accessibilityRole="radio" accessibilityState={{checked:c.props.value===selectedValue}} onPress={()=>{onValueChange(c.props.value);setOpen(false);}} style={{minHeight:52,padding:14,borderBottomWidth:1,borderColor:C.line,backgroundColor:c.props.value===selectedValue?C.pale:C.white}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name={c.props.value===selectedValue?'check-circle':'circle'} size={21} color={c.props.value===selectedValue?C.primary:C.muted}/><Text style={{flex:1,fontSize:16,color:C.ink,fontWeight:c.props.value===selectedValue?'700':'500'}}>{c.props.label}</Text></View></Pressable>)}</ScrollView>
 <Pressable accessibilityRole="button" onPress={()=>setOpen(false)} style={{minHeight:48,justifyContent:'center'}}><Text style={styles.link}>Cerrar</Text></Pressable>
 </View></View></Modal></View>;
}
ItemSelect.Item=()=>null;
