import { Pressable, Text, View } from "react-native";

export default function ProductButton({
    product,
    isSelected,
    onPress,
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`mb-3 rounded-2xl border p-4 ${isSelected
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 bg-white"
                }`}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text
                        className={`text-base ${isSelected
                            ? "font-bold text-blue-700"
                            : "text-slate-900"
                            }`}
                    >
                        {product.name}
                    </Text>

                    <Text className="mt-1 text-sm text-slate-500">
                        {product.category}
                    </Text>
                </View>

                <View className="items-end">
                    <Text className="text-lg font-bold text-slate-900">
                        ${product.price}
                    </Text>

                    <Text className="text-sm text-slate-500">
                        por {product.unit}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}