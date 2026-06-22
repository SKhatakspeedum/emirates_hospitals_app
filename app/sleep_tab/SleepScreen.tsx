import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { COURSES_SUB_URL, SPD_USER_SUBSCRIPTION } from "../config/config";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Function to get icon based on category name
const getCategoryIcon = (categoryName: string, isSelected: boolean) => {
  const iconSize = 40;
  const iconColor = "#FFFFFF"; // Always white icons

  // Extract specific category words by splitting and analyzing each word
  const words = categoryName.toLowerCase().split(/\s+/);
  let iconName = "";
  let backgroundColor = "";

  // Check for specific keywords in any part of the name
  for (const word of words) {
    // Check for specific category words
    if (word === "mudra" || word === "mudras") {
      iconName = "meditation";
      backgroundColor = "#60A5FA"; // Blue
      break;
    } else if (
      word === "mind" ||
      word === "mental" ||
      word === "training" ||
      word === "brain"
    ) {
      iconName = "brain";
      backgroundColor = "#FBBF24"; // Yellow
      break;
    } else if (word === "meditation") {
      iconName = "meditation";
      backgroundColor = "#818CF8"; // Purple
      break;
    } else if (
      word === "exercise" ||
      word === "exercises" ||
      word === "fitness"
    ) {
      iconName = "run-fast";
      backgroundColor = "#34D399"; // Green
      break;
    } else if (word === "pressure" || word === "point" || word === "points") {
      iconName = "hand-pointing-up";
      backgroundColor = "#FB923C"; // Orange
      break;
    } else if (word === "music" || word === "sound" || word === "sounds") {
      iconName = "music";
      backgroundColor = "#F87171"; // Red
      break;
    }
  }

  // Default if no specific word is found
  if (!iconName) {
    iconName = "sleep";
    backgroundColor = "#60A5FA"; // Blue
  }

  // Apply selected state styling
  const containerStyle = {
    backgroundColor: backgroundColor,
    opacity: isSelected ? 1 : 0.7,
    width: 55,
    height: 55,
    borderRadius: 50,
    marginTop: 0,
    alignItems: "center" as "center",
    justifyContent: "center" as "center",
  };

  // Return the appropriate icon with container
  return (
    <View style={containerStyle}>
      {iconName === "brain" ? (
        <FontAwesome5 name="brain" size={iconSize - 15} color={iconColor} />
      ) : (
        <MaterialCommunityIcons
          name={iconName as any}
          size={iconSize - 10}
          color={iconColor}
        />
      )}
    </View>
  );
};

// Define TypeScript interfaces for our data model
interface CategoryItem {
  id: string;
  group_name: string;
  icon?: any; // For local images
}

interface ModuleItem {
  id: string;
  module_name: string;
  module_description?: string;
  module_image?: string;
  premium?: boolean;
  image?: any; // For local images
  // Additional fields from API
  [key: string]: any;
}

interface CategoryData {
  [categoryId: string]: ModuleItem[];
}

const SleepScreen = () => {
  // State variables
  const navigation = useNavigation<any>();

  // Responsive screen width state for web
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0
  );
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [itemsByCategory, setItemsByCategory] = useState<CategoryData>({});
  const router = useRouter();

  // Fetch data from API on component mount
  useEffect(() => {
    fetchSleepData();
  }, []);

  // Function to fetch sleep data from API
  const fetchSleepData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
        {
          p_category_code: "SLEEP_WELL",
        }
      );

      if (response?.returnCode === true) {
        if (response.returnData && response.returnData.length > 0) {
          let sleepData = response.returnData[0].data_category_group_module;

          if (sleepData && sleepData.length > 0) {
            let parsedData;
            try {
              parsedData = JSON.parse(sleepData);
              processApiData(parsedData);
            } catch (parseError) {
              console.error("Error parsing JSON data:", parseError);
              setError("Failed to parse data from server");
            }
          } else {
            setError("No sleep data available");
          }
        } else {
          setError("No return data available");
        }
      } else {
        setError(response?.msg || "Failed to fetch data");
      }
    } catch (e) {
      console.error("API call error:", e);
      setError("An error occurred while fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  // Process the API data to structure categories and items
  const processApiData = (data: any[]) => {
    // Extract unique categories
    const uniqueCategories: CategoryItem[] = [];
    const categoryMap = new Map<string, string>();
    const itemsByCat: CategoryData = {};

    // Process data to extract categories and items
    data.forEach((item) => {
      const categoryId = item.groupId;
      const categoryName = item.group_name;
      const categoryImage = item.group_image;
      const categoryPaid = item.group_is_paid;

      // Add category if not already added
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, categoryName);
        uniqueCategories.push({
          id: categoryId,
          group_name: categoryName,
          group_image: categoryImage,
          group_is_paid: categoryPaid,
        });
        itemsByCat[categoryId] = [];
      }

      // Add item to its category
      itemsByCat[categoryId].push({
        id: item.module_id || item.id,
        module_name: item.module_name,
        module_description: item.module_description,
        module_image: item.module_image,
        premium: item.is_paid === "paid",
        // Include the entire item for navigation
        ...item,
      });
    });
    // Update state with processed data
    setCategories(uniqueCategories);
    setItemsByCategory(itemsByCat);

    // Select first category by default
    if (
      uniqueCategories.length > 0 &&
      selectedCategory !== uniqueCategories[0].id
    ) {
      setSelectedCategory(uniqueCategories[0].id);
    }
  };
  // Render the component
  return (
    <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
    >
      <View
        style={[
          styles.container,
          Platform.OS === "web" && screenWidth >= 1024
            ? { marginLeft: 120, marginRight: 120 }
            : null,
        ]}
      >
        {/* <Text style={styles.title}>Sleep</Text> */}

        {/* <View style={styles.containerCard}> */}
          {isLoading ? (
            // Loading indicator
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#8B4CFC" />
              <Text style={styles.loaderText}>Loading sleep data...</Text>
            </View>
          ) : error ? (
            // Error message
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchSleepData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Content when data is loaded
            <>
            <View style={styles.containerCardWrapperOuter}>
              {/* Category Chips */}
              {categories.length > 0 ? (
                <FlatList
                  horizontal
                  data={categories}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={
                        selectedCategory === item.id
                          ? [styles.chip, styles.chipSelected]
                          : styles.chip
                      }
                      onPress={() => setSelectedCategory(item.id)}
                    >
                      <View
                        style={
                          selectedCategory === item.id
                            ? [styles.iconWrapper, styles.iconWrapperSelected]
                            : [styles.iconWrapper, styles.iconWrapperUnselected]
                        }
                      >
                        {/* Generate icon based on category name */}
                        {getCategoryIcon(item.group_name, selectedCategory === item.id)}
                        <Text
                          style={
                            selectedCategory === item.id
                              ? [styles.chipText, styles.chipTextSelected]
                              : [styles.chipText]
                          }
                        >
                          {(() => {
                            const words = item.group_name.trim().split(' ');
                            if (words.length > 1) {
                              return words[0] + '\n' + words.slice(1).join(' ');
                            }
                            return item.group_name.trim();
                          })()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.noDataText}>No categories found</Text>
              )}

              <View style={styles.categoryDivider} />
            </View>
              {/* Items List */}
              {selectedCategory && itemsByCategory[selectedCategory] ? (
                <FlatList
                  data={itemsByCategory[selectedCategory]}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={[styles.listContent]}
                  style={{ marginBottom: 20 }}
                  ListEmptyComponent={
                    <Text style={styles.noDataText}>
                      No items available in this category
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemCard}
                      /**
                       * Navigate to MusicPlayerScreen with item data as a parameter
                       * @param {{ id: number, module_name: string, module_image: string, premium: boolean }} item - The sleep item to be played
                       * @return {void}
                       */
                      onPress={async () => {
                        let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
                        if (item.is_paid === 'paid' && subscription_status === "false") {
                          Toast.show({
                            type: 'info',
                            text1: 'You need to buy paid membership to view the content.'
                          });
                          return;
                        }
                        // Check if session_json_data exists and parse it if it's a string
                        let sessionData;
                        try {
                          if (item.session_json_data) {
                            sessionData =
                              typeof item.session_json_data === "string"
                                ? JSON.parse(item.session_json_data)
                                : item.session_json_data;
                          }
                        } catch (error) {
                          console.error(
                            "Error parsing session_json_data:",
                            error
                          );
                          // If parsing fails, treat as empty array
                          sessionData = [];
                        }

                        // Check if sessionData is an array and its length
                        if (
                          Array.isArray(sessionData) &&
                          sessionData.length > 1
                        ) {
                          // If array length > 1, we'll navigate to a different screen in the future
                          // For now, just show an alert
                          console.log(
                            "Multiple sessions available:",
                            sessionData.length
                          );
                          // TODO: Navigate to session selection screen when it's available
                          Alert.alert(
                            "Multiple Sessions",
                            `This module has ${sessionData.length} sessions. Session selection screen will be implemented soon.`
                          );
                        } else {
                          // If array length is 0 or 1, or if it's not an array, navigate to MusicPlayerScreen
                          navigation.navigate(
                            "music_player/MusicPlayerScreen",
                            {
                              itemData: item,
                              sessionData:
                                sessionData && sessionData.length === 1
                                  ? sessionData[0]
                                  : null,
                            }
                          );
                        }
                      }}
                    >
                      <View style={{position: 'relative'}}>
                        <Image
                          source={
                            item.module_image
                              ? {
                                  uri:
                                    SiteConfig.on_mood9_ASSETS_URL +
                                    COURSES_SUB_URL +
                                    item.module_image,
                                }
                              : require("@/assets/images/mask_group.png")
                          }
                          style={styles.itemThumbnail}
                        />
                      </View>
                      <Text style={styles.itemTitle}>{item.module_name}</Text>
                      
                        {item.is_paid === 'paid' && (
                          <View style={styles.crownBadge}>
                            <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
                          </View>
                        )}
                      <View style={styles.rightIcons}>
                        {/* {item.premium && (
                          <Image
                            source={require("@/assets/images/crown.png")}
                            style={styles.crownIcon}
                          />
                        )} */}
                        <Image
                          source={require("@/assets/images/arrow_right.png")}
                          style={styles.arrowIcon}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.noDataText}>No items available</Text>
              )}
            </>
          )}
        {/* </View> */}
      </View>
      <Toast />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  crownBadge: {
    // position: 'absolute',
    // top: 5,
    // right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    height: 24,
    width: 24,
    alignItems: 'center',
    marginHorizontal: 8,
    justifyContent: 'center',
    padding: 1,
    zIndex: 2,
  },
  // ... keep all style definitions as before, but without the generic index signature

  background: { 
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
   },
  container: { flex: 1, paddingTop: 10, paddingHorizontal: 15 },
  containerCard: {
    flexGrow: 1,
    overflow: "hidden",
  },
  title: {
    fontSize: 18,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    textAlign: "left",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 15,
    marginTop: 24,
  },

  // Loading and error styles
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4CFC",
    fontFamily: "QuicksandMedium",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "QuicksandMedium",
  },
  retryButton: {
    backgroundColor: "#8B4CFC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "QuicksandMedium",
  },
  noDataText: {
    fontSize: 16,
    color: "#8B8B8B",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "QuicksandMedium",
  },
  containerCardWrapperOuter:{
      marginBottom: 10,
  },
  // Category styles
  chipRow: {
    // flexDirection: "row",
    // paddingHorizontal: 4,
    // paddingVertical: 8,
    gap: 12,
    alignItems:'flex-start'
  },
  chip: {
    // flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
    borderRadius: 8,
    minWidth: 90,
    maxWidth: 90,
    // minHeight: 120,
    // maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignSelf: 'center',
    marginBottom: 10, // extra space below chip
  },
  chipSelected: {
    backgroundColor: "#e2e9fe",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
    // width: 55,
    // height: 55,
    marginVertical: 4,
  },
  iconWrapperSelected: {
    opacity: 1,
  },
  iconWrapperUnselected: {
    opacity: 0.7,
  },
  chipIcon: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },

  chipText: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
    textAlign: "center",
    marginTop: 8,
    width: '100%',
  },
  chipTextSelected: {
    fontFamily: "QuicksandSemiBold",
    color: "#8B4CFC",
  },

  // Item list styles
  listContent: {
    paddingBottom: 10,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 6,
    marginBottom: 16,
    paddingRight: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
    width: '100%',
  },

  itemThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: "#f5f5f5",
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  crownIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
    marginRight: 4,
    alignSelf: 'center',
  },
  arrowIcon: {
    width: 8,
    height: 14,
    tintColor: "#8B4CFC",
  },
});

export default SleepScreen;
