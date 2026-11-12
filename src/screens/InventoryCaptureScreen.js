import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { styles, Field } from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import { createMobileApi } from '../services/mobileApi.mjs';
import { inventoryAttempts } from '../services/inventoryStorage';
import { resolveInventoryAttempt, unresolvedInventory } from '../domain/inventorySubmission.mjs';
import { captureBody, captureQuantity, inventoryScaled, inventoryText } from '../domain/inventoryCapture.mjs';

export default function InventoryCaptureScreen({ model, navigation, route }) {
  const [baseline, setBaseline] = useState(route.params.baseline);
  const [form, setForm] = useState({ quantity: '', closedPackages: '', looseUnits: '', reason: '',
    presentationId: route.params.baseline.product.composition?.presentationId ||
      (route.params.baseline.product.packOptions?.length === 1 ? route.params.baseline.product.packOptions[0].id : '') });
  const [attempt, setAttempt] = useState(null), [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [reviewing, setReviewing] = useState(false);
  const lock = useRef(false), originalServer = useRef(model.state.baseUrl);
  const api = () => createMobileApi(originalServer.current, model.token);
  const p = baseline.product, initial = !p.initialMovementId;
  const pending = attempt && ['prepared','unknown'].includes(attempt.phase);
  const confirmed = attempt?.phase === 'confirmed', rejected = attempt?.phase === 'rejected';
  const editable = ready && !busy && !reviewing && !pending && !confirmed && !rejected;
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !busy, headerBackVisible: !busy });
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => lock.current);
    return () => subscription.remove();
  }, [busy, navigation]);
  useEffect(() => {
    let alive = true;
    inventoryAttempts.all().then(values => {
      const saved = unresolvedInventory(values).find(a => a.server === originalServer.current);
      if (!alive) return;
      if (saved) { setAttempt(saved); setBaseline(saved.baseline); setForm(saved.form); }
      setReady(true);
    }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);
  let capture = null, difference = null;
  try {
    capture = captureQuantity(p, form);
    if (p.quantity !== null) difference = inventoryText(inventoryScaled(capture.quantity) - inventoryScaled(p.quantity, { signed: true }));
  } catch {}
  async function transmit(value, allowSend) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      if (model.state.baseUrl !== originalServer.current) throw new Error('Vuelve a la conexión original para resolver este inventario.');
      const fingerprint = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, model.token);
      const result = await resolveInventoryAttempt({ attempt: value, api: api(), credentialFingerprint: fingerprint,
        persist: inventoryAttempts.save, allowSend });
      setAttempt(result);
      if (result.phase === 'confirmed') setMessage('Inventario guardado y confirmado por el servidor.');
      else setError(result.error || 'Resultado pendiente. Consulta la operación antes de reintentar.');
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function review() {
    if (!editable || lock.current) return;
    setError('');
    try {
      const other = unresolvedInventory(await inventoryAttempts.all()).find(a => a.server === originalServer.current);
      if (other) throw new Error('Resuelve primero la operación pendiente del inventario.');
      const body = captureBody(baseline.snapshot, p, form);
      const permission = initial ? baseline.snapshot.permissions?.initial : baseline.snapshot.permissions?.count;
      if (!permission) throw new Error('El servidor no autorizó esta captura.');
      const isZero = body.quantity === '0';
      const detail = `${p.name}\n${initial ? 'Inventario inicial pendiente' : `Existencia registrada: ${p.quantity ?? 'desconocida'} ${p.unit}`}\nCantidad física: ${body.quantity} ${p.unit}` +
        (capture?.physicalComposition ? `\n${form.closedPackages} paquetes cerrados × ${p.packOptions.find(o => o.id === form.presentationId).factor} + ${form.looseUnits} sueltos` : '') +
        (difference !== null ? `\nDiferencia: ${difference} ${p.unit}` : '') +
        (form.reason ? `\nMotivo: ${form.reason}` : '') + (isZero ? '\nConfirmas expresamente que contaste CERO existencias.' : '');
      setReviewing(true);
      Alert.alert(initial ? 'Confirmar inventario inicial' : 'Confirmar conteo físico', detail, [
        { text: 'Volver a revisar', style: 'cancel', onPress: () => setReviewing(false) },
        { text: isZero ? 'Confirmar cero' : 'Confirmar guardado', onPress: async () => {
          setReviewing(false);
          try {
            const fingerprint = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, model.token);
            const value = { key: Crypto.randomUUID(), server: originalServer.current, credentialFingerprint: fingerprint,
              body: { ...body, zeroConfirmed: isZero }, phase: 'prepared', baseline, form, createdAt: new Date().toISOString() };
            // Show a recoverable pending attempt even if local persistence/network fails.
            setAttempt(value); await transmit(value, true);
          } catch (e) { setError(e.message); }
        } },
      ], { cancelable: false });
    } catch (e) { setError(e.message); }
  }
  async function reloadBaseline() {
    if (lock.current || pending) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const snapshot = await api().inventory(), product = snapshot.products.find(r => String(r.productId) === String(p.productId));
      if (!product) throw new Error('El artículo ya no está disponible.');
      setBaseline({ snapshot, product }); setAttempt(null);
      setMessage(`Saldo actualizado: ${product.quantity ?? 'desconocido'} ${product.unit}. Revisa nuevamente las cantidades y confirma el conteo.`);
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView edges={['bottom']} style={styles.root}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{p.name}</Text>
      <Text style={styles.notice}>{baseline.snapshot.environment === 'synthetic' ? 'QA · Datos de prueba' : 'Base real'} · {confirmed ? (initial ? 'Inventario inicial registrado' : 'Conteo físico registrado') : initial ? 'Inventario inicial pendiente' : 'Conteo físico'}</Text>
      <Text style={styles.muted}>{confirmed ? `Existencia confirmada al guardar: ${attempt.body.quantity} ${p.unit}` : `Existencia registrada: ${p.quantity === null ? 'desconocida' : `${p.quantity} ${p.unit}`}`}</Text>
      {!!message && <Text accessibilityRole="alert" style={styles.notice}>{message}</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.notice}>{error}</Text>}
      <View style={styles.card}>
        {p.packOptions?.length ? <>
          <Text style={styles.heading}>Presentación cerrada</Text>
          {p.packOptions.map(o => <ActionButton key={o.id} label={`${form.presentationId === o.id ? '✓ ' : ''}${o.name} · ${o.factor} ${p.unit}`}
            fullWidth variant={form.presentationId === o.id ? 'primary' : 'secondary'} disabled={!editable} onPress={() => set('presentationId', o.id)} />)}
          <Field label="Paquetes cerrados contados" accessibilityLabel="Paquetes cerrados contados" value={form.closedPackages} onChangeText={v => set('closedPackages', v)} keyboardType="number-pad" editable={editable} />
          <Field label="Unidades sueltas contadas" accessibilityLabel="Unidades sueltas contadas" value={form.looseUnits} onChangeText={v => set('looseUnits', v)} keyboardType="number-pad" editable={editable} />
          <Text style={styles.muted}>El factor proviene de la presentación autorizada. El conteo conserva paquetes y sueltos por separado.</Text>
        </> : <Field label={`Cantidad física (${p.unit})`} accessibilityLabel="Cantidad física contada" value={form.quantity} onChangeText={v => set('quantity', v)} keyboardType={p.unit === 'pieza' ? 'number-pad' : 'decimal-pad'} editable={editable} />}
        <Text style={styles.price}>Equivalente físico: {capture ? `${capture.quantity} ${p.unit}` : 'Pendiente de captura'}</Text>
        {difference !== null && <Text style={styles.price}>Diferencia: {difference} {p.unit}</Text>}
        <Field label={initial ? 'Observaciones (opcional)' : 'Motivo del ajuste'} accessibilityLabel="Motivo del ajuste" value={form.reason} onChangeText={v => set('reason', v)} maxLength={1000} editable={editable} />
      </View>
      {editable && <ActionButton label={initial ? 'Guardar inicial' : 'Guardar conteo'} fullWidth onPress={review} />}
      {pending && <>
        <Text style={styles.notice}>Hay una operación pendiente. No cambies el conteo hasta consultar su resultado.</Text>
        <Text selectable style={styles.muted}>Operación: {attempt.key}</Text>
        <ActionButton label="Consultar resultado" fullWidth disabled={busy} onPress={() => transmit(attempt, false)} />
        {attempt.phase === 'prepared' && <ActionButton label="Reintentar mismo conteo" fullWidth disabled={busy} onPress={() => Alert.alert('Confirmar reintento', 'Se consultará de nuevo el resultado y se usará la misma clave y las mismas cantidades.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Reintentar', onPress: () => transmit(attempt, true) }])} />}
      </>}
      {rejected && <ActionButton label="Consultar saldo actualizado y revisar conteo" fullWidth disabled={busy} onPress={reloadBaseline} />}
      {confirmed && <>
        <Text selectable style={styles.muted}>Movimiento confirmado: {attempt.result.movementId}</Text>
        <ActionButton label="Ver historial" fullWidth onPress={() => navigation.navigate('InventoryHistory', { productId: p.productId })} />
        <ActionButton label="Volver al inventario" fullWidth variant="secondary" onPress={() => navigation.goBack()} />
      </>}
      {busy && <Text style={styles.muted}>Consultando el resultado del servidor…</Text>}
    </ScrollView>
  </SafeAreaView>;
}
