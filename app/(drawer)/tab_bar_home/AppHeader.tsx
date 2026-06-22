import React, { useState, useEffect } from "react";
import {
  ImageBackground,
  SafeAreaView,
  Platform,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface AppHeaderProps {
  handleMenuPress: () => void;
}

export default function AppHeader({ handleMenuPress }: AppHeaderProps) {
  const navigation = useNavigation();
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      const updateScreenWidth = () => {
        setScreenWidth(Dimensions.get("window").width);
      };

      const subscription = Dimensions.addEventListener(
        "change",
        updateScreenWidth
      );
      return () => subscription?.remove();
    }
  }, []);

  return (
    <ImageBackground
      source={
        Platform.OS === "web" && screenWidth >= 1024
          ? undefined
          : require("@/assets/images/dashboard_bg_top.png")
      }
      style={[
        styles.topBackground,
        Platform.OS === "web" &&
          screenWidth >= 1024 && { backgroundColor: "#262626" },
      ]}
      resizeMode="cover"
    >
      {!(Platform.OS === "web" && screenWidth >= 1024) && (
        <Image
          source={
            Platform.OS === "web" && screenWidth >= 1024
              ? undefined
              : require("@/assets/images/dashboard_bg_top.png")
          }
          resizeMode="cover"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
          }}
        />
      )}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          {/* Center: App Title */}
          <Text style={styles.appTitle}>OnMood9</Text>
          {/* Left: Hamburger */}
          <TouchableOpacity
            onPress={handleMenuPress}
            accessible={true}
            accessibilityLabel="Menu"
            style={styles.hamburgerBtn}
          >
            <Svg width={27} height={18} viewBox="0 0 27 18" fill="none">
              <Path
                d="M20.25 1.28571C20.25 0.575658 19.6456 0 18.9 0H1.35C0.604442 0 0 0.575658 0 1.28571C0 1.99577 0.604442 2.57143 1.35 2.57143H18.9C19.6456 2.57143 20.25 1.99572 20.25 1.28571ZM1.35 7.71429H25.65C26.3956 7.71429 27 8.28999 27 9C27 9.71006 26.3956 10.2857 25.65 10.2857H1.35C0.604442 10.2857 0 9.71006 0 9C0 8.28999 0.604442 7.71429 1.35 7.71429ZM1.35 15.4286H13.5C14.2455 15.4286 14.85 16.0042 14.85 16.7143C14.85 17.4243 14.2455 18 13.5 18H1.35C0.604442 18 0 17.4243 0 16.7143C0 16.0042 0.604442 15.4286 1.35 15.4286Z"
                fill="white"
              />
            </Svg>
          </TouchableOpacity>

          {/* Right: Crown, Search, Notification */}
          <View style={styles.headerIconsRight}>
            {/* <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("plans/PlansScreen")}>
          <Image
              source={require("@/assets/images/crown.png")}
              style={styles.crownIcon}
            />
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate("search/SearchScreen")}
            >
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
            </TouchableOpacity> */}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  appTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    zIndex: 0,
    top: 0,
    bottom: 0,
    textAlignVertical: "center",
    lineHeight: 56,
  },
  topBackground: {
    backgroundColor: "#8B4CFC",
    width: "100%",
    height: Platform.OS === "web" ? 55 : Platform.OS === "ios" ? 95 : 85,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 8,
  },
  hamburgerBtn: {
    padding: 0,
    marginRight: 10,
  },
  headerIconsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownIcon: {
    width: 30,
    height: 20,
    resizeMode: "contain",
  },
  headerIconBtn: {
    marginLeft: 18,
    paddingRight: 18,
    padding: 0,
  },
});
