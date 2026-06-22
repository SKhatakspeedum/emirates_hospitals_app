import React, { useEffect, useRef, useState } from "react";
import { ImageBackground, Platform } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "../config/colors";
import {
  generateOtp,
  generateOtpEmail,
  getDecryptedID,
} from "../suggestus_plugin/util/util_functions";
import {
  IS_LOGGED_IN,
  SIGNUP_API_URL_STEP_3,
  SPD_USER_EMAIL,
  SPD_USER_ID,
  SPD_USER_NAME,
} from "../config/config";
import { useRoute } from "@react-navigation/native";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useResponsivePlatform } from "../hooks/useResponsivePlatform";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

export default function OTPVerificationScreen() {
  const { isWeb } = useResponsivePlatform();
  const route = useRoute();
  let { check_otp } = route.params as { check_otp: string };
  const router = useRouter();
  const { email = "" } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const [email_id, setEmail_id] = useState("");
  const horizontalMargin = useResponsiveHorizontalMargin();

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0,
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  useEffect(() => {
    const fetchEmail = async () => {
      const email_id_new = await getDecryptedID(SPD_USER_EMAIL);
      setEmail_id(email_id_new);
    };
    fetchEmail();
  }, []);

  const handleChange = (text, idx) => {
    if (/[^0-9]/.test(text)) return;
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);
    setError("");
    if (text && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (!text && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }
    setLoading(true);
    try {
      const user_id = await getDecryptedID(SPD_USER_ID);
      const verify_otp_response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_validate_md_user_accounts_otp,
        {
          p_user_id: user_id,
          p_otp: code,
        },
      );
      if (verify_otp_response.returnCode == true) {
        if (!!verify_otp_response.returnData[0].id) {
          /// now lets take user to Home screen
          const update_status_response = await callSuggestusAPI(
            spd_processId_config.spdonmood9_update_md_user_accounts_status,
            {
              p_user_id: user_id,
              p_status: "Active",
            },
          );
          Toast.show({
            type: "success",
            text1: "Account verified successfully.",
          });
          await AsyncStorage.setItem(IS_LOGGED_IN, "true");
          router.replace("/tab_bar_home/HomeScreen");
        } else {
          Toast.show({
            type: "error",
            text1: "OTP verification failed. Please try again.",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "OTP verification failed. Please try again.",
        });
      }
    } catch (err) {
      setLoading(false);
      setError("OTP verification failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    // TODO: Implement resend OTP API call
    let otp = generateOtp();
    let email_id = await getDecryptedID(SPD_USER_EMAIL);
    let fullName = await getDecryptedID(SPD_USER_NAME);
    let user_id = await getDecryptedID(SPD_USER_ID);
    let { subject, message } = generateOtpEmail(fullName, otp);
    // lets first save new OTP on backend
    const save_otp_response = await callSuggestusAPI(
      spd_processId_config.spdonmood9_update_md_user_accounts_otp,
      {
        p_user_id: user_id,
        p_otp: otp,
      },
    );
    if (save_otp_response.returnCode == true) {
      const resend_otp_response = await callSuggestusAPI(
        spd_processId_config.sgconf_integration_postAPICallJWT,
        {
          get_api_url: SiteConfig.on_mood9_API_URL + SIGNUP_API_URL_STEP_3,
          get_api_url_params: {
            message: message,
            email: email_id,
            subject: subject,
          },
        },
      );
      if (resend_otp_response.returnCode == true) {
        let status = resend_otp_response.returnData[0].p_return_result.status;
        if (status == true) {
          check_otp = otp;
          Toast.show({ type: "success", text1: "OTP sent successfully." });
        } else {
          Toast.show({
            type: "error",
            text1: "Some error occurred while resending OTP. Please try again.",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Some error occurred while resending OTP. Please try again.",
        });
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Some error occurred while resending OTP. Please try again.",
      });
    }
  };

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <View style={[styles.container, isWeb && styles.webContainer]}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/splash_icon.png")}
            style={styles.logo}
          />
          {/* <Text style={styles.title}>OnMood9</Text> */}
        </View>
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to ({email_id})</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputRefs.current[idx] = ref)}
              style={[
                styles.otpInput,
                isWeb && styles.inputNoOutline, // Remove outline on web
                error && !digit ? styles.otpInputError : null,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, idx)}
              returnKeyType="next"
              autoFocus={idx === 0}
            />
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the OTP? </Text>
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={styles.resendLink}>RESEND OTP</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          // @ts-ignore: cursor and transition are web-only
          style={[styles.verifyBtn, isWeb && styles.webVerifyBtn]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyBtnText}>VERIFY</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS === "web" && screenWidth >= 1024) {
    return (
      <ImageBackground
        source={require("@/assets/images/background_new_web.png")}
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
  // @ts-ignore: boxShadow is web-only
  containerNew: { flex: 1 },
  webContainer: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    marginVertical: 32,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    // justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 16,
    textAlign: "center",
    width: "100%",
    alignSelf: "flex-start",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
    borderRadius: 32,
    backgroundColor: "#888CA0",
  },
  subtitle: {
    fontSize: 16,
    color: "#575757",
    alignSelf: "flex-start",
    marginBottom: 18,
    fontFamily: "QuicksandSemiBold",
  },
  email: {
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  otpInput: {
    width: 38,
    height: 48,
    borderBottomWidth: 2,
    borderColor: "#8B4CFC",
    fontSize: 22,
    textAlign: "center",
    marginHorizontal: 4,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  // @ts-ignore: outlineStyle is web-only
  inputNoOutline: {
    outlineStyle: "none",
    outlineWidth: 0, // Remove browser default black border on focus (web)
  },
  otpInputError: {
    borderColor: "#e53935",
  },
  errorText: {
    color: "#e53935",
    fontSize: 13,
    marginBottom: 6,
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    justifyContent: "center",
  },
  resendText: {
    color: "#888CA0",
    fontSize: 14,
  },
  resendLink: {
    color: "#8B4CFC",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
  },
  verifyBtn: {
    width: "100%",
    backgroundColor: "#8B4CFC",
    shadowColor: "#8B4CFC",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  // @ts-ignore: cursor and transition are web-only
  webVerifyBtn: {
    cursor: Platform.OS === "web" ? "pointer" : undefined,
    transition: Platform.OS === "web" ? "opacity 0.2s" : undefined,
  },
  verifyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
