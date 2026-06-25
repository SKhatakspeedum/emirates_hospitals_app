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

  const isContinueEnabled = fullName.trim().length > 0;

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
          <View style={styles.content}>
            {/* Centered Brand Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>

            {/* Header Title */}
            <Text style={styles.title}>Enter your personal details</Text>

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
                  color={focusedField === "fullName" ? "#0177C8" : "#8E95A9"}
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
                  color={focusedField === "email" ? "#0177C8" : "#8E95A9"}
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

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              isContinueEnabled ? styles.continueBtnEnabled : styles.continueBtnDisabled,
            ]}
            disabled={!isContinueEnabled || loading}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
  },
  logoImg: {
    width: 280,
    height: 70,
  },
  title: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
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
    color: "#8E95A9",
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
    backgroundColor: "#FAFAFF",
    borderWidth: 1,
    borderColor: "#F0F1F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
  },
  inputWrapperFocused: {
    borderColor: "#0177C8",
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
    backgroundColor: "#fff",
  },
  continueBtn: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueBtnEnabled: {
    backgroundColor: "#001871",
    ...Platform.select({
      ios: {
        shadowColor: "#001871",
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
    backgroundColor: "#D0D4DF",
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});
