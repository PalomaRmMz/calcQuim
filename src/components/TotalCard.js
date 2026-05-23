import { View, Text } from "react-native";

export default function TotalCard({ total }) {
    return (
        <View className="mb-5 rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
            <Text className="text-base font-semibold text-slate-500">
                Total de venta
            </Text>

            <Text className="mt-2 text-5xl font-extrabold text-green-600">
                ${Number(total || 0).toFixed(2)}
            </Text>
        </View>
    );
}