import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeSuggestus,
  createSuggestusSession,
} from "../suggestus_plugin/suggestusClient";
import { IS_LOGGED_IN } from "../config/config";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";

export default function SplashScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [sessionError, setSessionError] = useState(false);

  const init = async () => {
    try {
      setSessionError(false);
      setLoading(true);

      // Step 1: Create Suggestus session (footprint + session token)
      setLoadingText("Creating session...");
      const sessionResult = await initializeSuggestus();
      console.log("sessionResult:>>", sessionResult);
      if (!sessionResult?.returnCode) {
        // Retry once with session-only call (footprint may already exist)
        setLoadingText("Retrying session...");
        const retryResult = await createSuggestusSession();
        if (!retryResult?.returnCode) {
          setSessionError(true);
          setLoadingText("Could not connect. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Step 2: Check persistent login
      setLoadingText("Loading...");
      const isLoggedIn = await AsyncStorage.getItem(IS_LOGGED_IN);
      setLoading(false);

      if (isLoggedIn === "true") {
        router.replace("/tab_bar_home/HomeScreen");
      } else {
        router.replace("/init_screens/login");
      }
    } catch (error) {
      setSessionError(true);
      setLoadingText("Something went wrong.");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(":>>", 111111);
    init();
  }, []);

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
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* <Text style={styles.title}>Emirates Hospital</Text> */}
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0177C8" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}
        {sessionError && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{loadingText}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={init}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
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
  },
  bottomBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: bgSize,
    height: bgSize,
    transform: [{ rotate: "180deg" }],
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
    fontWeight: "bold",
    color: "#232323",
    textAlign: "center",
  },
  loaderContainer: {
    marginTop: 32,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#F0F6FC",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: "#0177C8",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  errorContainer: {
    marginTop: 32,
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#D9534F",
    fontWeight: "500",
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: "#0177C8",
  },
  retryText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
});
