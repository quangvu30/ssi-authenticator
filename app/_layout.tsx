import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../polyfills";

import { AccountsProvider } from "@/contexts/accounts-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeKeyPairs } from "@/lib/key-manager";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize cryptographic key pairs on app startup
  useEffect(() => {
    initializeKeyPairs().catch((error) => {
      console.error("Failed to initialize key pairs:", error);
    });
  }, []);

  return (
    <AccountsProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="qr-scanner"
            options={{ presentation: "fullScreenModal", headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AccountsProvider>
  );
}
