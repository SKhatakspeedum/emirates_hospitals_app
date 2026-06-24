import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  USER_FULL_DATA,
} from "../config/config";
import { useRoute } from "@react-navigation/native";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OTPVerificationScreen() {
  const route = useRoute();
  let { check_otp } = route.params as { check_otp: string };
  const router = useRouter();
  const { email = "" } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<any[]>([]);

  const [email_id, setEmail_id] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchEmailAndPhone = async () => {
      // Fetch email id
      const email_id_new = await getDecryptedID(SPD_USER_EMAIL);
      setEmail_id(email_id_new || "");

      // Fetch phone number representation
      const paramPhone = (route.params as any)?.phone_number;
      if (paramPhone) {
        setPhoneDisplay(paramPhone);
        return;
      }

      const fullDataStr = await getDecryptedID(USER_FULL_DATA);
      if (fullDataStr) {
        try {
          const parsed = JSON.parse(fullDataStr);
          if (parsed.contact) {
            setPhoneDisplay(parsed.contact);
            return;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      setPhoneDisplay(email_id_new || "your number");
    };
    fetchEmailAndPhone();
  }, []);

  const handleChange = (text: string, idx: number) => {
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

      // Guest User Bypass
      if (user_id === "guest_user_id") {
        if (code === check_otp || code === "123456") {
          Toast.show({
            type: "success",
            text1: "Account verified successfully.",
          });
          router.replace("/init_screens/personal_details");
        } else {
          Toast.show({
            type: "error",
            text1: "OTP verification failed. Please try again.",
          });
        }
        setLoading(false);
        return;
      }

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
          await callSuggestusAPI(
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
          router.replace("/init_screens/personal_details");
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
    let otp = generateOtp();
    let email_id = await getDecryptedID(SPD_USER_EMAIL);
    let fullName = await getDecryptedID(SPD_USER_NAME);
    let user_id = await getDecryptedID(SPD_USER_ID);
    let { subject, message } = generateOtpEmail(fullName, otp);
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

  const isOtpComplete = otp.join("").length === 6;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.startTitle}>Awesome, Thanks!</Text>
            <Text style={styles.startSubtitle}>
              Enter the 6 digit code we sent to {phoneDisplay} to verify your number.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.phoneLabel}>OTP</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => (inputRefs.current[idx] = ref)}
                    style={[
                      styles.otpInput,
                      focusedIdx === idx && styles.otpInputFocused,
                      error && !digit ? styles.otpInputError : null,
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleChange(text, idx)}
                    onFocus={() => setFocusedIdx(idx)}
                    onBlur={() => setFocusedIdx(null)}
                    returnKeyType="next"
                    autoFocus={idx === 0}
                  />
                ))}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                <Text style={styles.resendLink}>Resend code</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 0.35 }} />

            <TouchableOpacity
              style={[
                styles.verifyBtn,
                isOtpComplete ? styles.verifyBtnEnabled : styles.verifyBtnDisabled,
              ]}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  startTitle: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
    marginBottom: 8,
    textAlign: "left",
  },
  startSubtitle: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: "#6F768E",
    marginBottom: 40,
    textAlign: "left",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
    color: "#8E95A9",
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0F1F9",
    fontSize: 20,
    textAlign: "center",
    color: "#1B2130",
    backgroundColor: "#FAFAFF",
    fontFamily: "QuicksandBold",
    // @ts-ignore: outlineStyle is web-only
    outlineStyle: "none",
    outlineWidth: 0,
  },
  otpInputFocused: {
    borderColor: "#0177C8",
  },
  otpInputError: {
    borderColor: "#E53935",
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginTop: 8,
    textAlign: "left",
    fontFamily: "QuicksandMedium",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    justifyContent: "flex-start",
  },
  resendText: {
    color: "#6F768E",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
  },
  resendLink: {
    color: "#0177C8",
    fontFamily: "QuicksandBold",
    fontSize: 14,
  },
  verifyBtn: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  verifyBtnEnabled: {
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
  verifyBtnDisabled: {
    backgroundColor: "#D0D4DF",
  },
  verifyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});
