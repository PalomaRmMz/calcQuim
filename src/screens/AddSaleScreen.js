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
import QuickNav from "../components/QuickNav";
import ResultBox from "../components/ResultBox";

export default function AddSaleScreen({
    navigation,
    salesList,
    setSalesList,
}) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("ml");

    const quantityInLiters =
        unit === "ml"
            ? Number(quantity || 0) / 1000
            : Number(quantity || 0);

    const total =
        quantityInLiters * Number(selectedProduct.price || 0);

    function handleAddSale() {
        if (!quantity || Number(quantity) <= 0) return;

        const newItem = {
            id: Date.now().toString(),
            type: "venta_por_cantidad",
            product: selectedProduct.name,
            quantity: Number(quantity),
            unit,
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
            <ScrollView className="flex-1" contentContainerClassName="p-5">

                <QuickNav navigation={navigation} active="AddSale" />

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

                    <Text className="mb-2 mt-6 text-base font-semibold text-slate-900">
                        Cantidad vendida
                    </Text>

                    <View className="mt-4 flex-row gap-3">
                        {/* <View className="flex-[4] justify-center rounded-2xl bg-blue-50 p-4">
                            <Text className="text-2xl font-bold text-slate-900">
                                Cantidad vendida
                            </Text>
                        </View> */}

                        <View className="flex-[6] rounded-2xl bg-slate-100 p-4">
                            <View className="flex-row items-center rounded-3xl bg-slate-100 px-4 py-2">
                                <TextInput
                                    className="flex-1 px-2 py-4 text-center text-4xl font-bold text-slate-900"
                                    keyboardType="numeric"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    placeholder="750"
                                />

                                <View className="w-28 rounded-2xl bg-white">
                                    <Picker
                                        selectedValue={unit}
                                        onValueChange={setUnit}
                                    >
                                        <Picker.Item
                                            label="ml"
                                            value="ml"
                                        />
                                        <Picker.Item
                                            label="litros"
                                            value="litros"
                                        />
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    </View>

                    <ResultBox
                        mode="quantity"
                        product={selectedProduct}
                        saleQuantity={quantity}
                        saleUnit={unit}
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

            </ScrollView>
        </SafeAreaView>
    );
}