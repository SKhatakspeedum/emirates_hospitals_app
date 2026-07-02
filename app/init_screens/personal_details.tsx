import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  IS_LOGGED_IN,
  USER_FULL_DATA,
  SPD_USER_NAME,
  SPD_USER_EMAIL,
} from "../config/config";
import { Colors } from "../config/colors";
import {
  setEncryptedID,
  getDecryptedID,
  saveDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import {
  callSuggestusAPI,
  setUserId,
  setRoleId,
  setUserName,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const route = useRoute();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your full name to continue.",
      });
      Alert.alert("Required Field", "Please enter your full name to continue.");
      return;
    }

    setLoading(true);
    try {
      const name = fullName.trim();
      const nameParts = name.split(" ");
      const firstName = nameParts[0] ?? name;
      const lastName = nameParts.slice(1).join(" ");

      const rawPhone = (route.params as any)?.phone_number ?? "";

      // 1. Save Full Name and Email encrypted
      await setEncryptedID(SPD_USER_NAME, name);
      if (email.trim()) {
        await setEncryptedID(SPD_USER_EMAIL, email.trim());
      }

      // 2. Fetch current USER_FULL_DATA, update and save back
      const currentDataStr = await getDecryptedID(USER_FULL_DATA);
      let updatedData: Record<string, string> = {
        fname: name,
        email: email.trim(),
        contact: rawPhone,
      };

      if (currentDataStr) {
        try {
          const parsed = JSON.parse(currentDataStr);
          updatedData = {
            ...parsed,
            fname: name,
            email: email.trim() || parsed.email,
            contact: rawPhone || parsed.contact,
          };
        } catch (e) {
          // keep default
        }
      }

      await setEncryptedID(USER_FULL_DATA, JSON.stringify(updatedData));

      // 3. Register user via signup wrapper
      const signupRes = await callSuggestusAPI(
        spd_processId_config.sgconf_save_mst_user_from_signup_wrapper,
        {
          p_create_ai_code: SiteConfig.AI_CODE,
          p_next_process_id:
            "sgconf_get_mst_user_profile_for_authentic_token_v2",
          p_register_new_patient_flag: "N",
          p_usr_phone: rawPhone,
          p_usr_name: name,
          p_usr_additional_attributes: JSON.stringify({
            p_first_name: firstName,
            p_last_name: lastName,
            USER_LOGIN_TYPE: "external",
            USER_LOGIN_TYPE_DETAIL: "otp",
            user_emirates_id: "",
          }),
        },
      );

      if (signupRes?.returnCode !== true) {
        Toast.show({
          type: "error",
          text1: "Registration failed. Please try again.",
        });
        setLoading(false);
        return;
      }

      // 4. Fetch full user profile to get usr_id, rol_id, org_id, etc.
      const phoneE164 = rawPhone.replace(/\s+/g, "");
      const validateRes = await callSuggestusAPI(
        spd_processId_config.sgconf_util_validate_user_v2,
        {
          p_username: phoneE164.replace(/^\+/, ""),
          p_password: "",
          p_ai_code: SiteConfig.AI_CODE,
          p_login_type: "external",
        },
      );

      if (validateRes?.returnCode === true && validateRes?.returnData?.length > 0) {
        const u = validateRes.returnData[0];
        await Promise.all([
          setUserId(String(u.usr_id ?? "")),
          setRoleId(String(u.rol_id ?? "")),
          setUserName(u.usr_name ?? ""),
          saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
          saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
          saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
          saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
          u.usr_patient_id ? setPatientId(String(u.usr_patient_id)) : Promise.resolve(),
        ]);
      }

      // 5. Mark the user as logged in
      await AsyncStorage.setItem(IS_LOGGED_IN, "true");

      Toast.show({
        type: "success",
        text1: "Profile Updated Successfully",
        text2: "Welcome to Emirates Hospitals Group",
      });

      // 6. Redirect to Success screen
      router.replace("/init_screens/success");
    } catch (error) {
      console.error("Error saving personal details:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong while saving your details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const { height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenHeight < 680;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, { paddingTop: isSmallScreen ? 40 : 80 }]}>
            {/* Centered Brand Logo */}
            <View style={[styles.logoContainer, { marginVertical: isSmallScreen ? 15 : 40 }]}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={[styles.logoImg, { height: isSmallScreen ? 50 : 70 }]}
                resizeMode="contain"
              />
            </View>

            {/* Header Title */}
            <Text style={[styles.title, { marginBottom: isSmallScreen ? 15 : 32 }]}>Enter your personal details</Text>

            {/* Full Name Input Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "fullName" && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={focusedField === "fullName" ? Colors.secondary : Colors.label}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputNoOutline]}
                  placeholder="John Doe"
                  placeholderTextColor="#B3B7C6"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField("")}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Email Input Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Email <Text style={styles.optionalText}>(Optional)</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "email" && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedField === "email" ? Colors.secondary : Colors.label}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputNoOutline]}
                  placeholder="john@doe.com"
                  placeholderTextColor="#B3B7C6"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </View>
            </View>

            {/* Spacer */}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

        <View style={[styles.bottomBtnContainer, { paddingBottom: Platform.OS === "ios" ? (isSmallScreen ? 16 : 36) : 24 }]}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              styles.continueBtnEnabled,
            ]}
            disabled={loading}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.label} />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Toast />
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 40,
    width: "100%",
  },
  logoImg: {
    width: 280,
    height: 70,
  },
  title: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: Colors.text,
    marginBottom: 32,
    textAlign: "left",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
    color: Colors.label,
    marginBottom: 8,
    textAlign: "left",
  },
  optionalText: {
    fontFamily: "QuicksandMedium",
    color: "#B3B7C6",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
  },
  inputWrapperFocused: {
    borderColor: Colors.secondary,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1B2130",
    fontFamily: "QuicksandMedium",
    paddingVertical: 0,
  },
  // @ts-ignore: outlineStyle is web-only
  inputNoOutline: {
    outlineStyle: "none",
    outlineWidth: 0,
  } as any,
  bottomBtnContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  continueBtn: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueBtnEnabled: {
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueBtnDisabled: {
    backgroundColor: Colors.inactive,
  },
  continueBtnText: {
    color: Colors.lightgray,
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});
