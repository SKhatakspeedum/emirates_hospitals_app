import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { useOrgLogo } from "./hooks/useOrgLogo";

// This screen is the initial route mounted by the root Stack. All startup
// logic (Suggestus init, auth check, org config fetch, and the eventual
// router.replace() to Home/Login) lives solely in app/_layout.tsx, which
// overlays its own splash UI on top of this screen while it runs. Do NOT
// add navigation or async init logic here — a second router.replace() firing
// from this screen at the same time as the one in _layout.tsx caused a race
// that crashed navigation on native ("Attempted to navigate before mounting
// the Root Layout component").
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
        <Image
          source={logoSource}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
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
});
