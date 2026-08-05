import AsyncStorage from "@react-native-async-storage/async-storage";

const PRODUCTS_KEY = "calcquim_products";
const PRODUCTS_VERSION_KEY = "calcquim_products_version";

/*
 * Se aumenta a 3 para ejecutar nuevamente
 * la corrección del catálogo.
 */
const CURRENT_PRODUCTS_VERSION = 3;

function normalizeName(name = "") {
    return String(name)
        .trim()
        .toLowerCase();
}

function migrateProducts(
    defaultProducts,
    storedProducts
) {
    const defaultNames = new Set(
        defaultProducts.map((product) =>
            normalizeName(product.name)
        )
    );

    /*
     * Solamente conservamos productos creados
     * manualmente desde la aplicación.
     *
     * Los productos antiguos con isCustom: false
     * ya no se conservarán como productos extra.
     */
    const customProducts = storedProducts.filter(
        (product) =>
            product.isCustom === true &&
            !defaultNames.has(
                normalizeName(product.name)
            )
    );

    /*
     * Evita productos personalizados duplicados
     * con el mismo nombre.
     */
    const uniqueCustomProducts = [];

    const customNames = new Set();

    customProducts.forEach((product) => {
        const normalizedName = normalizeName(
            product.name
        );

        if (!customNames.has(normalizedName)) {
            customNames.add(normalizedName);
            uniqueCustomProducts.push(product);
        }
    });

    return [
        ...defaultProducts,
        ...uniqueCustomProducts,
    ];
}

export async function saveProducts(products) {
    try {
        console.log(
            "GUARDANDO PRODUCTOS:",
            products.length
        );

        await AsyncStorage.setItem(
            PRODUCTS_KEY,
            JSON.stringify(products)
        );

        await AsyncStorage.setItem(
            PRODUCTS_VERSION_KEY,
            String(CURRENT_PRODUCTS_VERSION)
        );

        console.log("PRODUCTOS GUARDADOS");
    } catch (error) {
        console.error(
            "Error guardando productos:",
            error
        );
    }
}

export async function loadProducts(
    defaultProducts = []
) {
    try {
        const [
            storedProductsJson,
            storedVersionText,
        ] = await Promise.all([
            AsyncStorage.getItem(PRODUCTS_KEY),
            AsyncStorage.getItem(
                PRODUCTS_VERSION_KEY
            ),
        ]);

        /*
         * Primera instalación o almacenamiento vacío.
         */
        if (!storedProductsJson) {
            return defaultProducts.length > 0
                ? defaultProducts
                : null;
        }

        const storedProducts = JSON.parse(
            storedProductsJson
        );

        const storedVersion = Number(
            storedVersionText || 0
        );

        if (!Array.isArray(storedProducts)) {
            throw new Error(
                "El catálogo guardado no es válido."
            );
        }

        /*
         * Cuando cambia la versión:
         * 1. Recupera todos los productos actuales.
         * 2. Elimina productos base antiguos.
         * 3. Conserva únicamente productos personalizados.
         */
        if (
            defaultProducts.length > 0 &&
            storedVersion <
            CURRENT_PRODUCTS_VERSION
        ) {
            const migratedProducts =
                migrateProducts(
                    defaultProducts,
                    storedProducts
                );

            await AsyncStorage.setItem(
                PRODUCTS_KEY,
                JSON.stringify(migratedProducts)
            );

            await AsyncStorage.setItem(
                PRODUCTS_VERSION_KEY,
                String(CURRENT_PRODUCTS_VERSION)
            );

            console.log(
                "CATÁLOGO CORREGIDO:",
                storedProducts.length,
                "->",
                migratedProducts.length
            );

            return migratedProducts;
        }

        console.log(
            "PRODUCTOS CARGADOS:",
            storedProducts.length
        );

        return storedProducts;
    } catch (error) {
        console.error(
            "Error cargando productos:",
            error
        );

        return defaultProducts.length > 0
            ? defaultProducts
            : null;
    }
}