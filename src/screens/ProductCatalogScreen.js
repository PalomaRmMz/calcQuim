import { useState } from "react";
import { View, Text, ScrollView, TextInput, Alert, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import ActionButton from "../components/ActionButton";
import QuickNav from "../components/QuickNav";
import { exportProducts } from "../utils/exportProducts";
import { importProductsFromJson } from "../utils/importProducts";

export default function ProductCatalogScreen({
    navigation,
    productsList,
    setProductsList,
}) {
    const [searchText, setSearchText] = useState("");

    const filteredProducts = [...productsList]
        .filter((product) =>
            product.name
                .toLowerCase()
                .includes(searchText.toLowerCase())
        )
        .sort((a, b) =>
            a.name.localeCompare(b.name)
        );

    function handleDelete(id) {
        Alert.alert(
            "Eliminar producto",
            "¿Deseas eliminar este producto?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        setProductsList((prev) =>
                            prev.filter(
                                (product) =>
                                    product.id !== id
                            )
                        );
                    },
                },
            ]
        );
    }

    async function handleImportProducts() {
        try {
            const importedProducts =
                await importProductsFromJson();

            if (!importedProducts) return;

            Alert.alert(
                "Importar catálogo",
                "¿Deseas reemplazar tu catálogo actual?",
                [
                    {
                        text: "Cancelar",
                        style: "cancel",
                    },
                    {
                        text: "Importar",
                        style: "destructive",
                        onPress: () => {
                            setProductsList(
                                importedProducts
                            );

                            Alert.alert(
                                "Catálogo importado",
                                "El catálogo se importó correctamente."
                            );
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                "Error",
                error.message ||
                "No se pudo importar el catálogo."
            );
        }
    }

    return (
        <SafeAreaView
            edges={["left", "right", "bottom"]}
            className="flex-1 bg-slate-100"
        >
            <ScrollView className="flex-1">
                <View className="pt-3 pb-5 px-5">

                    <QuickNav
                        navigation={navigation}
                        active="ProductsCatalog"
                    />

                    <View className="mb-3 flex-row gap-3">
                        <ActionButton
                            label="Agregar producto"
                            onPress={() =>
                                navigation.navigate(
                                    "ProductForm"
                                )
                            }
                            variant="success"
                        />

                        <ActionButton
                            label="Exportar catálogo"
                            onPress={() => {
                                console.log("PRODUCTOS EN PANTALLA:", productsList.length);
                                exportProducts([...productsList]);
                            }}
                            variant="primary"
                        />
                    </View>

                    <View className="mb-4">
                        <ActionButton
                            label="Importar catálogo"
                            onPress={
                                handleImportProducts
                            }
                            variant="dark"
                            fullWidth
                        />
                    </View>

                    <Text className="mb-2 font-bold text-slate-800">
                        Buscar producto
                    </Text>

                    <View className="flex-row items-center rounded-3xl bg-white px-4 shadow-sm">
                        <Feather
                            name="search"
                            size={20}
                            color="#64748b"
                        />

                        <TextInput
                            className="flex-1 px-3 py-4 text-base text-slate-900"
                            value={searchText}
                            onChangeText={
                                setSearchText
                            }
                            placeholder="Buscar producto..."
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <Text className="mb-3 mt-6 text-xl font-bold text-slate-900">
                        Productos (
                        {filteredProducts.length})
                    </Text>

                    {filteredProducts.map(
                        (product) => (
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
                                            ${product.price}{" "} por{" "}
                                            {product.unit}
                                        </Text>
                                    </View>

                                    <View className="rounded-full bg-slate-100 px-3 py-1">
                                        <Text className="text-xs font-bold text-slate-600">
                                            {product.category}
                                        </Text>
                                    </View>
                                </View>

                                <View className="mt-4 flex-row gap-3">
                                    <ActionButton
                                        label="Editar"
                                        onPress={() =>
                                            navigation.navigate(
                                                "ProductForm",
                                                {
                                                    productId:
                                                        product.id,
                                                }
                                            )
                                        }
                                        variant="dark"
                                    />

                                    <ActionButton
                                        label="Eliminar"
                                        onPress={() =>
                                            handleDelete(
                                                product.id
                                            )
                                        }
                                        variant="danger"
                                    />
                                </View>
                            </View>
                        )
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}