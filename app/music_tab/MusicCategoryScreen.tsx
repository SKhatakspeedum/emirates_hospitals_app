import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import { router } from "expo-router";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SiteConfig } from "../config/site_config";
import { COURSES_SUB_URL, SPD_USER_SUBSCRIPTION } from "../config/config";
import Svg, { Path } from "react-native-svg";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

// Define TypeScript interfaces for our data model
interface MusicModule {
  module_id: string;
  module_name: string;
  module_description?: string;
  module_image?: string;
  premium?: boolean;
  session_json_data?: string;
  [key: string]: any;
}

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

interface RouteParams {
  groupData: MusicGroup;
}

const MusicCategoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;

  // State variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupData, setGroupData] = useState<MusicGroup | null>(null);
  const [modules, setModules] = useState<MusicModule[]>([]);
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
  

  // Process navigation params when component mounts
  useEffect(() => {
    if (params?.groupData) {
      setGroupData(params.groupData);

      // Extract modules from the group data
      if (params.groupData.modules && params.groupData.modules.length > 0) {
        setModules(params.groupData.modules);
      }

      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [params]);

  const handleBack = () => {
    navigation.goBack();
  };

  // Navigate to MusicPlayerScreen with the selected module/track
  const handleTrack = async (item: MusicModule) => {
    let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
    if (item.is_paid === 'paid' && subscription_status === "false") {
      Toast.show({
        type: 'info',
        text1: 'You need to buy paid membership to view the content.'
      });
      return;
    }
    navigation.navigate("music_player/MusicPlayerScreen", {
      itemData: item,
      sessionData:
        item.session_json_data && item.session_json_data.length === 1
          ? item.session_json_data[0]
          : null,
    });
  };

  // Render a music module/track item
  const renderTrack = ({ item }: { item: MusicModule }) => (
    <TouchableOpacity
      style={styles.trackRow}
      activeOpacity={0.7}
      onPress={() => handleTrack(item)}
    >
      <View style={styles.trackRowContainer}>
      <View style={styles.thumbWrap}>
        <Image
          source={
            item.module_image &&
            item.module_image !== "null" &&
            item.module_image !== "undefined"
              ? {
                  uri:
                    SiteConfig.on_mood9_ASSETS_URL +
                    COURSES_SUB_URL +
                    item.module_image,
                }
              : require("@/assets/images/image_131.png") // Fallback image
          }
          style={styles.thumbImg}
        />
      </View>
      <Text style={styles.trackTitle}>{item.module_name}</Text>
      </View>
        {item.is_paid === 'paid' && (
          <View style={styles.crownBadge}>
            <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
          </View>
        )}
    </TouchableOpacity>
  );

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
      <CustomTopHeader title="Back" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, 
                                    Platform.OS === "web" && screenWidth >= 1024 ? { paddingHorizontal:116 } : null]}>
          {/* Content based on loading state */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#8B4CFC" />
              <Text style={styles.loaderText}>Loading music tracks...</Text>
            </View>
          ) : modules.length > 0 ? (
            <FlatList
              data={modules}
              keyExtractor={(item) => item.module_id}
              renderItem={renderTrack}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No music tracks available</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
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
    // backgroundColor: '#fff',
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 24,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  topBarTitle: {
    fontSize: 18,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    width: "100%",
    textAlign: "center",
  },
  categoryLabel: {
    fontSize: 18,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginTop: 12,
    marginBottom: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 30,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  trackRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  thumbWrap: {
    position: "relative",
    marginRight: 14,
  },
  thumbImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    resizeMode: "cover",
  },
  crownBadge: {
    // position: 'absolute',
    // top: 8,
    // right: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    zIndex: 2,
  },
  trackTitle: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  separator: {
    height: 1,
    backgroundColor: "#898D9E",
    marginLeft: 0,
    marginRight: 0,
    opacity: 0.5,
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
  // Empty state styles
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontFamily: "QuicksandRegular",
    fontSize: 14,
  },
});

export default MusicCategoryScreen;

