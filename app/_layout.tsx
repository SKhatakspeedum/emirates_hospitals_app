import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Fonts } from "./config/fonts";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "./auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IS_LOGGED_IN } from "./config/config";
import { useRouter } from "expo-router";
import { View, Platform } from "react-native";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts(Fonts);
  const [isReady, setIsReady] = useState(false);

  console.log("[RootLayout] rendering. loaded:", loaded, "isReady:", isReady, "error:", error);

  useEffect(() => {
    console.log("[RootLayout] loaded changed:", loaded);
    if (loaded) {
      SplashScreen.hideAsync().catch(err => console.error("[RootLayout] SplashScreen.hideAsync error:", err));
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      sessionStorage.setItem("refreshDetected", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const blockRefresh = async (e: KeyboardEvent) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        sessionStorage.setItem("refreshDetected", "true");
      }
    };

    window.addEventListener("keydown", blockRefresh);
    return () => window.removeEventListener("keydown", blockRefresh);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const checkReload = async () => {
      const wasRefreshed = sessionStorage.getItem("refreshDetected");
      if (wasRefreshed === "true") {
        sessionStorage.removeItem("refreshDetected");
        setTimeout(async () => {
          const isLoggedIn = await AsyncStorage.getItem(IS_LOGGED_IN);
          if (isLoggedIn === "true") {
            router.replace("/tab_bar_home/HomeScreen");
          } else {
            router.replace("/init_screens/login");
          }
        }, 20);
      }
    };

    checkReload();
  }, []);

  useEffect(() => {
    const handleInitialRedirect = async () => {
      console.log("[RootLayout] setting isReady to true");
      setIsReady(true); // Show the app now
    };

    handleInitialRedirect();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleBack = (e: PopStateEvent) => {
      e.preventDefault();

      // Force user to stay on current route or redirect to home

      router.replace("/tab_bar_home/HomeScreen"); // or any route
    };

    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, []);

  if (!loaded) {
    console.log("[RootLayout] fonts not loaded yet, returning null");
    return null;
  }

  if (!isReady) {
    console.log("[RootLayout] isReady is false, rendering blank View");
    return <View></View>;
  }
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </AuthProvider>
  );
}
