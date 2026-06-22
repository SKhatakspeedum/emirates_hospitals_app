import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  FlatList,
  Platform,
  AppState,
  BackHandler,
} from "react-native";
import { Audio, Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SiteConfig } from "../config/site_config";
import {
  COURSES_SUB_URL,
  MUSIC_SUB_URL,
  RELATED_VIDEO_THUMB_URL,
  RELATED_VIDEO_URL,
  SPD_USER_ID,
} from "../config/config";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";
const { width } = Dimensions.get("window");

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

// Define interface for the route params
interface RouteParams {
  itemData: {
    id: string;
    module_name: string;
    module_description?: string;
    module_image?: string;
    premium?: boolean;
    module_audio_file?: string;
    [key: string]: any;
  };
  sessionData?: {
    session_name?: string;
    session_description?: string;
    session_audio_file?: string;
    [key: string]: any;
  } | null;
}

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

const MusicPlayerScreen = () => {
  // Ensure audio stays active in background
  // Ensure audio stays active in background and plays when screen is locked
  useEffect(() => {
    const setAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // Keep audio active in background (screen lock)
          playsInSilentModeIOS: true,
          interruptionModeIOS: 1, // 1 = MIX_WITH_OTHERS (Expo SDK 48+ uses numbers)
          interruptionModeAndroid: 1, // 1 = MIX_WITH_OTHERS
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("Failed to set audio mode:", e);
      }
    };
    setAudioMode();

    // Re-apply audio mode if app comes back to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setAudioMode();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Get navigation and route
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = route.params as RouteParams;
  // Extract item and session data from params
  const [itemData, setItemData] = useState(params?.itemData || null);
  const [sessionData, setSessionData] = useState(params?.sessionData || null);

  // State for audio player
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(itemData?.fav_flag === "Y");
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const positionRef = useRef(position);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // Timer ref for progress tracking
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice options state
  const [voiceOptions, setVoiceOptions] = useState<
    { label: string; file_id: string; name_type: string; file_name?: string }[]
  >([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);

  // Session duration options state
  const [sessionFiles, setSessionFiles] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  // Ambient music state
  const [ambientPopupVisible, setAmbientPopupVisible] = useState(false);
  const [selectedAmbientId, setSelectedAmbientId] = useState<string>("");

  // Helper to select ambient and close popup
  const handleAmbientSelect = (ambientId: string) => {
    setSelectedAmbientId(ambientId);
    setAmbientPopupVisible(false);
  };
  const [ambientVolume, setAmbientVolume] = useState<number>(0.9);
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null);
  const [ambientFading, setAmbientFading] = useState<boolean>(false);
  const [ambientOptions, setAmbientOptions] = useState<any[]>([]);
  const [loadingAmbient, setLoadingAmbient] = useState(false);
  const [selectedAmbientTitle, setSelectedAmbientTitle] = useState<string>("");

  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
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

  // Check if the module is already in favorites on component mount
  useEffect(() => {
    if (itemData?.module_id) {
      setIsFavorite(itemData.fav_flag === "Y");
    }

    // Fetch session files if session data is available
    if (sessionData?.id) {
      fetchSessionFiles(sessionData.id);
    }
  }, [itemData, sessionData]);

  useEffect(() => {
    fetchRelatedVideos();
    fetchAmbientMusic();
  }, []);

  const fetchRelatedVideos = async () => {
    setLoading(true);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_videos_module_wise,
        {
          p_module_id: sessionData?.module_id,
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

  // Fetch ambient music options from API
  const fetchAmbientMusic = async () => {
    setLoadingAmbient(true);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_bg_music,
        {}
      );

      if (response?.returnCode === true && response.returnData) {
        const formattedOptions = response.returnData.map((item: any) => ({
          id: item.id,
          title: item.file_name,
          audioFile: item.audio_file
            ? SiteConfig.on_mood9_ASSETS_URL +
              RELATED_VIDEO_URL +
              item.audio_file
            : "",
        }));

        setAmbientOptions(formattedOptions);

        // Set default selected ambient if available
        if (formattedOptions.length > 0) {
          setSelectedAmbientId(formattedOptions[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching ambient music:", error);
      // Fallback to default options if API fails
      setAmbientOptions([]);
      setSelectedAmbientId("");
    } finally {
      setLoadingAmbient(false);
    }
  };

  // Fetch session files from API
  const fetchSessionFiles = async (sessionId: string) => {
    try {
      setIsLoadingFiles(true);

      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_session_file,
        { p_session_id: sessionId }
      );

      if (
        response?.returnCode === true &&
        response.returnData &&
        response.returnData.length > 0
      ) {
        setSessionFiles(response.returnData);

        // Select the first file by default
        const firstFile = response.returnData[0];
        setSelectedFileId(firstFile.file_id);

        // Fetch audio file for the selected file
        fetchAudioFile(sessionId, firstFile.file_id);
      } else {
        console.log("No session files found");
      }
    } catch (error) {
      console.error("Error fetching session files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Fetch audio file data from API
  const fetchAudioFile = async (sessionId: string, fileId: string) => {
    try {
      setIsLoadingAudio(true);

      // Get the audio file data
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_category_group_module_session_audio_file,
        {
          p_session_id: sessionId,
          p_file_id: fileId,
        }
      );

      if (
        response?.returnCode === true &&
        response.returnData &&
        response.returnData.length > 0
      ) {
        // Process voice options (Male/Female) from the response
        const voiceOpts: {
          label: string;
          file_id: string;
          name_type: string;
          file_name?: string;
        }[] = [];

        response.returnData.forEach((file: any) => {
          // Determine voice type label based on name_type
          let voiceLabel = "Default";
          if (file.name_type === "F") {
            voiceLabel = "Female";
          } else if (file.name_type === "M") {
            voiceLabel = "Male";
          }

          voiceOpts.push({
            label: voiceLabel,
            file_id: file.file_id,
            name_type: file.name_type,
            file_name: file.file_name,
          });
        });

        // Sort voice options to have Female first, then Male, then others
        voiceOpts.sort((a, b) => {
          if (a.name_type === "F" && b.name_type !== "F") return -1;
          if (a.name_type !== "F" && b.name_type === "F") return 1;
          if (a.name_type === "M" && b.name_type !== "M") return -1;
          if (a.name_type !== "M" && b.name_type === "M") return 1;
          return 0;
        });

        setVoiceOptions(voiceOpts);

        // Find the index of the selected file in voice options
        const selectedIndex = voiceOpts.findIndex(
          (opt) => opt.file_id === fileId
        );
        if (selectedIndex !== -1) {
          setSelectedVoiceIndex(selectedIndex);
        }

        const audioData = response.returnData[0];

        // Construct audio URL
        if (audioData.file_name) {
          // If sound is playing, stop it before loading new audio
          if (sound) {
            if (isPlaying) {
              await sound.stopAsync();
              setIsPlaying(false);
            }
            await sound.unloadAsync();
            setSound(null);
          }

          const url =
            SiteConfig.on_mood9_ASSETS_URL +
            MUSIC_SUB_URL +
            audioData.file_name;
          setAudioUrl(url);
          // Audio will auto-play when loaded due to the useEffect watching sound
        }
      } else {
        console.log("No audio file found");
      }
    } catch (error) {
      console.error("Error fetching audio file:", error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Handle duration selection
  const handleDurationSelect = (fileId: string) => {
    if (fileId === selectedFileId || isLoadingAudio) return;

    setSelectedFileId(fileId);
    if (sessionData?.id) {
      fetchAudioFile(sessionData.id, fileId);
    }
  };

  // Function to check if the module is already in favorites
  const checkFavoriteStatus = async () => {
    try {
      // This is a placeholder - in a real app, you would have an API to check favorite status
      // For now, we'll use AsyncStorage to simulate this
      const userId = await AsyncStorage.getItem(SPD_USER_ID);
      if (userId && itemData?.module_id) {
        const favKey = `fav_${userId}_${itemData.module_id}`;
        const isFav = await AsyncStorage.getItem(favKey);
        setIsFavorite(isFav === "true");
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  // Function to toggle favorite status
  const toggleFavorite = async () => {
    if (isFavLoading) return; // Prevent multiple clicks while loading

    try {
      setIsFavLoading(true);
      const userId = await AsyncStorage.getItem(SPD_USER_ID);
      const moduleId = sessionData?.module_id;
      // Prepare request object
      const requestObj = {
        p_user_id: userId,
        p_module_id: moduleId,
      };

      // Call the appropriate API based on current favorite status
      const processId = isFavorite
        ? spd_processId_config.spdonmood9_delete_md_user_favourite_modules
        : spd_processId_config.spdonmood9_save_md_user_favourite_modules;

      const response = await callSuggestusAPI(processId, requestObj);

      if (response?.returnCode === true) {
        // Update local state
        setIsFavorite(!isFavorite);

        // Save to AsyncStorage for local state persistence
        const favKey = `fav_${userId}_${moduleId}`;
        await AsyncStorage.setItem(favKey, (!isFavorite).toString());

        // Show success message
        const message = isFavorite
          ? "Removed from favorites"
          : "Added to favorites";
        console.log(message);
      } else {
        // Show error message
        Alert.alert("Error", response?.msg || "Failed to update favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites. Please try again.");
    } finally {
      setIsFavLoading(false);
    }
  };

  // Set audio URL based on session data or item data
  useEffect(() => {
    // We don't need to set audio URL here if we're using the API to get it
    // The fetchAudioFile function will handle setting the audio URL

    // Only set a default URL if we don't have session data (which would trigger fetchSessionFiles)
    if (!sessionData?.id) {
      let url = null;

      // First check if session data has an audio file
      if (sessionData && sessionData.session_audio_file) {
        url = sessionData.session_audio_file;
      }
      // If not, check if item data has an audio file
      else if (itemData && itemData.module_audio_file) {
        url = itemData.module_audio_file;
      }

      // If a URL is found, prepend the base URL if it's a relative path
      if (url) {
        if (url.startsWith("http")) {
          setAudioUrl(url);
        } else {
          setAudioUrl(SiteConfig.on_mood9_ASSETS_URL + COURSES_SUB_URL + url);
        }
      }
    }
  }, [itemData, sessionData]);

  // Auto-play when audio URL changes
  useEffect(() => {
    if (audioUrl && sound) {
      handlePlayPause(true); // Force play
    }
  }, [sound]);

  // Stop ambient music when component unmounts or main sound stops
  useEffect(() => {
    return () => {
      // Clean up ambient sound when component unmounts
      if (ambientSound) {
        ambientSound.unloadAsync();
      }
    };
  }, []);

  // Sync ambient music with main player status
  // Resume ambient music if app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: string) => {
        if (nextAppState === "active" && ambientSound) {
          ambientSound.getStatusAsync().then((status) => {
            if (status.isLoaded && !status.isPlaying) {
              ambientSound.playAsync();
            }
          });
        }
      }
    );
    return () => subscription.remove();
  }, [ambientSound]);

  // Cleanup ambient sound on unmount
  useEffect(() => {
    return () => {
      if (ambientSound) {
        ambientSound.unloadAsync();
      }
    };
  }, [ambientSound]);

  useEffect(() => {
    const syncAmbientWithMainPlayer = async () => {
      if (!ambientSound) return;

      if (isPlaying) {
        // If main player is playing, ensure ambient is playing too
        const ambientStatus = await ambientSound.getStatusAsync();
        if (ambientStatus.isLoaded && !ambientStatus.isPlaying) {
          ambientSound.playAsync();
        }
      } else {
        // If main player is stopped, pause ambient too
        const ambientStatus = await ambientSound.getStatusAsync();
        if (ambientStatus.isLoaded && ambientStatus.isPlaying) {
          ambientSound.pauseAsync();
        }
      }
    };

    syncAmbientWithMainPlayer();
  }, [isPlaying, ambientSound]);

  // Load sound when audio URL changes
  useEffect(() => {
    if (audioUrl) {
      loadSound();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUrl]);

  // Ambient music effect
  useEffect(() => {
    // Load or switch ambient music
    const loadAmbient = async () => {
      try {
        // Set audio mode for ambient (ensure background, mixing, looping)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: 1, // MIX_WITH_OTHERS
          interruptionModeAndroid: 1, // MIX_WITH_OTHERS
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        // Ensure previous ambient is unloaded
        if (ambientSound) {
          setAmbientFading(true);
          await fadeOutAmbient();
          await ambientSound.unloadAsync();
        }
        const selectedAmbient = ambientOptions.find(
          (a) => a.id === selectedAmbientId
        );
        if (!selectedAmbient) return;

        setSelectedAmbientTitle(selectedAmbient.title);
        const { sound: newAmbient } = await Audio.Sound.createAsync(
          { uri: selectedAmbient.audioFile },
          { shouldPlay: true, isLooping: true, volume: 0 }
        );
        setAmbientSound(newAmbient);
        await fadeInAmbient(newAmbient);
        if (isMounted.current) setAmbientFading(false);
      } catch (e) {
        console.error("Failed to load/play ambient music:", e);
      }
    };
    loadAmbient();
    // Only unload on unmount, not on every effect run
    return () => {
      if (ambientSound) {
        ambientSound.getStatusAsync().then((status) => {
          if (status.isLoaded) ambientSound.unloadAsync();
        });
      }
    };
    // eslint-disable-next-line
  }, [selectedAmbientId]);

  // Ref for component mount state
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle Android hardware back button press
  useEffect(() => {
    // Define the handler for back button press
    const handleBackPress = async () => {
      // Ensure audio cleanup before navigating back
      // Stop main audio playback
      try {
        if (sound) {
          if (isPlaying) {
            await sound.stopAsync();
            setIsPlaying(false);
          }
          await sound.unloadAsync();
          setSound(null);
        }
      } catch (error) {
        console.error("Error stopping main audio:", error);
      }

      // Stop ambient sound if playing
      try {
        if (ambientSound) {
          await ambientSound.stopAsync();
          await ambientSound.unloadAsync();
          if (isMounted.current) setAmbientSound(null);
        }
      } catch (error) {
        console.error("Error stopping ambient audio:", error);
      }

      // Navigate back after cleanup
      navigation.goBack();

      // Return true to prevent default back button behavior
      return true;
    };

    // Add event listener for Android back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    // Clean up the event listener on component unmount
    return () => backHandler.remove();
  }, [sound, ambientSound, isPlaying, navigation]);

  // Ambient volume effect
  useEffect(() => {
    if (ambientSound && !ambientFading) {
      ambientSound
        .getStatusAsync()
        .then((status) => {
          if (status.isLoaded) {
            ambientSound.setVolumeAsync(ambientVolume);
          }
        })
        .catch((e) => {
          console.warn("Ambient volume set error:", e);
        });
    }
  }, [ambientVolume, ambientSound, ambientFading]);

  // Fade helpers
  const fadeOutAmbient = async () => {
    if (!ambientSound) return;
    try {
      const status = await ambientSound.getStatusAsync();
      if (!status.isLoaded) return;
      let vol = ambientVolume;
      while (vol > 0.01) {
        vol -= 0.08;
        await ambientSound.setVolumeAsync(Math.max(0, vol));
        await new Promise((res) => setTimeout(res, 25));
      }
      await ambientSound.setVolumeAsync(0);
      await ambientSound.stopAsync();
    } catch (e) {
      console.warn("fadeOutAmbient error:", e);
    }
  };

  const fadeInAmbient = async (soundObj: Audio.Sound) => {
    try {
      const status = await soundObj.getStatusAsync();
      if (!status.isLoaded) return;
      let vol = 0;
      await soundObj.setVolumeAsync(0);
      await soundObj.playAsync();
      while (vol < ambientVolume) {
        vol += 0.08;
        await soundObj.setVolumeAsync(Math.min(ambientVolume, vol));
        await new Promise((res) => setTimeout(res, 25));
      }
      await soundObj.setVolumeAsync(ambientVolume);
    } catch (e) {
      console.warn("fadeInAmbient error:", e);
    }
  };

  const loadSound = async () => {
    if (!audioUrl) return;

    if (sound) {
      await sound.unloadAsync();
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setPosition(0);
      setDuration(0);
    } catch (error) {
      console.error("Error loading sound:", error);
      Alert.alert("Error", "Failed to load audio file. Please try again.");
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      setIsPlaying(status.isPlaying);
    } else if (status.error) {
      Alert.alert("Playback Error", status.error);
    }
  };

  // --- Audio Progress Tracking ---
  // Save progress every minute while playing
  // --- Audio Progress Tracking ---
  // Save progress every 5 seconds while playing (for debugging)
  const saveProgress = async () => {
    try {
      const userId = await AsyncStorage.getItem(SPD_USER_ID);
      const sessionId = sessionData?.id;
      const moduleId = sessionData?.module_id;
      const playedSeconds = Math.floor(positionRef.current);
      if (!userId || !sessionId || !moduleId) return;
      const requestObj = {
        p_user_id: userId,
        p_session_id: sessionId,
        p_module_id: moduleId,
        p_listened_time: playedSeconds,
        p_is_repeated_fully: "N",
        p_is_fully_listened: "N",
        p_group_id: itemData?.group_id,
        p_file_id: selectedFileId,
        p_category_id: itemData?.categoryId,
      };

      await callSuggestusAPI(
        spd_processId_config.spdonmood9_save_md_user_played_sessions,
        requestObj
      );
    } catch (error) {
      // Optionally log error, but do not alert
      console.warn("[DEBUG] Error saving audio progress:", error);
    }
  };

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    // Start/stop the timer
    if (isPlaying) {
      progressTimerRef.current = setInterval(saveProgress, 10000); // 60 seconds for production
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
    // Cleanup on unmount
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying]);

  const handlePlayPause = async (forcePlay = false) => {
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (status.isPlaying && !forcePlay) {
      await sound.pauseAsync();
      setIsPlaying(false);

      // Also pause ambient sound when main player is paused
      if (ambientSound) {
        await ambientSound.pauseAsync();
      }
    } else {
      await sound.playAsync();
      setIsPlaying(true);

      // Resume ambient sound when main player is resumed
      if (ambientSound) {
        await ambientSound.playAsync();
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;
    await sound.setPositionAsync(value * 1000);
    setPosition(value);
  };

  const handleSkip = async (amount: number) => {
    if (!sound) return;
    let newPos = position + amount;
    newPos = Math.max(0, Math.min(newPos, duration));
    await sound.setPositionAsync(newPos * 1000);
    setPosition(newPos);
  };

  // Function to handle voice selection
  const handleVoiceSelect = async (index: number) => {
    // Close the dropdown
    setVoiceDropdownOpen(false);

    // If the same option is selected again, do nothing
    if (index === selectedVoiceIndex) {
      return;
    }

    // Update the selected index
    setSelectedVoiceIndex(index);

    // If we have a valid voice option
    if (voiceOptions.length > 0 && index < voiceOptions.length) {
      const selectedVoice = voiceOptions[index];

      // If the file ID is different from the current one, update it and play the new audio
      if (selectedVoice.file_id !== selectedFileId) {
        setSelectedFileId(selectedVoice.file_id);

        // We already have the audio URL from the API response, so we can construct it directly
        if (selectedVoice.file_name) {
          // If sound is playing, stop it before loading new audio
          if (sound) {
            if (isPlaying) {
              await sound.stopAsync();
              setIsPlaying(false);
            }
            await sound.unloadAsync();
            setSound(null);
          }

          const url =
            SiteConfig.on_mood9_ASSETS_URL +
            MUSIC_SUB_URL +
            selectedVoice.file_name;
          setAudioUrl(url);
          // Audio will auto-play when loaded due to the useEffect watching sound
        }
      }
    }
  };

  const handleVideoPress = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <View style={styles.container}>
        <ImageBackground
          source={require("@/assets/images/music_bg.jpg")}
          style={styles.background}
          resizeMode="cover"
        >
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={async () => {
                // Stop main audio playback
                if (sound) {
                  try {
                    if (isPlaying) {
                      await sound.stopAsync();
                      setIsPlaying(false);
                    }
                    await sound.unloadAsync();
                    setSound(null);
                  } catch (error) {
                    console.error("Error stopping main audio:", error);
                  }
                }

                // Stop ambient sound if playing
                if (ambientSound) {
                  try {
                    await ambientSound.stopAsync();
                    await ambientSound.unloadAsync();
                    setAmbientSound(null);
                  } catch (error) {
                    console.error("Error stopping ambient audio:", error);
                  }
                }

                // Navigate back
                navigation.goBack();
              }}
            >
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M7 1L2.41421 5.58579C1.63317 6.36683 1.63316 7.63316 2.41421 8.41421L7 13"
                  stroke="#8B4CFC"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "QuicksandSemiBold",
                  marginLeft: 8,
                  marginBottom: 3,
                  color: "#8B4CFC",
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={[
              Platform.OS === "web" && screenWidth >= 1024
                ? {
                    marginLeft: horizontalMargin,
                    marginRight: horizontalMargin,
                  }
                : null,
            ]}
            contentContainerStyle={{
              paddingBottom: 32,
              flexGrow: 1,
              justifyContent: "flex-start",
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Voice Selection Dropdown Button */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setVoiceDropdownOpen(true)}
            >
              <Text style={styles.dropdownText}>
                {voiceOptions.length > 0
                  ? voiceOptions[selectedVoiceIndex]?.label
                  : "Voice"}
              </Text>
              {/* <Image source={require('@/assets/images/vector_9.png')} style={styles.dropdownIcon} /> */}
              <Svg
                style={styles.dropdownIcon}
                width="14"
                height="8"
                viewBox="0 0 14 8"
                fill="none"
              >
                <Path
                  d="M13 1L8.41421 5.58578C7.63317 6.36683 6.36683 6.36683 5.58579 5.58579L1 0.999999"
                  stroke="#8B4CFC"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
            {/* Voice Selection Dropdown Modal */}
            <Modal
              visible={voiceDropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setVoiceDropdownOpen(false)}
            >
              <TouchableOpacity
                style={styles.ambientOverlay}
                activeOpacity={1}
                onPress={() => setVoiceDropdownOpen(false)}
              >
                <View
                  style={[
                    styles.ambientPopup,
                    Platform.OS === "web" && screenWidth >= 1024
                      ? { width: 450 }
                      : null,
                  ]}
                >
                  <View style={styles.ambientHeader}>
                    <Text style={styles.ambientTitle}>Select Voice</Text>
                    <TouchableOpacity
                      onPress={() => setVoiceDropdownOpen(false)}
                      style={styles.ambientCloseBtn}
                    >
                      {/* <Image source={require('@/assets/images/vector_11.png')} style={{ width: 22, height: 22, tintColor: '#222B45' }} /> */}
                      <Text style={{ fontSize: 16, color: "#000000" }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.ambientOptionsList}>
                    {voiceOptions.map((voice, index) => (
                      <TouchableOpacity
                        key={voice.file_id}
                        style={styles.ambientOption}
                        onPress={() => handleVoiceSelect(index)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            selectedVoiceIndex === index &&
                              styles.radioOuterSelected,
                          ]}
                        >
                          {selectedVoiceIndex === index && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.ambientOptionText,
                            selectedVoiceIndex === index &&
                              styles.ambientOptionTextSelected,
                          ]}
                        >
                          {voice.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Ambient Music Popup */}
            {/* Only render the modal if we have ambient options */}
            {ambientOptions.length > 0 && (
              <Modal
                visible={ambientPopupVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAmbientPopupVisible(false)}
              >
                <TouchableOpacity
                  style={styles.ambientOverlay}
                  activeOpacity={1}
                  onPress={() => setAmbientPopupVisible(false)}
                >
                  <View
                    style={[
                      styles.ambientPopup,
                      Platform.OS === "web" && screenWidth >= 1024
                        ? { width: 450 }
                        : null,
                    ]}
                  >
                    <View style={styles.ambientHeader}>
                      <Text style={styles.ambientTitle}>Ambient music</Text>
                      <TouchableOpacity
                        onPress={() => setAmbientPopupVisible(false)}
                        style={styles.ambientCloseBtn}
                      >
                        {/* <Image
                        source={require("@/assets/images/vector_11.png")}
                        style={{ width: 22, height: 22, tintColor: "#222B45" }}
                      /> */}
                        <Text style={{ fontSize: 16, color: "#000000" }}>
                          ✕
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.ambientOptionsList}>
                      {loadingAmbient ? (
                        <ActivityIndicator
                          size="large"
                          color="#8B4CFC"
                          style={{ marginVertical: 20 }}
                        />
                      ) : ambientOptions.length === 0 ? (
                        <Text style={styles.ambientHelperText}>
                          No ambient music options available
                        </Text>
                      ) : (
                        <ScrollView style={{ maxHeight: 300 }}>
                          {ambientOptions.map((opt) => (
                            <TouchableOpacity
                              key={opt.id}
                              style={[
                                styles.ambientOption,
                                selectedAmbientId === opt.id &&
                                  styles.ambientOptionSelected,
                              ]}
                              onPress={() => handleAmbientSelect(opt.id)}
                              activeOpacity={0.8}
                            >
                              <View
                                style={[
                                  styles.radioOuter,
                                  selectedAmbientId === opt.id &&
                                    styles.radioOuterSelected,
                                ]}
                              >
                                {selectedAmbientId === opt.id && (
                                  <View style={styles.radioInner} />
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.ambientOptionText,
                                  selectedAmbientId === opt.id &&
                                    styles.ambientOptionTextSelected,
                                ]}
                              >
                                {opt.title}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                    <View style={styles.ambientVolumeRow}>
                      {/* <Text style={styles.ambientVolumeLabel}>Volume</Text> */}
                      <Svg
                        width={10}
                        height={18}
                        viewBox="0 0 10 18"
                        fill="none"
                      >
                        <Path
                          d="M9 18.0004C8.766 18.0004 8.5356 17.9086 8.3637 17.7367L4.1274 13.5004H1.8C0.8073 13.5004 0 12.6931 0 11.7004V6.30037C0 5.30767 0.8073 4.50037 1.8 4.50037H4.1274L8.3637 0.264068C8.6211 0.00576847 9.0081 -0.0707315 9.3447 0.0687685C9.6813 0.208268 9.9 0.536769 9.9 0.900369V17.1004C9.9 17.464 9.6813 17.7925 9.3447 17.932C9.2331 17.9779 9.1161 18.0004 9 18.0004Z"
                          fill={"#262626"}
                        />
                      </Svg>
                      <Slider
                        style={styles.ambientSlider}
                        minimumValue={0}
                        maximumValue={1}
                        value={ambientVolume}
                        minimumTrackTintColor="#8B4CFC"
                        maximumTrackTintColor="#E0E5F2"
                        thumbTintColor="#8B4CFC"
                        onValueChange={setAmbientVolume}
                      />
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <Path
                          d="M14.724 15.6245C14.4927 15.6245 14.2614 15.5354 14.0859 15.359C13.7349 15.0062 13.7367 14.4365 14.0895 14.0855C15.4503 12.7337 16.2 10.9283 16.2 9.00045C16.2 7.07265 15.4503 5.26725 14.0895 3.91545C13.7367 3.56445 13.7349 2.99565 14.0859 2.64195C14.436 2.28915 15.0048 2.28735 15.3585 2.63835C17.0622 4.33125 18 6.59025 18 9.00045C18 11.4107 17.0622 13.6697 15.3585 15.3626C15.183 15.5372 14.9535 15.6245 14.724 15.6245Z"
                          fill="#262626"
                        />
                        <Path
                          d="M12.1771 13.0774C11.9449 13.0774 11.7127 12.9883 11.5372 12.8101C11.1871 12.4564 11.1907 11.8867 11.5444 11.5375C12.2149 10.8742 12.6001 9.94902 12.6001 9.00042C12.6001 8.05182 12.2149 7.12662 11.5444 6.46332C11.1907 6.11412 11.188 5.54442 11.5372 5.19072C11.8864 4.83792 12.4561 4.83432 12.8098 5.18352C13.8205 6.18252 14.4001 7.57392 14.4001 9.00042C14.4001 10.4269 13.8205 11.8183 12.8098 12.8173C12.6343 12.991 12.4057 13.0774 12.1771 13.0774Z"
                          fill="#262626"
                        />
                        <Path
                          d="M9 18.0004C8.766 18.0004 8.5356 17.9086 8.3637 17.7367L4.1274 13.5004H1.8C0.8073 13.5004 0 12.6931 0 11.7004V6.30037C0 5.30767 0.8073 4.50037 1.8 4.50037H4.1274L8.3637 0.264068C8.6211 0.00576847 9.0081 -0.0707315 9.3447 0.0687685C9.6813 0.208268 9.9 0.536769 9.9 0.900369V17.1004C9.9 17.464 9.6813 17.7925 9.3447 17.932C9.2331 17.9779 9.1161 18.0004 9 18.0004Z"
                          fill="#262626"
                        />
                      </Svg>
                    </View>
                    <Text style={styles.ambientHelperText}>
                      Use headphones to experience 3D music.
                    </Text>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}

            {/* Main Audio Image */}
            <View style={styles.imageWrapperContianer}>
              <View style={styles.imageWrapper}>
                <Image
                  source={
                    itemData?.module_image
                      ? {
                          uri:
                            SiteConfig.on_mood9_ASSETS_URL +
                            COURSES_SUB_URL +
                            itemData.module_image,
                        }
                      : require("@/assets/images/music_place_holder.png")
                  }
                  style={styles.albumArt}
                />
              </View>
              {/* Audio Details */}
              <View style={styles.detailsWrapper}>
                <Text style={styles.title}>{itemData?.module_name}</Text>
                <Text style={styles.subtitle}>{itemData?.course_name}</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressWrapper}>
                <Text style={styles.progressTime}>{formatTime(position)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={position}
                  minimumTrackTintColor="#8B4CFC"
                  maximumTrackTintColor="#E0E5F2"
                  thumbTintColor="#8B4CFC"
                  onSlidingComplete={handleSeek}
                />
                <Text style={styles.progressTime}>{formatTime(duration)}</Text>
              </View>

              {/* Controls */}
              <View style={styles.controlsWrapper}>
                <TouchableOpacity
                  onPress={toggleFavorite}
                  style={styles.controlBtn}
                >
                  {isFavLoading ? (
                    <ActivityIndicator size="small" color="#8B4CFC" />
                  ) : isFavorite ? (
                    <FontAwesome name="heart" size={30} color="red" />
                  ) : (
                    <FontAwesome name="heart-o" size={30} color="#898D9E" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSkip(-15)}
                  style={styles.controlBtn}
                >
                  <Svg width={30} height={33} viewBox="0 0 30 33" fill="none">
                    <Path
                      d="M11.808 23C11.624 23 11.472 22.944 11.352 22.832C11.232 22.712 11.172 22.564 11.172 22.388V15.956L11.328 16.172L10.212 16.952C10.116 17.032 10 17.072 9.864 17.072C9.704 17.072 9.56 17.012 9.432 16.892C9.312 16.764 9.252 16.616 9.252 16.448C9.252 16.24 9.356 16.068 9.564 15.932L11.388 14.72C11.46 14.672 11.536 14.64 11.616 14.624C11.704 14.608 11.784 14.6 11.856 14.6C12.04 14.6 12.188 14.66 12.3 14.78C12.412 14.892 12.468 15.036 12.468 15.212V22.388C12.468 22.564 12.404 22.712 12.276 22.832C12.156 22.944 12 23 11.808 23ZM16.4618 23.084C16.1498 23.084 15.8258 23.036 15.4898 22.94C15.1618 22.844 14.8818 22.7 14.6498 22.508C14.5618 22.436 14.4938 22.344 14.4458 22.232C14.3978 22.12 14.3738 22.012 14.3738 21.908C14.3738 21.796 14.4218 21.688 14.5178 21.584C14.6218 21.472 14.7618 21.416 14.9378 21.416C15.0658 21.416 15.2138 21.48 15.3818 21.608C15.5418 21.712 15.7098 21.8 15.8858 21.872C16.0698 21.944 16.2578 21.98 16.4498 21.98C16.8658 21.98 17.2258 21.904 17.5298 21.752C17.8338 21.6 18.0658 21.388 18.2258 21.116C18.3938 20.836 18.4778 20.512 18.4778 20.144C18.4778 19.8 18.4018 19.508 18.2498 19.268C18.0978 19.02 17.8898 18.828 17.6258 18.692C17.3698 18.556 17.0818 18.488 16.7617 18.488C16.4978 18.488 16.2658 18.532 16.0658 18.62C15.8658 18.7 15.6858 18.784 15.5258 18.872C15.3658 18.952 15.2178 18.992 15.0818 18.992C14.8738 18.992 14.7178 18.948 14.6138 18.86C14.5098 18.764 14.4418 18.652 14.4098 18.524C14.3858 18.388 14.3818 18.264 14.3978 18.152L14.8178 15.14C14.8418 15.004 14.9058 14.892 15.0098 14.804C15.1218 14.708 15.2578 14.66 15.4178 14.66H18.9338C19.0938 14.66 19.2258 14.716 19.3298 14.828C19.4418 14.932 19.4978 15.064 19.4978 15.224C19.4978 15.384 19.4418 15.516 19.3298 15.62C19.2258 15.724 19.0938 15.776 18.9338 15.776H15.7178L15.8498 15.668L15.4658 18.248L15.2858 17.888C15.3578 17.808 15.4778 17.732 15.6458 17.66C15.8218 17.58 16.0178 17.516 16.2338 17.468C16.4578 17.412 16.6818 17.384 16.9058 17.384C17.4338 17.384 17.9058 17.504 18.3218 17.744C18.7458 17.976 19.0778 18.3 19.3178 18.716C19.5578 19.132 19.6778 19.604 19.6778 20.132C19.6778 20.724 19.5458 21.244 19.2818 21.692C19.0178 22.132 18.6458 22.476 18.1658 22.724C17.6858 22.964 17.1178 23.084 16.4618 23.084Z"
                      fill="#898D9E"
                    />
                    <Path
                      d="M3.15661 8.98601C3.54577 8.50619 4.24837 8.4284 4.73307 8.81146C5.21778 9.19453 5.30444 9.89609 4.92753 10.3856C3.1889 12.5719 2.24717 15.2854 2.25761 18.0788C2.25613 24.7461 7.52089 30.2242 14.183 30.4875C20.8451 30.7508 26.5257 25.7052 27.0504 19.0585C27.575 12.4119 22.7564 6.53753 16.1355 5.7523L17.6643 7.06328C18.1189 7.47307 18.1641 8.17055 17.7661 8.63557C17.3682 9.10059 16.6721 9.16367 16.197 8.77777L12.2466 5.39169C11.9962 5.17725 11.8521 4.86408 11.8521 4.53444C11.8521 4.2048 11.9962 3.89163 12.2466 3.6772L16.197 0.291116C16.5016 0.0165099 16.9313 -0.0712089 17.3192 0.0619977C17.7071 0.195204 17.9923 0.528368 18.064 0.93221C18.1357 1.33605 17.9826 1.747 17.6643 2.0056L15.9605 3.46557C23.8667 4.16187 29.7862 11.0187 29.321 18.9419C28.8559 26.8651 22.1749 32.9822 14.2415 32.7487C6.30811 32.5152 -0.00153542 26.0156 0.000219345 18.0788C-0.0118465 14.7772 1.10146 11.57 3.15661 8.98601Z"
                      fill="#898D9E"
                    />
                    <Path
                      d="M10.4514 8.65451C10.2566 8.88195 9.97935 9.02264 9.68076 9.04561C9.38217 9.06858 9.08669 8.97194 8.85938 8.77697L4.90895 5.39089C4.65858 5.17646 4.51448 4.86329 4.51448 4.53365C4.51448 4.20401 4.65858 3.89084 4.90895 3.6764L8.85938 0.290323C9.16404 0.0157164 9.59369 -0.0720023 9.98162 0.0612042C10.3695 0.194411 10.6547 0.527574 10.7264 0.931417C10.7981 1.33526 10.645 1.74621 10.3267 2.00481L7.37797 4.53478L10.3278 7.06362C10.8011 7.4689 10.8564 8.181 10.4514 8.65451Z"
                      fill="#898D9E"
                    />
                  </Svg>

                  {/* <Image
                  source={require("@/assets/images/rewind_music.png")}
                  style={styles.controlIcon}
                /> */}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePlayPause()}
                  style={[styles.controlBtnPlay]}
                >
                  {isPlaying ? (
                    <FontAwesome name="pause" size={30} color="#FFFFFF" />
                  ) : (
                    <FontAwesome name="play" size={30} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSkip(15)}
                  style={styles.controlBtn}
                >
                  <Svg width={30} height={33} viewBox="0 0 30 33" fill="none">
                    <Path
                      d="M11.808 23C11.624 23 11.472 22.944 11.352 22.832C11.232 22.712 11.172 22.564 11.172 22.388V15.956L11.328 16.172L10.212 16.952C10.116 17.032 10 17.072 9.864 17.072C9.704 17.072 9.56 17.012 9.432 16.892C9.312 16.764 9.252 16.616 9.252 16.448C9.252 16.24 9.356 16.068 9.564 15.932L11.388 14.72C11.46 14.672 11.536 14.64 11.616 14.624C11.704 14.608 11.784 14.6 11.856 14.6C12.04 14.6 12.188 14.66 12.3 14.78C12.412 14.892 12.468 15.036 12.468 15.212V22.388C12.468 22.564 12.404 22.712 12.276 22.832C12.156 22.944 12 23 11.808 23ZM16.4618 23.084C16.1498 23.084 15.8258 23.036 15.4898 22.94C15.1618 22.844 14.8818 22.7 14.6498 22.508C14.5618 22.436 14.4938 22.344 14.4458 22.232C14.3978 22.12 14.3738 22.012 14.3738 21.908C14.3738 21.796 14.4218 21.688 14.5178 21.584C14.6218 21.472 14.7618 21.416 14.9378 21.416C15.0658 21.416 15.2138 21.48 15.3818 21.608C15.5418 21.712 15.7098 21.8 15.8858 21.872C16.0698 21.944 16.2578 21.98 16.4498 21.98C16.8658 21.98 17.2258 21.904 17.5298 21.752C17.8338 21.6 18.0658 21.388 18.2258 21.116C18.3938 20.836 18.4778 20.512 18.4778 20.144C18.4778 19.8 18.4018 19.508 18.2498 19.268C18.0978 19.02 17.8898 18.828 17.6258 18.692C17.3698 18.556 17.0818 18.488 16.7617 18.488C16.4978 18.488 16.2658 18.532 16.0658 18.62C15.8658 18.7 15.6858 18.784 15.5258 18.872C15.3658 18.952 15.2178 18.992 15.0818 18.992C14.8738 18.992 14.7178 18.948 14.6138 18.86C14.5098 18.764 14.4418 18.652 14.4098 18.524C14.3858 18.388 14.3818 18.264 14.3978 18.152L14.8178 15.14C14.8418 15.004 14.9058 14.892 15.0098 14.804C15.1218 14.708 15.2578 14.66 15.4178 14.66H18.9338C19.0938 14.66 19.2258 14.716 19.3298 14.828C19.4418 14.932 19.4978 15.064 19.4978 15.224C19.4978 15.384 19.4418 15.516 19.3298 15.62C19.2258 15.724 19.0938 15.776 18.9338 15.776H15.7178L15.8498 15.668L15.4658 18.248L15.2858 17.888C15.3578 17.808 15.4778 17.732 15.6458 17.66C15.8218 17.58 16.0178 17.516 16.2338 17.468C16.4578 17.412 16.6818 17.384 16.9058 17.384C17.4338 17.384 17.9058 17.504 18.3218 17.744C18.7458 17.976 19.0778 18.3 19.3178 18.716C19.5578 19.132 19.6778 19.604 19.6778 20.132C19.6778 20.724 19.5458 21.244 19.2818 21.692C19.0178 22.132 18.6458 22.476 18.1658 22.724C17.6858 22.964 17.1178 23.084 16.4618 23.084Z"
                      fill="#898D9E"
                    />
                    <Path
                      d="M26.1901 8.98601C25.8009 8.50619 25.0983 8.4284 24.6136 8.81146C24.1289 9.19453 24.0422 9.89609 24.4191 10.3856C26.1578 12.5719 27.0995 15.2854 27.0891 18.0788C27.0906 24.7461 21.8258 30.2242 15.1637 30.4875C8.50159 30.7508 2.82095 25.7052 2.2963 19.0585C1.77165 12.4119 6.59031 6.53753 13.2112 5.7523L11.6824 7.06328C11.2278 7.47307 11.1826 8.17055 11.5805 8.63557C11.9785 9.10059 12.6746 9.16367 13.1497 8.77777L17.1001 5.39169C17.3505 5.17725 17.4946 4.86408 17.4946 4.53444C17.4946 4.2048 17.3505 3.89163 17.1001 3.6772L13.1497 0.291116C12.845 0.01651 12.4154 -0.07121 12.0275 0.061998C11.6395 0.195204 11.3544 0.528368 11.2827 0.93221C11.211 1.33605 11.364 1.747 11.6824 2.0056L13.3862 3.46557C5.47994 4.16187 -0.439489 11.0187 0.0256298 18.9419C0.490748 26.8651 7.17179 32.9822 15.1052 32.7487C23.0386 32.5152 29.3482 26.0156 29.3465 18.0788C29.3585 14.7772 28.2452 11.57 26.1901 8.98601Z"
                      fill="#898D9E"
                    />
                    <Path
                      d="M18.8953 8.65451C19.0901 8.88195 19.3673 9.02264 19.6659 9.04561C19.9645 9.06858 20.26 8.97194 20.4873 8.77697L24.4377 5.39089C24.6881 5.17646 24.8322 4.86329 24.8322 4.53365C24.8322 4.20401 24.6881 3.89084 24.4377 3.6764L20.4873 0.290323C20.1826 0.0157164 19.753 -0.0720023 19.3651 0.0612042C18.9771 0.194411 18.692 0.527574 18.6203 0.931417C18.5486 1.33526 18.7016 1.74621 19.02 2.00481L21.9687 4.53478L19.0189 7.06362C18.5456 7.4689 18.4903 8.181 18.8953 8.65451Z"
                      fill="#898D9E"
                    />
                  </Svg>

                  {/* <Image
                  source={require("@/assets/images/forward_music.png")}
                  style={styles.controlIcon}
                /> */}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    // Navigate to MusicInfoScreen with item data
                    navigation.navigate("music_player/MusicInfoScreen", {
                      itemData: {
                        id: itemData?.module_id || sessionData?.id || "unknown",
                        title:
                          sessionData?.session_name ||
                          itemData?.module_name ||
                          "Audio Track",
                        image: itemData?.module_image
                          ? SiteConfig.on_mood9_ASSETS_URL +
                            COURSES_SUB_URL +
                            itemData.module_image
                          : null,
                        description:
                          itemData?.long_description ||
                          sessionData?.session_description ||
                          itemData?.module_description ||
                          "No description available.",
                      },
                    });
                  }}
                  style={styles.controlBtn}
                >
                  <Image
                    source={require("@/assets/images/music_info.png")}
                    style={styles.controlIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* Session Duration Options */}
            {sessionFiles.length > 0 && (
              <View style={styles.durationContainer}>
                {sessionFiles.map((file) => (
                  <TouchableOpacity
                    key={file.file_id}
                    style={[
                      styles.durationButton,
                      selectedFileId === file.file_id &&
                        styles.durationButtonSelected,
                    ]}
                    onPress={() => handleDurationSelect(file.file_id)}
                    disabled={isLoadingAudio}
                  >
                    {isLoadingAudio && selectedFileId === file.file_id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.durationText,
                          selectedFileId === file.file_id &&
                            styles.durationTextSelected,
                        ]}
                      >
                        {file.file_name.trim()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Ambient Music Button and Display - Only show if options are available */}
            {ambientOptions.length > 0 && (
              <TouchableOpacity
                style={styles.ambientMusicButton}
                onPress={() => setAmbientPopupVisible(true)}
              >
                <View style={styles.ambientMusicContent}>
                  {/* <Image
                  source={require("@/assets/images/music_info.png")}
                  style={styles.ambientMusicIcon}
                /> */}
                  <View style={styles.ambientMusicTextContainer}>
                    <Text style={styles.ambientMusicLabel}>Ambient music</Text>
                    {selectedAmbientTitle ? (
                      <Text style={styles.selectedAmbientTitle}>
                        {selectedAmbientTitle}
                      </Text>
                    ) : (
                      <Text style={styles.ambientMusicText}>
                        Select ambient music
                      </Text>
                    )}
                  </View>
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                    <Path
                      d="M17.3756 8.27579H0.669227C0.503651 8.27579 0.344857 8.34156 0.227777 8.45864C0.110697 8.57572 0.0449219 8.73452 0.0449219 8.90009C0.0449219 9.06567 0.110697 9.22446 0.227777 9.34154C0.344857 9.45862 0.503651 9.5244 0.669227 9.5244H17.3756C17.5412 9.5244 17.7 9.45862 17.8171 9.34154C17.9342 9.22446 17.9999 9.06567 17.9999 8.90009C17.9999 8.73452 17.9342 8.57572 17.8171 8.45864C17.7 8.34156 17.5412 8.27579 17.3756 8.27579Z"
                      fill="white"
                    />
                    <Path
                      d="M9.15995 3.28136H17.3758C17.5414 3.28136 17.7002 3.21558 17.8173 3.0985C17.9343 2.98142 18.0001 2.82263 18.0001 2.65705C18.0001 2.49147 17.9343 2.33268 17.8173 2.2156C17.7002 2.09852 17.5414 2.03275 17.3758 2.03275H9.15995C8.99437 2.03275 8.83558 2.09852 8.7185 2.2156C8.60142 2.33268 8.53564 2.49147 8.53564 2.65705C8.53564 2.82263 8.60142 2.98142 8.7185 3.0985C8.83558 3.21558 8.99437 3.28136 9.15995 3.28136Z"
                      fill="white"
                    />
                    <Path
                      d="M8.81769 14.5189H0.624305C0.458729 14.5189 0.299935 14.5846 0.182855 14.7017C0.0657748 14.8188 0 14.9776 0 15.1432C0 15.3087 0.0657748 15.4675 0.182855 15.5846C0.299935 15.7017 0.458729 15.7675 0.624305 15.7675H8.81769C8.98326 15.7675 9.14206 15.7017 9.25914 15.5846C9.37622 15.4675 9.44199 15.3087 9.44199 15.1432C9.44199 14.9776 9.37622 14.8188 9.25914 14.7017C9.14206 14.5846 8.98326 14.5189 8.81769 14.5189Z"
                      fill="white"
                    />
                    <Path
                      d="M17.3606 14.5188H13.5972V13.0555C13.5972 12.8899 13.5315 12.7311 13.4144 12.614C13.2973 12.4969 13.1385 12.4312 12.9729 12.4312C12.8074 12.4312 12.6486 12.4969 12.5315 12.614C12.4144 12.7311 12.3486 12.8899 12.3486 13.0555V17.2308C12.3486 17.3964 12.4144 17.5552 12.5315 17.6723C12.6486 17.7893 12.8074 17.8551 12.9729 17.8551C13.1385 17.8551 13.2973 17.7893 13.4144 17.6723C13.5315 17.5552 13.5972 17.3964 13.5972 17.2308V15.7674H17.3606C17.5261 15.7674 17.6849 15.7017 17.802 15.5846C17.9191 15.4675 17.9849 15.3087 17.9849 15.1431C17.9849 14.9776 17.9191 14.8188 17.802 14.7017C17.6849 14.5846 17.5261 14.5188 17.3606 14.5188Z"
                      fill="white"
                    />
                    <Path
                      d="M0.669227 3.31881H4.43254V4.7647C4.43254 4.93027 4.49831 5.08907 4.61539 5.20615C4.73247 5.32323 4.89127 5.389 5.05684 5.389C5.22242 5.389 5.38122 5.32323 5.4983 5.20615C5.61538 5.08907 5.68115 4.93027 5.68115 4.7647V0.624306C5.68115 0.458729 5.61538 0.299935 5.4983 0.182855C5.38122 0.0657748 5.22242 0 5.05684 0C4.89127 0 4.73247 0.0657748 4.61539 0.182855C4.49831 0.299935 4.43254 0.458729 4.43254 0.624306V2.0702H0.669227C0.503651 2.0702 0.344857 2.13597 0.227777 2.25305C0.110697 2.37013 0.0449219 2.52893 0.0449219 2.6945C0.0449219 2.86008 0.110697 3.01887 0.227777 3.13595C0.344857 3.25303 0.503651 3.31881 0.669227 3.31881Z"
                      fill="white"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
            )}

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
                                  <View style={styles.playButtonWrapper} pointerEvents="none">
                                    <View style={styles.playCircle}>
                                      <Ionicons
                                        name="play"
                                        size={20}
                                        color="#fff"
                                        style={{ marginLeft: 2 }}
                                      />
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
          </ScrollView>
        </ImageBackground>

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
                  ? { width: 900, height: 600 }
                  : null,
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
                      Platform.OS === "web" && screenWidth >= 1024
                        ? { width: 900, height: 540, marginTop: 30 }
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
                    style={[
                      styles.videoPlayer
                    ]}
                    useNativeControls
                    resizeMode="contain"
                    shouldPlay
                  />
                )
              ) : null}
            </View>
          </View>
        </Modal>

        {/* Info Modal */}
        <Modal
          visible={showInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
        >
          <TouchableOpacity
            style={styles.infoOverlay}
            onPress={() => setShowInfo(false)}
          >
            <View style={styles.infoModal}>
              <Text style={styles.infoTitle}>About this audio</Text>
              <Text style={styles.infoContent}>
                This is a placeholder for additional information about the audio
                track.
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
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
        {mainContent}
      </ImageBackground>
    );
  }
  return mainContent;
};

const styles = StyleSheet.create({
  containerNew: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 10,
    marginLeft: 0,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    height: Platform.OS === "ios" ? 75 : 80,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  ambientMusicButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 12,
    // backgroundColor: "#F0F0F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E5F2",
    backgroundColor: "#a098b9",
  },
  ambientMusicContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  ambientMusicIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    // tintColor: "#8B4CFC",
  },
  ambientMusicTextContainer: {
    flex: 1,
  },
  ambientMusicLabel: {
    fontSize: 14,
    fontFamily: "QuicksandRegular",
    color: "#fff",
  },
  selectedAmbientTitle: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#fff",
    marginTop: 2,
  },
  ambientMusicText: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#22274D",
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    // backgroundColor: "#000",
    height: "100%",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoThumb: {
    width: 120,
    marginRight: 16,
    alignItems: "center",
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
  videoModalContent: {
    width: "90%",
    height: 260,
    backgroundColor: "#222",
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  videoList: {
    paddingBottom: 10,
  },
  videoImage: {
    width: 120,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginBottom: 6,
  },
  videoTitle: {
    fontSize: 14,
    color: "#22274D",
    fontFamily: "QuicksandRegular",
    textAlign: "center",
    width: 110,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "QuicksandSemiBold",
    color: "#22274D",
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
    paddingTop: 0,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: 'space-between',
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 0,
    paddingVertical: 16,
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    // padding: 8,
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
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    // backgroundColor: '#E9EEF7',
    // borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
    marginLeft: 0,
  },
  dropdownText: {
    fontSize: 15,
    color: "#222B45",
    fontWeight: "600",
    marginRight: 5,
  },
  dropdownIcon: {
    marginTop: 2,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 24,
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#222B45",
  },
  imageWrapperContianer: {
    paddingHorizontal: 16,
    width: "100%",
    marginTop: 15,
  },
  imageWrapper: {
    width: "100%",
    height: 220,
    borderRadius: 32,
    backgroundColor: "#E9EEF7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#BFD5F7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  playButtonWrapper: {
    position: "absolute",
    top: "25%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  playCircle: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: "rgba(160, 160, 160, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 2,
    elevation: 2,
  },
  albumArt: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    resizeMode: "cover",
  },
  detailsWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontFamily: "QuicksandBold",
    color: "#262626",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#262626",
  },
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 32,
  },
  progressTime: {
    fontSize: 13,
    color: "#6B7A99",
    width: 40,
    textAlign: "center",
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
    height: 30,
  },
  controlsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 18,
    marginBottom: 18,
  },
  controlBtn: {
    padding: 2,
    // borderRadius: 24,
    // backgroundColor: '#E9EEF7',
    marginHorizontal: 4,
  },
  controlBtnPlay: {
    height: 66,
    width: 66,
    backgroundColor: "#8B4CFC",
    borderRadius: 66,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // playBtn: {
  //   backgroundColor: '#8B4CFC',
  //   shadowColor: '#8B4CFC',
  //   shadowOpacity: 0.18,
  //   shadowRadius: 8,
  //   elevation: 3,
  // },
  controlIcon: {
    // width: 25,
    // height: 25,
    padding: 5,
    // tintColor: '#8B4CFC',
  },
  favoriteIcon: {
    // tintColor: '#FF4757',
  },
  playIcon: {
    width: 38,
    height: 38,
    tintColor: "#fff",
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: width - 64,
    alignItems: "center",
  },
  infoTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    color: "#222B45",
  },
  infoContent: {
    fontSize: 15,
    color: "#6B7A99",
    textAlign: "center",
  },
  // Ambient music styles
  ambientOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  ambientPopup: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    width: width - 48,
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 6,
    alignItems: "stretch",
  },
  ambientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    // borderBottomWidth: 1,
    // borderBottomColor: "#ddd",
    paddingBottom: 8,
  },
  ambientTitle: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#262626",
  },
  ambientCloseBtn: {
    padding: 5,
  },
  ambientOptionsList: {
    marginVertical: 8,
  },
  ambientOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#898d9f66",
    padding: 12,
    borderRadius: 8,
  },
  ambientOptionSelected: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#898d9f66",
    backgroundColor: "#8B4CFC1A",
    padding: 12,
    borderRadius: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#C5C7D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    backgroundColor: "transparent",
  },
  radioOuterSelected: {
    borderColor: "#C5C7D0",
    backgroundColor: "transparent",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#8B4CFC",
    marginLeft: 0,
  },
  ambientOptionText: {
    fontSize: 16,
    color: "#222B45",
    fontFamily: "QuicksandMedium",
  },
  ambientOptionTextSelected: {
    color: "#222B45",
    fontFamily: "QuicksandSemiBold",
  },
  ambientVolumeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 4,
    gap: 10,
    backgroundColor: "#8b4cfc1a",
    padding: 12,
    borderRadius: 8,
  },
  ambientVolumeLabel: {
    fontSize: 15,
    color: "#6B7A99",
    marginRight: 12,
    width: 60,
  },
  ambientSlider: {
    flex: 1,
    height: 32,
  },
  ambientHelperText: {
    fontSize: 14,
    color: "#262626",
    marginTop: 6,
    // textAlign: "center",
  },
  // Duration selection styles
  durationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    width: "100%",
    paddingHorizontal: 20,
    gap: 10,
  },
  durationButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#898D9E66",
  },
  durationButtonSelected: {
    borderColor: "#8B4CFC",
    backgroundColor: "#FFFFFF66",
  },
  durationText: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  durationTextSelected: {
    color: "#262626",
  },
});

export default MusicPlayerScreen;
