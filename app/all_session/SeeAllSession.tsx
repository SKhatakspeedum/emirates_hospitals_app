import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Platform,
  ImageBackground,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import { Video } from "expo-av";
import RenderHtml from "react-native-render-html";
import { callSuggestusAPI } from "@/app/suggestus_plugin/suggestusClient";
import { spd_processId_config } from "@/app/config/process_id";
import { SiteConfig } from "@/app/config/site_config";
import {
  RELATED_VIDEO_THUMB_URL,
  RELATED_VIDEO_URL,
  SPD_USER_SUBSCRIPTION,
} from "@/app/config/config";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

// Define the route params type
type RouteParams = {
  sessions: any[];
  moduleData: any;
};

type VideoItem = {
  module_video_id: string;
  module_id: string;
  video_id: string;
  id: string;
  file_name: string;
  file_path: string;
  audio_video_file: string;
  video_thumb_image: string;
  file_size: string;
  file_type: string;
  status: string;
  notes: string;
  created_on: string;
  modified_on: string;
};

export default function SeeAllSession() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
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

  // Data is passed as { sessions: <parsed session data>, moduleData: <original plan data> }
  const params = route.params as RouteParams;
  const sessions = params?.sessions || [];
  const moduleData = params?.moduleData || {};
  const { width } = Dimensions.get("window");

  useEffect(() => {
    fetchRelatedVideos();
  }, []);

  const fetchRelatedVideos = async () => {
    if (!moduleData.id) return;

    setLoading(true);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_videos_module_wise,
        {
          p_module_id: moduleData.id,
        }
      );

      if (response?.returnCode === true && response.returnData) {
        setRelatedVideos(response.returnData);
      }
    } catch (error) {
      console.error("Error fetching related videos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle session selection
  const handleSessionPress = async (session: any) => {
    let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
    if (session.is_paid === 'paid' &&  subscription_status === "false") {
      Toast.show({
        type: 'info',
        text1: 'You need to buy paid membership to view the content.'
      });
      return;
    }
    navigation.navigate("music_player/MusicPlayerScreen", {
      itemData: moduleData,
      sessionData: session,
    });
  };

  const handleVideoPress = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  // Render a session item
  const renderSessionItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleSessionPress(item)}
    >
      <View style={styles.playButtonContainer}>
        <View style={styles.playButton}>
          <Ionicons name="play" size={24} color="#8B4CFC" />
        </View>
      </View>
      <View style={styles.sessionInfoContainer}>
        <Text style={styles.sessionName}>
          {item.session_name || `Session ${index + 1}`}
        </Text>
        {item.duration && (
          <Text style={styles.sessionDuration}>{item.duration}</Text>
        )}
      </View>
        {item.is_paid === 'paid' && (
          <View style={styles.crownBadge}>
            <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
          </View>
        )}
      <Ionicons name="chevron-forward" size={20} color="#B3B7C6" />
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
      <View style={[styles.container,
                    Platform.OS === "web" && screenWidth >= 1024 ? { paddingHorizontal:116 } : null]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Sessions Title */}
          <Text style={styles.sectionTitle}>Sessions</Text>
          {/* Sessions List */}
          <FlatList
            data={sessions}
            keyExtractor={(_, idx) => `session-${idx}`}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />

          {/* Related Videos */}
          {relatedVideos.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Related Videos</Text>
              <FlatList
                data={relatedVideos}
                keyExtractor={(item) => `video-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.videoList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.videoThumb}
                    onPress={() => handleVideoPress(item)}
                  >
                    <View
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 10,
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            SiteConfig.on_mood9_ASSETS_URL +
                            RELATED_VIDEO_THUMB_URL +
                            item.video_thumb_image,
                        }}
                        style={styles.videoImage}
                        resizeMode="cover"
                      />
                      <View
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          left: 0,
                          top: 0,
                          backgroundColor: "#000",
                          zIndex: 1,
                          opacity: 0.2,
                        }}
                      ></View>
                      <View style={styles.playBtnWrapper}>
                        <Ionicons name="play" size={24} color="#fff" />
                      </View>
                    </View>
                    <Text style={styles.videoTitle} numberOfLines={1}>
                      {item.file_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Video Player Modal */}
          <Modal
            visible={showVideoPlayer}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowVideoPlayer(false)}
          >
            <View style={styles.modalBackground}>
              <View
                style={[
                  styles.videoModalContent,
                  Platform.OS === "web" && screenWidth >= 1024
                    ? { width: 800, height: 500, justifyContent: 'center', alignItems: 'center' }
                    : {},
                ]}
              >
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowVideoPlayer(false)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                {selectedVideo?.audio_video_file ? (
                  Platform.OS === "web" ? (
                    <video
                      src={
                        SiteConfig.on_mood9_ASSETS_URL +
                        RELATED_VIDEO_URL +
                        selectedVideo.audio_video_file
                      }
                      controls
                      style={
                        screenWidth >= 1024
                          ? { width: 700, height: 400, borderRadius: 10, background: '#000' }
                          : styles.videoPlayer
                      }
                    />
                  ) : (
                    <Video
                      source={{
                        uri:
                          SiteConfig.on_mood9_ASSETS_URL +
                          RELATED_VIDEO_URL +
                          selectedVideo.audio_video_file,
                      }}
                      style={styles.videoPlayer}
                      useNativeControls
                      resizeMode="contain"
                      shouldPlay
                    />
                  )
                ) : null}
              </View>
            </View>
          </Modal>

          {/* Detail Layout (HTML) */}
          {moduleData.long_description ? (
            <View style={styles.sectionContainer}>
              <RenderHtml
                contentWidth={width - 32}
                source={{ html: moduleData.long_description }}
                tagsStyles={{
                  p: {
                    fontSize: 14,
                    color: "#262626",
                    fontFamily: "QuicksandRegular",
                  },
                  h1: {
                    fontSize: 20,
                    fontFamily: "QuicksandSemiBold",
                    color: "#262626",
                  },
                  h2: {
                    fontSize: 18,
                    fontFamily: "QuicksandSemiBold",
                    color: "#262626",
                  },
                  h3: {
                    fontSize: 16,
                    fontFamily: "QuicksandSemiBold",
                    color: "#262626",
                  },
                }}
              />
            </View>
          ) : null}
        </ScrollView>
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

const styles = StyleSheet.create({
  containerNew: { flex: 1 },
  crownBadge: {
    // position: 'absolute',
    // top: -6,
    // right: -6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
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
    padding: 16,
    paddingTop: 0,
    // backgroundColor: "#fff",
  },
  sectionContainer: {
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 10,
  },
  videoList: {
    paddingBottom: 10,
  },
  videoThumb: {
    width: 150,
    marginRight: 16,
    alignItems: "center",
  },
  videoImage: {
    width: 150,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#eee",
    verticalAlign: "top",
    marginBottom: 6,
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
    zIndex: 2,
    elevation: 4,
  },
  videoTitle: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandMedium",
    textAlign: "center",
    // width: 110,
    marginTop: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalContent: {
    width: "90%",
    height: 260,
    backgroundColor: "#222",
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: 2,
  },
  videoPlayer: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#000",
    marginTop: 30,
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
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  playButtonContainer: {
    marginRight: 16,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3EEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfoContainer: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#22274D",
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#B3B7C6",
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
  },
});
