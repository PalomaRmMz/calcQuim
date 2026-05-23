import { useState } from "react";

import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    Pressable,
    Alert,
    ScrollView,
} from "react-native";

import { Picker } from "@react-native-picker/picker";

import { products } from "../data/Products";
import ResultBox from "../components/ResultBox";
import QuickNav from "../components/QuickNav";

export default function AddSaleScreen({
    navigation,
    salesList,
    setSalesList,
}) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [quantity, setQuantity] = useState("");
    const quantityInLiters = Number(quantity || 0);
    const total = quantityInLiters * Number(selectedProduct.price || 0);

    function handleAddSale() {
        if (!quantity || Number(quantity) <= 0) return;

        const newItem = {
            id: Date.now().toString(),
            type: "venta_por_cantidad",
            product: selectedProduct.name,
            quantity: Number(quantity),
            unit: "litro",
            price: selectedProduct.price,
            total,
        };
        setSalesList((prevList) => [newItem, ...prevList]);
        setQuantity("");
        Alert.alert(
            "Agregado",
            "Venta agregada correctamente"
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="flex-1">
                <View className="p-5">

                    <QuickNav
                        navigation={navigation}
                        active="AddSale"
                    />

                    <View className="rounded-3xl bg-white p-5 shadow-md">

                        <Text className="mb-3 text-base font-semibold text-slate-900">
                            Producto vendido
                        </Text>

                        <View className="rounded-2xl border border-slate-200 bg-slate-50">
                            <Picker
                                selectedValue={selectedProduct.id}
                                onValueChange={(productId) => {
                                    const product = products.find(
                                        (item) => item.id === productId
                                    );

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
                            Cantidad vendida
                        </Text>

                        <View className="flex-row items-center rounded-3xl border-2 border-slate-700 bg-white px-4 py-1">
                            <TextInput
                                className="flex-1 px-2 py-3 text-3xl font-bold text-slate-900"
                                keyboardType="numeric"
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder="0.5"
                            />

                            <View className="w-12 items-center justify-center">
                                <Text className="text-2xl font-bold text-slate-700">
                                    L
                                </Text>
                            </View>
                        </View>

                        <ResultBox
                            mode="quantity"
                            product={selectedProduct}
                            saleQuantity={quantity}
                            saleUnit="litro"
                        />

                        <Pressable
                            onPress={handleAddSale}
                            className="mt-6 rounded-3xl bg-green-600 p-5"
                        >
                            <Text className="text-center text-xl font-bold text-white">
                                Agregar venta
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}