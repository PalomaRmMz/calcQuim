import HardwareCreateScreen from './src/screens/HardwareCreateScreen';
﻿import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useMobileSale } from "./src/hooks/useMobileSale";
import MainSections from './src/components/MainSections';
import SaleSummaryScreen from "./src/screens/SaleSummaryScreen";
import ConnectionScreen from "./src/screens/ConnectionScreen";
import InventoryProductScreen from './src/screens/InventoryProductScreen';
import InventoryCaptureScreen from './src/screens/InventoryCaptureScreen';
import InventoryHistoryScreen from './src/screens/InventoryHistoryScreen';
import { COLORS as C } from "./src/domain/brand.mjs";
import { useEmulatorProbe } from "./src/testing/useEmulatorProbe";
const Stack = createNativeStackNavigator();
export default function App() {
  const model = useMobileSale();
  useEmulatorProbe(model);
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: C.white },
            headerTintColor: C.ink,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: C.background },
          }}
        >
          <Stack.Screen name="Home" options={{ headerShown: false }}>
            {(props) => <MainSections {...props} model={model} />}
          </Stack.Screen>
          <Stack.Screen
            name="Connection"
            options={{ title: "Configuración" }}
          >
            {(props) => <ConnectionScreen {...props} model={model} />}
          </Stack.Screen>
          <Stack.Screen name="HardwareCreate" options={{title:'Agregar producto'}}>{(props)=><HardwareCreateScreen {...props} model={model}/>}</Stack.Screen>
          <Stack.Screen
            name="InventoryProduct"
            options={{ title: "Existencias del producto" }}
          >
            {(props) => <InventoryProductScreen {...props} model={model} />}
          </Stack.Screen>
          <Stack.Screen
            name="InventoryCapture" options={{ title: "Captura de inventario" }}
          >
            {(props) => <InventoryCaptureScreen {...props} model={model} />}
          </Stack.Screen>
          <Stack.Screen
            name="InventoryHistory" options={{ title: "Historial de inventario" }}
          >
            {(props) => <InventoryHistoryScreen {...props} model={model} />}
          </Stack.Screen>
          <Stack.Screen
            name="SaleSummary"
            options={{ title: "Resumen de venta" }}
          >
            {(props) => <SaleSummaryScreen {...props} model={model} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
