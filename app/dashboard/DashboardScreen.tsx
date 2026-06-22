import React, { useRef, useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  ImageBackground,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { SiteConfig } from "@/app/config/site_config";
import {
  COURSES_SUB_URL,
  SPD_USER_NAME,
  SPD_USER_SUBSCRIPTION,
} from "@/app/config/config";
import * as Progress from "react-native-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import QuickActionButtonsGrid from "../(drawer)/tab_bar_home/QuickActionButtonsGrid";
import YoutubePreviewSection from "../(drawer)/tab_bar_home/YoutubePreviewSection";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const Tab = createBottomTabNavigator();
const HEADER_HEIGHT = 0;

// Home Screen Component
function DashboardScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [userProfileName, setUserProfileName] = useState<any>(null);
  const [moodPrompt, setMoodPrompt] = useState("");
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width,
  );

  // State for sleep widget API
  const [sleepWidget, setSleepWidget] = useState<any>(null);
  const [sleepWidgetLoading, setSleepWidgetLoading] = useState(true);
  const [sleepWidgetError, setSleepWidgetError] = useState<string | null>(null);

  const moodPrompts = [
    "How’s your mood right now?",
    "What’s going on in your mind?",
    "Feeling okay today?",
    "Where’s your head at today?",
    "What emotion is strongest right now?",
    "What’s your vibe today?",
    "Take a breath — how do you feel?",
    "What's your current mood?",
    "How are things with you today?",
    "What’s your inner weather like?",
    "Emotion check — what’s showing up?",
    "What word describes your mood now?",
    "Feeling calm or stormy today?",
    "Pause and check — how are you?",
    "What’s your mental state right now?",
    "Is today a good day or tough one?",
    "What’s your emotional energy level?",
    "Any big feelings today?",
    "Mood check-in: what’s going on?",
    "Describe how you feel right now.",
  ];

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  useEffect(() => {
    AsyncStorage.getItem(SPD_USER_NAME).then((value) => {
      setUserProfileName(value);
    });
    // Pick a random prompt on mount
    const randomIndex = Math.floor(Math.random() * moodPrompts.length);
    setMoodPrompt(moodPrompts[randomIndex]);
  }, []);

  // Listen for window resize events to update screen width
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(Dimensions.get("window").width);
    };

    if (Platform.OS === "web") {
      // Add event listener for window resize on web
      const subscription = Dimensions.addEventListener(
        "change",
        updateScreenWidth,
      );
      return () => subscription?.remove();
    }
  }, []);

  // Fetch sleep widget data (sleep quality, duration, panda image)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setSleepWidgetLoading(true);
      setSleepWidgetError(null);
      try {
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_md_user_sleep_hygiene_check_out_30_day_sleep_quality_widget,
          {},
        );
        if (response?.returnCode === true && mounted) {
          setSleepWidget(response.returnData[0]);
        } else if (mounted) {
          setSleepWidget({
            sleep_quality_score: 0,
            sleep_score: 0,
            sleep_duration: "0",
            score_category: "n/a",
          });
          setSleepWidgetError("No data returned");
        }
      } catch (e) {
        if (mounted) {
          setSleepWidget(null);
          setSleepWidgetError("Error fetching sleep widget");
        }
      } finally {
        if (mounted) setSleepWidgetLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          [
            // styles.scrollContent,
            // { marginTop: HEADER_HEIGHT },
          ]
        }
      >
        <Animated.View style={[styles.headerContainer]}>
          {/* Background Image (Top Section Only) */}
          <ImageBackground
            source={
              Platform.OS === "web" && screenWidth >= 1024
                ? undefined
                : require("@/assets/images/dashboard_bg_top.png")
            }
            style={[
              styles.topBackground,
              Platform.OS === "web" &&
                screenWidth >= 1024 && { backgroundColor: "transparent" },
            ]}
            resizeMode="cover"
          >
            <StatusBar
              barStyle="dark-content"
              backgroundColor="transparent"
              translucent
            />
            <SafeAreaView
              style={[
                styles.safeArea,
                Platform.OS === "web" &&
                  screenWidth >= 1024 && {
                    paddingHorizontal: 0,
                    marginLeft: 0,
                    marginRight: 0,
                  },
              ]}
            >
              {/* Header and Sleep Check Section */}
              <View
                style={[
                  styles.staticHeader,
                  Platform.OS === "web" &&
                    screenWidth >= 1024 && {
                      paddingHorizontal: 0,
                      marginLeft: 0,
                      marginRight: 0,
                    },
                ]}
              >
                {/* Greeting */}
                <View style={styles.greetingContainer}>
                  <Text style={styles.greeting}>Hello, {userProfileName}</Text>
                  <Text style={styles.subGreeting}>{moodPrompt}</Text>
                </View>

                {/* Sleep Quality Card and Check-in/out */}
                <View
                  style={[
                    styles.sleepSection,
                    Platform.OS === "web" &&
                      screenWidth >= 1024 && {
                        flexDirection: "row",
                        alignItems: "stretch",
                        gap: 16,
                        marginBottom: 16,
                      },
                  ]}
                >
                  <View
                    style={[
                      styles.checkButton,
                      { marginBottom: 16 },
                      Platform.OS === "web" &&
                        screenWidth >= 1024 && {
                          flex: 1.8,
                          marginBottom: 0,
                          height: "auto",
                          maxWidth: 700,
                        },
                    ]}
                  >
                    <View
                      style={[
                        styles.sleepCardContainer,
                        Platform.OS === "web" &&
                          screenWidth >= 1024 && {
                            flex: 1,
                          },
                      ]}
                    >
                      {/* Left: Info Block */}
                      <View
                        style={[
                          styles.sleepCardInfoBlock,
                          Platform.OS === "web" &&
                            screenWidth >= 1024 && {
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "flex-start",
                              gap: 30,
                            },
                        ]}
                      >
                        {/* Sleep Duration Row */}
                        <View style={styles.sleepCardRow}>
                          <Image
                            source={require("@/assets/images/sleep_duration.png")}
                            style={{
                              width: 20,
                              height: 20,
                              marginRight: 12,
                              marginTop: 4,
                            }}
                          />
                          <View>
                            <Text style={styles.sleepCardLabel}>
                              Sleep duration
                            </Text>
                            <Text
                              style={[
                                styles.sleepCardValue,
                                Platform.OS === "web" &&
                                  screenWidth >= 1024 && {
                                    fontSize: 20,
                                  },
                              ]}
                            >
                              {!!sleepWidget?.sleep_duration
                                ? sleepWidget?.sleep_duration
                                : "0"}{" "}
                              Hrs
                            </Text>
                          </View>
                        </View>
                        {/* Divider */}
                        <View style={styles.sleepCardDivider} />
                        {/* Sleep Quality Row */}
                        <View style={styles.sleepCardRow}>
                          <Image
                            source={require("@/assets/images/sleep_quality.png")}
                            style={{
                              width: 20,
                              height: 20,
                              marginRight: 12,
                              marginTop: 4,
                            }}
                          />
                          <View>
                            <Text style={styles.sleepCardLabel}>
                              Sleep Score
                            </Text>
                            <Text
                              style={[
                                styles.sleepCardValue,
                                Platform.OS === "web" &&
                                  screenWidth >= 1024 && {
                                    fontSize: 20,
                                  },
                              ]}
                            >
                              {!!sleepWidget?.sleep_quality_score
                                ? sleepWidget?.sleep_quality_score
                                : "0"}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {/* Right: Panda Image */}
                      <View style={styles.sleepCardPandaWrapper}>
                        <Image
                          source={(() => {
                            const category = (
                              sleepWidget?.score_category || ""
                            ).toLowerCase();
                            if (!category || category === "n/a") {
                              return require("@/assets/images/sleep_empty.png");
                            } else if (category === "good") {
                              return require("@/assets/images/sleep_panda_green.png");
                            } else if (category === "poor") {
                              return require("@/assets/images/sleep_panda_red.png");
                            } else if (category === "average") {
                              return require("@/assets/images/sleep_panda_yellow.png");
                            } else {
                              return require("@/assets/images/sleep_empty.png");
                            }
                          })()}
                          style={styles.sleepCardPanda}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.sleepCheckRow,

                      Platform.OS === "web" &&
                        screenWidth >= 1024 && {
                          minWidth: "320px",
                          marginBottom: 0,
                          flexGrow: 1,
                          gap: 16,
                        },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 255, 255, 0.4)",
                        "rgba(255, 255, 255, 0.0001)",
                        "rgba(255, 255, 255, 0.0001)",
                        "rgba(255, 255, 255, 0.1)",
                      ]} // Your gradient colors
                      // start={{ x: 1, y: 1 }}
                      // end={{ x: 1, y: 1 }}
                      style={[
                        styles.gradientBorder,
                        { width: "48%" },
                        Platform.OS === "web" &&
                          screenWidth >= 1024 && {
                            marginBottom: 0,
                            width: "auto",
                            flexGrow: 1,
                          },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          Platform.OS === "web" &&
                            screenWidth >= 1024 && {
                              marginBottom: 0,
                            },
                          // { backgroundColor: "#00000033" },
                        ]}
                        onPress={() =>
                          navigation.navigate("sleep_check_in_out/SleepCheckIn")
                        }
                      >
                        <Image
                          source={require("@/assets/images/sleep_check_in.png")}
                          style={styles.checkIcon}
                        />
                        <Text style={styles.checkText}>
                          Sleep check-in{" "}
                          <Svg
                            width={7}
                            height={14}
                            viewBox="0 0 7 14"
                            fill="none"
                          >
                            <Path
                              d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36684 7.63316 5.58579 8.41421L1 13"
                              stroke="white"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              opacity={0.8}
                            />
                          </Svg>
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                    <LinearGradient
                      colors={[
                        "rgba(255, 255, 255, 0.4)",
                        "rgba(255, 255, 255, 0.0001)",
                        "rgba(255, 255, 255, 0.0001)",
                        "rgba(255, 255, 255, 0.1)",
                      ]} // Your gradient colors
                      // start={{ x: 1, y: 1 }}
                      // end={{ x: 1, y: 1 }}
                      style={[
                        styles.gradientBorder,
                        { width: "48%" },
                        Platform.OS === "web" &&
                          screenWidth >= 1024 && {
                            marginBottom: 0,
                            width: "auto",
                            flexGrow: 1,
                          },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          Platform.OS === "web" &&
                            screenWidth >= 1024 && {
                              marginBottom: 0,
                            },
                          // { backgroundColor: "#00000033" },
                        ]}
                        onPress={() =>
                          navigation.navigate(
                            "sleep_check_in_out/SleepCheckOut",
                          )
                        }
                      >
                        <Image
                          source={require("@/assets/images/sleep_check_out.png")}
                          style={styles.checkIcon}
                        />
                        <Text style={styles.checkText}>
                          Sleep check-out{" "}
                          <Svg
                            width={7}
                            height={14}
                            viewBox="0 0 7 14"
                            fill="none"
                          >
                            <Path
                              opacity={0.8}
                              d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36684 7.63316 5.58579 8.41421L1 13"
                              stroke="white"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                            />
                          </Svg>
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </Animated.View>

        {/* Main Content (White Background) */}
        <View
          style={[
            styles.scrollContent,
            ,
            Platform.OS === "web" &&
              screenWidth >= 1024 && {
                marginTop: 0,
              },
          ]}
        >
          {/* Sleep Plans Section */}
          <SleepPlansSection />

          {/* Mood Prompt */}
          <View style={styles.moodPromptContainer}>
            <ImageBackground
              source={require("../../assets/images/card_bg.png")}
              style={[
                styles.moodPrompt,
                { flex: 1, width: "100%", height: "100%" },
              ]}
              resizeMode="cover"
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.moodPromptText}>
                    Take a minute to add your current mood
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("mood_tracker/MoodTrackerScreen")
                    }
                  >
                    <Text style={styles.moodPromptCTA}>
                      Start now{" "}
                      <Svg width={6} height={12} viewBox="0 0 6 12" fill="none">
                        <Path
                          d="M1 1L4.58578 4.58578C5.36683 5.36683 5.36683 6.63316 4.58579 7.41421L1 11"
                          stroke="#8B4CFC"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                        />
                      </Svg>
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("@/assets/images/undraw_meditation.png")}
                  style={[
                    styles.moodIllustration,
                    Platform.OS === "web" &&
                      screenWidth >= 1024 && {
                        marginRight: 30,
                        height: 100,
                        width: 150,
                      },
                  ]}
                />
              </View>
            </ImageBackground>
          </View>
          {/* Featured Sessions Section */}
          <SessionSection />

          {/* Sleep Check-in Slider Section */}
          {/* <SleepCheckInSlider /> */}

          {/* Quick Action Buttons Grid Section */}
          <QuickActionButtonsGrid />

          {/* Music Section */}
          <MusicSection />

          {/* Youtube Preview Section */}
          <YoutubePreviewSection />

          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function MusicSection() {
  const navigation = useNavigation<any>();
  const [musicPlans, setMusicPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_category_group_module_music_widget_data,
          {},
        );
        // Assuming response is an array of plans, each with a 'thumb' property
        if (response?.returnCode === true) {
          let MusicData = response.returnData;
          setMusicPlans(MusicData);
        }
      } catch (e) {
        // Optionally handle error
        if (mounted) setMusicPlans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSeeAll = () => {
    navigation.navigate("seeAll/SeeAllPlansScreen", {
      allPlans: musicPlans,
      type: "music",
    });
  };
  return (
    <View
      style={[
        styles.sleepPlansSection,
        Platform.OS === "web" && {
          marginTop: 20,
        },
      ]}
    >
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sleepPlansHeader}>
          <Text style={styles.sleepPlansTitle}>Music</Text>
        </View>
        <TouchableOpacity
          onPress={handleSeeAll}
          style={{ alignSelf: "center", marginTop: 10 }}
        >
          <Text style={styles.sleepPlansButton}>
            See all{" "}
            <Svg width={5} height={9} viewBox="0 0 5 9" fill="none">
              <Path
                d="M1 1L3.27983 2.99485C4.19048 3.79167 4.19048 5.20833 3.27982 6.00515L1 8"
                stroke="#8B4CFC"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            </Svg>
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ alignItems: "center", padding: 24 }}>
          <Progress.Circle size={36} indeterminate color="#8B4CFC" />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sleepPlansCardContainer}
          >
            {musicPlans.slice(0, 10).map((plan, idx) => {
              const isFree = plan.is_paid === "free";
              const CardContent = (
                <ImageBackground
                  source={{
                    uri:
                      SiteConfig.on_mood9_ASSETS_URL +
                      COURSES_SUB_URL +
                      plan.module_image,
                  }}
                  style={styles.sleepPlansCardImage}
                  resizeMode="cover"
                >
                  {/* Crown icon for paid plans */}
                  {!isFree && (
                    <View style={styles.crownOverlay}>
                      {/* <Image
                        source={require("@/assets/images/crown.png")}
                        style={styles.crownIcon}
                      /> */}

                      <MaterialCommunityIcons
                        name="crown"
                        size={20}
                        color="#FFD700"
                      />
                    </View>
                  )}
                  <View style={styles.imageOverlay}></View>
                  <Text style={styles.sleepPlansCardTitle}>
                    {plan.module_name}
                  </Text>
                </ImageBackground>
              );
              return (
                <View style={styles.sleepPlansCard} key={`plan-thumb-${idx}`}>
                  {isFree ? (
                    <TouchableOpacity
                      style={styles.sleepPlansCard}
                      onPress={() => {
                        let sessionData = plan.session_json_data;
                        if (!!sessionData) {
                          sessionData = JSON.parse(sessionData);
                        }
                        if (sessionData && sessionData.length > 1) {
                          navigation.navigate("all_session/SeeAllSession", {
                            sessions: sessionData,
                            moduleData: plan,
                          });
                        } else {
                          navigation.navigate(
                            "music_player/MusicPlayerScreen",
                            {
                              itemData: plan,
                              sessionData:
                                sessionData && sessionData.length === 1
                                  ? sessionData[0]
                                  : null,
                            },
                          );
                        }
                      }}
                    >
                      {CardContent}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.sleepPlansCard}
                      onPress={async () => {
                        let subscription_status = await AsyncStorage.getItem(
                          SPD_USER_SUBSCRIPTION,
                        );
                        if (subscription_status === "true") {
                          let sessionData = plan.session_json_data;
                          if (!!sessionData) {
                            sessionData = JSON.parse(sessionData);
                          }
                          if (sessionData && sessionData.length > 1) {
                            navigation.navigate("all_session/SeeAllSession", {
                              sessions: sessionData,
                              moduleData: plan,
                            });
                          } else {
                            navigation.navigate(
                              "music_player/MusicPlayerScreen",
                              {
                                itemData: plan,
                                sessionData:
                                  sessionData && sessionData.length === 1
                                    ? sessionData[0]
                                    : null,
                              },
                            );
                          }
                        } else {
                          Toast.show({
                            type: "info",
                            text1:
                              "You need to buy paid membership to view the content.",
                          });
                        }
                      }}
                    >
                      {CardContent}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function SleepPlansSection() {
  const navigation = useNavigation<any>();
  const [sleepPlans, setSleepPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_category_group_module_sleep_widget_data,
          {},
        );
        // Assuming response is an array of plans, each with a 'thumb' property
        if (response?.returnCode === true) {
          let SleepData = response.returnData;
          setSleepPlans(SleepData);
        }
      } catch (e) {
        // Optionally handle error
        if (mounted) setSleepPlans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSeeAll = () => {
    navigation.navigate("seeAll/SeeAllPlansScreen", {
      allPlans: sleepPlans,
      type: "sleep",
    });
  };
  return (
    <View style={styles.sleepPlansSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sleepPlansHeader}>
          <Text style={styles.sleepPlansTitle}>Sleep</Text>
        </View>

        <TouchableOpacity
          onPress={handleSeeAll}
          style={{ alignSelf: "center", marginTop: 0 }}
        >
          <Text style={styles.sleepPlansButton}>
            See all{" "}
            <Svg width={5} height={9} viewBox="0 0 5 9" fill="none">
              <Path
                d="M1 1L3.27983 2.99485C4.19048 3.79167 4.19048 5.20833 3.27982 6.00515L1 8"
                stroke="#8B4CFC"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            </Svg>
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ alignItems: "center", padding: 24 }}>
          <Progress.Circle size={36} indeterminate color="#8B4CFC" />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sleepPlansCardContainer}
          >
            {sleepPlans.slice(0, 10).map((plan, idx) => {
              const isFree = plan.is_paid === "free";
              const CardContent = (
                <ImageBackground
                  source={{
                    uri:
                      SiteConfig.on_mood9_ASSETS_URL +
                      COURSES_SUB_URL +
                      plan.module_image,
                  }}
                  style={styles.sleepPlansCardImage}
                  resizeMode="cover"
                >
                  {/* Crown icon for paid plans */}
                  {!isFree && (
                    <View style={styles.crownOverlay}>
                      {/* <Image
                        source={require("@/assets/images/crown.png")}
                        style={styles.crownIcon}
                      /> */}

                      <MaterialCommunityIcons
                        name="crown"
                        size={20}
                        color="#FFD700"
                      />
                    </View>
                  )}
                  <View style={styles.imageOverlay}></View>
                  <Text style={styles.sleepPlansCardTitle}>
                    {plan.module_name}
                  </Text>
                </ImageBackground>
              );
              return (
                <View style={styles.sleepPlansCard} key={`plan-thumb-${idx}`}>
                  {isFree ? (
                    <TouchableOpacity
                      style={styles.sleepPlansCard}
                      onPress={() => {
                        let sessionData = plan.session_json_data;
                        if (!!sessionData) {
                          sessionData = JSON.parse(sessionData);
                        }
                        if (sessionData && sessionData.length > 1) {
                          navigation.navigate("all_session/SeeAllSession", {
                            sessions: sessionData,
                            moduleData: plan,
                          });
                        } else {
                          navigation.navigate(
                            "music_player/MusicPlayerScreen",
                            {
                              itemData: plan,
                              sessionData:
                                sessionData && sessionData.length === 1
                                  ? sessionData[0]
                                  : null,
                            },
                          );
                        }
                      }}
                    >
                      {CardContent}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.sleepPlansCard}
                      onPress={async () => {
                        let subscription_status = await AsyncStorage.getItem(
                          SPD_USER_SUBSCRIPTION,
                        );
                        if (subscription_status === "true") {
                          let sessionData = plan.session_json_data;
                          if (!!sessionData) {
                            sessionData = JSON.parse(sessionData);
                          }
                          if (sessionData && sessionData.length > 1) {
                            navigation.navigate("all_session/SeeAllSession", {
                              sessions: sessionData,
                              moduleData: plan,
                            });
                          } else {
                            navigation.navigate(
                              "music_player/MusicPlayerScreen",
                              {
                                itemData: plan,
                                sessionData:
                                  sessionData && sessionData.length === 1
                                    ? sessionData[0]
                                    : null,
                              },
                            );
                          }
                        } else {
                          Toast.show({
                            type: "info",
                            text1:
                              "You need to buy paid membership to view the content.",
                          });
                        }
                      }}
                    >
                      {CardContent}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function SessionSection() {
  const navigation = useNavigation<any>();
  const [sessionPlans, setSessionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_category_group_module_featured_session,
          {},
        );
        // Assuming response is an array of plans, each with a 'thumb' property
        if (response?.returnCode === true) {
          let SessionData = response.returnData;
          setSessionPlans(SessionData);
        }
      } catch (e) {
        // Optionally handle error
        if (mounted) setSessionPlans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSeeAll = () => {
    navigation.navigate("seeAll/SeeAllPlansScreen", {
      allPlans: sessionPlans,
      type: "session",
    });
  };
  return (
    <View
      style={[
        styles.sleepPlansSection,
        Platform.OS === "web" && {
          marginTop: 20,
        },
      ]}
    >
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sleepPlansHeader}>
          <Text style={styles.sleepPlansTitle}>Featured Session</Text>
        </View>
        <TouchableOpacity
          onPress={handleSeeAll}
          style={{ alignSelf: "center", marginTop: 10 }}
        >
          <Text style={styles.sleepPlansButton}>
            See all{" "}
            <Svg width={5} height={9} viewBox="0 0 5 9" fill="none">
              <Path
                d="M1 1L3.27983 2.99485C4.19048 3.79167 4.19048 5.20833 3.27982 6.00515L1 8"
                stroke="#8B4CFC"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            </Svg>
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ alignItems: "center", padding: 24 }}>
          <Progress.Circle size={36} indeterminate color="#8B4CFC" />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sleepPlansCardContainer}
          >
            {sessionPlans
              .slice(0, Platform.OS === "web" ? 20 : 10)
              .map((plan, idx) => {
                const isFree = plan.is_paid === "free";
                const CardContent = (
                  <ImageBackground
                    source={{
                      uri:
                        SiteConfig.on_mood9_ASSETS_URL +
                        COURSES_SUB_URL +
                        plan.module_image,
                    }}
                    style={styles.sleepPlansCardImage}
                    resizeMode="cover"
                  >
                    {/* Crown icon for paid plans */}
                    {!isFree && (
                      <View style={styles.crownOverlay}>
                        {/* <Image
                        source={require("@/assets/images/crown.png")}
                        style={styles.crownIcon}
                      /> */}

                        <MaterialCommunityIcons
                          name="crown"
                          size={20}
                          color="#FFD700"
                        />
                      </View>
                    )}
                    <View style={styles.imageOverlay}></View>
                    <Text style={styles.sleepPlansCardTitle}>
                      {plan.module_name}
                    </Text>
                  </ImageBackground>
                );
                return (
                  <View
                    style={[styles.sleepPlansCard, { width: 140, height: 180 }]}
                    key={`session-thumb-${idx}`}
                  >
                    {isFree ? (
                      <TouchableOpacity
                        style={[
                          styles.sleepPlansCard,
                          { width: 140, height: 180 },
                        ]}
                        onPress={() => {
                          let sessionData = plan.session_json_data;
                          if (!!sessionData) {
                            sessionData = JSON.parse(sessionData);
                          }

                          // Check if there are multiple sessions
                          if (sessionData && sessionData.length > 1) {
                            // Navigate to SeeAllSession to show list of sessions
                            navigation.navigate("all_session/SeeAllSession", {
                              sessions: sessionData,
                              moduleData: plan,
                            });
                          } else {
                            // Navigate directly to player if there's only one or no session
                            navigation.navigate(
                              "music_player/MusicPlayerScreen",
                              {
                                itemData: plan,
                                sessionData:
                                  sessionData && sessionData.length === 1
                                    ? sessionData[0]
                                    : null,
                              },
                            );
                          }
                        }}
                      >
                        {CardContent}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.sleepPlansCard,
                          { width: 140, height: 180 },
                        ]}
                        onPress={async () => {
                          let subscription_status = await AsyncStorage.getItem(
                            SPD_USER_SUBSCRIPTION,
                          );
                          if (subscription_status === "true") {
                            let sessionData = plan.session_json_data;
                            if (!!sessionData) {
                              sessionData = JSON.parse(sessionData);
                            }

                            // Check if there are multiple sessions
                            if (sessionData && sessionData.length > 1) {
                              // Navigate to SeeAllSession to show list of sessions
                              navigation.navigate("all_session/SeeAllSession", {
                                sessions: sessionData,
                                moduleData: plan,
                              });
                            } else {
                              // Navigate directly to player if there's only one or no session
                              navigation.navigate(
                                "music_player/MusicPlayerScreen",
                                {
                                  itemData: plan,
                                  sessionData:
                                    sessionData && sessionData.length === 1
                                      ? sessionData[0]
                                      : null,
                                },
                              );
                            }
                          } else {
                            Toast.show({
                              type: "info",
                              text1:
                                "You need to buy paid membership to view the content.",
                            });
                          }
                        }}
                      >
                        {CardContent}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // --- New styles for Sleep Card Redesign ---
  sleepCardGradient: {
    borderRadius: 18,
    padding: 0,
    marginBottom: 16,
    overflow: "hidden",
    // minHeight: 110,
    width: "100%",
    alignSelf: "center",
  },
  sleepCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    justifyContent: "space-between",
  },
  sleepCardInfoBlock: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 0,
  },
  sleepCardRow: {
    flexDirection: "row",
    // alignItems: "center",
    marginBottom: 0,
  },
  sleepCardLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
    fontWeight: "400",
    fontFamily: "QuicksandMedium",
  },
  sleepCardValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 0,
    fontFamily: "QuicksandMedium",
    marginBottom: 0,
  },
  sleepCardValuePoor: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 0,
    textShadowColor: "#0006",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sleepCardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 6,
    marginLeft: 0,
    marginRight: 0,
  },
  sleepCardPandaWrapper: {
    width: 80,
    height: 80,
    // borderRadius: '100%',
    // backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 18,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 6,
    // elevation: 2,
  },
  sleepCardPanda: {
    width: 80,
    height: 80,
  },
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
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
  },
  container: {
    flex: 1,
    marginTop: -2,
    backgroundColor: Platform.OS === "web" ? "#000" : "#fff",
  },
  headerContainer: {
    // position: "sticky",
    // top: 0,
    // left: 0,
    // right: 0,
    // height: HEADER_HEIGHT,
  },
  // staticHeader: {
  //   position: 'absolute', top: 60, left:16, right:16,
  //   zIndex: 2,
  // },
  topBackground: {
    // flex: 1,
    width: "100%",
    // paddingHorizontal: 16,
  },
  topSection: {
    paddingHorizontal: 16,
  },
  sleepSection: {
    marginTop: 6,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  staticHeader: {
    paddingHorizontal: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 8,
  },
  hamburgerBtn: {
    padding: 0,
    marginRight: 10,
  },
  headerIconsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  // headerIconsRight: {
  //   flexDirection: 'row',
  //   alignItems: 'center'
  // },
  headerIconBtn: {
    marginLeft: 18,
    padding: 4,
  },
  greetingContainer: {
    paddingHorizontal: 0,
    marginBottom: 16,
    marginTop: 11,
  },
  greeting: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "QuicksandMedium",
    marginBottom: 4,
  },
  subGreeting: {
    color: "#B3B7C6",
    fontSize: 16,
    fontFamily: "QuicksandMedium",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -25,
    // position: "relative",
    // zIndex: 999,
  },

  gradientBorder: {
    padding: 1,
    borderRadius: 10,
    marginBottom: 16,
    // backdropFilter: "blur(32px)",
    // backgroundColor: "#5A5A5A80",
  },
  sleepQualityCard: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#5A5A5A80",
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#2c3a4c",
    backdropFilter: "blur(32px)",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    elevation: 3,
  },
  sleepQualityCircleWrapper: {
    marginRight: 14,
  },
  sleepQualityCircleOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 4,
    borderColor: "#FFC42E",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  sleepQualityScore: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "QuicksandSemiBold",
  },
  sleepQualityTextBlock: {
    flex: 1,
  },
  sleepQualityLabel: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "QuicksandSemiBold",
    marginBottom: 2,
  },
  sleepQualitySub: {
    color: "#d2d2d2",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
  },
  sleepCheckRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  checkButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "#2c3a4c",
    backdropFilter: "blur(32px)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: "100%",
    display: "block",
    padding: 1,
    marginBottom: 0,
  },

  checkIcon: {
    width: 58,
    height: 58,
    marginRight: 8,
    resizeMode: "contain",
  },
  checkText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    display: "flex",
    width: "100%",
    marginTop: 6,
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 0,
  },
  sectionTitle: {
    color: "#181C3A",
    fontSize: 16,
    fontFamily: "QuicksandBold",
  },
  seeAllText: {
    color: "#8B4CFC",
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
  },
  cardListContainer: {
    // paddingRight: 20,
    // paddingBottom: 8,
    paddingHorizontal: 0,
  },
  sleepCard: {
    width: width * 0.38,
    backgroundColor: "rgba(35, 39, 82, 0.8)",
    borderRadius: 10,
    marginRight: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    position: "relative",
  },
  sleepCardImage: {
    width: "100%",
    height: 190,
    resizeMode: "cover",
  },
  sleepCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "left",
    position: "absolute",
    left: 0,
    width: "100%",
    bottom: 0,
    paddingHorizontal: 10,
  },
  moodPrompt: {
    flexDirection: "row",
    // backgroundColor: "#CDF0FB",
    borderRadius: 10,
    padding: 16,
    paddingVertical: 8,
    alignItems: "center",
    marginVertical: 18,
    borderWidth: 1,
    borderColor: "#e2f9ff",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2,
    overflow: "hidden",
  },
  moodPromptText: {
    color: "#262626",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    marginBottom: 6,
  },
  moodPromptCTA: {
    color: "#8B4CFC",
    marginTop: 8,
    fontSize: 16,
    fontFamily: "QuicksandBold",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  moodIllustration: {
    width: 100,
    height: 80,
    resizeMode: "contain",
    marginLeft: 10,
  },
  featuredCard: {
    width: width * 0.38,
    aspectRatio: 1 / 1.2,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredCardImage: {
    flex: 1,
    width: "100%",
    height: undefined,
    justifyContent: "flex-end",
  },
  featuredCardImageStyle: {
    borderRadius: 10,
  },
  featuredCardTextContainer: {
    width: "100%",
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 24,
    alignItems: "flex-start",
  },
  featuredCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandBold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  featuredCardSession: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  carouselCard: {
    backgroundColor: "rgba(35, 39, 82, 0.8)",
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  carouselTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  carouselText: {
    color: "#B3B7C6",
    fontSize: 14,
    marginBottom: 12,
  },
  carouselButton: {
    backgroundColor: "#7B61FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  carouselButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  carouselIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B3B7C6",
    marginRight: 6,
  },
  carouselDotActive: {
    backgroundColor: "#7B61FF",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(243, 238, 255, 0.9)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    color: "#7B61FF",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
  musicCard: {
    width: width * 0.38,
    backgroundColor: "rgba(35, 39, 82, 0.8)",
    borderRadius: 14,
    marginRight: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  musicCardImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  musicCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  youtubeCard: {
    width: width * 0.38,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginRight: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  youtubeCardImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  youtubeCardTitle: {
    color: "#181C3A",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  bottomPadding: {
    height: 20,
  },
  sheet: {
    position: "absolute",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 16,
    shadowOpacity: 0.15,
    elevation: 8,
    overflow: "hidden",
  },
  sleepPlansSection: {
    paddingHorizontal: 0,
    marginTop: 0,
  },
  sleepPlansHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 12,
  },
  sleepPlansTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#000",
  },
  sleepPlansButton: {
    color: "#8B4CFC",
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
  },
  sleepPlansCardContainer: {
    paddingRight: 16,
  },
  sleepPlansCard: {
    backgroundColor: "#3E3A6E",
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    width: 180,
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sleepPlansCardImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  sleepPlansCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    padding: 12,
    textAlign: "left",
    // backgroundColor:'#0000001c',
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default DashboardScreen;
