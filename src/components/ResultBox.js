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
        <View className="mt-6 rounded-3xl bg-blue-600 p-6">
            <Text className="text-lg font-semibold text-blue-100">
                Debes vender
            </Text>

            {numericAmount > 0 ? (
                <>
                    <Text className="mt-4 text-center text-5xl font-extrabold text-white">
                        {formattedResult}
                    </Text>
                </>
            ) : (
                <Text className="mt-3 text-base text-blue-100">
                    Ingresa una cantidad para calcular.
                </Text>
            )}
        </View>
    );
}