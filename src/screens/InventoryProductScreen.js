import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import { createMobileApi } from '../services/mobileApi.mjs';
import { validateInventory } from '../domain/inventory.mjs';
import { inventoryAttempts } from '../services/inventoryStorage';
import { unresolvedInventory } from '../domain/inventorySubmission.mjs';

export default function InventoryProductScreen({ model, navigation, route }) {
  const [baseline, setBaseline] = useState(route.params.baseline);
  const [pending, setPending] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const id = route.params.baseline.product.productId;
  const base = model.state.baseUrl, token = model.token;
  const refresh = useCallback(async alive => {
    setBusy(true); setError('');
    try {
      const snapshot = validateInventory(await createMobileApi(base, token).inventory());
      const product = snapshot.products.find(p => String(p.productId) === String(id));
      if (!product) throw new Error('El producto ya no está disponible en este inventario.');
      if (alive()) setBaseline({ snapshot, product });
      const values = await inventoryAttempts.all();
      if (alive()) setPending(unresolvedInventory(values).find(a => a.server === base) || null);
    } catch (e) { if (alive()) setError(e.offline ? 'Sin respuesta de Admin. Mostramos la última consulta; actualiza antes de capturar.' : e.message); }
    finally { if (alive()) setBusy(false); }
  }, [base, token, id]);
  useFocusEffect(useCallback(() => {
    let alive = true; refresh(() => alive);
    return () => { alive = false; };
  }, [refresh]));
  const { snapshot, product: p } = baseline;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.root}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{p.name}</Text>
      <Text style={styles.muted}>{p.categoryName || 'Sin categoría'} · {snapshot.environment === 'synthetic' ? 'QA · Datos de prueba' : 'Base real'}</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.notice}>{error}</Text>}
      <View style={styles.card}>
        {!p.initialMovementId && <Text style={styles.notice}>Inventario inicial pendiente</Text>}
        <Text style={styles.heading}>{p.quantity === null ? 'Saldo desconocido' : `${p.quantity} ${p.unit}`}</Text>
        <Text style={styles.muted}>{p.status === 'unknown' ? 'Sin base de inventario' : p.status === 'estimated' ? 'Saldo estimado' : 'Saldo calculado'}</Text>
        {p.composition?.known ? <Text style={styles.muted}>
          {p.composition.closedPackages} paquetes cerrados × {p.composition.factor} · {p.composition.looseUnits} unidades sueltas
        </Text> : <Text style={styles.muted}>Composición de paquetes y sueltos desconocida</Text>}
        {p.low && <Text style={styles.notice}>Existencia en mínimo o por debajo{p.minimum != null ? ` · Mínimo ${p.minimum} ${p.unit}` : ''}</Text>}
        <Text style={styles.muted}>{error ? 'Última consulta' : 'Consultado'} {new Date(snapshot.generatedAt).toLocaleString('es-MX')}</Text>
      </View>
      {pending && <><Text style={styles.notice}>Hay un inventario pendiente de confirmar.</Text>
        <ActionButton label="Resolver operación pendiente" fullWidth onPress={() => navigation.navigate('InventoryCapture', { baseline: pending.baseline })} /></>}
      {p.captureAvailable === false && <Text style={styles.notice}>Las presentaciones físicas requieren revisión en Admin antes de contar.</Text>}
      {p.captureAvailable !== false && (p.initialMovementId ? snapshot.permissions?.count : snapshot.permissions?.initial) &&
        <ActionButton label={p.initialMovementId ? 'Realizar conteo' : 'Registrar inicial'} fullWidth disabled={!!pending || busy || !!error}
          onPress={() => navigation.navigate('InventoryCapture', { baseline })} />}
      <ActionButton label="Ver historial" fullWidth variant="secondary" onPress={() => navigation.navigate('InventoryHistory', { productId: p.productId })} />
      <ActionButton label={busy ? 'Actualizando…' : 'Actualizar existencias'} fullWidth variant="secondary" disabled={busy} onPress={() => refresh(() => true)} />
    </ScrollView>
  </SafeAreaView>;
}
