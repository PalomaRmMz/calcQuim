import { useState } from "react";

import {
    SafeAreaView,
    View,
    Text,
    ScrollView,
    Pressable,
    Alert,
} from "react-native";
import QuickNav from "../components/QuickNav";
import SaleCard from "../components/SaleCard";
import TotalCard from "../components/TotalCard";
import {
    calculateSaleByAmount,
    calculateSaleByLiters,
    calculateTotalSales,
} from "../utils/salesCalculations";

export default function ListScreen({ navigation, salesList, setSalesList }) {
    const list = salesList || [];

    const [editingId, setEditingId] = useState(null);
    const [editedValue, setEditedValue] = useState("");
    const totalSales = calculateTotalSales(list);

    function handleDelete(id) {
        Alert.alert("Eliminar", "¿Deseas eliminar este registro?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: () => {
                    setSalesList(list.filter((item) => item.id !== id));
                },
            },
        ]);
    }

    function handleClearSales() {
        Alert.alert("Nueva venta", "¿Deseas iniciar una nueva venta?", [
            { text: "Iniciar nueva venta", style: "cancel" },
            {
                text: "Limpiar",
                style: "destructive",
                onPress: () => setSalesList([]),
            },
        ]);
    }

    function handleStartEdit(item) {
        setEditingId(item.id);

        if (item.type === "venta_por_monto") {
            setEditedValue(item.amount?.toString() || "");
        } else {
            setEditedValue(item.quantity?.toString() || "");
        }
    }

    function handleCancelEdit() {
        setEditingId(null);
        setEditedValue("");
    }

    function handleSaveEdit(id) {
        const updatedList = list.map((item) => {
            if (item.id !== id) return item;

            const newValue = Number(editedValue);

            if (!newValue || newValue <= 0) return item;

            if (item.type === "venta_por_monto") {
                const { quantity, milliliters } = calculateSaleByAmount(
                    newValue,
                    item.price
                );

                return {
                    ...item,
                    amount: newValue,
                    quantity,
                    milliliters,
                };
            }

            const newTotal = calculateSaleByLiters(newValue, item.price);

            return {
                ...item,
                quantity: newValue,
                unit: "litro",
                total: newTotal,
            };
        });

        setSalesList(updatedList);
        handleCancelEdit();
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView className="p-5">
                <QuickNav navigation={navigation} active="SalesList" />

                <TotalCard total={totalSales} />

                {list.length > 0 && (
                    <Pressable
                        onPress={handleClearSales}
                        className="mb-5 rounded-2xl bg-red-500 py-3"
                    >
                        <Text className="text-center text-sm font-bold text-white">
                            Limpiar venta
                        </Text>
                    </Pressable>
                )}

                {list.length === 0 ? (
                    <View className="rounded-3xl bg-white p-6 shadow-sm">
                        <Text className="text-center text-slate-500">
                            Aún no has agregado productos.
                        </Text>
                    </View>
                ) : (
                    list.map((item) => (
                        <SaleCard
                            key={item.id}
                            item={item}
                            isEditing={editingId === item.id}
                            editedValue={editedValue}
                            onChangeEdit={setEditedValue}
                            onStartEdit={() => handleStartEdit(item)}
                            onSaveEdit={() => handleSaveEdit(item.id)}
                            onCancelEdit={handleCancelEdit}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}