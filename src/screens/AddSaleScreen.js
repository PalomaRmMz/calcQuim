import { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    Pressable,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { products } from "../data/Products";

export default function AddSaleScreen({ navigation, salesList, setSalesList }) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("ml");

    function handleAddSale() {
        if (!quantity || Number(quantity) <= 0) return;

        const newItem = {
            id: Date.now().toString(),
            type: "venta",
            product: selectedProduct.name,
            quantity: Number(quantity),
            unit,
            price: selectedProduct.price,
        };

        setSalesList((prevList) => [newItem, ...prevList]);
        setQuantity("");

        Alert.alert("Agregado", "Venta agregada correctamente");
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <View className="p-5">
                <View className="rounded-3xl bg-white p-5">
                    <Text className="mb-3 text-base font-semibold text-slate-900">
                        Producto vendido
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

                    <View className="mt-4 rounded-2xl bg-blue-50 p-4">
                        <Text className="mt-1 text-2xl font-bold text-blue-700">
                            ${selectedProduct.price} por {selectedProduct.unit}
                        </Text>
                    </View>

                    <Text className="mb-2 mt-6 text-base font-semibold text-slate-900">
                        Cantidad vendida
                    </Text>

                    <View className="flex-row gap-3">
                        <TextInput
                            className="flex-[6] rounded-3xl bg-slate-100 px-4 py-4 text-center text-4xl font-bold text-slate-900"
                            keyboardType="numeric"
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="750"
                        />

                        <View className="flex-[4] rounded-3xl border border-slate-200 bg-slate-50">
                            <Picker selectedValue={unit} onValueChange={setUnit}>
                                <Picker.Item label="ml" value="ml" />
                                <Picker.Item label="litros" value="litros" />
                                <Picker.Item label="pieza(s)" value="pieza(s)" />
                            </Picker>
                        </View>
                    </View>

                    <Pressable
                        onPress={handleAddSale}
                        className="mt-6 rounded-3xl bg-blue-600 p-5"
                    >
                        <Text className="text-center text-xl font-bold text-white">
                            Agregar venta
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => navigation.navigate("Lista de venta")}
                        className="mt-3 rounded-3xl bg-slate-900 p-5"
                    >
                        <Text className="text-center text-xl font-bold text-white">
                            Ver lista
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}