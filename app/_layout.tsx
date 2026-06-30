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
import {
  IS_LOGGED_IN,
  SPD_ORG_ID,
  SPD_AI_CODE,
  SPD_ORG_LOGO,
  SPD_ORG_WEBSITE_URL,
  SPD_INITPAGE_STEPS,
  SPD_ORG_LANGUAGE_CODE,
} from "./config/config";
import { setEncryptedID } from "./suggestus_plugin/util/util_functions";
import { useRouter } from "expo-router";
import { View, Platform } from "react-native";
import { callSuggestusAPI } from "./suggestus_plugin/suggestusClient";
import { spd_processId_config } from "./config/process_id";
import { SiteConfig } from "./config/site_config";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts(Fonts);
  const [isReady, setIsReady] = useState(false);

  console.log(
    "[RootLayout] rendering. loaded:",
    loaded,
    "isReady:",
    isReady,
    "error:",
    error,
  );

  useEffect(() => {
    console.log("[RootLayout] loaded changed:", loaded);
    if (loaded) {
      SplashScreen.hideAsync().catch((err) =>
        console.error("[RootLayout] SplashScreen.hideAsync error:", err),
      );
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
  //     console.log("[RootLayout] setting isReady to true");
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

  useEffect(() => {
    const handleInitialRedirect = async () => {
      try {
        const res = await callSuggestusAPI(
          spd_processId_config.sgconf_get_mst_organization_by_org_patient_portal_url,
          {
            p_org_ai_code: SiteConfig.AI_CODE,
            p_org_patient_portal_url: SiteConfig.ACTION_URL,
          },
        );

        console.log("[RootLayout] org config fetched:", res);

        if (res?.returnCode === true && res?.returnData?.length > 0) {
          const final_org_data = res.returnData[0];

          // ── Basic org fields ──────────────────────────────────────────
          const org_ai_code = final_org_data?.org_ai_code;
          const org_profile_image = final_org_data?.org_profile_image;
          const org_name = final_org_data?.org_name;
          const org_website_url = final_org_data?.org_website;
          const org_id = final_org_data?.org_id;

          await setEncryptedID(SPD_ORG_LOGO, org_profile_image || null);
          await setEncryptedID(SPD_ORG_WEBSITE_URL, org_website_url || null);
          await setEncryptedID(SPD_AI_CODE, org_ai_code || null);
          await setEncryptedID("sg_org_name", org_name || null);

          // sg_org_id is the key read by createUserdata() in util_functions.js
          if (org_id) {
            await setEncryptedID(SPD_ORG_ID, org_id);
          }

          // ── Parse nested org detail JSON ──────────────────────────────
          let responseData: Record<string, any> = {};
          try {
            responseData =
              typeof final_org_data?.p_org_detail_json === "string"
                ? JSON.parse(final_org_data.p_org_detail_json)
                : final_org_data?.p_org_detail_json || {};
          } catch (parseError) {
            console.error(
              "[RootLayout] Error parsing p_org_detail_json:",
              parseError,
            );
            responseData = {};
          }

          // ── Signup / EULA config ──────────────────────────────────────
          const eulaConfig = responseData?.spd_signup_eula_config;
          await setEncryptedID(
            SPD_INITPAGE_STEPS,
            eulaConfig && eulaConfig.length !== 0
              ? JSON.stringify(eulaConfig)
              : null,
          );

          // ── Language code ─────────────────────────────────────────────
          await setEncryptedID(
            SPD_ORG_LANGUAGE_CODE,
            responseData?.spd_theme_setting_config?.language || null,
          );

          // ── Color palette (theme-aware) ───────────────────────────────
          const colorPalette = {
            primary: responseData?.spd_theme_setting_config?.primary_color,
            secondary: responseData?.spd_theme_setting_config?.secondary_color,
            ui_border: responseData?.spd_theme_setting_config?.ui_border,
            ui_theme_base:
              responseData?.spd_theme_setting_config?.ui_theme_base,
          };

          if (responseData?.spd_theme_setting_config?.theme !== "DARK") {
            await setEncryptedID("color_palette", colorPalette);
          } else {
            await setEncryptedID("dark_color_palette", colorPalette);
          }

          // ── Terms & Conditions ────────────────────────────────────────
          await setEncryptedID(
            "TERM_CONDITION",
            final_org_data?.terms_conditions || null,
          );

          // ── Full org config JSON (used by login page config etc.) ─────
          await setEncryptedID("DEFAULT_JSON_DATA", responseData);

          console.log("[RootLayout] org config stored. org_id:", org_id, "ai_code:", org_ai_code);
        } else {
          console.warn(
            "[RootLayout] org config fetch failed or empty:",
            res?.message || res?.msg,
          );
        }
      } catch (error) {
        console.error("[RootLayout] Error fetching org config:", error);
      }

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
