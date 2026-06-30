import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { COURSES_SUB_URL, SPD_USER_SUBSCRIPTION } from "../config/config";
import CustomHeader from "../components/CustomHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

// Define TypeScript interfaces for our data model
interface CategoryGroup {
  id: string;
  group_id: string;
  group_name: string;
  group_code: string;
  group_description?: string;
  modules: ModuleItem[];
}

interface ModuleItem {
  module_id: string;
  module_name: string;
  module_description?: string;
  long_description?: string;
  module_image?: string;
  premium?: boolean;
  [key: string]: any;
}

interface RouteParams {
  category_code: string;
  category_name?: string;
}

const DistressMeditate = () => {
  // State variables
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params as RouteParams) || {
    category_code: "DE_STRESS",
  };

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
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

  // Function to get display name based on category code
  const getCategoryDisplayName = (categoryCode: string): string => {
    switch (categoryCode.toUpperCase()) {
      case "DE_STRESS":
        return "De-stress";
      case "MINDFULNESS":
        return "Meditate";
      case "SLEEP":
        return "Sleep";
      case "ANXIETY":
        return "Anxiety Relief";
      case "DEPRESSION":
        return "Depression Relief";
      case "FOCUS":
        return "Focus & Concentration";
      default:
        return params.category_name || categoryCode;
    }
  };

  const [categoryName, setCategoryName] = useState<string>(
    getCategoryDisplayName(params.category_code),
  );

  // Fetch data from API on component mount
  useEffect(() => {
    fetchCategoryData();
  }, [params.category_code]);

  // Function to fetch category data from API
  const fetchCategoryData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
        { p_category_code: params.category_code },
      );

      if (response?.returnCode === true && response.returnData) {
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
        }
      } else {
        setError("No data available. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching category data:", err);
      setError(
        "Failed to load data. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Process the API data to structure categories and items
  const processApiData = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      setError("No data available");
      return;
    }

    try {
      // Group modules by group_id
      const groupedData: CategoryGroup[] = [];

      // First pass: collect all unique groups
      const uniqueGroups = new Map<string, CategoryGroup>();

      data.forEach((item) => {
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

        // Process session data if it exists
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
          sessionData = null;
        }

        // Add module to the appropriate group
        const group = uniqueGroups.get(item.group_id);
        if (group) {
          group.modules.push({
            module_id: item.module_id,
            module_name: item.module_name,
            module_description: item.module_description || "",
            long_description: item.long_description || "",
            module_image: item.module_image || null,
            premium: item.is_paid === "paid",
            // Include the session data for MusicPlayerScreen
            session_json_data: item.session_json_data || null,
            // Include the entire item for navigation
            ...item,
          });
        }
      });

      // Convert map to array and sort by group name
      const sortedGroups = Array.from(uniqueGroups.values()).sort((a, b) =>
        a.group_name.localeCompare(b.group_name),
      );
      setCategoryGroups(sortedGroups);
    } catch (err) {
      console.error("Error processing API data:", err);
      setError("Error processing data. Please try again.");
    }
  };

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

  // Render loading state
  if (isLoading) {
    const loadingContent = (
      <View
        style={[
          styles.containerNew,
          { marginLeft: horizontalMargin, marginRight: horizontalMargin },
        ]}
      >
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8B4CFC" />
          <Text style={styles.loaderText}>Loading...</Text>
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
          {loadingContent}
        </ImageBackground>
      );
    }
    return loadingContent;
  }

  // Render error state
  if (error) {
    const errorContent = (
      <View
        style={[
          styles.containerNew,
          { marginLeft: horizontalMargin, marginRight: horizontalMargin },
        ]}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCategoryData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
          {errorContent}
        </ImageBackground>
      );
    }
    return errorContent;
  }

  // Render module item
  const renderModuleItem = ({ item }: { item: ModuleItem }) => (
    <TouchableOpacity
      style={styles.moduleItem}
      onPress={() => handleModulePress(item)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={
            item.module_image
              ? {
                  uri:
                    SiteConfig.on_mood9_ASSETS_URL +
                    COURSES_SUB_URL +
                    item.module_image,
                }
              : undefined
          }
          style={styles.moduleImage}
          resizeMode="cover"
        />
        {item.premium && (
          <View style={styles.crownOverlay}>
            <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
          </View>
        )}
      </View>
      <View style={styles.imageOverlay}></View>
      <Text style={styles.moduleName} numberOfLines={2}>
        {item.module_name}
      </Text>
    </TouchableOpacity>
  );

  // Render category group
  const renderCategoryGroup = ({ item }: { item: CategoryGroup }) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{item.group_name}</Text>
      {item.modules.length > 0 ? (
        <FlatList
          data={item.modules}
          renderItem={renderModuleItem}
          keyExtractor={(item) => item.module_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moduleList}
        />
      ) : (
        <Text style={styles.noModulesText}>No modules available</Text>
      )}
    </View>
  );

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
        <CustomHeader title="Back" />
        <View style={styles.container}>
          {/* Main Content */}
          {categoryGroups.length > 0 ? (
            <FlatList
              data={categoryGroups}
              renderItem={renderCategoryGroup}
              keyExtractor={(item) => item.group_id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No meditation modules found.
              </Text>
            </View>
          )}
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
  containerNew: { flex: 1 },
  crownIcon: {
    width: 16,
    height: 16,
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  headerRow: {
    // paddingHorizontal: 16,
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
    padding: 0,
    marginRight: 2,
  },
  backIcon: {
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
    width: "100%",
    textAlign: "center",
  },

  // Category section styles
  categoryList: {
    paddingBottom: 80,
  },
  categorySection: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  categoryTitle: {
    fontSize: 16,
    color: "#262626",
    marginBottom: 16,
    fontFamily: "QuicksandSemiBold",
  },
  moduleList: {
    paddingRight: 8,
  },

  // Module item styles
  moduleItem: {
    width: 180,
    marginRight: 12,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginBottom: 0,
  },
  moduleImage: {
    width: "100%",
    height: "100%",
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 4,
  },
  moduleName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    padding: 12,
    textAlign: "left",
    textShadowColor: "rgba(0,0,0,0.5)",
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
  },

  // Loading and error states
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8B4CFC",
    fontFamily: "QuicksandMedium",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
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

  // Empty states
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#8B8B8B",
    textAlign: "center",
    fontFamily: "QuicksandMedium",
  },
  noModulesText: {
    fontSize: 14,
    color: "#8B8B8B",
    fontFamily: "QuicksandRegular",
    marginTop: 8,
    marginBottom: 16,
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
});

export default DistressMeditate;
