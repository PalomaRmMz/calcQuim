import { View, Text, TextInput } from "react-native";
import ActionButton from "./ActionButton";

export default function SaleCard({
    item,
    isEditing,
    editedValue,
    onChangeEdit,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
}) {
    const isQuantitySale = item.type === "venta_por_cantidad";

    function formatLiquid(milliliters) {
        return milliliters >= 1000
            ? `${(milliliters / 1000).toFixed(2)} litros`
            : `${milliliters.toFixed(0)} ml`;
    }

    return (
        <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
            <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 text-lg font-extrabold text-slate-900">
                    {item.product}
                </Text>

                <View
                    className={`rounded-full px-3 py-1 ${isQuantitySale ? "bg-green-100" : "bg-blue-100"
                        }`}
                >
                    <Text
                        className={`text-xs font-bold ${isQuantitySale ? "text-green-700" : "text-blue-700"
                            }`}
                    >
                        {isQuantitySale ? "Cantidad" : "Monto"}
                    </Text>
                </View>
            </View>

            {isEditing ? (
                <>
                    <Text className="mt-4 text-sm font-semibold text-slate-500">
                        {isQuantitySale
                            ? "Editar cantidad en litros"
                            : "Editar monto en pesos"}
                    </Text>

                    <TextInput
                        className="mt-2 rounded-2xl border border-slate-300 bg-white p-4 text-2xl font-bold text-slate-900"
                        keyboardType="numeric"
                        value={editedValue}
                        onChangeText={onChangeEdit}
                        placeholder={isQuantitySale ? "Ejemplo: 1" : "Ejemplo: 25"}
                    />

                    <View className="mt-4 flex-row gap-3">
                        <ActionButton label="Guardar" onPress={onSaveEdit} />
                        <ActionButton
                            label="Cancelar"
                            onPress={onCancelEdit}
                            variant="dark"
                        />
                    </View>
                </>
            ) : (
                <>
                    {isQuantitySale ? (
                        <>
                            <Text className="mt-3 text-2xl font-extrabold text-green-600">
                                {item.quantity} litro
                            </Text>

                            <Text className="mt-1 text-base text-slate-500">
                                Total: ${Number(item.total || 0).toFixed(2)}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text className="mt-3 text-2xl font-extrabold text-blue-600">
                                ${Number(item.amount || 0).toFixed(2)}
                            </Text>

                            <Text className="mt-1 text-base text-slate-500">
                                Total: {formatLiquid(Number(item.milliliters || 0))}
                            </Text>
                        </>
                    )}

                    <View className="mt-5 flex-row gap-3">
                        <ActionButton
                            label=""
                            variant="white"
                        />
                        <ActionButton
                            label="Editar"
                            onPress={onStartEdit}
                            variant="dark"
                        />

                        <ActionButton
                            label="Eliminar"
                            onPress={onDelete}
                            variant="danger"
                        />
                    </View>
                </>
            )}
        </View>
    );
}