import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Platform,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SiteConfig } from "@/app/config/site_config";
import { COURSES_SUB_URL, SPD_USER_SUBSCRIPTION } from "@/app/config/config";
import { spd_processId_config } from "@/app/config/process_id";
import { callSuggestusAPI } from "@/app/suggestus_plugin/suggestusClient";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import Toast from 'react-native-toast-message';
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_IMAGE = require("@/assets/images/internal_screen_bg.png");

export default function SearchScreen() {
  const navigation = useNavigation();
  const horizontalMargin = useResponsiveHorizontalMargin();

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth : 0) : 0
  );
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', updateScreenWidth);
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Responsive numColumns for FlatList (web)
  const [numColumns, setNumColumns] = useState(Platform.OS === 'web' ? 7 : 2);

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

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setError("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.trim() === "") {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
          { p_search_text: query }
        );
        if (response?.returnCode === true && response.returnData) {
          setResults(response.returnData);
        } else {
          setResults([]);
          setError("No results found.");
        }
      } catch (e) {
        setResults([]);
        setError("Something went wrong.");
      }
      setLoading(false);
    }, 600);
  }, []);

  const renderThumb = ({ item }: any) => {
    let imageUri = '';
    let displayText = '';
    let data_category_group_module = item.data_category_group_module;
    let isPaid = false;
    if (data_category_group_module && data_category_group_module.length > 0) {
      if(typeof data_category_group_module === 'string'){
        try {
          data_category_group_module = JSON.parse(data_category_group_module);
          if(data_category_group_module && data_category_group_module.length > 0){
            imageUri = SiteConfig.on_mood9_ASSETS_URL + COURSES_SUB_URL + data_category_group_module[0].module_image;
            displayText = data_category_group_module[0].category_name + ' - ' + data_category_group_module[0].module_name;
            isPaid = data_category_group_module[0].is_paid === 'paid';
          }
        } catch (error) {
          console.log('error', error);
        }
      }
    }
    return (
      <TouchableOpacity
        style={styles.thumbCard}
        onPress={async () => {
          let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
          if (isPaid && subscription_status === "false") {
            Toast.show({
              type: 'info',
              text1: 'You need to buy paid membership to view the content.'
            });
            return;
          }
          // @ts-ignore - navigation type workaround for dynamic screens
          navigation.navigate("music_player/MusicPlayerScreen", {
            itemData: data_category_group_module[0],
            sessionData:
            data_category_group_module[0].session_json_data && data_category_group_module[0].session_json_data.length === 1
              ? data_category_group_module[0].session_json_data[0]
              : null,
          });
        }}
      >
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.thumbImage}
          resizeMode="cover"
        >
          {isPaid && (
            <View style={styles.crownOverlay}>
             
                            <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
            </View>
          )}
          <View style={styles.titleOverlay}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {displayText}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };


  const mainContent = (
    <View style={[styles.container, { marginLeft: horizontalMargin, marginRight: horizontalMargin }]}> 
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Header */}
        <CustomTopHeader title="Back" />
        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#A1A1A1"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#A1A1A1"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            autoFocus
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color="#A1A1A1"
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </View>
        {/* Results */}
        <View style={styles.resultsWrapper}>
          {loading && (
            <ActivityIndicator
              size="large"
              color="#8b4cfc"
              style={{ marginTop: 30 }}
            />
          )}
          {!loading && error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : 
            (!loading && !searchQuery) ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <Image
                  source={require('@/assets/images/assess.png')}
                  style={{ width: 150, height: 150, opacity: 0.7, marginBottom: 20 }}
                  resizeMode="contain"
                />
                <Text style={{ fontSize: 20, color: '#8B4CFC', fontFamily: 'QuicksandSemiBold', marginBottom: 8 }}>
                  Start your search
                </Text>
                <Text style={{ fontSize: 15, color: '#888', textAlign: 'center', maxWidth: 250, fontFamily: 'QuicksandRegular' }}>
                  Find music, meditations, and more by typing in the search bar above.
                </Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, idx) =>
                  item.module_id ? String(item.module_id) : String(idx)
                }
                renderItem={renderThumb}
                numColumns={numColumns}
                key={"columns-" + numColumns}
                contentContainerStyle={styles.flatListContainer}
                ListEmptyComponent={
                  !loading && searchQuery ? (
                    <Text style={styles.noResultsText}>No results found.</Text>
                  ) : null
                }
                keyboardShouldPersistTaps="handled"
              />
            )
          }
        </View>
      </ImageBackground>
      <Toast />
    </View>
  );

  if (Platform.OS === 'web' && screenWidth >= 1024) {
    return (
      <ImageBackground
        source={require("../../assets/images/background_new_web.png")}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        {mainContent}
      </ImageBackground>
    );
  }
  return mainContent;
}

const CARD_SIZE =
  (require("react-native").Dimensions.get("window").width - 45) / 2;
function getThumbSize() {
  if (typeof window === 'undefined') return { maxWidth: 200, maxHeight: 200 };
  const width = window.innerWidth;
  if (width >= 1500) return { maxWidth: 188, maxHeight: 188 };
  if (width >= 1400) return { maxWidth: 200, maxHeight: 200 };
  if (width >= 1200) return { maxWidth: 180, maxHeight: 180 };
  if (width >= 1000) return { maxWidth: 235, maxHeight: 235 };
  if (width >= 900)  return { maxWidth: 220, maxHeight: 220 };
  if (width >= 800)  return { maxWidth: 250, maxHeight: 250 };
  if (width >= 600)  return { maxWidth: 235, maxHeight: 235 };
  return { maxWidth: 320, maxHeight: 320 };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffff",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 5,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    elevation: 2,
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
    height: 44,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#333",
    ...(Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : {}),
  },
  clearIcon: { marginLeft: 8 },
  resultsWrapper: { flex: 1, marginTop: 15 },
  flatListContainer: { paddingHorizontal: 12, paddingBottom: 20 },
  thumbCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 6,
    overflow: "hidden",
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    ...(Platform.OS === 'web' ? getThumbSize() : {}),
  },
  thumbImage: {
    flex: 1,
    justifyContent: "flex-end",
    borderRadius: 10,
    overflow: "hidden",
    position: 'relative',
    ...(Platform.OS === 'web' ? getThumbSize() : {}),
  },
  crownOverlay: {
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
  crownIcon: {
    width: 16,
    height: 16,
  },
  titleOverlay: { padding: 12 },
  cardTitle: {     
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
   },
  errorText: { color: "red", alignSelf: "center", marginTop: 30, fontSize: 16 },
  noResultsText: {
    color: "#888",
    alignSelf: "center",
    marginTop: 30,
    fontSize: 16,
  },
});
