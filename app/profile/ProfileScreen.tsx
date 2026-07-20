import React, { useState, useEffect } from "react";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { SPD_USER_ID, USER_FULL_DATA } from "../config/config";
import { spd_processId_config } from "../config/process_id";
import { setEncryptedID } from "../suggestus_plugin/util/util_functions";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { SiteConfig } from "../config/site_config";
import Toast from "react-native-toast-message";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import dayjs from "dayjs";

const HEADER_IMAGE = require("@/assets/images/profile_bg.svg");
const AVATAR_PLACEHOLDER = require("@/assets/images/icon.png");

interface ProfileData {
  emiratesId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
}

export default function ProfileScreen() {
  const horizontalMargin = useResponsiveHorizontalMargin();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  const [profile, setProfile] = useState<ProfileData>({
    emiratesId: "",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
  });

  useEffect(() => {
    const fetchUserIdAndProfileImg = async () => {
      try {
        const id = await AsyncStorage.getItem(SPD_USER_ID);
        if (id) {
          setUserId(id);
          fetchProfileData(id);
        }
        const full_data_str = await AsyncStorage.getItem(USER_FULL_DATA);
        if (full_data_str) {
          const full_data = JSON.parse(full_data_str);
          if (full_data.profile_image_url) {
            setProfileImageUrl(full_data.profile_image_url);
          }
        }
      } catch (error) {
        console.error("Error fetching user ID or profile image:", error);
      }
    };
    fetchUserIdAndProfileImg();
  }, []);

  const fetchProfileData = async (id: string) => {
    setLoading(true);
    let profileData = await AsyncStorage.getItem(USER_FULL_DATA);

    const applyProfile = (userData: any) => {
      let mergedData = { ...userData };
      if (userData.additional_attributes) {
        try {
          const parsed = typeof userData.additional_attributes === "string"
            ? JSON.parse(userData.additional_attributes)
            : userData.additional_attributes;
          mergedData = { ...mergedData, ...parsed };
        } catch (e) {
          console.warn("Could not parse additional_attributes", e);
        }
      }

      const eId = mergedData.p_emirates_id || mergedData.user_emirates_id || mergedData.emirates_id || mergedData.usr_emirates_id || "";
      const fname = mergedData.p_first_name || mergedData.firstName || mergedData.fname || mergedData.user_fname || "";
      const lname = mergedData.p_last_name || mergedData.lastName || mergedData.lname || mergedData.user_lname || "";
      const dobRaw = mergedData.user_dob || mergedData.usr_dob || mergedData.dob || "";
      const formattedDob = dobRaw ? dayjs(dobRaw).format("MMM DD, YYYY") : "";
      const genderRaw = mergedData.user_gender || mergedData.gender || mergedData.usr_gender || "";

      let genderDisplay = genderRaw;
      if (genderRaw.toLowerCase() === 'm' || genderRaw.toLowerCase() === 'male') genderDisplay = "Male";
      else if (genderRaw.toLowerCase() === 'f' || genderRaw.toLowerCase() === 'female') genderDisplay = "Female";

      let maskedEid = eId;
      if (eId && eId.replace(/\D/g, '').length >= 15) {
        const rawNums = eId.replace(/\D/g, '');
        if (rawNums.length === 15) {
          maskedEid = `***-****-****${rawNums.substring(10, 13)}-${rawNums.substring(13)}`;
        }
      } else if (!eId) {
        maskedEid = "N/A";
      }

      setProfile({
        emiratesId: maskedEid,
        firstName: fname || "N/A",
        lastName: lname || "N/A",
        dob: formattedDob || "N/A",
        gender: genderDisplay || "N/A",
      });
    };

    if (profileData) {
      applyProfile(JSON.parse(profileData));
    }

    try {
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_user_accounts_profile,
        { p_user_id: id }
      );

      if (response?.returnCode === true && response.returnData) {
        const userData = response.returnData[0];
        if (!!userData) {
          await setEncryptedID(USER_FULL_DATA, JSON.stringify(userData));
          applyProfile(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageEdit = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access media library is required!");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled) return;

      const cropResult = await ImageManipulator.manipulateAsync(
        pickerResult.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setAvatarUploading(true);

      const id = await AsyncStorage.getItem(SPD_USER_ID);
      if (!id) throw new Error("User ID not found");

      const uploadUrl = `${SiteConfig.on_mood9_ASSETS_URL}/upload-image.php`;
      const filename = `profile_${id}_${Date.now()}.jpg`;
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(cropResult.uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: "image/jpeg" });
        formData.append("uploadedFile", file);
      } else {
        formData.append("uploadedFile", {
          uri: cropResult.uri,
          name: filename,
          type: "image/jpeg",
        } as any);
      }

      formData.append("uploadType", "Profile-Image");

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || uploadData?.result === "false" || !uploadData?.url) {
        Toast.show({
          type: "error",
          text1: "Image upload failed",
          text2: uploadData?.msg || "There was an error uploading your image.",
        });
        return;
      }

      let imageUrl = `${SiteConfig.on_mood9_ASSETS_URL}/${uploadData.url}`;

      const apiRes = await callSuggestusAPI(
        spd_processId_config.spdonmood9_update_md_onmood9_users_assets_for_profile,
        { p_user_id: id, p_asset_type: "profile_image", p_asset_url: imageUrl }
      );

      if (apiRes?.returnCode === true) {
        setAvatarUrl(imageUrl);
        setProfileImageUrl(imageUrl);
        Toast.show({ type: "success", text1: "Profile image updated." });
        fetchProfileData(id);
      } else {
        throw new Error("Failed to update profile image");
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Error", text2: err.message || "Could not update profile image." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const mainContent = (
    <View style={[styles.containerNew, { marginLeft: horizontalMargin, marginRight: horizontalMargin }]}>
      <ImageBackground
        source={require("@/assets/images/internal_screen_bg.png")}
        style={styles.background}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.container, Platform.OS === "web" && screenWidth >= 1024 ? { width: '100%', maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' } : {}]}>

            <View style={styles.topHeader}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <View style={styles.bannerContainer}>
              <Image source={HEADER_IMAGE} style={styles.bannerImg} />
              <TouchableOpacity style={styles.bannerEditIcon}>
                <Feather name="edit-3" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarWrapper}>
              <TouchableOpacity onPress={handleProfileImageEdit} disabled={avatarUploading} style={styles.avatarTouch}>
                <Image
                  source={
                    profileImageUrl ? { uri: profileImageUrl }
                      : avatarUrl ? { uri: avatarUrl }
                        : AVATAR_PLACEHOLDER
                  }
                  style={styles.avatar}
                />
                <View style={styles.avatarEditBadge}>
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color={Colors.backgroundLight} />
                  ) : (
                    <Feather name="edit-3" size={12} color={Colors.backgroundLight} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.detailsContainer}>

                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="card" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>Emirates ID</Text>
                    <Text style={styles.detailValue}>{profile.emiratesId}</Text>
                  </View>
                </View>

                <View style={styles.detailRowSplit}>
                  <View style={styles.detailRowHalf}>
                    <View style={styles.detailIconBoxSecondary}>
                      <Ionicons name="person" size={18} color={Colors.warning} />
                    </View>
                    <View style={styles.detailTextCol}>
                      <Text style={styles.detailLabel}>First name</Text>
                      <Text style={styles.detailValue}>{profile.firstName}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRowHalf}>
                    <View style={styles.detailIconBoxSecondaryDark}>
                      <Ionicons name="person" size={18} color={Colors.success} />
                    </View>
                    <View style={styles.detailTextCol}>
                      <Text style={styles.detailLabel}>Last name</Text>
                      <Text style={styles.detailValue}>{profile.lastName}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIconBoxTertiary}>
                    <Ionicons name="calendar" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>Date of birth</Text>
                    <Text style={styles.detailValue}>{profile.dob}</Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.detailIconBoxQuaternary}>
                    <Ionicons name="male-female" size={18} color={Colors.warning} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{profile.gender}</Text>
                  </View>
                </View>

              </View>
            )}

          </View>
        </ScrollView>
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
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: Colors.backgroundLight,
  },
  scrollView: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topHeader: {
    marginTop: Platform.OS === 'android' ? 50 : 30,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.text,
    fontFamily: FontFamilies.bold,
  },
  bannerContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCardLight,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerEditIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.backgroundOverlayVeryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -55,
    zIndex: 10,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.background,
    backgroundColor: Colors.backgroundLight,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundOverlayVeryLight,
  },
  detailRowSplit: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundOverlayVeryLight,
    gap: 16,
  },
  detailRowHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.pressed,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailIconBoxSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warningBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailIconBoxSecondaryDark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailIconBoxTertiary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.pressed,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailIconBoxQuaternary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warningBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailTextCol: {
    flexDirection: 'column',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
  }
});
