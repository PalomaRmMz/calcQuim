import { useLayoutEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import ActionButton from "../components/ActionButton";
import Ticket from "../components/Ticket";
import { styles } from "../components/BrandUI";
import { ticketHtml } from "../domain/ticket.mjs";
import { logoDataUri } from "../domain/logo.mjs";
import { collectSyntheticArtifact } from "../testing/useEmulatorProbe";

export default function SaleSummaryScreen({ model: m, navigation, route }) {
  const [customer, setCustomer] = useState(false),
    [sharing, setSharing] = useState(false),
    [logoReady, setLogoReady] = useState(false),
    [laidOut, setLaidOut] = useState(false),
    ticketRef = useRef(null);
  const receipt = m.state?.receipts.find(
    (r) => r.id === route.params?.receiptId,
  );
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !customer, title: "Ticket de venta" });
  }, [customer, navigation]);
  if (!receipt)
    return (
      <View style={styles.page}>
        <Text style={styles.muted}>
          No hay evidencia de una venta confirmada.
        </Text>
      </View>
    );
  async function share(format) {
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync()))
        throw new Error(
          "Compartir archivos no está disponible en este dispositivo.",
        );
      const name = `FullClean-${String(receipt.folio).replace(/[^a-zA-Z0-9_-]/g, "-")}-${receipt.corrected ? "v" + receipt.version : "original"}.${format}`;
      let base64;
      if (format === "pdf")
        ({ base64 } = await Print.printToFileAsync({
          html: ticketHtml(receipt, { logoDataUri }),
          base64: true,
        }));
      else {
        if (!logoReady || !laidOut)
          throw new Error("Espera a que termine de cargar el ticket.");
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        base64 = await captureRef(ticketRef, {
          format: "png",
          quality: 1,
          result: "base64",
          snapshotContentContainer: false,
          width: 1080,
        });
      }
      if (!base64) throw new Error("No se pudo generar el archivo del ticket.");
      // Cache propia: evita compartir archivos nativos fuera del ámbito de esta app en Expo Go.
      const file = new File(Paths.cache, name);
      file.write(base64, { encoding: "base64" });
      await collectSyntheticArtifact(m, name, base64);
      await Sharing.shareAsync(file.uri, {
        mimeType: format === "pdf" ? "application/pdf" : "image/png",
        UTI: format === "pdf" ? "com.adobe.pdf" : "public.png",
        dialogTitle: `Compartir ticket ${format.toUpperCase()}`,
      });
    } catch (e) {
      Alert.alert("Ticket", e.message);
    } finally {
      setSharing(false);
    }
  }
  return (
    <SafeAreaView
      style={styles.root}
      edges={customer ? ["top", "bottom"] : ["bottom"]}
    >
      <ScrollView
        collapsable={false}
        removeClippedSubviews={false}
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        onContentSizeChange={() => setLaidOut(true)}
      >
        <Ticket receipt={receipt} paperRef={ticketRef} onLogoReady={() => setLogoReady(true)} />
      </ScrollView>
      {customer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a controles de venta"
          onPress={() => setCustomer(false)}
          style={{ padding: 14, alignItems: "center" }}
        >
          <Text style={styles.link}>Volver</Text>
        </Pressable>
      ) : (
        <View style={styles.footer}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ActionButton
                disabled={sharing || !logoReady || !laidOut}
                label="Compartir PNG"
                icon="image"
                variant="dark"
                onPress={() => share("png")}
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton
                disabled={sharing}
                label="Compartir PDF"
                icon="file-text"
                variant="dark"
                onPress={() => share("pdf")}
                fullWidth
              />
            </View>
          </View>
          {m.state.draft.status === "confirmed" && (
            <ActionButton
              disabled={m.busy || sharing}
              label="Nueva venta"
              icon="plus"
              fullWidth
              onPress={async () => {
                if (await m.newSale()) navigation.popTo("Home");
              }}
            />
          )}
          <Pressable
            disabled={sharing}
            onPress={() => setCustomer(true)}
            accessibilityRole="button"
            style={{ alignItems: "center" }}
          >
            <Text style={[styles.link, { paddingVertical: 4 }]}>
              Mostrar al cliente
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
