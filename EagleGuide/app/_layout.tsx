// app/_layout.tsx
import { Stack } from "expo-router";
import { SessionProvider } from "./lib/session";
import { Theme } from "./Theme";

export default function RootLayout() {
   return (
    <Theme>
      <SessionProvider>
        <Stack>
          <Stack.Screen 
            name="index" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Login" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Signup" 
            options={{ headerShown: false }} 
          />
        </Stack>
      </SessionProvider>
    </Theme>
  );
}
