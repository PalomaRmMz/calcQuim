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
    route,
    salesList,
    setSalesList,
}) {
    const list = salesList || [];
    const [editingId, setEditingId] = useState(null);
    const [editedQuantity, setEditedQuantity] = useState("");
    const totalSales = list.reduce((acc, item) => {
        if (item.type === "venta_por_monto") {
            return acc + Number(item.amount || 0);
        }

        return acc + Number(item.total || 0);
    }, 0);

    function handleDelete(id) {
        Alert.alert(
            "Eliminar",
            "¿Deseas eliminar este registro?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        const updatedList = list.filter(
                            (item) => item.id !== id
                        );
                        setSalesList(updatedList);
                    },
                },
            ]
        );
    }

    function handleStartEdit(item) {
        setEditingId(item.id);

        if (item.type === "venta_por_monto") {
            setEditedQuantity(item.amount?.toString() || "");
        } else {
            setEditedQuantity(item.quantity?.toString() || "");
        }
    }

    function handleSaveEdit(id) {
        const updatedList = list.map((item) => {
            if (item.id === id) {
                const newValue = Number(editedQuantity);

                if (item.type === "venta_por_monto") {
                    const newQuantity = newValue / Number(item.price || 1);
                    return {
                        ...item,
                        amount: newValue,
                        quantity: newQuantity,
                        milliliters: newQuantity * 1000,
                    };
                }

                const quantityInLiters =
                    item.unit === "ml"
                        ? newValue / 1000
                        : newValue;
                const newTotal = quantityInLiters * Number(item.price || 0);

                return {
                    ...item,
                    quantity: newValue,
                    total: newTotal,
                };
            }
            return item;
        });

        setSalesList(updatedList);
        setEditingId(null);
        setEditedQuantity("");
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView className="p-5">

                <QuickNav navigation={navigation} active="SalesList" />

                <View className="mb-5 rounded-3xl bg-green-600 p-5">
                    <Text className="text-lg font-semibold text-green-100">
                        Total de venta
                    </Text>

                    <Text className="mt-2 text-5xl font-extrabold text-white text-center">
                        ${totalSales.toFixed(2)}
                    </Text>
                </View>

                {list.length === 0 ? (
                    <Text className="text-slate-500">
                        Aún no has agregado productos.
                    </Text>
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
                                    <TextInput
                                        className="mt-4 rounded-2xl bg-slate-100 p-4 text-2xl font-bold"
                                        keyboardType="numeric"
                                        value={editedQuantity}
                                        onChangeText={setEditedQuantity}
                                    />

                                    <Pressable
                                        onPress={() => handleSaveEdit(item.id)}
                                        className="mt-3 rounded-2xl bg-blue-600 p-4"
                                    >
                                        <Text className="text-center text-lg font-bold text-white">
                                            Guardar
                                        </Text>
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    {item.type === "venta_por_monto" ? (
                                        <>
                                            <Text className="mt-1 text-2xl font-bold text-blue-600">
                                                {item.milliliters >= 1000
                                                    ? `${(item.milliliters / 1000).toFixed(2)} litros`
                                                    : `${item.milliliters.toFixed(0)} ml`}
                                            </Text>

                                            <Text className="mt-1 text-lg text-slate-700">
                                                Total: ${item.amount}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text className="mt-1 text-2xl font-bold text-green-600">
                                                {item.quantity} {item.unit}
                                            </Text>

                                            <Text className="mt-1 text-lg text-slate-700">
                                                Total: $
                                                {Number(item.total || 0).toFixed(2)}
                                            </Text>
                                        </>
                                    )}

                                    <View className="mt-5 flex-row gap-3">
                                        {(item.type === "venta_por_cantidad" || item.type === "venta_por_monto") && (
                                            <Pressable
                                                onPress={() => handleStartEdit(item)}
                                                className="flex-1 rounded-2xl bg-slate-900 p-4"
                                            >
                                                <Text className="text-center font-bold text-white">
                                                    Editar
                                                </Text>
                                            </Pressable>
                                        )}

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