import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ImageBackground,
  Modal,
  Image,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { Video } from "expo-av";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SiteConfig } from "@/app/config/site_config";
import {
  COURSES_SUB_URL,
  RELATED_VIDEO_URL,
  SPD_USER_SUBSCRIPTION,
} from "@/app/config/config";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

// Placeholder assets
const videoPlaceholder = require("@/assets/images/explore_banner_thumb.png");
const candleFlower = require("@/assets/images/candle_flower.png");
const rule333 = require("@/assets/images/333_rule.png");
const breathingExercise = require("@/assets/images/breathing_exercise.png");
const morningStretch = require("@/assets/images/morning_stretch.png");

const PURPLE = "#8A4FFF";
const DARK_OVERLAY = "rgba(0,0,0,0.38)";
const GRADIENT_OVERLAY = "rgba(0,0,0,0.30)";
const SCREEN_WIDTH = 375;
const THUMB_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;
const THUMB_HEIGHT = 190;
// Responsive video height
let VIDEO_HEIGHT = 208;
const BORDER_RADIUS = 10;

const ExploreDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const itemData = route?.params?.itemData;
  const [readMore, setReadMore] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const horizontalMargin = useResponsiveHorizontalMargin();
  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0,
  );

  if (Platform.OS === "web" && screenWidth >= 1024) {
    VIDEO_HEIGHT = 350;
  }

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  // Process modules on mount
  useEffect(() => {
    if (!itemData?.data_category_group_module) return;
    let parsedData: any[] = [];
    try {
      parsedData =
        typeof itemData.data_category_group_module === "string"
          ? JSON.parse(itemData.data_category_group_module)
          : itemData.data_category_group_module;
    } catch (e) {
      setError("Invalid module data");
      setCategoryGroups([]);
      return;
    }
    // Group modules by group_id
    try {
      const uniqueGroups = new Map<string, any>();
      parsedData.forEach((item) => {
        if (!uniqueGroups.has(item.group_id)) {
          uniqueGroups.set(item.group_id, {
            id: item.group_id,
            group_id: item.group_id,
            group_name: item.group_name,
            group_code: item.group_code || "",
            group_description: item.group_description || "",
            modules: [],
          });
        }
        // Parse session_json_data if needed
        let sessionData = null;
        try {
          if (item.session_json_data) {
            sessionData =
              typeof item.session_json_data === "string"
                ? JSON.parse(item.session_json_data)
                : item.session_json_data;
          }
        } catch (error) {
          sessionData = null;
        }
        // Add module to group
        const group = uniqueGroups.get(item.group_id);
        if (group) {
          group.modules.push({
            ...item,
            session_json_data: sessionData,
            premium: item.is_paid === "paid",
          });
        }
      });
      const sortedGroups = Array.from(uniqueGroups.values()).sort((a, b) =>
        a.group_name.localeCompare(b.group_name),
      );
      setCategoryGroups(sortedGroups);
      setError(null);
    } catch (err) {
      setError("Error processing data");
      setCategoryGroups([]);
    }
  }, [itemData]);

  // Handle module item press
  const handleModulePress = async (item: ModuleItem) => {
    let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
    if (item.premium && subscription_status === "false") {
      Toast.show({
        type: "info",
        text1: "You need to buy paid membership to view the content.",
      });
      return;
    }
    // Check if session_json_data exists and parse it if it's a string
    let sessionData = null;
    try {
      if (item.session_json_data) {
        sessionData =
          typeof item.session_json_data === "string"
            ? JSON.parse(item.session_json_data)
            : item.session_json_data;
      }
    } catch (error) {
      console.error("Error parsing session_json_data:", error);
      // If parsing fails, treat as null
      sessionData = null;
    }

    // Check if sessionData is an array and its length
    if (sessionData && Array.isArray(sessionData) && sessionData.length > 1) {
      // For now, navigate with the first session
      navigation.navigate("music_player/MusicPlayerScreen", {
        itemData: item,
        sessionData: sessionData[0],
      });
    } else {
      // If array length is 0 or 1, or if it's not an array, navigate to MusicPlayerScreen

      navigation.navigate("music_player/MusicPlayerScreen", {
        itemData: item,
        sessionData:
          sessionData && Array.isArray(sessionData) && sessionData.length === 1
            ? sessionData[0]
            : sessionData,
      });
    }
  };

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
        {/* Video Modal */}
        {itemData?.lib_audio_video_file ? (
          <Modal
            visible={videoVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setVideoVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.85)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={[
                  {
                    backgroundColor: "#222",
                    borderRadius: 14,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  Platform.OS === "web" && screenWidth >= 1024
                    ? { width: 800, height: 500 }
                    : { width: "90%", height: 260 },
                ]}
              >
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: 16,
                    padding: 2,
                  }}
                  onPress={() => setVideoVisible(false)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                {Platform.OS === "web" && screenWidth >= 1024 ? (
                  <video
                    src={
                      SiteConfig.on_mood9_ASSETS_URL +
                      RELATED_VIDEO_URL +
                      itemData.lib_audio_video_file
                    }
                    controls
                    style={{
                      width: 700,
                      height: 350,
                      borderRadius: 10,
                      backgroundColor: "#000",
                      marginTop: 30,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Video
                    source={{
                      uri:
                        SiteConfig.on_mood9_ASSETS_URL +
                        RELATED_VIDEO_URL +
                        itemData.lib_audio_video_file,
                    }}
                    style={{
                      width: "100%",
                      height: 220,
                      borderRadius: 10,
                      backgroundColor: "#000",
                      marginTop: 30,
                    }}
                    controls
                    resizeMode="contain"
                    fullscreen
                    useNativeControls
                  />
                )}
              </View>
            </View>
          </Modal>
        ) : null}

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* <View style={styles.divider} /> */}
          {/* Video Section */}
          {itemData?.lib_audio_video_file ? (
            <View
              style={[
                styles.videoSection,
                ,
                Platform.OS === "web" && screenWidth >= 1024
                  ? { paddingHorizontal: 116 }
                  : null,
              ]}
            >
              <TouchableOpacity onPress={() => setVideoVisible(true)}>
                {(() => {
                  // Debug: log the image URL
                  const thumbSource = itemData?.lib_video_thumb_image
                    ? {
                        uri: itemData.lib_video_thumb_image.startsWith("http")
                          ? itemData.lib_video_thumb_image
                          : SiteConfig.on_mood9_ASSETS_URL +
                            COURSES_SUB_URL +
                            itemData.lib_video_thumb_image,
                      }
                    : require("@/assets/images/explore_banner_thumb.png");
                  return (
                    <ImageBackground
                      source={thumbSource}
                      style={{
                        ...styles.videoThumb,
                        width: "100%",
                        height: VIDEO_HEIGHT,
                      }}
                      imageStyle={{ borderRadius: 10 }}
                      resizeMode="cover"
                    >
                      <View style={styles.playBtnWrapper}>
                        <Ionicons name="play" size={24} color="#fff" />
                      </View>
                    </ImageBackground>
                  );
                })()}
              </TouchableOpacity>
              <Text style={styles.videoTitle}>{itemData?.name}</Text>
              <Text style={styles.videoDesc} numberOfLines={readMore ? 10 : 2}>
                {itemData?.description}
              </Text>
              <TouchableOpacity onPress={() => setReadMore(!readMore)}>
                <Text style={styles.readMore}>
                  {readMore ? "Read less" : "Read more"}
                </Text>
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
          ) : null}

          {/* Grouped Modules */}
          {error ? (
            <Text style={{ color: "red", margin: 16 }}>{error}</Text>
          ) : categoryGroups.length === 0 ? (
            <Text style={{ color: "#999", margin: 16 }}>No modules found.</Text>
          ) : (
            categoryGroups.map((group) => (
              <View
                key={group.group_id}
                style={[
                  styles.sectionBlock,
                  Platform.OS === "web" && screenWidth >= 1024
                    ? { paddingHorizontal: 116 }
                    : null,
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{group.group_name}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardRow}
                >
                  {group.modules.map((module: any, idx: number) => (
                    <Pressable
                      key={
                        module.module_id ||
                        module.id ||
                        `${module.module_name}_${idx}`
                      }
                      style={styles.card}
                      android_ripple={{ color: "#e0e0e0" }}
                      onPress={() => handleModulePress(module)}
                    >
                      <ImageBackground
                        source={
                          module.module_image
                            ? {
                                uri:
                                  SiteConfig.on_mood9_ASSETS_URL +
                                  COURSES_SUB_URL +
                                  module.module_image,
                              }
                            : ""
                        }
                        style={styles.cardThumb}
                        imageStyle={{ borderRadius: 10 }}
                        resizeMode="cover"
                      >
                        <View style={styles.cardGradient} />
                        {module.premium && (
                          <View style={styles.crownOverlay}>
                            <MaterialCommunityIcons
                              name="crown"
                              size={20}
                              color="#FFD700"
                            />
                          </View>
                        )}
                        <Text style={styles.cardText}>
                          {module.module_name}
                        </Text>
                      </ImageBackground>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ))
          )}
        </ScrollView>
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
  crownOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 24,
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
    zIndex: 2,
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    zIndex: 2,
    width: "100%",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  backBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    width: "100%",
    textAlign: "center",
    flex: 1,
  },
  videoSection: { marginBottom: 16 },
  videoThumbWrapper: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    width: "100%",
    height: VIDEO_HEIGHT,
    marginBottom: 12,
    position: "relative",
    backgroundColor: "#EAEAEA",
  },
  videoThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: BORDER_RADIUS,
  },
  playBtnWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -28 }, { translateY: -28 }],
    backgroundColor: "#ffffff45",
    borderRadius: 56,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 2,
    marginTop: 15,
  },
  videoDesc: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandRegular",
    marginBottom: 2,
    lineHeight: 20,
  },
  readMore: {
    color: "#8B4CFC",
    fontSize: 14,
    fontFamily: "QuicksandRegular",
    textDecorationLine: "underline",
    marginTop: 2,
  },
  sectionBlock: { marginTop: 12, marginBottom: 10 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#8B4CFC",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#EAEAEA",
    position: "relative",
    elevation: 2,
  },
  cardThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: BORDER_RADIUS,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GRADIENT_OVERLAY,
    borderRadius: BORDER_RADIUS,
  },
  cardText: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default ExploreDetailScreen;
