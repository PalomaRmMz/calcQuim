import { View, Text } from "react-native";

export default function ResultBox({
    amount,
    product,
    quantity,
    milliliters,
}) {
    const numericAmount = Number(amount);

    const formattedResult =
        milliliters >= 1000
            ? `${(milliliters / 1000).toFixed(2)} litros`
            : `${milliliters.toFixed(0)} ml`;

    return (
        <View className="mt-6 rounded-xl bg-green-50 p-6">
            {numericAmount > 0 ? (
                <Text className="mt-4 text-center text-5xl font-extrabold text-green-700">
                    {formattedResult}
                </Text>
            ) : (
                <Text className="text-center">
                    Ingresa una cantidad para calcular.
                </Text>
            )}
        </View>
    );
}