import { Pressable, Text } from "react-native";

export default function ActionButton({
    label,
    onPress,
    variant = "primary",
}) {
    const variants = {
        primary: "bg-blue-600 border-blue-600",
        danger: "bg-white border-red-500",
        dark: "bg-white border-slate-900",
        success: "bg-green-600 border-green-600",
        white: "bg-white border-white",
    };

    const textVariants = {
        primary: "text-white",
        danger: "text-red-500",
        dark: "text-slate-900",
        success: "text-white",
        white: "text-slate-900",
    };

    return (
        <Pressable
            onPress={onPress}
            className={`flex-1 rounded-2xl border py-3 ${variants[variant]}`}
        >
            <Text className={`text-center text-sm font-bold ${textVariants[variant]}`}>
                {label}
            </Text>
        </Pressable>
    );
}