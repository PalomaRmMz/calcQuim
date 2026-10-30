import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, } from "react-native";

export default function ProductSearchInput({ inputRef, products, selectedProduct, onSelectProduct, onProductSelected, }) {
    const [searchText, setSearchText] = useState(
        selectedProduct?.name || ""
    );

    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setSearchText(selectedProduct?.name || "");
    }, [selectedProduct]);

    function normalizeText(text = "") {
        return String(text)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    const normalizedSearch = normalizeText(searchText);

    const filteredProducts = [...products]
        .filter((product) => {
            const productName = normalizeText(
                product.name
            );

            const productCategory = normalizeText(
                product.category
            );
            return (
                productName.includes(normalizedSearch) ||
                productCategory.includes(normalizedSearch)
            );
        })
        .sort((a, b) => {
            const categoryComparison = String(
                a.category || ""
            ).localeCompare(
                String(b.category || ""),
                "es",
                { sensitivity: "base" }
            );

            if (categoryComparison !== 0) {
                return categoryComparison;
            }

            return String(a.name || "").localeCompare(
                String(b.name || ""),
                "es",
                { sensitivity: "base" }
            );
        });

    function handleSelect(product) {
        onSelectProduct(product);
        setSearchText(product.name);
        setShowResults(false);

        if (onProductSelected) {
            setTimeout(() => {
                onProductSelected();
            }, 100);
        }
    }

    return (
        <View>
            <TextInput
                ref={inputRef}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900"
                placeholder="Escribe el producto o categoría..."
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={(text) => {
                    setSearchText(text);
                    setShowResults(true);

                    if (
                        selectedProduct &&
                        text !== selectedProduct.name
                    ) {
                        onSelectProduct(null);
                    }
                }}
                onFocus={() => setShowResults(true)}
            />

            {showResults && searchText.trim().length > 0 && (
                <View className="mt-2 max-h-72 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {filteredProducts.length === 0 ? (
                        <Text className="p-4 text-slate-500">
                            No se encontraron productos.
                        </Text>
                    ) : (
                        <ScrollView
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator
                        >
                            {filteredProducts.map(
                                (product) => (
                                    <Pressable
                                        key={product.id}
                                        onPress={() => handleSelect(product)}
                                        className="border-b border-slate-100 p-4"
                                    >
                                        <Text className="font-bold text-slate-900">
                                            {product.name}
                                        </Text>
                                    </Pressable>
                                )
                            )}
                        </ScrollView>
                    )}
                </View>
            )}
        </View>
    );
}