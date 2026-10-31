import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import { styles, Field } from "../components/BrandUI";
export default function ConnectionScreen({ model: m, navigation }) {
  const [url, setUrl] = useState(m.state?.baseUrl || ""),
    [secret, setSecret] = useState(m.token),
    [showLegacy, setShowLegacy] = useState(false);
  const legacySales = (() => {
    try {
      return JSON.parse(m.legacy?.currentSale || "[]");
    } catch {
      return null;
    }
  })();
  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Conectar con Admin</Text>
          <Field
            label="Dirección del servidor local"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="URL del servidor"
            value={url}
            onChangeText={setUrl}
          />
          <Field
            label="Credencial móvil"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            accessibilityLabel="Credencial móvil"
            value={secret}
            onChangeText={setSecret}
          />
          <Text style={styles.muted}>
            La credencial se guarda cifrada en este dispositivo.
          </Text>
          <ActionButton
            disabled={m.busy}
            label="Guardar conexión"
            onPress={() => m.configure(url, secret)}
            fullWidth
          />
          <ActionButton
            disabled={m.busy}
            label="Sincronizar catálogo"
            icon="refresh-cw"
            onPress={m.sync}
            fullWidth
            variant="dark"
          />
          <Text style={styles.muted}>
            Dirección guardada: {m.state?.baseUrl}
            {m.state?.catalog
              ? ` · Catálogo actualizado ${new Date(m.state.catalog.syncedAt).toLocaleString("es-MX")}`
              : ""}
          </Text>
          <Text style={styles.muted}>
            En el celular usa la IP Wi-Fi de la computadora y el puerto 3016.
            Ambos equipos deben estar en la misma red y Express debe estar
            iniciado. El puerto 3015 corresponde exclusivamente a pruebas
            sintéticas.
          </Text>
          {m.error ? (
            <Text accessibilityRole="alert" style={styles.notice}>
              {m.error}
            </Text>
          ) : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Datos anteriores conservados</Text>
          <Text style={styles.muted}>
            {legacySales
              ? `${legacySales.length} renglones en la venta local anterior.`
              : "La venta anterior requiere revisar su formato."}{" "}
            No se convierten ni se envían como ventas oficiales.
          </Text>
          <Pressable onPress={() => setShowLegacy(!showLegacy)}>
            <Text style={styles.link}>Consultar datos anteriores</Text>
          </Pressable>
          {showLegacy && (
            <>
              <Text selectable>{JSON.stringify(m.legacy, null, 2)}</Text>
              <ActionButton
                label="Compartir respaldo anterior"
                fullWidth
                onPress={() =>
                  Share.share({
                    message: JSON.stringify(m.legacy, null, 2),
                  }).catch(() => {})
                }
              />
            </>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Tickets originales guardados</Text>
          {m.state?.receipts.map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                navigation.navigate("SaleSummary", { receiptId: r.id })
              }
            >
              <Text style={styles.link}>
                {r.folio} · ${r.total.toFixed(2)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
