import React, { useState, useEffect } from "react";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { SPD_USER_ID, USER_FULL_DATA } from "../config/config";
import { hashPasswordAsync } from "../suggestus_plugin/util/util_functions";
import { spd_processId_config } from "../config/process_id";
import { setEncryptedID } from "../suggestus_plugin/util/util_functions";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import Svg, { Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { SiteConfig } from "../config/site_config";
import { PROFILE_PIC } from "../config/config";
import Toast from "react-native-toast-message";

import { Platform } from "react-native";

const HEADER_IMAGE = require("@/assets/images/image_131.png");
const AVATAR_PLACEHOLDER = require("@/assets/images/icon.png");

// Define the profile interface
interface ProfileData {
  fullName: string;
  contact: string;
  email: string;
}

// Define the password form interface
interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileScreen() {
  const horizontalMargin = useResponsiveHorizontalMargin();
  // ...existing state...
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // State for profile data and UI
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  // Initial empty profile
  const initialProfile: ProfileData = {
    fullName: "",
    contact: "",
    email: "",
  };

  // Country code state (separate from profile)
  const [countryCode, setCountryCode] = useState("+91");

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [tab, setTab] = useState("Personal");
  const router = useRouter();

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch user ID and profile data on component mount
  useEffect(() => {
    const fetchUserIdAndProfileImg = async () => {
      try {
        const id = await AsyncStorage.getItem(SPD_USER_ID);
        if (id) {
          setUserId(id);
          fetchProfileData(id);
        }
        // Get profile image from USER_FULL_DATA
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

  // Handler for profile image edit
  const handleProfileImageEdit = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access media library is required!");
        return;
      }

      // 1. Pick image from gallery
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ fixed deprecated option
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled) return;

      // 2. Crop/resize image
      const cropResult = await ImageManipulator.manipulateAsync(
        pickerResult.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setAvatarUploading(true);

      // 3. Upload image to server
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
          text2:
            uploadData?.msg ||
            "There was an error uploading your image. Please try again.",
        });
        return;
      }

      let imageUrl = `${SiteConfig.on_mood9_ASSETS_URL}/${uploadData.url}`;

      // 4. Update profile with image
      const apiRes = await callSuggestusAPI(
        spd_processId_config.spdonmood9_update_md_onmood9_users_assets_for_profile,
        {
          p_user_id: id,
          p_asset_type: "profile_image",
          p_asset_url: imageUrl,
        }
      );

      if (apiRes?.returnCode === true) {
        setAvatarUrl(imageUrl);
        setProfileImageUrl(imageUrl);
        Toast.show({
          type: "success",
          text1: "Profile image updated.",
        });

        fetchProfileData(id);
      } else {
        throw new Error("Failed to update profile image");
      }
    } catch (err: any) {
      console.log(err.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Could not update profile image.",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Fetch profile data from API
  const fetchProfileData = async (id: string) => {
    setLoading(true);
    // lets first set the data for screen
    let profileData = await AsyncStorage.getItem(USER_FULL_DATA);
    if (profileData) {
      const userData = JSON.parse(profileData);
      setProfile({
        fullName: userData.fname || "",
        email: userData.email || "",
        contact: userData.contact || "",
      });
      // Set country code separately
      setCountryCode("+91"); // Default to India
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
          // now lets set the state as well
          setProfile({
            fullName: userData.fname || "",
            email: userData.email || "",
            contact: userData.contact || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit mode toggle
  const handleEdit = () => setEditMode(true);

  // Handle profile form submission
  const handleSubmit = async () => {
    // Validate form
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_update_md_onmood9_users_profile,
        {
          p_user_id: userId,
          p_fname: profile.fullName,
          p_email: profile.email,
          p_contact: profile.contact,
        }
      );

      if (response?.returnCode === true) {
        Alert.alert("Success", "Profile updated successfully");
        setEditMode(false);
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Validate profile form
  const validateProfile = () => {
    const errors: { [key: string]: string } = {};

    if (!profile.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!profile.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(profile.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!profile.contact.trim()) {
      errors.contact = "Contact number is required";
    } else if (!/^\d{10}$/.test(profile.contact.replace(/\s/g, ""))) {
      errors.contact = "Please enter a valid 10-digit contact number";
    }

    return errors;
  };

  // Handle password form validation and submission
  const validatePasswordForm = () => {
    const errors: { [key: string]: string } = {};

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  // Handle password change
  const handlePasswordChange = async () => {
    const validationErrors = validatePasswordForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Get user ID from AsyncStorage
      const id = await AsyncStorage.getItem(SPD_USER_ID);
      if (!id) {
        throw new Error("User ID not found");
      }

      // Hash the password using bcrypt
      const hashedPassword = await hashPasswordAsync(passwordForm.newPassword);

      // Call the API to update the password
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_update_md_onmood9_users_change_password,
        {
          p_user_id: id,
          p_password: hashedPassword,
        }
      );

      if (response?.returnCode === true) {
        Alert.alert("Success", "Password changed successfully");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      } else {
        Alert.alert(
          "Error",
          response?.returnMessage ||
          "Failed to change password. Please try again."
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form field changes
  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile({ ...profile, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Handle password form field changes
  const handlePasswordFormChange = (
    field: keyof PasswordForm,
    value: string
  ) => {
    setPasswordForm({ ...passwordForm, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <ImageBackground
        source={require("@/assets/images/internal_screen_bg.png")}
        style={styles.background}
      >
        {/* Top Header for screen */}
        <CustomTopHeader title="Back" />
        <ScrollView style={[styles.scrollView]}>
          <View style={[styles.container,
          Platform.OS === "web" && screenWidth >= 1024 ? { width: '100%', maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' } : {},]}>
            {/* Profile header image */}
            <Image
              source={HEADER_IMAGE}
              style={[
                styles.headerImg,
                Platform.OS === "web" && screenWidth >= 1024 ? { height: 250 } : {},
              ]}
            />

            {/* Profile avatar */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handleProfileImageEdit}
              disabled={avatarUploading}
            >
              <Image
                source={
                  profileImageUrl
                    ? { uri: profileImageUrl }
                    : avatarUrl
                      ? { uri: avatarUrl }
                      : AVATAR_PLACEHOLDER
                }
                style={styles.avatar}
              />
              <View style={[styles.editIcon, { right: Platform.OS === "web" && screenWidth >= 1024 ? undefined : "40%" }]}>
                {avatarUploading ? (
                  <Text style={styles.editIconText}>
                    <ActivityIndicator size="small" color="#fff" />
                  </Text>
                ) : (
                  <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                    <Path
                      d="M7.42701 5.40719C7.22046 5.40719 7.05351 5.57455 7.05351 5.78069V8.7689C7.05351 8.9747 6.88615 9.14241 6.68001 9.14241H1.45065C1.24444 9.14241 1.07715 8.9747 1.07715 8.7689V3.53955C1.07715 3.33375 1.24444 3.16605 1.45065 3.16605H4.43886C4.64541 3.16605 4.81236 2.99869 4.81236 2.79255C4.81236 2.58634 4.64541 2.41898 4.43886 2.41898H1.45065C0.832844 2.41898 0.330078 2.92174 0.330078 3.53955V8.7689C0.330078 9.38671 0.832844 9.88948 1.45065 9.88948H6.68001C7.29781 9.88948 7.80058 9.38671 7.80058 8.7689V5.78069C7.80058 5.57414 7.63356 5.40719 7.42701 5.40719Z"
                      fill="white"
                    />
                    <Path
                      d="M3.83254 5.06693C3.80641 5.09306 3.78883 5.1263 3.78138 5.16214L3.51731 6.48297C3.505 6.54418 3.52442 6.60731 3.56847 6.65177C3.60396 6.68726 3.65177 6.70628 3.70074 6.70628C3.71264 6.70628 3.72502 6.70518 3.73733 6.70258L5.05775 6.43851C5.09434 6.43099 5.12758 6.41348 5.15337 6.38729L8.10868 3.43197L6.78826 2.11162L3.83254 5.06693Z"
                      fill="white"
                    />
                    <Path
                      d="M9.02094 1.19834C8.65681 0.834136 8.06438 0.834136 7.70052 1.19834L7.18359 1.71526L8.50401 3.03568L9.02094 2.51869C9.19726 2.34278 9.29438 2.10819 9.29438 1.85868C9.29438 1.60918 9.19726 1.37459 9.02094 1.19834Z"
                      fill="white"
                    />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Tabs */}
            <View style={[styles.tabRow]}>
              <View style={[styles.tabRow,
              Platform.OS === "web" && screenWidth >= 1024 ? { width: "100%", alignItems: "center", justifyContent: "center", margin: 0 } : {},
              ]}>
                <TouchableOpacity
                  onPress={() => {
                    setTab("Personal");
                    setErrors({});
                  }}
                  style={styles.tabBtn}
                >
                  <Text
                    style={[styles.tab, tab === "Personal" && styles.tabActive]}
                  >
                    Personal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setTab("ChangePassword");
                    setErrors({});
                  }}
                  style={styles.tabBtn}
                >
                  <Text
                    style={[
                      styles.tab,
                      tab === "ChangePassword" && styles.tabActive,
                    ]}
                  >
                    Change Password
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loading indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B4CFC" />
                <Text style={styles.loadingText}>Loading profile data...</Text>
              </View>
            )}

            {/* Personal Info Tab */}
            {!loading && tab === "Personal" && (
              <View style={[styles.infoBox]}>
                <View
                  style={[{ width: "100%" },
                  Platform.OS === "web" && screenWidth >= 1024
                    ? { width: "90%" }
                    : {},
                  ]}
                >
                  <Text style={styles.label}>Full name</Text>
                  {editMode ? (
                    <TextInput
                      style={[
                        styles.input,
                        errors.fullName ? styles.inputError : null,
                      ]}
                      value={profile.fullName}
                      onChangeText={(text) => handleChange("fullName", text)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <Text style={styles.value}>{profile.fullName || ""}</Text>
                  )}

                  <Text style={styles.label}>Contact</Text>
                  {editMode ? (
                    <View style={styles.phoneRow}>
                      <TextInput
                        style={[styles.input, styles.countryCode]}
                        value={countryCode}
                        onChangeText={setCountryCode}
                        keyboardType="phone-pad"
                        maxLength={4}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.phoneNumber,
                          errors.contact ? styles.inputError : null,
                        ]}
                        value={profile.contact}
                        onChangeText={(text) => handleChange("contact", text)}
                        keyboardType="phone-pad"
                        placeholder="Enter your contact number"
                      />
                    </View>
                  ) : (
                    <Text style={styles.value}>
                      {countryCode} {profile.contact || ""}
                    </Text>
                  )}

                  <Text style={styles.label}>Email</Text>
                  {/* Email is always displayed as text, never editable */}
                  <Text
                    style={[styles.value, editMode && styles.disabledInput]}
                  >
                    {profile.email || ""}
                  </Text>
                </View>
                {/* Action buttons */}
                <View style={styles.actionRow}>
                  {editMode ? (
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        Platform.OS === "web" && screenWidth >= 1024
                          ? { width: 300 }
                          : {},
                      ]}
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitBtnText}>Update Profile</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleEdit}>
                      <Text style={styles.editProfileText}>Edit profile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Change Password Tab */}
            {!loading && tab === "ChangePassword" && (
              <View style={styles.infoBox}>
                <View
                  style={[{ width: "100%" },
                  Platform.OS === "web" && screenWidth >= 1024
                    ? { width: "90%" }
                    : {},
                  ]}
                >
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.newPassword ? styles.inputError : null,
                      ]}
                      value={passwordForm.newPassword}
                      onChangeText={(text) =>
                        handlePasswordFormChange("newPassword", text)
                      }
                      secureTextEntry={!showNewPassword}
                      placeholder="Enter new password"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <MaterialIcons
                        name={showNewPassword ? "visibility" : "visibility-off"}
                        size={20}
                        color="#B3B7C6"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.newPassword ? (
                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                  ) : null}

                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.confirmPassword ? styles.inputError : null,
                      ]}
                      value={passwordForm.confirmPassword}
                      onChangeText={(text) =>
                        handlePasswordFormChange("confirmPassword", text)
                      }
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Confirm new password"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <MaterialIcons
                        name={
                          showConfirmPassword ? "visibility" : "visibility-off"
                        }
                        size={20}
                        color="#B3B7C6"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  ) : null}

                  <View style={styles.passwordRequirements}>
                    <Text style={styles.passwordHint}>
                      Password must be at least 6 characters long
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      styles.passwordSubmitBtn,
                      Platform.OS === "web" && screenWidth >= 1024
                        ? { width: 300 }
                        : {},
                    ]}
                    onPress={handlePasswordChange}
                    disabled={
                      submitting ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    }
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Change Password</Text>
                    )}
                  </TouchableOpacity>
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
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 0,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
    marginBottom: 18,
  },
  backButton: {
    padding: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandRegular",
  },
  headerImg: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 8,
  },
  avatarWrapper: { alignItems: "center", marginTop: -60, marginBottom: 16 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "#7B5AFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editIconText: {
    color: "#fff",
    fontWeight: "bold",
    paddingTop: 7,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E4",
    marginHorizontal: 0,
    width: "100%",
  },
  tabBtn: { flex: 1, alignItems: "center", paddingBottom: 6, width: "50%" },
  tab: {
    fontSize: 16,
    color: "#262626",
    borderBottomWidth: 1.5,
    borderBottomColor: "transparent",
    paddingBottom: 6,
    width: "100%",
    textAlign: "center",
    fontFamily: "QuicksandSemiBold",
    marginBottom: -6,
  },
  tabActive: { color: "#8B4CFC", borderBottomColor: "#8B4CFC" },
  infoBox: {
    paddingHorizontal: 0,
    paddingTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#262626",
    marginTop: 12,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "QuicksandRegular",
  },
  value: {
    fontSize: 16,
    color: "#262626",
    marginBottom: 2,
    paddingVertical: 8,
    // paddingTop: 2,
    fontFamily: "QuicksandSemiBold",
    // borderBottomWidth: 1,
    // borderBottomColor: "#bbb",
  },
  input: {
    fontSize: 16,
    color: "#262626",
    marginBottom: 2,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    fontFamily: "QuicksandSemiBold",
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 1,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
    fontFamily: "QuicksandRegular",
  },
  phoneRow: { flexDirection: "row", gap: 8 },
  countryCode: { width: 70, flex: 0, marginRight: 8 },
  phoneNumber: { flex: 1 },
  actionRow: { alignItems: "center", marginTop: 30 },
  submitBtn: {
    backgroundColor: "#7B5AFF",
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 60,
    width: "100%",
  },
  submitBtnText: {
    color: "#fff",
    // fontWeight: "600",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    textAlign: "center",
  },
  editProfileText: {
    color: "#7B5AFF",
    fontSize: 16,
    textDecorationLine: "underline",
    marginTop: 20,
    fontFamily: "QuicksandSemiBold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4CFC",
    fontFamily: "QuicksandRegular",
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: "#898D9E",
    fontFamily: "QuicksandRegular",
  },
  passwordSubmitBtn: {
    marginTop: 30,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 5,
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#e7e7e7",
    color: "#666",
    padding: 12,
    borderRadius: 8,
    fontFamily: "QuicksandRegular",
  },
});
