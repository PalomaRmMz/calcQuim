import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useMobileSale } from "./src/hooks/useMobileSale";
import QuickSaleScreen from "./src/screens/QuickSaleScreen";
import SaleSummaryScreen from "./src/screens/SaleSummaryScreen";
import ConnectionScreen from "./src/screens/ConnectionScreen";
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
            {(props) => <QuickSaleScreen {...props} model={model} />}
          </Stack.Screen>
          <Stack.Screen
            name="Connection"
            options={{ title: "Conexión y datos" }}
          >
            {(props) => <ConnectionScreen {...props} model={model} />}
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
