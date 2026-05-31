import AsyncStorage from "@react-native-async-storage/async-storage";

const PRODUCTS_KEY = "calcquim_products";

export async function saveProducts(products) {
    try {
        await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
        console.error("Error guardando productos:", error);
    }
}

export async function loadProducts() {
    try {
        const storedProducts = await AsyncStorage.getItem(PRODUCTS_KEY);

        return storedProducts ? JSON.parse(storedProducts) : null;
    } catch (error) {
        console.error("Error cargando productos:", error);
        return null;
    }
}