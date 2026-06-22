import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { ImageBackground } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { callSuggestusAPI } from "@/app/suggestus_plugin/suggestusClient";
import { spd_processId_config } from "@/app/config/process_id";
import { SiteConfig } from "@/app/config/site_config";
import { COURSES_SUB_URL } from "@/app/config/config";
import { SPD_USER_ID } from "@/app/config/config";
import { getDecryptedID } from "@/app/suggestus_plugin/util/util_functions";

import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

export default function FavoriteList() {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const horizontalMargin = useResponsiveHorizontalMargin();

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0,
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  // Fetch user ID securely
  useEffect(() => {
    (async () => {
      const id = await getDecryptedID(SPD_USER_ID);
      setUserId(id);
      if (id) fetchFavorites(id);
    })();
  }, []);

  // Fetch favorites list
  const fetchFavorites = async (id: string) => {
    setLoading(true);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_user_favourite_modules_list,
        { p_user_id: id },
      );
      if (response?.returnCode === true && Array.isArray(response.returnData)) {
        setFavorites(response.returnData);
        setFilteredFavorites(response.returnData);
      } else {
        setFavorites([]);
        setFilteredFavorites([]);
      }
    } catch (error) {
      setFavorites([]);
      setFilteredFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter favorites based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFavorites(favorites);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredFavorites(
        favorites.filter(
          (item) =>
            (item.module_name &&
              item.module_name.toLowerCase().includes(lowercaseQuery)) ||
            (item.short_description &&
              item.short_description.toLowerCase().includes(lowercaseQuery)) ||
            (item.category_name &&
              item.category_name.toLowerCase().includes(lowercaseQuery)),
        ),
      );
    }
  }, [searchQuery, favorites]);

  // Remove favorite
  const handleRemoveFavorite = async (moduleId: string) => {
    if (!userId) return;
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_delete_md_user_favourite_modules,
        { p_user_id: userId, p_module_id: moduleId },
      );
      if (response?.returnCode === true) {
        fetchFavorites(userId);
      } else {
        Alert.alert("Error", "Could not remove from favorites.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not remove from favorites.");
    }
  };

  // Handle  favorite click
  const handleFavoriteClick = async (item: any) => {
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
    if (Array.isArray(sessionData) && sessionData.length > 1) {
      // If array length > 1, log the information for now
      // In the future, this could navigate to a session selection screen
      console.log("Multiple sessions available:", sessionData.length);
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

  // Pull to refresh
  const onRefresh = useCallback(() => {
    if (userId) {
      setRefreshing(true);
      fetchFavorites(userId);
    }
  }, [userId]);

  // Render each favorite item
  const renderItem = ({ item }: any) => {
    const moduleId =
      item.session_json_data && item.session_json_data.module_id
        ? item.session_json_data.module_id
        : item.id;
    return (
      <View
        style={[
          { paddingHorizontal: 16 },
          Platform.OS === "web" && screenWidth >= 1024
            ? { paddingHorizontal: 116 }
            : null,
        ]}
      >
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.unfavoriteBtn, { width: "85%" }]}
            onPress={() => handleFavoriteClick(item)}
          >
            <View style={{ display: "flex", flexDirection: "row" }}>
              <ImageBackground
                style={styles.thumbnail}
                source={{
                  uri:
                    SiteConfig.on_mood9_ASSETS_URL +
                    COURSES_SUB_URL +
                    item.module_image,
                }}
                imageStyle={{ borderRadius: 10 }}
                resizeMode="cover"
              />
              <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.module_name}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.short_description}
                </Text>
                <View style={styles.tagsRow}>
                  {item.category_name ? (
                    <Text style={styles.tag}>{item.category_name}</Text>
                  ) : null}
                  {item.course_name ? (
                    <Text style={styles.tag}>{item.course_name}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.unfavoriteBtn}
            onPress={() => handleRemoveFavorite(moduleId)}
          >
            <Icon
              name="heart-off"
              size={26}
              color="#8B4CFC"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Always render header
  const renderHeader = () => <CustomTopHeader title="Back" />;

  // Empty state
  if (loading) {
    const loaderContent = (
      <View
        style={[
          styles.containerNew,
          { marginLeft: horizontalMargin, marginRight: horizontalMargin },
        ]}
      >
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#8B4CFC" />
          </View>
        </View>
      </View>
    );

    if (Platform.OS === "web" && screenWidth >= 1024) {
      return (
        <ImageBackground
          source={require("../../assets/images/background_new_web.png")}
          style={{ flex: 1, width: "100%", height: "100%" }}
          resizeMode="cover"
        >
          {loaderContent}
        </ImageBackground>
      );
    }

    return loaderContent;
  }
  if (!filteredFavorites.length) {
    const emptyContent = (
      <View
        style={[
          styles.containerNew,
          { marginLeft: horizontalMargin, marginRight: horizontalMargin },
        ]}
      >
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No favorites found.</Text>
          </View>
        </View>
      </View>
    );

    if (Platform.OS === "web" && screenWidth >= 1024) {
      return (
        <ImageBackground
          source={require("../../assets/images/background_new_web.png")}
          style={{ flex: 1, width: "100%", height: "100%" }}
          resizeMode="cover"
        >
          {emptyContent}
        </ImageBackground>
      );
    }

    return emptyContent;
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
        <View style={styles.container}>
          {renderHeader()}
          {/* Search Bar */}
          <View
            style={[
              styles.searchContainer,
              Platform.OS === "web" && screenWidth >= 1024
                ? { marginHorizontal: 116 }
                : null,
            ]}
          >
            <Icon
              name="magnify"
              size={20}
              color="#B3B7C6"
              style={{ marginLeft: 8 }}
            />
            <View
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            >
              <TextInput
                style={styles.searchInput}
                placeholder="Search favorites..."
                placeholderTextColor="#B3B7C6"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                >
                  <Icon name="close-circle" size={20} color="#B3B7C6" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <FlatList
            data={filteredFavorites}
            keyExtractor={(item) => `${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
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
}

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
    // backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  headerContainer: {
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandSemiBold",
    width: "100%",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FC",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 10,
    height: 44,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontFamily: "QuicksandMedium",
    paddingHorizontal: 8,
    outline: "none",
    height: 44,
    ...(Platform.OS === "web" ? { outlineStyle: "none", outlineWidth: 0 } : {}),
  },
  clearButton: {
    padding: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    // borderRadius: 14,
    marginBottom: 14,
    paddingVertical: 16,
    // shadowColor: "#000",
    // shadowOpacity: 0.04,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginRight: 12,
    marginLeft: 10,
    marginTop: 4,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#22274D",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: "#5E6488",
    fontFamily: "QuicksandRegular",
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#E8E3FF",
    color: "#8B4CFC",
    fontSize: 11,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 6,
    fontFamily: "QuicksandMedium",
  },
  unfavoriteBtn: {
    marginLeft: 0,
    padding: 0,
    display: "flex",
    flexWrap: "nowrap",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#B3B7C6",
    fontFamily: "QuicksandMedium",
  },
});
