import "./global.css";

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { products } from "./src/data/Products";
import { loadProducts, saveProducts } from "./src/storage/productsStorage";
import AddSaleScreen from "./src/screens/AddSaleScreen";
import CalculatorScreen from "./src/screens/CalculatorScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ListScreen from "./src/screens/ListScreen";
import ProductAdminScreen from "./src/screens/ProductAdminScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [salesList, setSalesList] = useState([]);
  const [productsList, setProductsList] = useState(products);

  useEffect(() => {
    async function loadInitialData() {
      const storedSales = await AsyncStorage.getItem("currentSale");

      if (storedSales) {
        setSalesList(JSON.parse(storedSales));
      }

      const storedProducts = await loadProducts();

      if (storedProducts) {
        setProductsList(storedProducts);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("currentSale", JSON.stringify(salesList));
  }, [salesList]);

  useEffect(() => {
    saveProducts(productsList);
  }, [productsList]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">

        <Stack.Screen
          name="Home"
          options={{
            title: "Inicio",
            headerTitleStyle: { fontSize: 22, },
          }}
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
          options={{
            title: "Venta por monto",
            headerTitleStyle: { fontSize: 22, },
          }}
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
          options={{
            title: "Venta por cantidad",
            headerTitleStyle: { fontSize: 22, },
          }}
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
          options={{
            title: "Lista de venta",
            headerTitleStyle: { fontSize: 22, },
          }}
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
          name="ProductsAdmin"
          options={{
            title: "Productos",
            headerTitleStyle: { fontSize: 22, },
          }}
        >
          {(props) => (
            <ProductAdminScreen
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