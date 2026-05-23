import { View, Text, Pressable } from "react-native";

export default function QuickNav({ navigation, active }) {
    const items = [
        { label: "Monto", route: "Calculator" },
        { label: "Cantidad", route: "AddSale" },
        { label: "Lista", route: "SalesList" },
    ];

    return (
        <View className="mb-5 flex-row rounded-3xl bg-slate-200 p-1">
            {items.map((item) => {
                const isActive = active === item.route;

                return (
                    <Pressable
                        key={item.route}
                        onPress={() => navigation.navigate(item.route)}
                        className={`flex-1 rounded-3xl px-3 py-3 ${isActive ? "bg-blue-600" : "bg-transparent"
                            }`}
                    >
                        <Text
                            className={`text-center font-bold ${isActive ? "text-white" : "text-slate-600"
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