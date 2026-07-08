import { View, Text } from "react-native";
import { calculateSaleByLiters, formatLiquid, } from "../utils/salesCalculations";

export default function ResultBox({
    quantity = 0,
    milliliters = 0,
    saleQuantity = 0,
    mode = "money",
    amount,
    product,
    saleUnit,
}) {
    const numericAmount = Number(amount);
    const numericSaleQuantity = Number(saleQuantity);
    const formattedLiquidResult = formatLiquid(milliliters);
    const saleTotal = calculateSaleByLiters(
        numericSaleQuantity,
        product?.price || 0
    );

    if (mode === "quantity") {
        return (
            <View className="mt-6 rounded-3xl bg-green-100 p-6">
                {numericSaleQuantity > 0 ? (
                    <>
                        <Text className="mt-4 text-center text-5xl font-extrabold text-green-700">
                            ${Number(saleTotal || 0).toFixed(2)}
                        </Text>

                        <Text className="mt-3 text-center text-lg">
                            {numericSaleQuantity} {saleUnit} de {product.name}
                        </Text>
                    </>
                ) : (
                    <Text className="text-center">
                        Ingresa la cantidad vendida.
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View className="mt-6 rounded-3xl bg-green-100 p-6">
            {numericAmount > 0 ? (
                <>
                    <Text className="mt-4 text-center text-5xl font-extrabold text-green-700">
                        {formattedLiquidResult}
                    </Text>

                    <Text className="mt-3 text-center text-lg text-blue-100">
                        {Number(quantity || 0).toFixed(2)} {product.unit}
                    </Text>
                </>
            ) : (
                <Text className="text-base">
                    Ingresa una cantidad para calcular.
                </Text>
            )}
        </View>
    );
}