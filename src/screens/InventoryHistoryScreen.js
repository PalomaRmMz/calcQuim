import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import { createMobileApi } from '../services/mobileApi.mjs';
import { inventoryScaled, inventoryText } from '../domain/inventoryCapture.mjs';
export default function InventoryHistoryScreen({ model, route }) {
  const [value, setValue] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const id = route.params.productId;
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setValue(await createMobileApi(model.state.baseUrl, model.token).inventoryHistory(id)); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }, [id, model.state.baseUrl, model.token]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <SafeAreaView edges={['bottom']} style={styles.root}>
    <FlatList data={value?.history || []} keyExtractor={m => m.id} contentContainerStyle={styles.page}
      ListHeaderComponent={<View style={{ gap: 12 }}><Text style={styles.title}>{value?.name || 'Historial'}</Text>
        <Text style={styles.muted}>Movimientos conservados · Solo lectura</Text>
        <ActionButton label="Actualizar historial" fullWidth disabled={busy} onPress={load} />
        {!!error && <Text accessibilityRole="alert" style={styles.notice}>{error}</Text>}
      </View>}
      ListEmptyComponent={!busy && !error ? <Text style={styles.muted}>Sin movimientos registrados.</Text> : null}
      renderItem={({ item: m }) => <View style={styles.card}>
        <Text style={styles.heading}>{m.entryType === 'initial_inventory' ? 'Inventario inicial' : m.entryType === 'physical_count' ? 'Conteo físico' : m.reason}</Text>
        <Text style={styles.price}>{m.entryType ? 'Existencia registrada: ' : 'Movimiento: '}{m.quantity} {m.unit}</Text>
        {m.previousQuantity !== null && <Text style={styles.muted}>Anterior: {m.previousQuantity} · Diferencia: {inventoryText(inventoryScaled(m.quantity, { signed: true }) - inventoryScaled(m.previousQuantity, { signed: true }))} {m.unit}</Text>}
        {m.composition && <Text style={styles.muted}>{m.composition.closedPackages} paquetes cerrados × {m.composition.factor} + {m.composition.looseUnits} sueltos</Text>}
        <Text style={styles.muted}>{m.reason}{m.note ? ` · ${m.note}` : ''}</Text>
        {m.audit && <><Text style={styles.muted}>Responsable: {m.audit.responsible}</Text><Text selectable style={styles.muted}>Operación: {m.audit.operationId}</Text></>}
        <Text style={styles.muted}>{new Date(m.recordedAt || m.occurredAt).toLocaleString('es-MX')}</Text>
      </View>} />
  </SafeAreaView>;
}
