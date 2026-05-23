import { SafeAreaView, View, Text, Pressable } from "react-native";

export default function HomeScreen({ navigation, salesList }) {
    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <View className="flex-1 p-5">
                <Text className="mt-8 text-4xl font-extrabold text-blue-600">
                    CalcQuim
                </Text>

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