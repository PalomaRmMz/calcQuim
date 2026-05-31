import { useState } from "react";
import { View, Text, ScrollView, TextInput, Alert, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import { sanitizeDecimalInput } from "../utils/numberInput";

export default function ProductAdminScreen({ productsList, setProductsList }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [editingId, setEditingId] = useState(null);

    function resetForm() {
        setName("");
        setPrice("");
        setEditingId(null);
    }

    function handleSaveProduct() {
        if (!name.trim() || !price || Number(price) <= 0) {
            Alert.alert("Datos incompletos", "Agrega nombre y precio válido.");
            return;
        }

        if (editingId) {
            setProductsList((prev) =>
                prev.map((product) =>
                    product.id === editingId
                        ? { ...product, name: name.trim(), price: Number(price) }
                        : product
                )
            );

            resetForm();
            return;
        }

        const newProduct = {
            id: Date.now().toString(),
            name: name.trim(),
            category: "personalizado",
            unit: "litro",
            price: Number(price),
        };

        setProductsList((prev) => [...prev, newProduct]);
        resetForm();
    }

    function handleEdit(product) {
        setEditingId(product.id);
        setName(product.name);
        setPrice(product.price.toString());
    }

    function handleDelete(id) {
        Alert.alert("Eliminar producto", "¿Deseas eliminar este producto?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: () => {
                    setProductsList((prev) => prev.filter((product) => product.id !== id));
                },
            },
        ]);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="p-5">
                <View className="rounded-3xl bg-white p-5 shadow-sm">
                    <Text className="mb-4 text-2xl font-extrabold text-blue-600">
                        Administrar productos
                    </Text>

                    <Text className="mb-2 font-bold text-slate-800">
                        Nombre del producto
                    </Text>

                    <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900"
                        value={name}
                        onChangeText={setName}
                        placeholder="Ejemplo: Suavitel Primavera"
                    />

                    <Text className="mb-2 mt-4 font-bold text-slate-800">
                        Precio por litro
                    </Text>

                    <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900"
                        value={price}
                        onChangeText={(text) => setPrice(sanitizeDecimalInput(text))}
                        keyboardType="numeric"
                        placeholder="Ejemplo: 15"
                    />

                    <View className="mt-5">
                        <ActionButton
                            label={editingId ? "Guardar" : "Agregar venta"}
                            onPress={handleSaveProduct}
                            variant="success"
                            fullWidth
                        />
                    </View>

                    {editingId && (
                        <View className="mt-3">
                            <ActionButton
                                label="Cancelar"
                                onPress={resetForm}
                                variant="dark"
                                fullWidth
                            />
                        </View>
                    )}
                </View>

                <Text className="mb-3 mt-6 text-xl font-bold text-slate-900">
                    Productos
                </Text>

                {[...productsList]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((product) => (
                        <View key={product.id} className="mb-3 rounded-3xl bg-white p-5">
                            <Text className="text-lg font-bold text-slate-900">
                                {product.name}
                            </Text>

                            <Text className="mt-1 text-slate-500">
                                ${product.price} por {product.unit}
                            </Text>

                            <View className="mt-4 flex-row gap-3">
                                <ActionButton
                                    label="Editar"
                                    onPress={() => handleEdit(product)}
                                    variant="dark"
                                />

                                <ActionButton
                                    label="Eliminar"
                                    onPress={() => handleDelete(product.id)}
                                    variant="danger"
                                />
                            </View>
                        </View>
                    ))}
            </ScrollView>
        </SafeAreaView>
    );
}