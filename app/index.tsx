import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeSuggestus } from "./suggestus_plugin/suggestusClient";
import { IS_LOGGED_IN } from "./config/config";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import useResponsiveHorizontalMargin from "./hooks/useResponsiveHorizontalMargin";


export default function IndexRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const horizontalMargin = useResponsiveHorizontalMargin();
  
  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0
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
      await initializeSuggestus();
      // Check persistent login
      setTimeout(async () => {
        const isLoggedIn = await AsyncStorage.getItem(IS_LOGGED_IN);
        setLoading(false);
        if (isLoggedIn === "true") {
          router.replace("/tab_bar_home/HomeScreen");
        } else {
          router.replace("/init_screens/login");
        }
      }, 1000);
    };
    init();
  }, [router]);
  // return <Redirect href="/init_screens/splash" />;
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/splash_bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.centerContent}>
          <Image
            source={require("@/assets/images/splash_icon.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>OnMood9</Text>
          {loading && (
            <ActivityIndicator
              size="large"
              color="#000"
              style={styles.loader}
            />
          )}
        </View>
      </ImageBackground>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
    borderRadius: 32,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontFamily: 'QuicksandBold',
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 16,
    textAlign: 'center',
  },
});
