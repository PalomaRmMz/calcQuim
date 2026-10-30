import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export async function exportProducts(products) {
    try {
        const fileName = `productos_calcquim_${Date.now()}.json`;
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(
            fileUri,
            JSON.stringify(products, null, 2)
        );

        // PRUEBA INTERNA: leer el mismo archivo exportado
        const exportedContent = await FileSystem.readAsStringAsync(fileUri);
        const exportedProducts = JSON.parse(exportedContent);

        Alert.alert(
            "Archivo generado",
            `Se exportaron ${exportedProducts.length} productos.\n\nÚltimo producto: ${exportedProducts[exportedProducts.length - 1]?.name || "Sin nombre"
            }`
        );
        console.log("PRODUCTOS EXPORTADOS:", exportedProducts.length);
        console.log("ÚLTIMO PRODUCTO:", exportedProducts[exportedProducts.length - 1]);
        console.log("RUTA DEL ARCHIVO:", fileUri);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: "application/json",
                dialogTitle: "Exportar catálogo",
                UTI: "public.json",
            });
        }
    } catch (error) {
        console.error("Error exportando productos:", error);
        Alert.alert(
            "Error",
            "No se pudo exportar el catálogo."
        );
    }
}