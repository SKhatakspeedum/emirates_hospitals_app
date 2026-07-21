import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { COURSES_SUB_URL, SPD_USER_SUBSCRIPTION } from "../config/config";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MasonryList from "@react-native-seoul/masonry-list";
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const CARD_RADIUS = 10;

// Define interfaces for data types
interface MusicGroup {
  id: string;
  group_id: string;
  group_name: string;
  group_code?: string;
  group_description?: string;
  group_image?: string;
  premium?: boolean;
  modules?: MusicModule[];
  [key: string]: any;
}

interface MusicModule {
  module_id: string;
  module_name: string;
  module_description?: string;
  long_description?: string;
  module_image?: string;
  premium?: boolean;
  session_json_data?: string;
  [key: string]: any;
}

const MusicScreen = () => {
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : Dimensions.get("window").width
      : Dimensions.get("window").width
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      const updateScreenWidth = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", updateScreenWidth);
      return () => window.removeEventListener("resize", updateScreenWidth);
    } else {
      const subscription = Dimensions.addEventListener("change", ({ window }) => {
        setScreenWidth(window.width);
      });
      return () => subscription?.remove();
    }
  }, []);

  const navigation = useNavigation<any>();
  // State variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [musicGroups, setMusicGroups] = useState<MusicGroup[]>([]);
  // Recently Played: dynamic
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] =
    useState<boolean>(true);
  const [recentlyPlayedError, setRecentlyPlayedError] = useState<string | null>(
    null
  );

  // Fetch recently played on mount
// Inside your component:
useFocusEffect(
  React.useCallback(() => {
    fetchRecentlyPlayed();
  }, [])
);

  // Fetch music data from API on component mount
  useEffect(() => {
    fetchMusicData();
  }, []);

  // Function to fetch music data from API
  const fetchMusicData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
        { p_category_code: "MUSIC" }
      );

      if (response?.returnCode === true && response.returnData) {
        if (response.returnData && response.returnData.length > 0) {
          let musicData = response.returnData[0].data_category_group_module;

          if (musicData && musicData.length > 0) {
            let parsedData;
            try {
              parsedData = JSON.parse(musicData);
              processApiData(parsedData);
            } catch (parseError) {
              console.error("Error parsing JSON data:", parseError);
              setError("Failed to parse data from server");
            }
          } else {
            setError("No music data available");
          }
        }
      } else {
        setError("No data available. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching music data:", err);
      setError(
        "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentlyPlayed = async () => {
    setRecentlyPlayedLoading(true);
    setRecentlyPlayedError(null);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_recent_played_wrapper,
        { p_category_code: "MUSIC" }
      );
      if (
        response?.returnCode === true &&
        response.returnData &&
        response.returnData.length > 0
      ) {
        let all: any[] = [];
        response.returnData.forEach((it: any) => {
          if (it.data_category_group_module) {
            try {
              const parsed = JSON.parse(it.data_category_group_module);
              all = all.concat(parsed);
            } catch {}
          }
        });
        setRecentlyPlayed(all.slice(0, 10));
      } else {
        setRecentlyPlayed([]);
      }
    } catch (err) {
      console.error("Error fetching recently played:", err);
      setRecentlyPlayedError("Failed to load recently played");
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  };
  // Process the API data to structure music groups
  const processApiData = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      setError("No data available");
      return;
    }

    try {
      // Group modules by group_id
      const uniqueGroups = new Map<string, MusicGroup>();

      data.forEach((item) => {
        if (!uniqueGroups.has(item.group_id)) {
          uniqueGroups.set(item.group_id, {
            id: item.group_id,
            group_id: item.group_id,
            group_name: item.group_name,
            group_code: item.group_code || "",
            group_description: item.group_description || "",
            group_image: item.group_image || null,
            premium: item.is_paid === 'paid',
            modules: [],
          });
        }

        // Add module to the appropriate group
        const group = uniqueGroups.get(item.group_id);
        if (group && group.modules) {
          group.modules.push({
            module_id: item.module_id,
            module_name: item.module_name,
            module_description: item.module_description || "",
            long_description: item.long_description || "",
            module_image: item.module_image || null,
            premium: item.is_paid === 'paid',
            session_json_data: item.session_json_data || null,
            ...item,
          });
        }
      });

      // Convert map to array and sort by group name
      const sortedGroups = Array.from(uniqueGroups.values()).sort((a, b) =>
        a.group_name.localeCompare(b.group_name)
      );
      setMusicGroups(sortedGroups);
    } catch (err) {
      console.error("Error processing API data:", err);
      setError("Error processing data. Please try again.");
    }
  };

  // Placeholder: handle play and navigation
  const handlePlay = (item: any) =>{ 
    navigation.navigate("music_player/MusicPlayerScreen", {
      itemData: item,
      sessionData: item.session_json_data?.[0] || null,
    });
  }
  // Handle navigation to MusicCategoryScreen with group data
  const handleGroup = async (item: MusicGroup) => {
    let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
    if (item.premium && subscription_status === "false") {
      Toast.show({
        type: 'info',
        text1: 'You need to buy paid membership to view the content.'
      });
      return;
    }
    navigation.navigate("music_tab/MusicCategoryScreen", {
      groupData: item,
    });
  };

  // Render Recently Played card
  const renderRecent = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recentCard}
      onPress={() => handlePlay(item)}
    >
      <Image source={{ uri: SiteConfig.on_mood9_ASSETS_URL +
                    COURSES_SUB_URL +item.module_image }} style={styles.recentImg} />
      <View style={styles.recentOverlay} />
            {/* <View style={styles.recentPlayIconWrap}>
              <FontAwesome name="play-circle" size={32} color="#fff" style={styles.recentPlayIcon} />
            </View> */}
      <View style={styles.recentPlayIconWrap}>
        <Ionicons
          name="play"
          style={{ marginRight: "-2px" }}
          size={18}
          color="#fff"
        />
      </View>
      <View style={styles.recentTextWrap}>
        <Text style={styles.recentTitle}>{item.module_name}</Text>
        {/* <Text style={styles.recentDuration}>{item.duration}</Text> */}
      </View>
    </TouchableOpacity>
  );
  let count = 0;
  // Render Music Group card
  const renderGroup = ({ item, i }: { item: MusicGroup; i: number }) => {
    count++;
    return (
      <TouchableOpacity
        style={[
          styles.groupCard,
          {
            height: count % 2 === 0 ? 250 : 150,
            marginLeft: i % 2 === 0 ? 0 : 0,
            marginRight: i % 2 === 0 ? 8 : 0,
          },
        ]}
        onPress={() => handleGroup(item)}
      >
        <Image
          source={
            item.group_image &&
            item.group_image !== "null" &&
            item.group_image !== "undefined" &&
            item.group_image !== "no_image.jpg"
              ? {
                  uri:
                    SiteConfig.on_mood9_ASSETS_URL +
                    COURSES_SUB_URL +
                    item.group_image,
                }
              : item.modules &&
                item.modules.length > 0 &&
                item.modules[0].module_image &&
                item.modules[0].module_image !== "null" &&
                item.modules[0].module_image !== "undefined"
              ? {
                  uri:
                    SiteConfig.on_mood9_ASSETS_URL +
                    COURSES_SUB_URL +
                    item.modules[0].module_image,
                }
              : require("@/assets/images/image_131.png") // Final fallback image
          }
          style={styles.groupImg}
        />
        <View style={styles.groupOverlay} />
        {item.premium && (
          <View style={styles.crownIcon}>
            <MaterialCommunityIcons
              name="crown"
              size={20}
              color="#FFD700"
            />
          </View>
        )}
                                 <View style={styles.imageOverlay}></View>
        <Text style={styles.groupTitle}>{item.group_name}</Text>
      </TouchableOpacity>
    );
  };
  return (
    <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView
          style={[
            { flex: 1 },
            Platform.OS === "web" && screenWidth >= 1024
              ? { marginLeft: "auto", marginRight: "auto", width: 1024 }
              : {},
          ]}
        >
          <ScrollView style={styles.container}>
          {/* Recently Played */}
          <Text style={styles.sectionLabel}>Recently played</Text>
          <View style={styles.recentListContainer}>
            {recentlyPlayedLoading ? (
              <View
                style={{
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color="#8B4CFC" />
              </View>
            ) : recentlyPlayedError ? (
              <View
                style={{
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "red" }}>{recentlyPlayedError}</Text>
              </View>
            ) : recentlyPlayed.length === 0 ? (
              <View
                style={{
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <Image
                  source={require('@/assets/images/assess.png')}
                  style={{ width: 60, height: 60, opacity: 0.7, marginRight: 16 }}
                  resizeMode="contain"
                />
                <View>
                  <Text style={{ fontSize: 16, color: '#8B4CFC', marginBottom: 4, fontFamily: 'QuicksandSemiBold' }}>
                    No recently played music
                  </Text>
                  <Text style={{ fontSize: 13, color: '#888', maxWidth: 200, fontFamily: 'QuicksandMedium' }}>
                    Start listening to relaxing music and they will appear here!
                  </Text>
                </View>
              </View>
            ) : (
              <FlatList
                data={recentlyPlayed}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, idx) =>
                  item.id ? item.id.toString() : idx.toString()
                }
                renderItem={renderRecent}
                contentContainerStyle={styles.recentList}
              />
            )}
          </View>
          <Text style={styles.sectionLabel}>Music groups</Text>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#8B4CFC" />
              <Text style={styles.loaderText}>Loading music groups...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchMusicData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{width: '100%', overflow: 'hidden'}}>
            <MasonryList
              data={musicGroups}
              numColumns={2}
              keyExtractor={(item) => item.group_id || item.id}
              renderItem={(item) => renderGroup(item)}
              contentContainerStyle={styles.groupsGrid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.noDataText}>No music groups available</Text>
              }
            />
            </View>
          )}
        </ScrollView>
        {/* Bottom Nav */}
      </SafeAreaView>
      <Toast />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  crownIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 2,
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
    paddingTop: 12,
    paddingLeft: 5,
    paddingRight: 5,
    // paddingHorizontal: 10,
    // backgroundColor: '#F6F7FA',
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 10,
    marginTop: 24,
  },
  topBarTitle: {
    fontSize: 18,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 8,
  },
  recentListContainer: {
    overflow: "visible", // Parent container must also allow overflow
    marginBottom: 0, // Add some spacing if needed
  },
  recentList: {
    marginBottom: 10,
  },
  recentCard: {
    width: 270,
    height: 125,
    borderRadius: CARD_RADIUS,
    marginRight: 14,
    overflow: "hidden",
    backgroundColor: "#C7C7C7",
    position: "relative",
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recentImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    borderRadius: CARD_RADIUS,
    resizeMode: "cover",
  },
  recentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: CARD_RADIUS,
  },
  recentPlayIconWrap: {
    backgroundColor: "#00000080",
    borderRadius: 32,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: '50%',
    transform: [
    { translateX: -20 }, // half of width
    { translateY: -20 }  // half of height
  ],
     shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    left: '50%',
    zIndex: 2,
  },
  recentPlayIcon: {
    alignSelf: "center",
  },
  recentTextWrap: {
    padding: 6,
    display:'block',
  },
  recentTitle: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.13)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  recentDuration: {
    color: "#E0E7FF",
    fontFamily: "QuicksandRegular",
    fontSize: 14,
  },
  groupsGrid: {
    paddingHorizontal: 0,
    paddingBottom: 80,
    marginHorizontal: 0,
  },
  groupCard: {
    // flex: 1,
    // aspectRatio: 1.25,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 0,
    // marginLeft: 3,
    marginRight: 0,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "#C7C7C7",
    position: "relative",
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 6,
    // shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  groupImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    borderRadius: CARD_RADIUS,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
  },
  groupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: CARD_RADIUS,
  },
  groupTitle: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
    margin: 14,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.16)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  premiumBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#000",
    height: 28,
    width: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    zIndex: 2,
  },
  crownBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#000",
    height: 28,
    width: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    zIndex: 2,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 62,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -1 },
    elevation: 8,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  navTab: {
    alignItems: "center",
    flex: 1,
    paddingTop: 8,
  },
  navLabel: {
    color: "#A1A1AA",
    fontWeight: "500",
    fontSize: 12,
    marginTop: 1,
  },
  navLabelActive: {
    color: "#8B5CF6",
    fontWeight: "700",
  },
  // Loading state styles
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    color: "#666",
    fontFamily: "QuicksandRegular",
    fontSize: 14,
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginBottom: 16,
    color: "#666",
    fontFamily: "QuicksandRegular",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#8B4CFC",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
  // Empty state style
  noDataText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
    fontFamily: "QuicksandRegular",
    fontSize: 14,
  },
});

export default MusicScreen;
