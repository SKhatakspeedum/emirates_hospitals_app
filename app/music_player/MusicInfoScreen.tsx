import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SiteConfig } from "../config/site_config";
import { COURSES_SUB_URL } from "../config/config";
import RenderHtml from "react-native-render-html";
import Svg, { Path } from "react-native-svg";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const { width, height } = Dimensions.get("window");

interface MusicInfoItem {
  id: string;
  title: string;
  image: string | null;
  description: string;
}

const MusicInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [info, setInfo] = useState<MusicInfoItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    // Get data from route params
    const params = route.params as any;

    // Check for nested params structure (common in nested navigators)
    const itemData = params?.params?.itemData || params?.itemData;
    if (itemData) {
      setInfo({
        id: itemData.id || "default",
        title: itemData.title || "Meditation Track",
        image: itemData.image,
        description: itemData.description || "No description available.",
      });
    } else {
      // Fallback data if no params provided
      setInfo(null);
    }

    setIsLoading(false);
  }, [route.params]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4CFC" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <ImageBackground
        source={require("@/assets/images/internal_screen_bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Top Header for screen */}
        <CustomTopHeader title="Back" />
        <View style={[styles.container,
              Platform.OS === "web" && screenWidth >= 1024 ? { paddingHorizontal:116 } : null
        ]}>
          {/* Main Image */}
          <View
            style={[
              styles.imageWrapper,
              Platform.OS === "web" && screenWidth >= 1024 ? { height: 300, width: 650 } : null,
            ]}
          >
            <Image
              source={
                info?.image
                  ? { uri: info.image }
                  : require("@/assets/images/music_place_holder.png")
              }
              style={[styles.mainImage, Platform.OS === "web" && screenWidth >= 1024 ? { height: 300 } : null]}
              onError={() => console.log("Image loading error")}
            />
          </View>
          {/* Content Section */}
          <ScrollView
            style={[
              styles.contentScroll 
            ]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Render HTML content */}
            {info?.description ? (
              <RenderHtml
                contentWidth={width - 48}
                source={{ html: info.description }}
                tagsStyles={{
                  p: {
                    color: "#6B7A99",
                    fontSize: 16,
                    lineHeight: 24,
                    marginBottom: 16,
                  },
                  h1: {
                    color: "#222B45",
                    fontSize: 20,
                    fontWeight: "bold",
                    marginBottom: 12,
                    marginTop: 16,
                  },
                  h2: {
                    color: "#222B45",
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 10,
                    marginTop: 14,
                  },
                  h3: {
                    color: "#222B45",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginBottom: 8,
                    marginTop: 12,
                  },
                  li: {
                    color: "#6B7A99",
                    fontSize: 16,
                    lineHeight: 24,
                    marginBottom: 8,
                  },
                  ul: { paddingLeft: 16, marginBottom: 16 },
                  ol: { paddingLeft: 16, marginBottom: 16 },
                  strong: { fontWeight: "bold" },
                  em: { fontStyle: "italic" },
                }}
              />
            ) : (
              <Text style={styles.description}>No description available.</Text>
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );

  if (Platform.OS === "web" && screenWidth >= 1024) {
    return (
      <ImageBackground
        source={require("../../assets/images/background_new_web.png")}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        {mainContent}
      </ImageBackground>
    );
  }
  return mainContent;
};

const styles = StyleSheet.create({
  containerNew: { flex: 1 },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    // backgroundColor: '#F6F7FA',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 12,
    paddingHorizontal: 0,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
    marginBottom: 20,
  },
  headerBtn: {
    padding: 0,
    marginRight: 2,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: "#222B45",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandRegular",
  },
  imageWrapper: {
    width: "100%",
    height: 220,
    borderRadius: 32,
    backgroundColor: "#E9EEF7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 22,
    shadowColor: "#BFD5F7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  mainImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    resizeMode: "cover",
  },
  contentScroll: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 0,
  },
  contentContainer: {
    paddingBottom: 40,
    paddingHorizontal: 0,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontFamily: "QuicksandRegular",
    color: "#262626",
    marginBottom: 6,
    textAlign: "left",
  },
  description: {
    fontSize: 16,
    color: "#262626",
    textAlign: "left",
    fontFamily: "QuicksandRegular",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
    color: "#6B7A99",
    fontSize: 18,
    marginTop: 16,
  },
});

export default MusicInfoScreen;
