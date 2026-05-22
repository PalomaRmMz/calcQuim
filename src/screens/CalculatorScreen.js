import { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { products } from "../data/Products";
import ResultBox from "../components/ResultBox";
import { calculateQuantity } from "../utils/calculations";

export default function CalculatorScreen({ navigation, salesList, setSalesList }) {
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
            type: "calculo",
            product: selectedProduct.name,
            amount: Number(amount),
            quantity,
            milliliters,
        };
        setSalesList((prevList) => [newItem, ...prevList]);
        setAmount("");

        Alert.alert(
            "Agregado",
            "Producto agregado a la lista"
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="flex-1" contentContainerClassName="p-5">

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

                    <Text className="mt-5 text-l font-bold text-slate-900 mb-2">
                        Monto solicitado
                    </Text>

                    <View className="flex-row items-center rounded-3xl border-2 border-slate-600 border-rounded-sm border-blue-600">

                        <View className="w-12 items-center justify-center">
                            <Text className="text-xl font-bold text-slate-800">
                                $
                            </Text>
                        </View>

                        <TextInput
                            className="flex-1 px-2 py-4 text-xl font-bold text-slate-900"
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

                    <Pressable
                        onPress={() => navigation.navigate("Lista")}
                        className="mt-3 rounded-3xl bg-white p-5 border border-slate-600"
                    >
                        <Text className="text-center text-xl font-bold">
                            Ver lista de ventas
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}