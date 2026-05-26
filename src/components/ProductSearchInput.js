import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";

export default function ProductSearchInput({
    inputRef,
    products,
    selectedProduct,
    onSelectProduct,
    onProductSelected,
}) {
    const [searchText, setSearchText] = useState(selectedProduct?.name || "");
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setSearchText(selectedProduct?.name || "");
    }, [selectedProduct]);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchText.toLowerCase())
    );

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
                placeholder="Escribe el producto..."
                value={searchText}
                onChangeText={(text) => {
                    setSearchText(text);
                    setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
            />

            {showResults && searchText.length > 0 && (
                <View className="mt-2 max-h-60 rounded-2xl border border-slate-200 bg-white">
                    {filteredProducts.length === 0 ? (
                        <Text className="p-4 text-slate-500">
                            No se encontraron productos.
                        </Text>
                    ) : (
                        filteredProducts.slice(0, 8).map((product) => (
                            <Pressable
                                key={product.id}
                                onPress={() => handleSelect(product)}
                                className="border-b border-slate-100 p-4"
                            >
                                <Text className="font-bold text-slate-900">
                                    {product.name}
                                </Text>

                                <Text className="mt-1 text-sm text-slate-500">
                                    ${product.price} por {product.unit}
                                </Text>
                            </Pressable>
                        ))
                    )}
                </View>
            )}
        </View>
    );
}