import "./global.css";

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import CalculatorScreen from "./src/screens/CalculatorScreen";
import AddSaleScreen from "./src/screens/AddSaleScreen";
import ListScreen from "./src/screens/ListScreen";

const Stack = createNativeStackNavigator();

export default function App() {

  const [salesList, setSalesList] = useState([]);

  useEffect(() => {
    async function loadSales() {
      const storedSales = await AsyncStorage.getItem("currentSale");

      if (storedSales) {
        setSalesList(JSON.parse(storedSales));
      }
    }

    loadSales();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("currentSale", JSON.stringify(salesList));
  }, [salesList]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          options={{ title: "Inicio" }}
        >
          {(props) => (
            <HomeScreen
              {...props}
              salesList={salesList}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}