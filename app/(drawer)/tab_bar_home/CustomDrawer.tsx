import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  IS_LOGGED_IN,
  SPD_USER_EMAIL,
  SPD_USER_ID,
  SPD_USER_NAME,
  SPD_USER_SUBSCRIPTION,
  USER_FULL_DATA,
} from "@/app/config/config";
import Toast from "react-native-toast-message";

const drawerItems = [
  {
    label: "PHR",
    icon: <Ionicons name="id-card-outline" size={22} color="#0076D6" />,
    screen: "profile/ProfileScreen",
  },
  {
    label: "Explore",
    icon: <MaterialCommunityIcons name="heart-search-outline" size={22} color="#0076D6" />,
    screen: "explore_tab/ExploreScreen",
  },
  {
    label: "Orders",
    icon: <Ionicons name="bag-handle-outline" size={22} color="#0076D6" />,
    screen: "Orders",
  },
  {
    label: "Medicines",
    icon: <MaterialCommunityIcons name="file-prescription-outline" size={22} color="#0076D6" />,
    screen: "Medicines",
  },
  {
    label: "Health Packages",
    icon: <MaterialCommunityIcons name="medical-bag" size={22} color="#0076D6" />,
    screen: "HealthPackages",
  },
  {
    label: "Bills",
    icon: <Ionicons name="receipt-outline" size={22} color="#0076D6" />,
    screen: "Bills",
  },
];

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const [userProfileName, setUserProfileName] = useState("John Doe");

  useEffect(() => {
    const loadProfileData = async () => {
      const name = await AsyncStorage.getItem(SPD_USER_NAME);
      if (name) {
        setUserProfileName(name);
      }
    };
    loadProfileData();
    const unsubscribe = props.navigation.addListener("focus", () => {
      loadProfileData();
    });
    return unsubscribe;
  }, [props.navigation]);

  const handleNav = async (screen: string) => {
    console.log(screen);
    if (screen === "SignOut") {
      await AsyncStorage.setItem(IS_LOGGED_IN, "false");
      await AsyncStorage.setItem(SPD_USER_EMAIL, "");
      await AsyncStorage.setItem(SPD_USER_ID, "");
      await AsyncStorage.setItem(SPD_USER_NAME, "");
      await AsyncStorage.setItem(USER_FULL_DATA, "");
      await AsyncStorage.setItem(SPD_USER_SUBSCRIPTION, "false");
      Toast.show({
        type: "success",
        text1: "You have been signed out.",
      });
      props.navigation.reset({
        index: 0,
        routes: [{ name: "init_screens/login" }],
      });
      return;
    }

    // Check if the route is defined in the navigator
    const validRoutes = ["profile/ProfileScreen", "explore_tab/ExploreScreen"];
    if (validRoutes.includes(screen)) {
      props.navigation.navigate(screen);
      props.navigation.closeDrawer();
    } else {
      // Placeholder display for under-development medical screens
      Toast.show({
        type: "info",
        text1: "Feature coming soon",
        text2: `${screen} screen is under development.`,
      });
      props.navigation.closeDrawer();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.drawerContainer}>
        {/* Profile Header Row */}
        <TouchableOpacity
          style={styles.headerRow}
          onPress={() => handleNav("profile/ProfileScreen")}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/43.jpg" }}
            style={styles.avatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.userName} numberOfLines={1}>{userProfileName}</Text>
            <Text style={styles.userLocation}>Dubai</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#002075" style={styles.headerChevron} />
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.headerSeparator} />

        {/* Drawer Menu Items */}
        <ScrollView
          style={styles.linksScroll}
          showsVerticalScrollIndicator={false}
        >
          {drawerItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={styles.linkRow}
              onPress={() => handleNav(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIconWrapper}>
                {item.icon}
              </View>
              <Text style={styles.linkLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#B3B7C6" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logout at bottom */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => handleNav("SignOut")}
            activeOpacity={0.7}
          >
            <View style={styles.linkIconWrapper}>
              <Ionicons name="log-out-outline" size={22} color="#0076D6" style={styles.logoutIcon} />
            </View>
            <Text style={styles.logoutLabel}>Log out</Text>
            <Ionicons name="chevron-forward" size={16} color="#B3B7C6" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 30 : 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f3f3",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    color: "#1A1D24",
    fontFamily: "QuicksandBold",
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 12,
    color: "#0076D6",
    fontFamily: "QuicksandMedium",
  },
  headerChevron: {
    marginLeft: 8,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: "#F2F3F7",
    marginVertical: 12,
    marginHorizontal: 8,
  },
  linksScroll: {
    flex: 1,
    marginTop: 8,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  linkIconWrapper: {
    width: 28,
    alignItems: "center",
  },
  linkLabel: {
    fontSize: 15,
    color: "#1A1D24",
    marginLeft: 14,
    fontFamily: "QuicksandSemiBold",
    flex: 1,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F2F3F7",
    paddingTop: 12,
    marginBottom: Platform.OS === "ios" ? 10 : 0,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  logoutIcon: {
    // Arrow icon points to the right
  },
  logoutLabel: {
    fontSize: 15,
    color: "#1A1D24",
    marginLeft: 14,
    fontFamily: "QuicksandSemiBold",
    flex: 1,
  },
});
