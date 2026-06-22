import React, { useRef, useState, useEffect } from "react";
import useResponsiveHorizontalMargin from "../../hooks/useResponsiveHorizontalMargin";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  Platform,
  StatusBar,
  ImageBackground,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Footer from "./Footer";
import BottomSheetContent from "./BottomSheetContent";
import SleepScreen from "../../sleep_tab/SleepScreen";
import ExploreScreen from "../../explore_tab/ExploreScreen";
import MusicScreen from "../../music_tab/MusicScreen";
import AppHeader from "./AppHeader";
import DashboardScreen from "@/app/dashboard/DashboardScreen";
import AppHeaderWeb from "./AppHeaderWeb";

const { width, height } = Dimensions.get("window");
const Tab = createBottomTabNavigator();
const HEADER_HEIGHT = 0;

// Main component that sets up the Tab Navigator
export default function HomeScreen() {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");
      const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const BOTTOM_NAV_HEIGHT = 65; // Match your Footer.tsx height
  const SHEET_MARGIN = 16;
  const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7 - BOTTOM_NAV_HEIGHT;
  const [showSheet, setShowSheet] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT + 60)).current;
  const isScrolling = useRef(false);

  // Listen for window resize events to update screen width
    useEffect(() => {
      const updateScreenWidth = () => {
        setScreenWidth(Dimensions.get('window').width);
      };
  
      if (Platform.OS === 'web') {
        // Add event listener for window resize on web
        const subscription = Dimensions.addEventListener('change', updateScreenWidth);
        return () => subscription?.remove();
      }
    }, []);
    
  const openSheet = () => {
    setShowSheet(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Define the MenuItem interface to match BottomSheetContent
  interface MenuItem {
    icon: React.ReactNode;
    label: string;
    screen?: string;
    params?: any;
  }

  const closeSheet = (menuItem?: MenuItem) => {
    // Start the animation to close the sheet
    Animated.timing(translateY, {
      toValue: SHEET_MAX_HEIGHT,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      // Set showSheet to false when animation completes
      setShowSheet(false);

      // If a menu item with a screen was passed, navigate to that screen
      if (menuItem && menuItem.screen) {
        navigation
          .getParent()
          ?.navigate("DistressMeditate", { category_code: "MUSIC" });
      }
    });
  };

  const toggleSheet = () => {
    if (showSheet) {
      closeSheet();
    } else {
      openSheet();
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0 && !isScrolling.current) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 80) {
        closeSheet();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const Stack = createNativeStackNavigator();

  // Menu button should ONLY open the drawer, never the bottom sheet
  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const horizontalMargin = useResponsiveHorizontalMargin();

  return (
    <>
      {Platform.OS === 'web' && screenWidth >= 1024 ? (
        <ImageBackground
          source={require('../../../assets/images/background_new_web.png')}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          <View
            style={[
              { flex: 1 },
              { marginLeft: horizontalMargin, marginRight: horizontalMargin },
            ]}
          >
            {/* Main content */}
            <AppHeaderWeb handleMenuPress={handleMenuPress} />
            <Tab.Navigator
              tabBar={(props) => <Footer {...props} toggleSheet={toggleSheet} />}
              screenOptions={{ headerShown: false }}
            >
              <Tab.Screen name="HomeTab" component={DashboardScreen} />
              <Tab.Screen name="SleepTab" component={SleepScreen} />
              {/* This is a dummy screen for the center logo button - it won't be navigated to */}
              <Tab.Screen
                name="DrawerTab"
                component={DashboardScreen}
                options={{
                  tabBarButton: () => null,
                }}
              />
              <Tab.Screen name="ExploreTab" component={ExploreScreen} />
              <Tab.Screen name="Music" component={MusicScreen} />
            </Tab.Navigator>

            {/* Custom Bottom Sheet */}
            {showSheet && (
              <>
                {/* Dim overlay - covers screen content but NOT footer */}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      zIndex: 5,
                      bottom: BOTTOM_NAV_HEIGHT, // Stop at footer
                    },
                  ]}
                  onTouchEnd={() => closeSheet()} // Fixed to handle event correctly
                  pointerEvents="box-none"
                />

                {/* Bottom Sheet */}
                <Animated.View
                  style={[
                    styles.sheet,
                    {
                      maxHeight: SHEET_MAX_HEIGHT,
                      width: "100%",
                      bottom: BOTTOM_NAV_HEIGHT,
                      transform: [{ translateY }],
                      zIndex: 6, // Above overlay but below footer
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <BottomSheetContent closeSheet={closeSheet} />
                </Animated.View>
              </>
            )}
          </View>
        </ImageBackground>
      ) : (
        <View
          style={[
            { flex: 1 },
            { marginLeft: horizontalMargin, marginRight: horizontalMargin },
          ]}
        >
          {/* Main content */}
          <AppHeader handleMenuPress={handleMenuPress} />
          <Tab.Navigator
            tabBar={(props) => <Footer {...props} toggleSheet={toggleSheet} />}
            screenOptions={{ headerShown: false }}
          >
            <Tab.Screen name="HomeTab" component={DashboardScreen} />
            <Tab.Screen name="SleepTab" component={SleepScreen} />
            {/* This is a dummy screen for the center logo button - it won't be navigated to */}
            <Tab.Screen
              name="DrawerTab"
              component={DashboardScreen}
              options={{
                tabBarButton: () => null,
              }}
            />
            <Tab.Screen name="ExploreTab" component={ExploreScreen} />
            <Tab.Screen name="Music" component={MusicScreen} />
          </Tab.Navigator>

          {/* Custom Bottom Sheet */}
          {showSheet && (
            <>
              {/* Dim overlay - covers screen content but NOT footer */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    zIndex: 5,
                    bottom: BOTTOM_NAV_HEIGHT, // Stop at footer
                  },
                ]}
                onTouchEnd={() => closeSheet()} // Fixed to handle event correctly
                pointerEvents="box-none"
              />

              {/* Bottom Sheet */}
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    maxHeight: SHEET_MAX_HEIGHT,
                    width: "100%",
                    bottom: BOTTOM_NAV_HEIGHT,
                    transform: [{ translateY }],
                    zIndex: 6, // Above overlay but below footer
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <BottomSheetContent closeSheet={closeSheet} />
              </Animated.View>
            </>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // White background for whole screen
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
    width: 30,
    height: 20,
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
    marginTop: 6,
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
    // display: "block",
    // marginHorizontal: 4,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // elevation: 2,
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
    backgroundColor: "#CDF0FB",
    borderRadius: 10,
    padding: 16,
    paddingVertical: 8,
    alignItems: "center",
    marginVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

});
