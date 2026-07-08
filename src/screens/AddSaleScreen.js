import { useRef, useState } from "react";
import { View, Text, TextInput, Alert, ScrollView, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import ProductSearchInput from "../components/ProductSearchInput";
import ResultBox from "../components/ResultBox";
import QuickNav from "../components/QuickNav";
import { sanitizeDecimalInput } from "../utils/numberInput";
import { calculateSaleByLiters } from "../utils/salesCalculations";

export default function AddSaleScreen({
    navigation,
    salesList,
    setSalesList,
    productsList,
}) {
    const quantityInputRef = useRef(null);
    const productSearchRef = useRef(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState("");
    const total = calculateSaleByLiters(quantity, selectedProduct?.price || 0);

    function handleAddSale() {
        if (!selectedProduct) {
            Alert.alert("Producto requerido", "Selecciona un producto primero");
            return;
        }
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
        setSelectedProduct(null);

        setTimeout(() => {
            productSearchRef.current?.focus();
        }, 100);

        Alert.alert(
            "Agregado",
            "Venta agregada correctamente"
        );
    }

    return (
        <SafeAreaView
            edges={["left", "right", "bottom"]}
            className="flex-1 bg-slate-100"
        >
            <ScrollView className="flex-1">
                <View className="pt-3 pb-5 pl-5 pr-5">
                    <QuickNav navigation={navigation} active="AddSale" />

                    <View className="rounded-3xl bg-white p-5 shadow-md">
                        <Text className="mb-3 text-base font-semibold text-slate-900">
                            Producto vendido
                        </Text>

                        <ProductSearchInput
                            inputRef={productSearchRef}
                            products={productsList}
                            selectedProduct={selectedProduct}
                            onSelectProduct={setSelectedProduct}
                            onProductSelected={() => quantityInputRef.current?.focus()}
                        />

                        <View className="mt-4 flex-row gap-3">
                            <View className="flex-1 rounded-2xl bg-blue-50 p-4">
                                <Text className="text-sm text-slate-500">Precio</Text>

                                <Text className="mt-1 text-2xl font-bold text-blue-700">
                                    ${selectedProduct?.price || 0}
                                </Text>
                            </View>

                            <View className="flex-2 rounded-2xl bg-slate-100 p-4">
                                <Text className="text-sm text-slate-500">Unidad</Text>

                                <Text className="mt-1 text-2xl font-bold text-slate-800">
                                    {selectedProduct?.unit || "-"}
                                </Text>
                            </View>
                        </View>

                        <Text className="mt-5 mb-2 text-l font-bold text-slate-900">
                            Cantidad vendida
                        </Text>

                        <View className="flex-row items-center rounded-3xl border-2 border-slate-700 bg-white px-4 py-1">
                            <TextInput
                                ref={quantityInputRef}
                                className="flex-1 px-2 py-3 text-3xl font-bold text-slate-900"
                                keyboardType="numeric"
                                value={quantity}
                                onChangeText={(text) => setQuantity(sanitizeDecimalInput(text))}
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
                            product={selectedProduct || { name: "", price: 0, unit: "litro" }}
                            saleQuantity={quantity}
                            saleUnit="litro"
                        />

                        <View className="mt-6">
                            <ActionButton
                                label="Agregar venta"
                                onPress={handleAddSale}
                                variant="success"
                                fullWidth
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}