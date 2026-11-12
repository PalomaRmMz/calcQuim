import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import { COLORS as C } from '../domain/brand.mjs';
import { createMobileApi } from '../services/mobileApi.mjs';
import { searchInventory, validateInventory } from '../domain/inventory.mjs';
import { inventoryAttempts } from '../services/inventoryStorage';
import { unresolvedInventory } from '../domain/inventorySubmission.mjs';

export default function InventoryScreen({ model, navigation, active = true }) {
  const base = model.state?.baseUrl, token = model.token;
  const [snapshot, setSnapshot] = useState(null), [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [category, setCategory] = useState('Todas'), [pending, setPending] = useState(null);
  const epoch = useRef(0), loading = useRef(false);
  const refresh = useCallback(async () => {
    if (!base || !token || loading.current) return;
    loading.current = true;
    const request = ++epoch.current;
    setBusy(true); setError('');
    try {
      const value = validateInventory(await createMobileApi(base, token).inventory());
      if (epoch.current === request) setSnapshot(value);
    } catch (e) {
      if (epoch.current === request) setError(e.status === 404
        ? 'La consulta móvil de inventario aún no está habilitada en este servidor.'
        : e.offline ? 'Sin respuesta de Admin. Puedes buscar en la última consulta disponible.' : e.message);
    } finally {
      if (epoch.current === request) { loading.current = false; setBusy(false); }
    }
  }, [base, token]);
  useEffect(() => { setSnapshot(null); }, [base, token]);
  useEffect(() => { if (active) { setQuery(''); setCategory('Todas'); } }, [active]);
  useFocusEffect(useCallback(() => {
    if (!active) return;
    let alive = true;
    refresh();
    inventoryAttempts.all().then(values => {
      if (alive) setPending(unresolvedInventory(values).find(a => a.server === base) || null);
    }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; epoch.current++; loading.current = false; };
  }, [active, refresh, base]));
  const searching = query.trim().length > 0;
  const categories = ['Todas', ...new Set((snapshot?.products || []).map(p => p.categoryName || 'Sin categoría'))];
  const products = searchInventory(snapshot?.products || [], query).filter(p => category === 'Todas' || (p.categoryName || 'Sin categoría') === category);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
    <FlatList data={products} keyExtractor={p => String(p.productId)}
      contentContainerStyle={{ padding: 16, gap: 0 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      refreshing={busy} onRefresh={refresh}
      ListHeaderComponent={<View style={{ gap: 12, paddingBottom: 12 }}>
        <View style={styles.row}>
          <Text style={[styles.heading, { fontSize: 22, flex: 1 }]}>Inventario de jarcería</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Conexión y datos" onPress={() => { Keyboard.dismiss(); navigation.navigate('Connection'); }} style={{ padding: 10 }}>
            <Feather name="settings" size={21} color={C.primary} />
          </Pressable>
        </View>
        <ActionButton label="Agregar producto" fullWidth variant="secondary" onPress={()=>navigation.navigate('HardwareCreate')}/>
        <View style={[styles.row, { gap: 4 }]}>
          <TextInput style={[styles.input, { flex: 1 }]} accessibilityLabel="Buscar producto" placeholder="Buscar producto..."
            placeholderTextColor={C.muted} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
          {searching && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => { setQuery(''); setCategory('Todas'); }} style={{ padding: 12 }}>
            <Feather name="x" size={20} color={C.muted} />
          </Pressable>}
        </View>
        {searching && <>
          <View style={styles.row}>
            <Text style={styles.muted}>{snapshot?.environment === 'synthetic' ? 'QA · ' : ''}{busy ? 'Actualizando…' : `${products.length} coincidencias`}{error && snapshot ? ' · Última consulta' : ''}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Actualizar inventario" disabled={busy} onPress={refresh} style={{ padding: 8 }}>
              <Feather name="refresh-cw" size={17} color={C.primary} />
            </Pressable>
          </View>
          {categories.length > 2 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {categories.map(name => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`Categoría ${name}`}
              onPress={() => setCategory(name)} style={[styles.chip, { paddingVertical: 6 }, category === name && styles.selected]}>
              <Text style={category === name ? styles.white : styles.muted}>{name}</Text>
            </Pressable>)}
          </ScrollView>}
          {!!error && <Text accessibilityRole="alert" style={styles.notice}>{error}</Text>}
          {!token && <Text style={styles.notice}>Configura la credencial móvil en Conexión y datos.</Text>}
        </>}
        {pending && <><Text style={styles.notice}>Hay un inventario pendiente de confirmar.</Text>
          <ActionButton label="Resolver operación pendiente" fullWidth onPress={() => { Keyboard.dismiss(); navigation.navigate('InventoryCapture', { baseline: pending.baseline }); }} /></>}
      </View>}
      ListEmptyComponent={<Text style={[styles.muted, { paddingVertical: 12 }]}>
        {!searching ? 'Busca un producto para comenzar' : busy && !snapshot ? 'Consultando inventario…' : snapshot ? 'No se encontraron productos' : ''}
      </Text>}
      renderItem={({ item: p }) => <Pressable accessibilityRole="button" accessibilityLabel={`Ver existencias de ${p.name}`}
        onPress={() => { Keyboard.dismiss(); navigation.navigate('InventoryProduct', { baseline: { snapshot, product: p } }); }}
        style={[styles.row, { minHeight: 68, padding: 12, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.white }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.price}>{p.name}</Text>
          <Text style={styles.muted}>{p.quantity === null ? 'Saldo desconocido' : `${p.quantity} ${p.unit}`} · {p.categoryName || 'Sin categoría'}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={C.primary} />
      </Pressable>}
    />
  </SafeAreaView>;
}
