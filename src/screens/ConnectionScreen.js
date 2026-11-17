import { useState } from "react";
import {businessTimestamp} from '../domain/businessTime.mjs';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import { styles, Field } from "../components/BrandUI";
export default function ConnectionScreen({ model: m, navigation }) {
  const [url, setUrl] = useState(m.state?.baseUrl || ""),
    [secret, setSecret] = useState(m.token);
  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Configuración de conexión</Text>
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
              ? ` · Catálogo actualizado ${businessTimestamp(m.state.catalog.syncedAt)}`
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
      </ScrollView>
    </SafeAreaView>
  );
}
