import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { SvgIonicons } from "../../components/icons/SvgIcons";
import { Fontisto, MaterialCommunityIcons,
  MaterialIcons, } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  IS_LOGGED_IN,
  SPD_USER_EMAIL,
  SPD_USER_NAME,
  USER_FULL_DATA,
} from "@/app/config/config";
import Toast from "react-native-toast-message";
import { Colors } from "@/app/config/colors";
import { FontFamilies } from "@/app/config/fonts";
import { getDecryptedID } from "@/app/suggestus_plugin/util/util_functions";
import { ORG_CONFIG_STORAGE_KEYS } from "@/app/services/orgConfig";
import { useLeftMenuItems } from "@/app/hooks/useLeftMenuItems";
import { getMenuIcon } from "@/app/utils/menuIcon";

interface UserProfile {
  name: string;
  email: string;
  city: string;
  avatarUri: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "User",
  email: "",
  city: "",
  avatarUri: null,
};

const parseAdditionalAttributes = (raw: any): Record<string, string> => {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const DEFAULT_DRAWER_ITEMS = [
  {
    label: "Providers",
    icon: <Fontisto name="stethoscope" size={22} color={Colors.secondary} />,
    screen: "NearbyProviders",
  },
  {
    label: "Orders",
    icon: (
      <MaterialCommunityIcons
        name="clipboard-text-clock-outline"
        size={20}
        color={Colors.secondary}
      />
    ),
    screen: "OrderScreen",
  },
  {
    label: "Medicines",
    icon: (
      <MaterialCommunityIcons name="pill" size={20} color={Colors.secondary} />
    ),
    screen: "MedicinesScreen",
  },
  {
    label: "Health Packages",
    icon: (
      <MaterialIcons
        name="medical-services"
        size={20}
        color={Colors.secondary}
      />
    ),
    screen: "HealthPackages",
  },
  {
    label: "Settings",
    icon: (
      <SvgIonicons name="settings-outline" size={20} color={Colors.secondary} />
    ),
    screen: "Settings",
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  providers: <Fontisto name="stethoscope" size={22} color={Colors.secondary} />,
  orders: (
    <MaterialCommunityIcons
      name="clipboard-text-clock-outline"
      size={20}
      color={Colors.secondary}
    />
  ),
  medicines: (
    <MaterialCommunityIcons name="pill" size={20} color={Colors.secondary} />
  ),
  healthPackages: (
    <MaterialIcons name="medical-services" size={20} color={Colors.secondary} />
  ),
  settings: (
    <SvgIonicons name="settings-outline" size={20} color={Colors.secondary} />
  ),
};

const DEFAULT_ICON = (
  <SvgIonicons name="help-circle-outline" size={20} color={Colors.secondary} />
);

// Resolves the drawer-specific default icon for a widget, then defers to the
// shared getMenuIcon() (app/utils/menuIcon.tsx) for the actual rendering logic.
const getDrawerMenuIcon = (
  imageType?: string,
  imageData?: string,
  widgetCode?: string,
): React.ReactNode => {
  const fallback = ICON_MAP[widgetCode || ""] || DEFAULT_ICON;
  return getMenuIcon(imageType, imageData, fallback);
};

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { items: backendMenuItems, isLoading: menuLoading } =
    useLeftMenuItems();

  const drawerItems = useMemo(() => {
    if (backendMenuItems.length > 0) {
      return backendMenuItems.map((item) => ({
        label: item.widget_name,
        icon: getDrawerMenuIcon(
          item.menu_image_type,
          item.menu_image,
          item.widget_code,
        ),
        screen: item.screen,
      }));
    }
    return DEFAULT_DRAWER_ITEMS;
  }, [backendMenuItems]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setAvatarError(false);
    try {
      const fullDataStr = await getDecryptedID(USER_FULL_DATA);
      if (fullDataStr) {
        const parsed = JSON.parse(fullDataStr);
        const attrs = parseAdditionalAttributes(parsed.additional_attributes);

        const name =
          parsed.usr_name?.trim() ||
          (await AsyncStorage.getItem(SPD_USER_NAME)) ||
          "User";

        const email =
          parsed.usr_email?.trim() ||
          parsed.email?.trim() ||
          (await AsyncStorage.getItem(SPD_USER_EMAIL)) ||
          "";

        const city =
          attrs.user_city?.trim() ||
          attrs.p_city?.trim() ||
          attrs.city?.trim() ||
          "";

        const avatarUri =
          parsed.usr_profile_pic?.trim() ||
          parsed.profile_pic?.trim() ||
          parsed.usr_photo?.trim() ||
          null;

        setProfile({ name, email, city, avatarUri });
      } else {
        // USER_FULL_DATA not available — fall back to individual cached keys
        const name = (await AsyncStorage.getItem(SPD_USER_NAME)) || "User";
        const email = (await AsyncStorage.getItem(SPD_USER_EMAIL)) || "";
        setProfile({ ...DEFAULT_PROFILE, name, email });
      }
    } catch (error) {
      console.error("[CustomDrawer] Failed to load profile:", error);
      // Best-effort fallback — never crash the drawer
      try {
        const name = (await AsyncStorage.getItem(SPD_USER_NAME)) || "User";
        setProfile({ ...DEFAULT_PROFILE, name });
      } catch {
        setProfile(DEFAULT_PROFILE);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    const unsubscribe = (props.navigation as any).addListener(
      "focus",
      loadProfile,
    );
    return unsubscribe;
  }, [props.navigation, loadProfile]);

  const handleNav = async (
    screen: string,
    routeParams?: Record<string, any>,
  ) => {
    if (screen === "SignOut") {
      setIsSigningOut(true);
      try {
        // Org/hospital branding (logo, theme, country codes, etc.) isn't
        // user session data — preserve it across AsyncStorage.clear() so
        // the splash/login screens keep showing the correct org logo
        // immediately, instead of flashing to the generic default asset
        // while fetchAndApplyOrgConfig() re-fetches it in the background.
        const preserved = await AsyncStorage.multiGet(ORG_CONFIG_STORAGE_KEYS);
        await AsyncStorage.clear();
        const toRestore = preserved.filter(
          (pair): pair is [string, string] => pair[1] !== null,
        );
        if (toRestore.length > 0) {
          await AsyncStorage.multiSet(toRestore);
        }

        Toast.show({ type: "success", text1: "You have been signed out." });
        // Route through the splash screen so it re-runs device/session init
        // and refreshes org config in the background.
        props.navigation.reset({
          index: 0,
          routes: [{ name: "init_screens/splash" }],
        });
      } catch (err) {
        console.error("[CustomDrawer] Sign-out error:", err);
        Toast.show({
          type: "error",
          text1: "Sign-out failed",
          text2: "Please try again.",
        });
        setIsSigningOut(false);
      }
      return;
    }

    // if (screen === "PatientSelection") {
    //   props.navigation.closeDrawer();
    //   router.push("/patient/patient_selection");
    //   return;
    // }

    // if (screen === "RegisteredPatients") {
    //   props.navigation.closeDrawer();
    //   router.push({
    //     pathname: "/patient/registered_patients",
    //     params: { fromDrawer: "true" },
    //   });
    //   return;
    // }

    const tabScreens = ["OrderScreen", "MedicinesScreen", "ProfileScreen"];

    if (tabScreens.includes(screen)) {
      props.navigation.navigate("tab_bar_home/HomeScreen", { screen });
    } else if (screen === "NearbyProviders") {
      props.navigation.navigate("tab_bar_home/HomeScreen", {
        screen: "HomeTab",
        params: { screen: "NearbyProviders" },
      });
    } else {
      Toast.show({
        type: "info",
        text1: "Feature coming soon",
        text2: `${screen} screen is under development.`,
      });
    }
  };

  const renderAvatar = () => {
    if (loadingProfile) {
      return <View style={[styles.avatar, styles.avatarSkeleton]} />;
    }
    if (profile.avatarUri && !avatarError) {
      return (
        <Image
          source={{ uri: profile.avatarUri }}
          style={styles.avatar}
          onError={() => setAvatarError(true)}
        />
      );
    }
    return (
      <View style={[styles.avatar, styles.avatarInitials]}>
        <Text style={styles.initialsText}>{getInitials(profile.name)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.drawerContainer}>
        {/* Profile Header */}
        <TouchableOpacity
          style={styles.headerRow}
          onPress={() => handleNav("ProfileScreen")}
          activeOpacity={0.7}
        >
          {renderAvatar()}

          <View style={styles.headerTextContainer}>
            {loadingProfile ? (
              <>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonSub} />
              </>
            ) : (
              <>
                <Text style={styles.userName} numberOfLines={1}>
                  {profile.name}
                </Text>
                {profile.email || profile.city ? (
                  <Text style={styles.userSub} numberOfLines={1}>
                    {profile.city || profile.email}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Menu Items */}
        <ScrollView
          style={styles.linksScroll}
          showsVerticalScrollIndicator={false}
        >
          {drawerItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.linkRow}
              onPress={() => handleNav(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIconWrapper}>{item.icon}</View>
              <Text style={styles.linkLabel}>{item.label}</Text>
              {/* <SvgIonicons 
                name="chevron-forward"
                size={16}
                color={Colors.inactive}
              /> */}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => handleNav("SignOut")}
            activeOpacity={0.7}
            disabled={isSigningOut}
          >
            <View style={styles.linkIconWrapper}>
              <SvgIonicons 
                name="log-out-outline"
                size={22}
                color={Colors.secondary}
              />
            </View>
            <Text style={styles.logoutLabel}>Log out</Text>
            {/* <SvgIonicons 
              name="chevron-forward"
              size={16}
              color={Colors.inactive}
            /> */}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign-out loading overlay */}
      <Modal visible={isSigningOut} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Logging out...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightgray,
  },
  avatarSkeleton: {
    backgroundColor: Colors.border,
  },
  avatarInitials: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 22,
    fontFamily: FontFamilies.bold,
    color: Colors.background,
    letterSpacing: 1,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  userName: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
    marginBottom: 2,
  },
  userSub: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamilies.medium,
  },
  skeletonName: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border,
    marginBottom: 6,
  },
  skeletonSub: {
    width: 70,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  headerChevron: {
    marginLeft: 8,
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
    backgroundColor: Colors.background,
  },
  linkIconWrapper: {
    width: 28,
    alignItems: "center",
  },
  linkLabel: {
    fontSize: 15,
    color: Colors.label,
    marginLeft: 14,
    fontFamily: FontFamilies.semiBold,
    flex: 1,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginBottom: Platform.OS === "ios" ? 10 : 0,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: Colors.background,
  },
  logoutLabel: {
    fontSize: 15,
    color: Colors.label,
    marginLeft: 14,
    fontFamily: FontFamilies.semiBold,
    flex: 1,
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: Colors.lightgray,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 160,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loaderText: {
    marginTop: 14,
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
});
