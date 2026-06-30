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
} from "../suggestus_plugin/util/util_functions";

export default function PersonalDetailsScreen() {
  const router = useRouter();
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
      // 1. Save Full Name and Email encrypted
      await setEncryptedID(SPD_USER_NAME, fullName.trim());
      if (email.trim()) {
        await setEncryptedID(SPD_USER_EMAIL, email.trim());
      }

      // 2. Fetch current USER_FULL_DATA, parse it, update the profile, and save it back
      const currentDataStr = await getDecryptedID(USER_FULL_DATA);
      let updatedData = {
        fname: fullName.trim(),
        email: email.trim(),
        contact: "",
      };

      if (currentDataStr) {
        try {
          const parsed = JSON.parse(currentDataStr);
          updatedData = {
            ...parsed,
            fname: fullName.trim(),
            email: email.trim() || parsed.email,
          };
        } catch (e) {
          // Keep default if parse fails
        }
      }

      await setEncryptedID(USER_FULL_DATA, JSON.stringify(updatedData));

      // 3. Mark the user as logged in
      await AsyncStorage.setItem(IS_LOGGED_IN, "true");

      Toast.show({
        type: "success",
        text1: "Profile Updated Successfully",
        text2: "Welcome to Emirates Hospitals Group",
      });

      // 4. Redirect to Success screen
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
