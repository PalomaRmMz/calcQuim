import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS as C } from "../domain/brand.mjs";
export default function ActionButton({
  label,
  onPress,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  icon,
}) {
  const filled = ["primary", "success"].includes(variant),
    color = filled ? C.white : variant === "danger" ? C.coral : C.primary;
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={{
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? "100%" : undefined,
        minHeight: 48,
        padding: 12,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: filled
          ? C.primary
          : variant === "danger"
            ? C.coral
            : C.line,
        backgroundColor: filled ? C.primary : C.white,
        opacity: disabled ? 0.42 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {icon && <Feather name={icon} size={18} color={color} />}
      <Text
        style={{ color, fontWeight: "700", fontSize: 14, textAlign: "center" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
