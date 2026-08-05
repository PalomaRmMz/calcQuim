import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import { sanitizeDecimalInput } from "../utils/numberInput";

export default function ProductFormScreen({
    navigation,
    route,
    productsList,
    setProductsList,
}) {
    const productId = route.params?.productId;
    const editingProduct = productsList.find((item) => item.id === productId);

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [showCategories, setShowCategories] = useState(false);

    const categories = [
        { label: "Limpieza", value: "limpieza" },
        { label: "Lavandería", value: "lavanderia" },
        { label: "Automotriz", value: "automotriz" },
        { label: "Higiene personal", value: "higiene personal" },
        { label: "Personalizado", value: "personalizado" },
    ];

    useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name);
            setPrice(editingProduct.price.toString());
            setCategory(editingProduct.category || "");
        }
    }, [editingProduct]);

    function handleSaveProduct() {
        if (!name.trim() || !price || Number(price) <= 0 || !category) {
            Alert.alert("Datos incompletos", "Agrega nombre, precio y categoría.");
            return;
        }

        const alreadyExists = productsList.some(
            (product) =>
                product.name.trim().toLowerCase() === name.trim().toLowerCase() &&
                product.id !== productId
        );

        if (alreadyExists) {
            Alert.alert("Producto existente", "Ya existe un producto con ese nombre.");
            return;
        }

        if (editingProduct) {
            setProductsList((prev) =>
                prev.map((product) =>
                    product.id === productId
                        ? {
                            ...product,
                            name: name.trim(),
                            price: Number(price),
                            category,
                        }
                        : product
                )
            );
        } else {
            const newProduct = {
                id: Date.now().toString(),
                name: name.trim(),
                category,
                unit: "litro",
                price: Number(price),
                isCustom: true,
            };
            console.log("ANTES:", productsList.length);
            console.log("NUEVO:", newProduct);
            setProductsList((prev) => {
                const updatedProducts = [...prev, newProduct];
                console.log("DESPUÉS:", updatedProducts.length);
                return updatedProducts;
            });
        }
        Alert.alert(
            editingProduct ? "Producto actualizado" : "Producto agregado",
            editingProduct
                ? "El producto se actualizó correctamente."
                : "El producto se agregó correctamente.",
            [
                {
                    text: "Aceptar",
                    onPress: () => navigation.navigate("ProductsCatalog"),
                },
            ]
        );
    }

    return (
        <SafeAreaView
            edges={["left", "right", "bottom"]}
            className="flex-1 bg-slate-100"
        >
            <ScrollView className="flex-1">
                <View className="pt-3 pb-5 px-5">
                    <View className="rounded-3xl bg-white p-5 shadow-sm">
                        <Text className="mb-4 text-2xl font-extrabold text-blue-600">
                            {editingProduct ? "Editar producto" : "Nuevo producto"}
                        </Text>

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
                            onChangeText={(text) => setPrice(sanitizeDecimalInput(text))}
                            keyboardType="numeric"
                            placeholder="Ejemplo: 15"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text className="mb-2 mt-4 font-bold text-slate-800">
                            Categoría *
                        </Text>

                        <Pressable
                            onPress={() => setShowCategories(!showCategories)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                            <Text className={category ? "text-slate-900" : "text-slate-400"}>
                                {category
                                    ? categories.find((item) => item.value === category)?.label
                                    : "Selecciona una categoría..."}
                            </Text>
                        </Pressable>

                        {showCategories && (
                            <View className="mt-2 rounded-2xl border border-slate-200 bg-white">
                                {categories.map((item) => (
                                    <Pressable
                                        key={item.value}
                                        onPress={() => {
                                            setCategory(item.value);
                                            setShowCategories(false);
                                        }}
                                        className="border-b border-slate-100 px-4 py-4"
                                    >
                                        <Text className="font-bold text-slate-800">
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        <View className="mt-6">
                            <ActionButton
                                label="Guardar"
                                onPress={handleSaveProduct}
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