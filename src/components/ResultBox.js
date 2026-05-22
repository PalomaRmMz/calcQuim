import { View, Text } from "react-native";

export default function ResultBox({ amount, product, quantity, milliliters }) {
    const numericAmount = Number(amount);

    return (
        <View className="mt-6 rounded-2xl bg-blue-50 p-5">
            <Text className="mb-2 text-xl font-bold text-blue-600">Resultado</Text>

            {numericAmount > 0 ? (
                <>
                    <Text className="mb-1 text-lg text-slate-900">
                        Debes vender: {quantity.toFixed(2)} litro(s){/*{product.unit}*/}
                    </Text>

                    {product.unit === "litro" && (
                        <Text className="text-lg text-slate-900">
                            Equivale a: {milliliters.toFixed(0)} ml
                        </Text>
                    )}
                </>
            ) : (
                <Text className="text-base text-slate-600">
                    Ingresa una cantidad para calcular.
                </Text>
            )}
        </View>
    );
}