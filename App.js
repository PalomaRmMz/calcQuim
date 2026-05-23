import "./global.css";

import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalculatorScreen from "./src/screens/CalculatorScreen";
import AddSaleScreen from "./src/screens/AddSaleScreen";
import ListScreen from "./src/screens/ListScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [salesList, setSalesList] = useState([]);

  return (
    <NavigationContainer>
      <Stack.Navigator>
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