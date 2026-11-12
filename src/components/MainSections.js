import SalesScreen from '../screens/SalesScreen';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import QuickSaleScreen from '../screens/QuickSaleScreen';
import InventoryScreen from '../screens/InventoryScreen';
import { COLORS as C } from '../domain/brand.mjs';

export default function MainSections({ model, navigation }) {
  const [active, setActive] = useState('sale');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const container = useRef(null);
  useEffect(() => {
    let alive = true;
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      // Measure actual overlap so an Android window already resized by the IME
      // is not reduced a second time. Hiding always restores the original layout.
      container.current?.measureInWindow((_x, y, _width, height) => {
        if (alive) setKeyboardInset(Math.max(0, y + height - event.endCoordinates.screenY));
      });
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardInset(0));
    return () => { alive = false; shown.remove(); hidden.remove(); };
  }, []);
  const select = section => { Keyboard.dismiss(); setActive(section); };
  return <View ref={container} style={{ flex: 1, backgroundColor: C.background, paddingBottom: keyboardInset }}>
    {/* Keep the sale screen mounted: switching sections must preserve its UI and draft. */}
    <View style={{ flex: 1, display: active === 'sale' ? 'flex' : 'none' }} accessibilityElementsHidden={active !== 'sale'} importantForAccessibility={active !== 'sale' ? 'no-hide-descendants' : 'auto'}>
      <QuickSaleScreen model={model} navigation={navigation} mainSections />
    </View>
    <View style={{ flex: 1, display: active === 'inventory' ? 'flex' : 'none' }} accessibilityElementsHidden={active !== 'inventory'} importantForAccessibility={active !== 'inventory' ? 'no-hide-descendants' : 'auto'}>
      <InventoryScreen model={model} navigation={navigation} active={active === 'inventory'} />
    </View>
    <View style={{flex:1,display:active==='sales'?'flex':'none'}} accessibilityElementsHidden={active!=='sales'} importantForAccessibility={active!=='sales'?'no-hide-descendants':'auto'}><SalesScreen model={model} navigation={navigation} active={active==='sales'}/></View>
    <SafeAreaView edges={keyboardInset ? ['left', 'right'] : ['bottom', 'left', 'right']} style={{ backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingTop: 5 }}>
        {[{ id: 'sale', label: 'Venta rápida', icon: 'shopping-cart' }, { id: 'inventory', label: 'Inventario', icon: 'package' }, { id: 'sales', label: 'Ventas', icon: 'file-text' }].map(item =>
          <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active === item.id }}
            onPress={() => select(item.id)} style={{ flex: 1, minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: active === item.id ? C.pale : C.white }}>
            <Feather name={item.icon} size={20} color={active === item.id ? C.primary : C.muted} />
            <Text style={{ color: active === item.id ? C.primary : C.muted, fontWeight: active === item.id ? '800' : '500', fontSize: 12 }}>{item.label}</Text>
          </Pressable>)}
      </View>
    </SafeAreaView>
  </View>;
}
