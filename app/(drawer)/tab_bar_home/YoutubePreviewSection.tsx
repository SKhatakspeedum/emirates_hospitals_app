import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Dimensions,
  Modal,
  Alert,
  Platform,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { Ionicons } from "@expo/vector-icons";
import { callSuggestusAPI } from "@/app/suggestus_plugin/suggestusClient";
import { spd_processId_config } from "@/app/config/process_id";

const CARD_WIDTH = Math.round(Dimensions.get("window").width * 0.62);
const CARD_HEIGHT = 140;

export default function YoutubePreviewSection() {
  // Responsive modal size for web desktop
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width,
  );
  useEffect(() => {
    if (Platform.OS === "web") {
      const updateScreenWidth = () =>
        setScreenWidth(Dimensions.get("window").width);
      window.addEventListener("resize", updateScreenWidth);
      return () => window.removeEventListener("resize", updateScreenWidth);
    }
  }, []);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleGoToChannel = () => {
    // Replace with navigation or Linking.openURL as needed
    // Linking.openURL('https://youtube.com/channel/xyz');
    console.log("Go to channel");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_youtube_videos_widget_data,
          {},
        );
        // Assuming response is an array of plans, each with a 'thumb' property
        if (response?.returnCode === true) {
          let YoutubeData = response.returnData;
          setYoutubeVideos(YoutubeData);
        }
      } catch (e) {
        // Optionally handle error
        if (mounted) setYoutubeVideos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Function to extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;

    // Handle standard YouTube URLs
    let regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    }

    return null;
  };

  // Handle video play using YouTube iframe player
  const handlePlayVideo = (item: any) => {
    const id = extractYoutubeId(item.url);
    if (!id) {
      Alert.alert("Error", "Invalid YouTube URL");
      return;
    }

    // Set video ID and show modal
    setVideoId(id);
    setPlaying(true);
    setModalVisible(true);
  };

  // Handle state change in the YouTube player
  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // Close the modal and reset player
  const closeModal = () => {
    setPlaying(false);
    setModalVisible(false);
  };

  const renderVideoCard = ({ item }: any) => {
    return (
      <View
        style={[
          styles.card,
          Platform.OS === "web" && { width: 200, height: 200 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.thumbnail,
            Platform.OS === "web" && { width: 200, height: 200 },
          ]}
          activeOpacity={0.85}
          onPress={() => handlePlayVideo(item)}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            imageStyle={styles.thumbnailImg}
          >
            {/* Dark overlay for readability */}
            <View style={styles.overlay} />
            {/* Play button overlay */}
            <View style={styles.playButtonWrapper} pointerEvents="none">
              <View style={styles.playCircle}>
                <Ionicons
                  name="play"
                  size={28}
                  color="#fff"
                  style={{ marginLeft: 2 }}
                />
              </View>
            </View>
            {/* Video title */}

            <View style={styles.imageOverlay}></View>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.sectionWrapper,
        Platform.OS === "web" && {
          marginTop: 30,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Youtube</Text>
        {/* <TouchableOpacity onPress={handleGoToChannel} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.channelLink}>Go to channel  
          <Svg width={5} height={9} viewBox="0 0 5 9" fill="none">
          <Path
            d="M1 1L3.27983 2.99485C4.19048 3.79167 4.19048 5.20833 3.27982 6.00515L1 8"
            stroke="#8B4CFC"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </Svg>
      </Text>
        </TouchableOpacity> */}
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={youtubeVideos}
        keyExtractor={(_, idx) => `yt-${idx}`}
        renderItem={renderVideoCard}
        contentContainerStyle={styles.carouselContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />

      {/* YouTube Player Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              Platform.OS === "web" && screenWidth >= 1024
                ? {
                    width: 800,
                    height: 500,
                    justifyContent: "center",
                    alignItems: "center",
                  }
                : {},
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {videoId && (
              <YoutubePlayer
                height={
                  Platform.OS === "web" && screenWidth >= 1024 ? 400 : 200
                }
                width={
                  Platform.OS === "web" && screenWidth >= 1024
                    ? 700
                    : Dimensions.get("window").width * 0.9
                }
                play={playing}
                videoId={videoId}
                onChangeState={onStateChange}
                webViewProps={{
                  androidLayerType:
                    Platform.OS === "android" ? "hardware" : undefined,
                }}
                initialPlayerParams={{
                  preventFullScreen: false,
                  controls: true,
                  modestbranding: true,
                  rel: false,
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrapper: {
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
  },
  channelLink: {
    color: "#8B4CFC",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
    alignItems: "center",
    display: "flex",
    gap: 4,
  },
  carouselContent: {
    paddingLeft: 2,
    paddingRight: 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 2,
    backgroundColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbnail: {
    flex: 1,
    justifyContent: "flex-end",
  },
  thumbnailImg: {
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
    zIndex: 1,
  },
  playButtonWrapper: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 2,
    elevation: 2,
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
  videoTitle: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
    margin: 10,
    marginBottom: 12,
    zIndex: 2,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
