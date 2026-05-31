import { useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import ProductSearchInput from "../components/ProductSearchInput";
import QuickNav from "../components/QuickNav";
import ResultBox from "../components/ResultBox";
import { sanitizeDecimalInput } from "../utils/numberInput";
import { calculateSaleByAmount } from "../utils/salesCalculations";

export default function CalculatorScreen({ navigation, salesList, setSalesList, productsList, }) {
    const amountInputRef = useRef(null);
    const productSearchRef = useRef(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [amount, setAmount] = useState("");
    const { quantity, milliliters } = calculateSaleByAmount(
        amount,
        selectedProduct?.price || 0
    );

    function handleAddToList() {
        if (!selectedProduct) {
            Alert.alert("Producto requerido", "Selecciona un producto primero");
            return;
        }
        if (!amount || Number(amount) <= 0) return;

        const newItem = {
            id: Date.now().toString(),
            type: "venta_por_monto",
            product: selectedProduct.name,
            amount: Number(amount),
            price: selectedProduct.price,
            unit: selectedProduct.unit,
            quantity,
            milliliters,
        };

        setSalesList((prevList) => [newItem, ...prevList]);
        setAmount("");
        setSelectedProduct(null);

        setTimeout(() => {
            productSearchRef.current?.focus();
        }, 100);

        Alert.alert(
            "Agregado",
            "Producto agregado a la lista"
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="flex-1" contentContainerClassName="p-5">
                <QuickNav navigation={navigation} active="Calculator" />

                <View className="rounded-3xl bg-white p-5 shadow-md">
                    <Text className="mb-3 text-base font-semibold text-slate-900">
                        Producto
                    </Text>

                    <ProductSearchInput
                        inputRef={productSearchRef}
                        products={productsList}
                        selectedProduct={selectedProduct}
                        onSelectProduct={setSelectedProduct}
                        onProductSelected={() => amountInputRef.current?.focus()}
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
                        Monto solicitado
                    </Text>

                    <View className="flex-row items-center rounded-3xl border-2 border-blue-600">
                        <View className="w-12 items-center justify-center">
                            <Text className="text-xl font-bold text-slate-800">
                                $
                            </Text>
                        </View>

                        <TextInput
                            ref={amountInputRef}
                            className="flex-1 px-2 py-4 text-xl font-bold text-slate-900"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={(text) => setAmount(sanitizeDecimalInput(text))}
                        />
                    </View>

                    <ResultBox
                        mode="money"
                        amount={amount}
                        product={selectedProduct || { name: "", price: 0, unit: "litro" }}
                        quantity={quantity}
                        milliliters={milliliters}
                    />

                    <View className="mt-6">
                        <ActionButton
                            label="Agregar venta"
                            onPress={handleAddToList}
                            variant="success"
                            fullWidth
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}