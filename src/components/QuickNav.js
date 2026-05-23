import { View, Text, Pressable } from "react-native";

import {
    MaterialIcons,
    FontAwesome5,
    Ionicons,
} from "@expo/vector-icons";

export default function QuickNav({ navigation, active }) {
    const items = [
        {
            label: "Monto",
            route: "Calculator",
            icon: (
                <MaterialIcons
                    name="attach-money"
                    size={20}
                    color={active === "Calculator" ? "white" : "#475569"}
                />
            ),
        },

        {
            label: "Cantidad",
            route: "AddSale",
            icon: (
                <FontAwesome5
                    name="flask"
                    size={16}
                    color={active === "AddSale" ? "white" : "#475569"}
                />
            ),
        },

        {
            label: "Lista",
            route: "SalesList",
            icon: (
                <Ionicons
                    name="receipt"
                    size={18}
                    color={active === "SalesList" ? "white" : "#475569"}
                />
            ),
        },
    ];

    return (
        <View className="mb-5 flex-row rounded-3xl bg-slate-200 p-1">
            {items.map((item) => {
                const isActive = active === item.route;

                return (
                    <Pressable
                        key={item.route}
                        onPress={() => navigation.navigate(item.route)}
                        className={`flex-1 flex-row items-center justify-center gap-2 rounded-3xl px-3 py-3 ${isActive ? "bg-blue-600" : "bg-transparent"
                            }`}
                    >
                        {item.icon}

                        <Text
                            className={`font-bold ${isActive ? "text-white" : "text-slate-600"
                                }`}
                        >
                            {item.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}