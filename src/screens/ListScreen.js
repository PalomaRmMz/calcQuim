import { SafeAreaView, View, Text, ScrollView } from "react-native";

export default function ListScreen({ route, salesList }) {
    const list = route.params?.salesList || salesList || [];
    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="p-5">

                {list.length === 0 ? (
                    <Text className="text-slate-500">
                        Aún no has agregado productos.
                    </Text>
                ) : (
                    list.map((item) => (
                        <View key={item.id} className="mb-3 rounded-2xl bg-white p-4">
                            <Text className="text-lg font-bold text-slate-900">
                                {item.product}
                            </Text>

                            <Text className="text-slate-600">
                                ${item.amount} →{" "}
                                {item.milliliters >= 1000
                                    ? `${(item.milliliters / 1000).toFixed(2)} litros`
                                    : `${item.milliliters.toFixed(0)} ml`}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}