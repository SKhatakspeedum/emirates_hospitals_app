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
} from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
  FontAwesome,
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
    label: "Profile",
    icon: <Ionicons name="person-circle" size={22} color="#FFC107" />, // yellow
    screen: "profile/ProfileScreen",
  },
  {
    label: "My journey",
    icon: (
      <MaterialCommunityIcons name="link-variant" size={22} color="#4CAF50" />
    ), // green
    screen: "journey/MyJourneyScreen",
  },
  {
    label: "Mood tracker",
    icon: (
      <MaterialCommunityIcons name="headphones" size={22} color="#7B61FF" />
    ), // purple
    screen: "mood_tracker/MoodTrackerScreen",
  },
  // {
  //   label: 'Therapists',
  //   icon: <FontAwesome5 name="user-friends" size={20} color="#FF9800" />, // orange
  //   screen: 'Therapists',
  // },
  // {
  //   label: 'Plans',
  //   icon: <MaterialCommunityIcons name="crown-outline" size={22} color="#2196F3" />, // blue
  //   screen: 'plans/PlansScreen',
  // },
  {
    label: "Sign out",
    icon: <MaterialCommunityIcons name="logout" size={22} color="#FF6F91" />, // pink
    screen: "SignOut",
  },
];

const helpItem = {
  label: "Help & support",
  icon: (
    <MaterialCommunityIcons name="chat-question" size={22} color="#7B61FF" />
  ), // purple
  screen: "Help",
};

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const [userProfileName, setUserProfileName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Function to load user profile name and image
    const loadProfileData = async () => {
      const name = await AsyncStorage.getItem(SPD_USER_NAME);
      setUserProfileName(name || "");
      const full_data_str = await AsyncStorage.getItem(USER_FULL_DATA);
      if (full_data_str) {
        try {
          const full_data = JSON.parse(full_data_str);
          if (full_data.profile_image_url) {
            setProfileImageUrl(full_data.profile_image_url);
          } else {
            setProfileImageUrl(null);
          }
        } catch (e) {
          setProfileImageUrl(null);
        }
      } else {
        setProfileImageUrl(null);
      }
    };
    // Load on mount
    loadProfileData();
    // Listen for drawer open/focus
    const unsubscribe = props.navigation.addListener("focus", () => {
      loadProfileData();
    });
    return unsubscribe;
  }, [props.navigation]);

  const handleNav = async (screen: string) => {
    console.log(screen);
    if (screen === "SignOut") {
      // Implement your sign out logic here
      // e.g., clear tokens, AsyncStorage, etc.
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
      // Then navigate to login
      props.navigation.reset({
        index: 0,
        routes: [{ name: "init_screens/login" }],
      });
      return;
    }
    props.navigation.navigate(screen);
    props.navigation.closeDrawer();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.drawerContainer}>
        {/* Gradient Header */}

        {/* <LinearGradient
          colors={["#F7D9E3", "#E7EAF9", "#D9F7F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBg}
        >
        </LinearGradient> */}
        <View style={{ borderRadius: 10, overflow: "hidden", width: "100%" }}>
          <Image
            source={require("@/assets/images/profile_bg.svg")}
            style={styles.profileBg}
          />
        </View>
        <View style={styles.headerContent}>
          <Image
            source={
              profileImageUrl
                ? { uri: profileImageUrl }
                : require("@/assets/images/icon.png")
            }
            style={styles.avatar}
          />
          <Text style={styles.userName}>{userProfileName}</Text>
        </View>

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
              {item.icon}
              <Text style={styles.linkLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Help & Support at Bottom */}
        {/* <TouchableOpacity
          style={styles.helpRow}
          onPress={() => handleNav(helpItem.screen)}
          activeOpacity={0.7}
        >
          {helpItem.icon}
          <Text style={styles.helpLabel}>{helpItem.label}</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  drawerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 2, height: 0 },
    shadowRadius: 16,
    padding: 16,
    elevation: 8,
  },
  profileBg: {
    width: "100%",
  },
  headerBg: {
    // paddingTop: 38,
    // paddingBottom: 28,
    // paddingHorizontal: 24,
    // borderBottomLeftRadius: 32,
    // borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -24,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "#fff",
    marginRight: 10,
    backgroundColor: "#f3f3f3",
  },
  userName: {
    fontSize: 18,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    flexShrink: 1,
  },
  linksScroll: {
    flex: 1,
    marginTop: 18,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e4",
  },
  linkLabel: {
    fontSize: 16,
    color: "#262626",
    marginLeft: 15,
    fontFamily: "QuicksandSemiBold",
    flex: 1,
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    marginBottom: 10,
    borderRadius: 0,
    paddingTop: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F2F3F7",
  },
  helpLabel: {
    fontSize: 16,
    color: "#262626",
    marginLeft: 15,
    fontFamily: "QuicksandSemiBold",
    flex: 1,
  },
});
