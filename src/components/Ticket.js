import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS as C } from "../domain/brand.mjs";
import { ticketModel } from "../domain/ticket.mjs";
export default function Ticket({ receipt, onLogoReady, paperRef }) {
  const m = ticketModel(receipt);
  return (
    <View ref={paperRef} collapsable={false} style={t.paper}>
      <View style={t.header}>
        <Image
          source={require("../../assets/full-clean-logo.png")}
          resizeMode="contain"
          onLoad={onLogoReady}
          accessibilityLabel="Logo oficial Full Clean"
          style={t.logo}
        />
        <Text style={t.brand}>{m.brand.name}</Text>
        <Text style={t.slogan}>{m.brand.slogan}</Text>
        <Text style={t.address}>
          {m.brand.street}
          {"\n"}
          {m.brand.locality}
        </Text>
        <Text style={t.phone}>Teléfono y WhatsApp: {m.brand.phone}</Text>
      </View>
      <View style={t.meta}>
        <View style={{ flex: 1 }}>
          <Text style={t.caption}>TICKET DE VENTA</Text>
          <Text style={t.folio}>{m.folio}</Text>
          <Text style={t.detail}>{m.version}</Text>
        </View>
        <View style={{ alignItems: "flex-end", maxWidth: "50%" }}>
          <Text style={t.detail}>{m.date}</Text>
          <Text style={t.detail}>{m.time}</Text>
        </View>
      </View>
      <View style={t.tableHead}>
        <Text style={t.caption}>CONCEPTO / CANTIDAD</Text>
        <Text style={t.caption}>IMPORTE</Text>
      </View>
      {m.items.map((item, index) => (
        <View key={index} style={t.line}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={t.concept}>{item.name}</Text>
            <Text style={t.detail}>
              {item.quantity} · {item.price}
            </Text>
            {item.discount && <Text style={t.detail}>{item.discount}</Text>}
            {item.captured && <Text style={t.detail}>{item.captured}</Text>}
          </View>
          <Text style={t.amount}>{item.amount}</Text>
        </View>
      ))}
      <View style={t.total}>
        <Text style={t.detail}>Total · MXN</Text>
        <Text style={t.sum}>{m.total}</Text>
      </View>
      <Text style={t.thanks}>{m.brand.thanks}</Text>
      <Text style={t.fine}>{m.disclaimer}</Text>
    </View>
  );
}
const t = StyleSheet.create({
  paper: { backgroundColor: C.white, padding: 20 },
  header: {
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: C.cyan,
    paddingBottom: 20,
  },
  logo: { width: 250, maxWidth: "100%", height: 128, marginVertical: 12 },
  brand: { fontWeight: "800", fontSize: 16, color: C.ink, textAlign: "center" },
  slogan: { color: C.primary, fontSize: 12, marginTop: 4, marginBottom: 14 },
  address: {
    fontSize: 11,
    lineHeight: 17,
    color: C.muted,
    textAlign: "center",
  },
  phone: { fontSize: 11, color: C.ink, marginTop: 8 },
  meta: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 20,
  },
  caption: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: C.muted,
  },
  folio: { fontSize: 19, fontWeight: "800", color: C.ink, marginVertical: 4 },
  detail: { fontSize: 11, color: C.muted, lineHeight: 17 },
  tableHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.pale,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  line: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  concept: { fontSize: 14, fontWeight: "700", color: C.ink },
  amount: { fontSize: 14, fontWeight: "700", color: C.ink },
  total: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderColor: C.cyan,
    gap: 8,
  },
  sum: { fontSize: 32, fontWeight: "800", color: C.primary },
  thanks: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: C.ink,
    marginTop: 26,
    marginBottom: 6,
  },
  fine: { textAlign: "center", fontSize: 10, color: C.muted, marginBottom: 14 },
});
