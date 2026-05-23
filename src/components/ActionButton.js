import { Pressable, Text } from "react-native";

import {
    Feather,
    MaterialIcons,
} from "@expo/vector-icons";

export default function ActionButton({
    label,
    onPress,
    variant = "primary",
    fullWidth = false,
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
            className={`${fullWidth ? "w-full" : "flex-1"
                } flex-row items-center justify-center gap-2 rounded-2xl border py-3 ${variants[variant]}`}
        >
            {label === "Agregar venta" && (
                <Feather
                    name="plus-circle"
                    size={18}
                    color="white"
                />
            )}

            {label === "Editar" && (
                <Feather
                    name="edit-2"
                    size={16}
                    color="#0f172a"
                />
            )}

            {label === "Eliminar" && (
                <MaterialIcons
                    name="delete-outline"
                    size={18}
                    color="#ef4444"
                />
            )}

            {label === "Guardar" && (
                <Feather
                    name="check"
                    size={18}
                    color="white"
                />
            )}

            {label === "Cancelar" && (
                <MaterialIcons
                    name="close"
                    size={18}
                    color="#0f172a"
                />
            )}

            {label === "Limpiar venta" && (
                <MaterialIcons
                    name="delete-sweep"
                    size={18}
                    color="white"
                />
            )}
            <Text
                className={`text-center text-sm font-bold ${textVariants[variant]}`}
            >
                {label}
            </Text>
        </Pressable>
    );
}