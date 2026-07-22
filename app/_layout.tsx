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
import { useOrgLogo } from "./hooks/useOrgLogo";
import { fetchAndApplyOrgConfig } from "./services/orgConfig";
import { useRouter } from "expo-router";
import {
  View,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  createSuggestusSession,
  initializeSuggestus,
} from "./suggestus_plugin/suggestusClient";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const logoSource = useOrgLogo();
  const [loaded, error] = useFonts(Fonts);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded && isReady) {
      SplashScreen.hideAsync().catch((err) =>
        console.error("[RootLayout] SplashScreen.hideAsync error:", err),
      );
    }
  }, [loaded, isReady]);

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

  // useEffect(() => {
  //   if (Platform.OS !== "web") return;
  //   const checkReload = async () => {
  //     const wasRefreshed = sessionStorage.getItem("refreshDetected");
  //     if (wasRefreshed === "true") {
  //       sessionStorage.removeItem("refreshDetected");
  //       setTimeout(async () => {
  //         const isLoggedIn = await AsyncStorage.getItem(IS_LOGGED_IN);
  //         if (isLoggedIn === "true") {
  //           router.replace("/tab_bar_home/HomeScreen");
  //         } else {
  //           router.replace("/init_screens/login");
  //         }
  //       }, 20);
  //     }
  //   };

  //   checkReload();
  // }, []);

  // useEffect(() => {
  //   const handleInitialRedirect = async () => {
  //     setIsReady(true); // Show the app now
  //   };

  //   handleInitialRedirect();
  // }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!isReady) return; // wait until Root Layout (Stack) has mounted

    const checkReload = async () => {
      const wasRefreshed = sessionStorage.getItem("refreshDetected");
      if (wasRefreshed === "true") {
        sessionStorage.removeItem("refreshDetected");
        setTimeout(async () => {
          // Get current route from sessionStorage to preserve navigation
          const currentRoute = sessionStorage.getItem("currentRoute") as any;

          // If there's a saved route, use it (preserves registration flow)
          if (currentRoute) {
            sessionStorage.removeItem("currentRoute");
            router.replace(currentRoute);
            return;
          }

          // Otherwise, check auth state
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
  }, [isReady]);

  const init = async () => {
    // Best-effort session init — do NOT gate navigation on its success, or a
    // suggestus failure would strand the app on the splash screen.
    try {
      const sessionResult = await initializeSuggestus();
      if (!sessionResult?.returnCode) {
        // Retry once with session-only call (footprint may already exist)
        await createSuggestusSession();
      }
    } catch (error) {
      console.error("[RootLayout] suggestus init failed:", error);
    }

    // Single source of truth for the initial auth-gated redirect. index.tsx
    // must NOT also redirect, or the two competing router.replace() calls
    // produce a visible double reload on cold start.
    try {
      const isLoggedIn = await AsyncStorage.getItem(IS_LOGGED_IN);
      router.replace(
        isLoggedIn === "true"
          ? "/tab_bar_home/HomeScreen"
          : "/init_screens/login",
      );
    } catch (error) {
      console.error("[RootLayout] auth check failed:", error);
      router.replace("/init_screens/login");
    }
  };

  useEffect(() => {
    const handleInitialRedirect = async () => {
      await init();
      // Fetches + applies org logo, theme colors, country codes, EULA
      // config, etc. — shared with the post-logout flow in
      // init_screens/splash.tsx (see app/services/orgConfig.ts).
      await fetchAndApplyOrgConfig();
      setIsReady(true); // Show the app now
    };

    handleInitialRedirect();
  }, []);

  //to force redirect to home screen on web
  // useEffect(() => {
  //   if (Platform.OS !== "web") return;
  //   const handleBack = (e: PopStateEvent) => {
  //     e.preventDefault();

  //     // Force user to stay on current route or redirect to home

  //     router.replace("/tab_bar_home/HomeScreen"); // or any route
  //   };

  //   window.addEventListener("popstate", handleBack);

  //   return () => {
  //     window.removeEventListener("popstate", handleBack);
  //   };
  // }, []);

  // The Stack below must mount on the very first render so Expo Router has a
  // navigator ready before any router.replace() call (fired from the
  // effects above) resolves — otherwise it throws "Attempted to navigate
  // before mounting the Root Layout component". So we always render the
  // Stack and overlay the splash UI on top instead of early-returning it.
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationTypeForReplace: "push",
            animationDuration: 250,
          }}
        >
          <Stack.Screen
            name="patient/register_new_patient"
            options={{ presentation: "transparentModal", headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
        {(!loaded || !isReady) && (
          <View style={styles.splashContainer}>
            <Image
              source={require("@/assets/images/splash_bg.png")}
              style={styles.topBg}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/images/splash_bg.png")}
              style={styles.bottomBg}
              resizeMode="contain"
            />
            <View style={styles.centerContent}>
              <Image
                source={logoSource}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0177C8" />
              </View>
            </View>
          </View>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

const { width: screenWidth } = Dimensions.get("window");
const bgSize = screenWidth * 0.9;

const styles = StyleSheet.create({
  splashContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  topBg: {
    position: "absolute",
    top: 0,
    right: 0,
    width: bgSize,
    height: bgSize,
    opacity: 0.2,
  },
  bottomBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: bgSize,
    height: bgSize,
    transform: [{ rotate: "180deg" }],
    opacity: 0.2,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  logo: {
    width: screenWidth * 0.8,
    maxWidth: 280,
    aspectRatio: 4,
    height: 70,
    backgroundColor: "transparent",
  },
  loaderContainer: {
    marginTop: 16,
  },
});
