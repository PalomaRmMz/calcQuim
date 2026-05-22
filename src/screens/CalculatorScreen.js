import { useState } from "react";
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { products } from "../data/Products";
import ResultBox from "../components/ResultBox";
import { calculateQuantity } from "../utils/calculations";

export default function CalculatorScreen() {
    const [salesList, setSalesList] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [amount, setAmount] = useState("");
    const { quantity, milliliters } = calculateQuantity(
        amount,
        selectedProduct.price
    );

    function handleAddToList() {
        if (!amount || Number(amount) <= 0) return;

        const newItem = {
            id: Date.now().toString(),
            product: selectedProduct.name,
            amount: Number(amount),
            quantity,
            milliliters,
        };

        setSalesList([newItem, ...salesList]);
        setAmount("");
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="flex-1" contentContainerClassName="p-5">
                <Text className="mt-5 text-4xl font-extrabold text-blue-600">
                    CalcQuim
                </Text>

                <Text className="mb-6 mt-1 text-base text-slate-600">
                    Venta rápida por monto
                </Text>

                <View className="rounded-3xl bg-white p-5 shadow-md">
                    <Text className="mb-3 text-base font-semibold text-slate-900">
                        Producto
                    </Text>

                    <View className="rounded-2xl border border-slate-200 bg-slate-50">
                        <Picker
                            selectedValue={selectedProduct.id}
                            onValueChange={(productId) => {
                                const product = products.find((item) => item.id === productId);
                                setSelectedProduct(product);
                            }}
                        >
                            {products.map((product) => (
                                <Picker.Item
                                    key={product.id}
                                    label={product.name}
                                    value={product.id}
                                />
                            ))}
                        </Picker>
                    </View>

                    <View className="mt-4 flex-row gap-3">
                        <View className="flex-1 rounded-2xl bg-blue-50 p-4">
                            <Text className="text-sm text-slate-500">Precio</Text>

                            <Text className="mt-1 text-2xl font-bold text-blue-700">
                                ${selectedProduct.price}
                            </Text>
                        </View>

                        <View className="flex-2 rounded-2xl bg-slate-100 p-4">
                            <Text className="text-sm text-slate-500">Unidad</Text>

                            <Text className="mt-1 text-2xl font-bold text-slate-800">
                                {selectedProduct.unit}
                            </Text>
                        </View>
                    </View>

                    <Text className="mt-6 mb-2 text-base font-semibold text-slate-900">
                        ¿Cuánto pidió el cliente?
                    </Text>

                    <View className="flex-row items-center rounded-3xl bg-slate-100 px-4 py-2">
                        <View className="w-12 items-center justify-center">
                            <Text className="text-3xl font-bold text-slate-800">$</Text>
                        </View>

                        <TextInput
                            className="flex-1 px-2 py-4 text-center text-4xl font-bold text-slate-900"
                            placeholder="8"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>

                    <ResultBox
                        amount={amount}
                        product={selectedProduct}
                        quantity={quantity}
                        milliliters={milliliters}
                    />

                    <Pressable
                        onPress={handleAddToList}
                        className="mt-5 rounded-3xl bg-blue-600 p-5"
                    >
                        <Text className="text-center text-xl font-bold text-white">
                            Agregar a lista
                        </Text>
                    </Pressable>

                    <View className="mt-6">
                        <Text className="mb-3 text-lg font-bold text-slate-900">
                            Lista de cálculos
                        </Text>

                        {salesList.length === 0 ? (
                            <Text className="text-slate-500">
                                Aún no has agregado cálculos.
                            </Text>
                        ) : (
                            salesList.map((item) => (
                                <View
                                    key={item.id}
                                    className="mb-3 rounded-2xl bg-slate-100 p-4"
                                >
                                    <Text className="font-bold text-slate-900">
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
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}