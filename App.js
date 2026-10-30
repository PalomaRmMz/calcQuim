import "./global.css";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { products } from "./src/data/Products";
import {
  loadProducts,
  saveProducts,
} from "./src/storage/productsStorage";

import HomeScreen from "./src/screens/HomeScreen";
import CalculatorScreen from "./src/screens/CalculatorScreen";
import AddSaleScreen from "./src/screens/AddSaleScreen";
import ListScreen from "./src/screens/ListScreen";
import ProductCatalogScreen from "./src/screens/ProductCatalogScreen";
import ProductFormScreen from "./src/screens/ProductFormScreen";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerTitleStyle: {
    fontSize: 22,
  },
};

export default function App() {
  const [salesList, setSalesList] = useState([]);
  const [productsList, setProductsList] = useState(products);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const storedSales = await AsyncStorage.getItem("currentSale");

        if (storedSales) {
          setSalesList(JSON.parse(storedSales));
        }

        /*
         * Se envían los productos actuales de Products.js.
         * loadProducts se encargará de combinarlos con los
         * productos personalizados guardados anteriormente.
         */
        const storedProducts = await loadProducts(products);

        if (storedProducts) {
          setProductsList(storedProducts);
        }
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setDataLoaded(true);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    AsyncStorage.setItem(
      "currentSale",
      JSON.stringify(salesList)
    ).catch((error) => {
      console.error("Error guardando la venta:", error);
    });
  }, [salesList, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    saveProducts(productsList);
  }, [productsList, dataLoaded]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={screenOptions}
      >
        <Stack.Screen
          name="Home"
          options={{ title: "Inicio" }}
        >
          {(props) => (
            <HomeScreen
              {...props}
              salesList={salesList}
              productsList={productsList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Calculator"
          options={{ title: "Venta por monto" }}
        >
          {(props) => (
            <CalculatorScreen
              {...props}
              salesList={salesList}
              setSalesList={setSalesList}
              productsList={productsList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="AddSale"
          options={{ title: "Venta por cantidad" }}
        >
          {(props) => (
            <AddSaleScreen
              {...props}
              salesList={salesList}
              setSalesList={setSalesList}
              productsList={productsList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SalesList"
          options={{ title: "Lista de venta" }}
        >
          {(props) => (
            <ListScreen
              {...props}
              salesList={salesList}
              setSalesList={setSalesList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="ProductsCatalog"
          options={{ title: "Catálogo" }}
        >
          {(props) => (
            <ProductCatalogScreen
              {...props}
              productsList={productsList}
              setProductsList={setProductsList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="ProductForm"
          options={{ title: "Producto" }}
        >
          {(props) => (
            <ProductFormScreen
              {...props}
              productsList={productsList}
              setProductsList={setProductsList}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}