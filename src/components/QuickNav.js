import { View, Text, Pressable } from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather, } from "@expo/vector-icons";

export default function QuickNav({ navigation, active }) {
    const items = [
        {
            label: "",
            route: "Home",
            icon: (
                <Ionicons
                    name="home"
                    size={17}
                    color={active === "Home" ? "white" : "#475569"}
                />
            ),
        },
        {
            label: "Monto",
            route: "Calculator",
            icon: (
                <MaterialIcons
                    name="attach-money"
                    size={18}
                    color={active === "Calculator" ? "white" : "#475569"}
                />
            ),
        },
        {
            label: "Cant.",
            route: "AddSale",
            icon: (
                <FontAwesome5
                    name="flask"
                    size={14}
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
                    size={17}
                    color={active === "SalesList" ? "white" : "#475569"}
                />
            ),
        },
        {
            label: "Cat.",
            route: "ProductsCatalog",
            icon: (
                <Feather
                    name="box"
                    size={17}
                    color={active === "ProductsCatalog" ? "white" : "#475569"}
                />
            ),
        },
    ];

    return (
        <View className="mb-5 flex-row rounded-3xl bg-slate-200 pt-0 pb-1 pl-1 pr-1 mt-5">
            {items.map((item) => {
                const isActive = active === item.route;

                return (
                    <Pressable
                        key={item.route}
                        onPress={() => navigation.navigate(item.route)}
                        className={`flex-1 flex-row items-center justify-center gap-1 rounded-3xl px-2 py-3 ${isActive ? "bg-blue-600" : "bg-transparent"
                            }`}
                    >
                        {item.icon}

                        <Text
                            className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-600"
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