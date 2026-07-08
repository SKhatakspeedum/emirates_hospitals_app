import React, { useEffect, useState, useCallback } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
import {
  initializeSuggestus,
  callSuggestusAPI,
} from "@/app/suggestus_plugin/suggestusClient";
import {
  getDecryptedID,
  saveDataFromLocalStorage,
} from "@/app/suggestus_plugin/util/util_functions";
import { spd_processId_config } from "@/app/config/process_id";
import { SiteConfig } from "@/app/config/site_config";

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

const drawerItems = [
  {
    label: "PHR",
    icon: <Ionicons name="id-card-outline" size={22} color={Colors.primary} />,
    screen: "phr",
  },
  {
    label: "Patient",
    icon: <Ionicons name="people-outline" size={22} color={Colors.primary} />,
    // screen: "PatientSelection",
    screen: "RegisteredPatients",
  },
  {
    label: "Explore",
    icon: (
      <MaterialCommunityIcons
        name="compass-outline"
        size={22}
        color={Colors.primary}
      />
    ),
    screen: "explore",
  },
  {
    label: "Orders",
    icon: (
      <Ionicons name="bag-handle-outline" size={22} color={Colors.primary} />
    ),
    screen: "OrderScreen",
  },
  {
    label: "Medicines",
    icon: (
      <MaterialCommunityIcons
        name="prescription"
        size={22}
        color={Colors.primary}
      />
    ),
    screen: "MedicinesScreen",
  },
  {
    label: "Health Packages",
    icon: (
      <MaterialCommunityIcons
        name="briefcase-plus-outline"
        size={22}
        color={Colors.primary}
      />
    ),
    screen: "HealthPackages",
  },
  {
    label: "Bills",
    icon: <Ionicons name="receipt-outline" size={22} color={Colors.primary} />,
    screen: "Bills",
  },
];

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleNav = async (screen: string) => {
    if (screen === "SignOut") {
      setIsSigningOut(true);
      try {
        await AsyncStorage.clear();
        try {
          await initializeSuggestus();
        } catch (err) {
          console.warn(
            "[CustomDrawer] initializeSuggestus after logout failed:",
            err,
          );
        }
        try {
          const orgRes = await callSuggestusAPI(
            spd_processId_config.sgconf_get_mst_organization_by_org_patient_portal_url,
            {
              p_org_ai_code: SiteConfig.AI_CODE,
              p_org_patient_portal_url: SiteConfig.ACTION_URL,
            },
          );
          if (orgRes?.returnCode === true && orgRes.returnData?.length > 0) {
            const org = orgRes.returnData[0];
            const orgId = String(org.org_id ?? "");
            const orgName = String(org.org_name ?? "");
            if (orgId) {
              await saveDataFromLocalStorage("sg_org_id", orgId);
              await saveDataFromLocalStorage("sg_org_name", orgName);
            }
          }
        } catch (err) {
          console.warn("[CustomDrawer] org lookup after logout failed:", err);
        }
        Toast.show({ type: "success", text1: "You have been signed out." });
        props.navigation.reset({
          index: 0,
          routes: [{ name: "init_screens/login" }],
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

    if (screen === "PatientSelection") {
      props.navigation.closeDrawer();
      router.push("/patient/patient_selection");
      return;
    }

    if (screen === "RegisteredPatients") {
      props.navigation.closeDrawer();
      router.push("/patient/registered_patients");
      return;
    }

    const validRoutes = [
      "profile/ProfileScreen",
      "explore_tab/ExploreScreen",
      "orders/OrdersScreen",
    ];
    if (validRoutes.includes(screen)) {
      props.navigation.navigate(screen);
      props.navigation.closeDrawer();
    } else if (screen === "OrderScreen") {
      props.navigation.navigate("tab_bar_home/HomeScreen", {
        screen: "OrderScreen",
      });
      props.navigation.closeDrawer();
    } else if (screen === "MedicinesScreen") {
      props.navigation.navigate("tab_bar_home/HomeScreen", {
        screen: "MedicinesScreen",
      });
      props.navigation.closeDrawer();
    } else {
      Toast.show({
        type: "info",
        text1: "Feature coming soon",
        text2: `${screen} screen is under development.`,
      });
      props.navigation.closeDrawer();
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
          onPress={() => handleNav("profile/ProfileScreen")}
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

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.primary}
            style={styles.headerChevron}
          />
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.headerSeparator} />

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
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.inactive}
              />
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
              <Ionicons
                name="log-out-outline"
                size={22}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.logoutLabel}>Log out</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.inactive}
            />
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
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
  headerSeparator: {
    height: 1,
    backgroundColor: Colors.border,
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
    backgroundColor: "rgba(0,0,0,0.35)",
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
    shadowColor: "#000",
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
