import React from "react";
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import { useOrgLogo } from "./hooks/useOrgLogo";

// Passive splash shown on the index route ("/") during cold start.
//
// All startup work — suggestus session init, org config fetch, and the
// auth-gated redirect to Home/Login — lives in app/_layout.tsx (RootLayout)
// as the single source of truth. Doing it here as well previously caused two
// competing router.replace() calls (one from RootLayout, one from here after
// a 1s timeout) and a visible double reload, plus suggestus initializing
// twice. So this screen now only renders the splash and lets RootLayout
// navigate away.
export default function IndexRedirect() {
  const logoSource = useOrgLogo();

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
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0177C8" />
        </View>
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
  loaderContainer: {
    marginTop: 16,
  },
});
