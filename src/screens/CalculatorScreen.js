import { useState } from "react";
import { SafeAreaView, View, Text, TextInput, ScrollView } from "react-native";

import { products } from "../data/Products";
import ProductButton from "../components/ProductButton";
import ResultBox from "../components/ResultBox";
import { calculateQuantity } from "../utils/calculations";

export default function CalculatorScreen() {
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [amount, setAmount] = useState("");

    const { quantity, milliliters } = calculateQuantity(
        amount,
        selectedProduct.price
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="flex-1" contentContainerClassName="p-5">
                <Text className="mt-5 text-4xl font-extrabold text-blue-600">
                    CalcQuim
                </Text>

                <Text className="mt-1 mb-6 text-base text-slate-600">
                    Calculadora de venta por monto
                </Text>

                <View className="rounded-3xl bg-white p-5 shadow-md">
                    <Text className="mb-3 text-base font-semibold text-slate-900">
                        Producto
                    </Text>

                    {products.map((product) => (
                        <ProductButton
                            key={product.id}
                            product={product}
                            isSelected={selectedProduct.id === product.id}
                            onPress={() => setSelectedProduct(product)}
                        />
                    ))}

                    <Text className="mt-5 mb-2 text-base font-semibold text-slate-900">
                        ¿Cuánto dinero pidió el cliente?
                    </Text>

                    <TextInput
                        className="rounded-2xl bg-slate-100 px-4 py-4 text-lg text-slate-900"
                        placeholder="Ejemplo: 8"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <ResultBox
                        amount={amount}
                        product={selectedProduct}
                        quantity={quantity}
                        milliliters={milliliters}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}