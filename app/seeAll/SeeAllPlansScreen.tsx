import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import { SiteConfig } from "@/app/config/site_config";
import { COURSES_SUB_URL, BLOGS_SUB_URL, SPD_USER_SUBSCRIPTION } from "@/app/config/config";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const { width } = Dimensions.get("window");

// Define the route params type
type RouteParams = {
  allPlans: any[];
  type: "sleep" | "music" | "session";
};

export default function SeeAllPlansScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();

  // Accept params from both ExploreScreen (section) and DashboardScreen (type)
  const params = route.params as RouteParams & { section?: string };
  const initialPlans = params?.allPlans || [];
  // Prefer section from Explore, else fallback to type from Dashboard
  const sectionOrType = params?.section || params?.type || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlans, setFilteredPlans] = useState<any[]>(initialPlans);
  const [plans, setPlans] = useState<any[]>(initialPlans.slice(0, 20));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(initialPlans.length <= 20);
  // Responsive numColumns for FlatList (web)
  const [numColumns, setNumColumns] = useState(Platform.OS === 'web' ? 7 : 2);

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

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    function updateColumns() {
      const width = window.innerWidth;
      if (width >= 1500) setNumColumns(6);
      else if (width >= 1200) setNumColumns(5);
      else if (width >= 900) setNumColumns(4);
      else if (width >= 600) setNumColumns(3);
      else setNumColumns(2);
    }
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Get the appropriate title based on content type
  // Use sectionOrType for title logic
  const getScreenTitle = () => {
    switch (sectionOrType.toLowerCase()) {
      case "music":
        return "Music";
      case "session":
        return "Sessions";
      case "program":
        return "Programs";
      case "learn":
        return "Learn";
      case "de-stress":
      case "destress":
        return "De-stress";
      default:
        return "Sleep";
    }
  };


  // Filter plans based on search query
  useEffect(() => {
    console.log("initialPlans", initialPlans);
    let filtered;
    if (searchQuery.trim() === "") {
      filtered = initialPlans;
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = initialPlans.filter((item) => {
        // Search in module_name, title, and description if they exist
        let moduleName, title, description;
        if (getScreenTitle() === "Programs") {
          moduleName = (item.name || "").toLowerCase();
          description = (item.description || "").toLowerCase();
          title = (item.description || "").toLowerCase(); // title is also description
        } else {
          moduleName = (item.module_name || "").toLowerCase();
          title = (item.title || "").toLowerCase();
          description = (item.description || "").toLowerCase();
        }

        return (
          moduleName.includes(lowercaseQuery) ||
          title.includes(lowercaseQuery) ||
          description.includes(lowercaseQuery)
        );
      });
    }

    setFilteredPlans(filtered);
    // Reset pagination when search query changes
    setPage(1);
    setPlans(filtered.slice(0, 20));
    setAllLoaded(filtered.length <= 20);
  }, [searchQuery, initialPlans]);

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Load more items when user reaches the end
  const loadMoreItems = () => {
    if (loading || allLoaded) return;

    setLoading(true);

    // Simulate a delay to show loading indicator
    setTimeout(() => {
      const nextItems = filteredPlans.slice(page * 20, (page + 1) * 20);

      if (nextItems.length > 0) {
        setPlans([...plans, ...nextItems]);
        setPage(page + 1);
      } else {
        setAllLoaded(true);
      }

      setLoading(false);
    }, 500);
  };

  const renderPlan = ({ item }: any) => {
    // Determine image and text params based on section/type
    let imageUri = '';
    let displayText = '';
    if (sectionOrType === 'program') {
      imageUri = item.media_value?.startsWith('http')
        ? item.media_value
        : SiteConfig.on_mood9_ASSETS_URL + COURSES_SUB_URL + item.media_value;
      displayText = item.name;
    } else if (sectionOrType === 'learn') {
      const blogMedia = item.blog_media?.[0]?.media_file;
      imageUri = blogMedia?.startsWith('http')
        ? blogMedia
        : SiteConfig.on_mood9_ASSETS_URL + BLOGS_SUB_URL + blogMedia;
      displayText = item.title;
    } else {
      // Fallback: music, de-stress, etc.
      imageUri = SiteConfig.on_mood9_ASSETS_URL + COURSES_SUB_URL + (item.module_image || '');
      displayText = item.module_name || item.title;
    }
    return (
      <TouchableOpacity
        style={[styles.sleepPlansCard, getThumbSize()]}
        onPress={async () => {
          let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
          if (item.is_paid === 'paid' && subscription_status === "false") {
            Toast.show({
              type: 'info',
              text1: 'You need to buy paid membership to view the content.'
            });
            return;
          }
          if (sectionOrType === 'program') {
            navigation.navigate("explore_tab/ExploreDetailScreen", {
              itemData: item,
            });
          } else if (sectionOrType === 'learn') {
            const blogMedia = item.blog_media?.[0]?.media_file;
            navigation.navigate("blogs/BlogsScreen", {
              title: item.title,
              image: blogMedia?.startsWith('http')
                ? blogMedia
                : SiteConfig.on_mood9_ASSETS_URL + BLOGS_SUB_URL + blogMedia,
              html_content: item.read_more_descr,
              author: item.author,
            });
          } else {
            // Process session data if available
            let sessionData = item.session_json_data;
            if (!!sessionData) {
              if(typeof sessionData === 'string'){
                sessionData = JSON.parse(sessionData);
              }
            }
            // Check if there are multiple sessions
            if (sessionData && sessionData.length > 1) {
              navigation.navigate("all_session/SeeAllSession", {
                sessions: sessionData,
                moduleData: item,
              });
            } else {
              navigation.navigate("music_player/MusicPlayerScreen", {
                itemData: item,
                sessionData:
                  sessionData && sessionData.length === 1 ? sessionData[0] : null,
              });
            }
          }
        }}
      >
        <ImageBackground
          source={{ uri: imageUri }}
          style={[styles.sleepPlansCardImage]}
          resizeMode="cover"
        >
          {item.is_paid === 'paid' && (
            <View style={styles.crownBadge}>
              <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
            </View>
          )}
          
                            <View style={styles.imageOverlay}></View>
          <View style={styles.titleOverlay}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {displayText}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };


  // Render footer with loading indicator
  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#8B4CFC" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const mainContent = (
      <View
               style={[
                 styles.containerNew,
                 { marginLeft: horizontalMargin, marginRight: horizontalMargin },
               ]}>
  <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Top Header for screen */}
      <CustomTopHeader title={getScreenTitle()} />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#8B4CFC"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${getScreenTitle()}...`}
              placeholderTextColor="#B3B7C6"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#B3B7C6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {plans.length > 0 ? (
          <FlatList
            data={plans}
            keyExtractor={(_, idx) => `plan-${idx}`}
            renderItem={renderPlan}
            numColumns={numColumns}
            key={"columns-" + numColumns}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={{ justifyContent: "flex-start", gap: 12 }}
            onEndReached={loadMoreItems}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#B3B7C6" />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>
              Try a different search term
            </Text>
          </View>
        )}
      </View>
      <Toast />
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
}

const CARD_SIZE = (width - 45) / 2;
function getThumbSize() {
  if (typeof window === 'undefined') return { maxWidth: 200, maxHeight: 200 };
  const width = window.innerWidth;
  if (width >= 1500) return { maxWidth: 180, maxHeight: 188 };
  if (width >= 1400) return { maxWidth: 200, maxHeight: 200 };
  if (width >= 1200) return { maxWidth: 180, maxHeight: 180 };
  if (width >= 1000) return { maxWidth: 235, maxHeight: 235 };
  if (width >= 900)  return { maxWidth: 220, maxHeight: 220 };
  if (width >= 800)  return { maxWidth: 250, maxHeight: 250 };
  if (width >= 600)  return { maxWidth: 235, maxHeight: 235 };
  return { maxWidth: 320, maxHeight: 320 };
}
const styles = StyleSheet.create({
  containerNew: { flex: 1 },
  crownBadge: {   
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    // backgroundColor: "#fff",
    padding: 16,
    paddingTop: 0,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: "QuicksandSemiBold",
    color: "#333",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#B3B7C6",
    marginTop: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor:'#e7e7e7',
    shadowOffset: { width: 0, height: 5 },
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#333",
    outlineWidth: 0,
  },
  clearButton: {
    padding: 4,
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
  headerContainer: {
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
  backButton: {
    padding: 8,
  },
  header: {
    fontSize: 18,
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandSemiBold",
    width: "100%",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  sleepPlansCard: {
    width: '48%',
    // flex: 1,
    height: CARD_SIZE * 1.1,
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F3F2FA",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sleepPlansCardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  titleOverlay: {
    // backgroundColor: "rgba(0,0,0,0.4)",
    padding: 12,
  },
  cardTitle: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: "#8B4CFC",
    fontFamily: "QuicksandMedium",
  },
});
