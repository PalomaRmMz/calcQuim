import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS as C } from "../domain/brand.mjs";

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  page: { padding: 18, gap: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  title: { fontSize: 26, fontWeight: "800", color: C.ink },
  heading: { fontSize: 18, fontWeight: "700", color: C.ink },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 1,
  },
  muted: { color: C.muted, fontSize: 13, lineHeight: 19 },
  price: { color: C.ink, fontWeight: "700" },
  white: { color: C.white, fontWeight: "700" },
  card: {
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.ink,
    minHeight: 50,
  },
  link: { color: C.primary, fontWeight: "700", paddingVertical: 11 },
  danger: { color: C.coral, fontWeight: "700", paddingVertical: 11 },
  notice: {
    color: C.ink,
    backgroundColor: C.pale,
    borderLeftWidth: 3,
    borderLeftColor: C.orange,
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.pale,
  },
  selected: { backgroundColor: C.primary },
  badge: { color: C.primary, fontSize: 11, fontWeight: "700" },
  result: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: C.line,
    gap: 4,
  },
  resultName: { flex: 1, color: C.ink, fontWeight: "700", fontSize: 16 },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    gap: 8,
  },
});
export function BrandHeader({ title = "Venta rápida", onSettings }) {
  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: C.white,
        },
      ]}
    >
      <View style={[styles.row, { justifyContent: "flex-start", flex: 1 }]}>
        <Image
          source={require("../../assets/full-clean-logo.png")}
          resizeMode="contain"
          accessibilityLabel="Full Clean Home & Laundry"
          style={{ width: 68, height: 35 }}
        />
        <Text style={{ color: C.ink, fontWeight: "800", fontSize: 21 }}>
          {title}
        </Text>
      </View>
      {onSettings && (
        <Pressable
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Conexión y datos"
          style={{ padding: 12 }}
        >
          <Feather name="settings" size={21} color={C.primary} />
        </Pressable>
      )}
    </View>
  );
}
export function Notice({ children }) {
  return children ? (
    <Text accessibilityRole="alert" style={styles.notice}>
      {children}
    </Text>
  ) : null;
}
export function Field({ label, inputRef, ...props }) {
  return (
    <View style={{ gap: 7 }}>
      {label && <Text style={styles.price}>{label}</Text>}
      <TextInput
        ref={inputRef}
        placeholderTextColor={C.muted}
        selectionColor={C.primary}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}
export function ConnectionBadge({ status, catalog, onPress }) {
  const date = catalog?.syncedAt
    ? new Date(catalog.syncedAt).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const label =
    status === "syncing"
      ? "Actualizando catálogo…"
      : status === "connected"
        ? "Admin conectado"
        : status === "offline"
          ? "Sin conexión · Catálogo guardado"
          : catalog
            ? "Catálogo guardado"
            : "Conecta con Admin";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${date}. Configurar conexión`}
      style={[
        styles.row,
        {
          paddingHorizontal: 18,
          paddingVertical: 9,
          backgroundColor: C.white,
          borderBottomWidth: 1,
          borderColor: C.line,
          justifyContent: "flex-start",
        },
      ]}
    >
      <Feather
        name={
          status === "connected"
            ? "wifi"
            : status === "syncing"
              ? "refresh-cw"
              : "wifi-off"
        }
        size={13}
        color={status === "offline" ? C.orange : C.primary}
      />
      <Text style={[styles.muted, { flex: 1, fontSize: 11 }]}>
        {label}
        {date ? ` · ${date}` : ""}
      </Text>
      <Feather name="chevron-right" size={14} color={C.muted} />
    </Pressable>
  );
}
