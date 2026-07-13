import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeSuggestus } from "./suggestus_plugin/suggestusClient";
import { IS_LOGGED_IN } from "./config/config";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import useResponsiveHorizontalMargin from "./hooks/useResponsiveHorizontalMargin";
import { useOrgLogo } from "./hooks/useOrgLogo";

export default function IndexRedirect() {
  const router = useRouter();
  const logoSource = useOrgLogo();
  const [loading, setLoading] = useState(true);
  const horizontalMargin = useResponsiveHorizontalMargin();

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0,
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  /// This use effect will init th suggestus in application
  useEffect(() => {
    const init = async () => {
      try {
        await initializeSuggestus();
      } catch (err) {
        console.error("[IndexRedirect] Error in initializeSuggestus():", err);
      }

      // Check persistent login
      setTimeout(async () => {
        try {
          const isLoggedIn = await AsyncStorage.getItem(IS_LOGGED_IN);
          setLoading(false);
          if (isLoggedIn === "true") {
            router.replace("/tab_bar_home/HomeScreen");
          } else {
            router.replace("/init_screens/login");
          }
        } catch (err) {
          console.error(
            "[IndexRedirect] Error fetching stored login state:",
            err,
          );
        }
      }, 1000);
    };
    init();
  }, [router]);
  // return <Redirect href="/init_screens/splash" />;
  return (
    <View style={styles.container}>
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

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0177C8" />
          </View>
        )}
      </View>
      <Toast />
    </View>
  );
}

const { width: screenWidth } = Dimensions.get("window");
const bgSize = screenWidth * 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  logo: {
    width: "80%",
    maxWidth: 280,
    aspectRatio: 4,
    height: 70,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontFamily: "QuicksandBold",
    fontWeight: "bold",
    color: "#232323",
    marginBottom: 16,
    textAlign: "center",
  },
  loaderContainer: {
    marginTop: 16,
  },
});
