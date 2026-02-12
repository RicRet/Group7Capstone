// app/_layout.tsx
import { Stack } from "expo-router";
import { SessionProvider } from "./lib/session";
import { Theme } from "./Theme";

export default function RootLayout() {
   return (
    <Theme>
        <SessionProvider>
        <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="homepage" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="navigation" options={{ headerShown: false }} />
        <Stack.Screen name="addroute" options={{ headerShown: false }} />
        <Stack.Screen name="editroute" options={{ headerShown: false }} />
        <Stack.Screen name="friends" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
        <Stack.Screen name="Signup" options={{ headerShown: false }} />
        <Stack.Screen name="Settings" options={{ headerShown: false }} />
        <Stack.Screen name="test" options={{ headerShown: false, presentation: "modal" }} />
        </Stack>
      </SessionProvider>
    </Theme>
  );
}
