import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

export async function importProductsFromJson() {
    const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
    });

    if (result.canceled) {
        return null;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const parsedProducts = JSON.parse(fileContent);

    if (!Array.isArray(parsedProducts)) {
        throw new Error("El archivo no contiene una lista de productos.");
    }

    const isValid = parsedProducts.every(
        (product) =>
            product.id &&
            product.name &&
            product.category &&
            product.unit &&
            typeof product.price === "number"
    );

    if (!isValid) {
        throw new Error("El catálogo no tiene el formato correcto.");
    }
    return parsedProducts;
}