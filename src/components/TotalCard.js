import { View, Text } from "react-native";
import { COLORS as C } from "../domain/brand.mjs";
import { money } from "../domain/sale.mjs";
export default function TotalCard({ total, compact = false, pendingAmount }) {
  return (
    <View
      style={{
        flexDirection: compact ? "row" : "column",
        alignItems: compact ? "center" : undefined,
        justifyContent: "space-between",
        gap: 4,
      }}
    >
      <View>
        <Text style={{ color: C.muted, fontSize: 13 }}>Total · MXN</Text>
        {Number.isFinite(pendingAmount) && (
          <Text style={{ color: C.primary, fontSize: 11, marginTop: 3 }}>
            Por agregar: {money(pendingAmount)}
          </Text>
        )}
      </View>
      <Text
        style={{
          fontSize: compact ? 30 : 44,
          fontWeight: "800",
          color: C.ink,
          fontVariant: ["tabular-nums"],
        }}
      >
        {money(total || 0)}
      </Text>
    </View>
  );
}
