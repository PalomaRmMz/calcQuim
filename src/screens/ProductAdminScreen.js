import { useState } from "react";
import { View, Text, ScrollView, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import QuickNav from "../components/QuickNav";
import { sanitizeDecimalInput } from "../utils/numberInput";
import { exportProducts } from "../utils/exportProducts";

export default function ProductAdminScreen({ navigation, productsList, setProductsList, }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [searchText, setSearchText] = useState("");

    const customProductsCount = productsList.filter(
        (product) => product.isCustom
    ).length;

    const filteredProducts = [...productsList]
        .filter((product) =>
            product.name.toLowerCase().includes(searchText.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));

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

        const alreadyExists = productsList.some(
            (product) =>
                product.name.trim().toLowerCase() ===
                name.trim().toLowerCase() &&
                product.id !== editingId
        );

        if (alreadyExists) {
            Alert.alert(
                "Producto existente",
                "Ya existe un producto con ese nombre."
            );
            return;
        }

        if (editingId) {
            setProductsList((prev) =>
                prev.map((product) =>
                    product.id === editingId
                        ? {
                            ...product,
                            name: name.trim(),
                            price: Number(price),
                        }
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
            isCustom: true,
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
                    setProductsList((prev) =>
                        prev.filter((product) => product.id !== id)
                    );
                },
            },
        ]);
    }

    return (
        <SafeAreaView
            edges={["left", "right", "bottom"]}
            className="flex-1 bg-slate-100"
        >
            <ScrollView className="flex-1">
                <View className="pt-3 pb-5 pl-5 pr-5">
                    <QuickNav navigation={navigation} active="ProductsAdmin" />

                    <View className="rounded-3xl bg-white p-5 shadow-sm">

                        {editingId && (
                            <View className="mb-4 rounded-2xl bg-blue-50 p-3">
                                <Text className="font-bold text-blue-700">
                                    Editando producto
                                </Text>
                            </View>
                        )}

                        <Text className="mb-2 font-bold text-slate-800">
                            Nombre del producto
                        </Text>

                        <TextInput
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ejemplo: Suavitel Primavera"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text className="mb-2 mt-4 font-bold text-slate-800">
                            Precio por litro
                        </Text>

                        <TextInput
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900"
                            value={price}
                            onChangeText={(text) =>
                                setPrice(sanitizeDecimalInput(text))
                            }
                            keyboardType="numeric"
                            placeholder="Ejemplo: 15"
                            placeholderTextColor="#94a3b8"
                        />

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

                    <View className="mt-5 flex-row gap-3">
                        <ActionButton
                            label={editingId ? "Guardar" : "Agregar producto"}
                            onPress={handleSaveProduct}
                            variant="success"
                        />

                        <ActionButton
                            label="Exportar catálogo"
                            onPress={() => exportProducts(productsList)}
                            variant="primary"
                        />
                    </View>

                    <Text className="mb-2 mt-6 font-bold text-slate-800">
                        Buscar producto
                    </Text>

                    <View className="flex-row items-center rounded-3xl bg-white px-4 shadow-sm">
                        <Feather name="search" size={20} color="#64748b" />

                        <TextInput
                            className="flex-1 px-3 py-4 text-base text-slate-900"
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Buscar producto..."
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <Text className="mb-3 mt-6 text-xl font-bold text-slate-900">
                        Productos ({filteredProducts.length})
                    </Text>

                    {filteredProducts.map((product) => (
                        <View
                            key={product.id}
                            className="mb-3 rounded-3xl bg-white p-4 shadow-sm"
                        >
                            <View className="flex-row items-start justify-between gap-3">
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-slate-900">
                                        {product.name}
                                    </Text>

                                    <Text className="mt-1 text-slate-500">
                                        ${product.price} por {product.unit}
                                    </Text>
                                </View>

                                <View
                                    className={`rounded-full px-3 py-1 ${product.isCustom
                                        ? "bg-orange-100"
                                        : "bg-slate-100"
                                        }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${product.isCustom
                                            ? "text-orange-700"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        {product.isCustom ? "Personalizado" : product.category}
                                    </Text>
                                </View>
                            </View>

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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}