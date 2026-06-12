import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather, } from "@expo/vector-icons";
import { calculateTotalSales } from "../utils/salesCalculations";

export default function HomeScreen({ navigation, salesList }) {
    const totalSales = calculateTotalSales(salesList);

    function DashboardButton({
        title,
        subtitle,
        icon,
        iconColor,
        bgColor,
        onPress,
    }) {
        return (
            <Pressable
                onPress={onPress}
                className="flex-1 rounded-3xl bg-white p-5 shadow-sm"
            >
                <View
                    className={`mb-4 h-12 w-12 items-center justify-center rounded-2xl ${bgColor}`}
                >
                    {icon}
                </View>

                <Text className="text-lg font-extrabold text-slate-900">
                    {title}
                </Text>

                <Text className="mt-1 text-sm text-slate-500">
                    {subtitle}
                </Text>
            </Pressable>
        );
    }

    return (
        <SafeAreaView
            edges={["left", "right", "bottom"]}
            className="flex-1 bg-slate-100"
        >
            <View className="pt-3 pb-5 pl-5 pr-5">
                <Text className="mt-2 text-4xl font-extrabold text-blue-600">
                    CalcQuim
                </Text>

                <Text className="mt-1 text-base text-slate-500">
                    Calculadora rápida de venta
                </Text>

                <View className="my-6 rounded-3xl bg-green-600 p-6 shadow-sm">
                    <Text className="text-base font-semibold text-green-100">
                        Venta actual
                    </Text>

                    <Text className="mt-2 text-5xl font-extrabold text-white">
                        ${totalSales.toFixed(2)}
                    </Text>

                    <Text className="mt-2 text-green-100">
                        {salesList.length} producto(s) agregados
                    </Text>
                </View>

                <View className="mb-4 flex-row gap-4">
                    <DashboardButton
                        title="Monto"
                        subtitle="Dinero a producto"
                        bgColor="bg-blue-100"
                        icon={
                            <MaterialIcons
                                name="attach-money"
                                size={28}
                                color="#2563eb"
                            />
                        }
                        onPress={() => navigation.navigate("Calculator")}
                    />

                    <DashboardButton
                        title="Cantidad"
                        subtitle="Litros a cobrar"
                        bgColor="bg-green-100"
                        icon={
                            <FontAwesome5
                                name="flask"
                                size={22}
                                color="#16a34a"
                            />
                        }
                        onPress={() => navigation.navigate("AddSale")}
                    />
                </View>

                <View className="flex-row gap-4">
                    <DashboardButton
                        title="Lista"
                        subtitle={`${salesList.length} agregado(s)`}
                        bgColor="bg-slate-100"
                        icon={
                            <Ionicons
                                name="receipt"
                                size={26}
                                color="#0f172a"
                            />
                        }
                        onPress={() => navigation.navigate("SalesList")}
                    />

                    <DashboardButton
                        title="Productos"
                        subtitle="Editar catálogo"
                        bgColor="bg-orange-100"
                        icon={
                            <Feather
                                name="box"
                                size={25}
                                color="#ea580c"
                            />
                        }
                        onPress={() => navigation.navigate("ProductsCatalog")}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}