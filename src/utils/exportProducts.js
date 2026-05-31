import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function exportProducts(products) {
    try {
        const fileUri =
            FileSystem.documentDirectory + "productos.json";

        await FileSystem.writeAsStringAsync(
            fileUri,
            JSON.stringify(products, null, 2)
        );

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: "application/json",
                dialogTitle: "Exportar catálogo",
            });
        }
    } catch (error) {
        console.error(error);
    }
}