import "./global.css";

import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AddSaleScreen from "./src/screens/AddSaleScreen";
import CalculatorScreen from "./src/screens/CalculatorScreen";
import ListScreen from "./src/screens/ListScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [salesList, setSalesList] = useState([]);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Agregar venta">
          {(props) => (
            <AddSaleScreen
              {...props}
              salesList={salesList}
              setSalesList={setSalesList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Cálculo de producto por monto">
          {(props) => (
            <CalculatorScreen
              {...props}
              salesList={salesList}
              setSalesList={setSalesList}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Lista">
          {(props) => (
            <ListScreen
              {...props}
              salesList={salesList}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}