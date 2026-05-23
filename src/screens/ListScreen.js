import { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
} from "react-native";
import QuickNav from "../components/QuickNav";

export default function ListScreen({
    navigation,
    salesList,
    setSalesList,
}) {
    const list = salesList || [];

    const [editingId, setEditingId] = useState(null);
    const [editedValue, setEditedValue] = useState("");
    const totalSales = list.reduce((acc, item) => {
        if (item.type === "venta_por_monto") {
            return acc + Number(item.amount || 0);
        }
        return acc + Number(item.total || 0);
    }, 0);

    function handleDelete(id) {
        Alert.alert("Eliminar", "¿Deseas eliminar este registro?", [
            {
                text: "Cancelar",
                style: "cancel",
            },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: () => {
                    const updatedList = list.filter((item) => item.id !== id);
                    setSalesList(updatedList);
                },
            },
        ]);
    }

    function handleClearSales() {
        Alert.alert("Limpiar venta", "¿Deseas eliminar toda la venta?", [
            {
                text: "Cancelar",
                style: "cancel",
            },
            {
                text: "Limpiar",
                style: "destructive",
                onPress: () => {
                    setSalesList([]);
                },
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
                const newQuantity = newValue / Number(item.price || 1);
                return {
                    ...item,
                    amount: newValue,
                    quantity: newQuantity,
                    milliliters: newQuantity * 1000,
                };
            }
            const newTotal = newValue * Number(item.price || 0);
            return {
                ...item,
                quantity: newValue,
                unit: "litro",
                total: newTotal,
            };
        });
        setSalesList(updatedList);
        setEditingId(null);
        setEditedValue("");
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="p-5">
                <QuickNav navigation={navigation} active="SalesList" />

                <View className="mb-5 rounded-3xl bg-green-600 p-5">
                    <Text className="text-lg font-semibold text-green-100">
                        Total de venta
                    </Text>

                    <Text className="mt-2 text-center text-5xl font-extrabold text-white">
                        ${totalSales.toFixed(2)}
                    </Text>
                </View>

                {list.length > 0 && (
                    <Pressable
                        onPress={handleClearSales}
                        className="mb-5 rounded-2xl bg-red-500 p-4"
                    >
                        <Text className="text-center text-lg font-bold text-white">
                            Limpiar venta
                        </Text>
                    </Pressable>
                )}

                {list.length === 0 ? (
                    <View className="rounded-3xl bg-white p-5">
                        <Text className="text-center text-slate-500">
                            Aún no has agregado productos.
                        </Text>
                    </View>
                ) : (
                    list.map((item) => (
                        <View
                            key={item.id}
                            className="mb-4 rounded-3xl bg-white p-5"
                        >
                            <View className="flex-row items-center justify-between">
                                <Text className="flex-1 text-xl font-bold text-slate-900">
                                    {item.product}
                                </Text>

                                <View
                                    className={`rounded-2xl px-3 py-1 ${item.type === "venta_por_cantidad"
                                        ? "bg-green-100"
                                        : "bg-blue-100"
                                        }`}
                                >
                                    <Text
                                        className={`font-bold ${item.type === "venta_por_cantidad"
                                            ? "text-green-700"
                                            : "text-blue-700"
                                            }`}
                                    >
                                        {item.type === "venta_por_cantidad"
                                            ? "Cantidad"
                                            : "Monto"}
                                    </Text>
                                </View>
                            </View>

                            {editingId === item.id ? (
                                <>
                                    <Text className="mt-4 text-sm font-semibold text-slate-600">
                                        {item.type === "venta_por_monto"
                                            ? "Editar monto en pesos"
                                            : "Editar cantidad en litros"}
                                    </Text>

                                    <TextInput
                                        className="mt-2 rounded-2xl bg-slate-100 p-4 text-2xl font-bold text-slate-900"
                                        keyboardType="numeric"
                                        value={editedValue}
                                        onChangeText={setEditedValue}
                                        placeholder={
                                            item.type === "venta_por_monto"
                                                ? "Ejemplo: 25"
                                                : "Ejemplo: 0.8"
                                        }
                                    />

                                    <View className="mt-3 flex-row gap-3">
                                        <Pressable
                                            onPress={() => handleSaveEdit(item.id)}
                                            className="flex-1 rounded-2xl bg-blue-600 p-4"
                                        >
                                            <Text className="text-center text-lg font-bold text-white">
                                                Guardar
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={handleCancelEdit}
                                            className="flex-1 rounded-2xl bg-slate-400 p-4"
                                        >
                                            <Text className="text-center text-lg font-bold text-white">
                                                Cancelar
                                            </Text>
                                        </Pressable>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {item.type === "venta_por_monto" ? (
                                        <>
                                            <Text className="mt-2 text-2xl font-bold text-blue-600">
                                                ${Number(item.amount || 0).toFixed(2)}
                                            </Text>

                                            <Text className="mt-1 text-lg text-slate-700">
                                                Total:{" "}
                                                {item.milliliters >= 1000
                                                    ? `${(item.milliliters / 1000).toFixed(2)} litros`
                                                    : `${item.milliliters.toFixed(0)} ml`}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text className="mt-2 text-2xl font-bold text-green-600">
                                                {item.quantity} litro
                                            </Text>

                                            <Text className="mt-1 text-lg text-slate-700">
                                                Total: $
                                                {Number(item.total || 0).toFixed(2)}
                                            </Text>
                                        </>
                                    )}

                                    <View className="mt-5 flex-row gap-3">
                                        <Pressable
                                            onPress={() => handleStartEdit(item)}
                                            className="flex-1 rounded-2xl bg-slate-900 p-4"
                                        >
                                            <Text className="text-center font-bold text-white">
                                                Editar
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => handleDelete(item.id)}
                                            className="flex-1 rounded-2xl bg-red-500 p-4"
                                        >
                                            <Text className="text-center font-bold text-white">
                                                Eliminar
                                            </Text>
                                        </Pressable>
                                    </View>
                                </>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}