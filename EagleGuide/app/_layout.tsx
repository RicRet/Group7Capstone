// app/_layout.tsx
import { NavigationProvider } from "@googlemaps/react-native-navigation-sdk";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationProvider
        termsAndConditionsDialogOptions={{
          // You can customize title, message, buttons, etc.
          title: "Google Maps Terms",
          showOnlyDisclaimer: true
        }}
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="Login" options={{ headerShown: false }} />
          <Stack.Screen name="Signup" options={{ headerShown: false }} />
        </Stack>
      </NavigationProvider>
    </GestureHandlerRootView>
  );
}
