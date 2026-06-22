import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SiteConfig } from "../config/site_config";
import { BLOGS_SUB_URL } from "../config/config";
import { ImageBackground } from "react-native";
import Svg, { Path } from "react-native-svg";
import RenderHtml from "react-native-render-html";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const { width } = Dimensions.get("window");

const BlogsScreen = () => {
  const navigation = useNavigation();
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

  const route = useRoute();
  const {
    title = "",
    image = "",
    html_content = "",
    author = "Onmood9 Team",
  } = route.params || {};

  // Construct image URL
  let imageUrl = image;
  if (image && !image.startsWith("http")) {
    imageUrl = SiteConfig.on_mood9_ASSETS_URL + BLOGS_SUB_URL + image;
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
        <CustomTopHeader title="Back" />
        <View style={styles.safeArea}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {imageUrl ? (
              <ImageBackground
                source={{ uri: imageUrl }}
                style={[
                  styles.coverImage,
                  Platform.OS === "web" && screenWidth >= 1024
                    ? { height: 500 }
                    : {},
                ]}
                imageStyle={{ borderRadius: 14 }}
                resizeMode="cover"
              />
            ) : null}
            <Text style={styles.title}>{title}</Text>
            <View style={styles.authorRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 12c2.7 0 4.5-1.8 4.5-4.5S14.7 3 12 3 7.5 4.8 7.5 7.5 9.3 12 12 12zm0 1.5c-3 0-9 1.5-9 4.5V21h18v-3c0-3-6-4.5-9-4.5z"
                  fill="#8B4CFC"
                />
              </Svg>
              <Text style={styles.authorText}>{author}</Text>
            </View>
            <View style={styles.htmlContainer}>
              <RenderHtml
                contentWidth={width - 32}
                source={{ html: html_content || "" }}
                tagsStyles={htmlStyles}
              />
            </View>
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

const htmlStyles = {
  p: { fontSize: 16, color: "#333", marginBottom: 12, lineHeight: 22 },
  strong: { fontWeight: "bold" },
  span: { fontSize: 16, color: "#333" },
  h1: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  h2: { fontSize: 20, fontWeight: "bold", marginBottom: 14 },
  h3: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  containerNew: { flex: 1 },
  safeArea: {
    flex: 1,
    // backgroundColor: '#fff',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    zIndex: 2,
    width: "100%",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandSemiBold",
    width: "100%",
    textAlign: "center",
  },
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  coverImage: {
    width: "100%",
    height: width * 0.55,
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 18,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    textAlign: "left",
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
    gap: 6,
  },
  authorText: {
    fontSize: 14,
    color: "#8B4CFC",
    fontFamily: "QuicksandMedium",
    marginLeft: 5,
  },
  htmlContainer: {
    marginTop: 4,
    paddingBottom: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    borderRadius: 10,
  },
});

export default BlogsScreen;
