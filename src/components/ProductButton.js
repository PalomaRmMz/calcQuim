import { Pressable, Text } from "react-native";

export default function ProductButton({ product, isSelected, onPress }) {
    return (
        <Pressable
            className={`mb-3 rounded-2xl p-4 ${isSelected ? "bg-blue-600" : "bg-slate-100"
                }`}
            onPress={onPress}
        >
            <Text
                className={`text-base ${isSelected ? "font-bold text-white" : "text-slate-900"
                    }`}
            >
                {product.name} - ${product.price} por {product.unit}
            </Text>
        </Pressable>
    );
}