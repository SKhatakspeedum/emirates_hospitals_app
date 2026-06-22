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
import { View } from "react-native";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts(Fonts);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      sessionStorage.setItem("refreshDetected", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const blockRefresh = async (e: KeyboardEvent) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        sessionStorage.setItem("refreshDetected", "true");
      }
    };

    window.addEventListener("keydown", blockRefresh);
    return () => window.removeEventListener("keydown", blockRefresh);
  }, []);

  useEffect(() => {
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
      // const wasRefreshed = sessionStorage.getItem('refreshDetected');
      // if (wasRefreshed === 'true') {
      //   sessionStorage.removeItem('refreshDetected');
      // }

      setIsReady(true); // Show the app now
    };

    handleInitialRedirect();
  }, []);

  useEffect(() => {
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

  useEffect(() => {
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

  if (!isReady) return <View></View>;
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
