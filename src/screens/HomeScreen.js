import { SafeAreaView, View, Text, Pressable } from "react-native";
import { calculateTotalSales } from "../utils/salesCalculations";

export default function HomeScreen({ navigation, salesList }) {
    const totalSales = calculateTotalSales(salesList);

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <View className="flex-1 p-5">
                <View className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
                    <Text className="text-base font-semibold text-slate-500">
                        Venta actual
                    </Text>

                    <Text className="mt-2 text-4xl font-extrabold text-green-600">
                        ${totalSales.toFixed(2)}
                    </Text>

                    <Text className="mt-1 text-slate-500">
                        Productos agregados: {salesList.length}
                    </Text>
                </View>

                <Text className="mb-8 mt-2 text-base text-slate-600">
                    Selecciona una opción de venta
                </Text>

                <Pressable
                    onPress={() => navigation.navigate("Calculator")}
                    className="mb-4 rounded-3xl bg-blue-600 p-6"
                >
                    <Text className="text-2xl font-bold text-white">
                        Venta por monto
                    </Text>
                    <Text className="mt-2 text-blue-100">
                        Calcula cuánto producto dar por dinero
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate("AddSale")}
                    className="mb-4 rounded-3xl bg-green-600 p-6"
                >
                    <Text className="text-2xl font-bold text-white">
                        Venta por cantidad
                    </Text>
                    <Text className="mt-2 text-green-100">
                        Calcula cuánto cobrar por ml o litros
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate("SalesList")}
                    className="rounded-3xl bg-slate-900 p-6"
                >
                    <Text className="text-2xl font-bold text-white">
                        Lista de venta
                    </Text>
                    <Text className="mt-2 text-slate-300">
                        Productos agregados: {salesList.length}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}