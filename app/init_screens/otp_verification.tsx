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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getDecryptedID,
  saveDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import { SPD_USER_EMAIL, USER_FULL_DATA } from "../config/config";
import {
  setUserId,
  setRoleId,
  setUserName,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { Colors } from "../config/colors";
import { useRoute } from "@react-navigation/native";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import Toast from "react-native-toast-message";

export default function OTPVerificationScreen() {
  const route = useRoute();
  const router = useRouter();
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
      setError("Please enter the 6-digit code sent to your phone.");
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the 6-digit code.",
      });
      return;
    }

    setLoading(true);
    try {
      const rawPhone = (route.params as any)?.phone_number ?? phoneDisplay;
      const phoneE164 = rawPhone.replace(/\s+/g, "");

      const res = await callSuggestusAPI(
        spd_processId_config.sgconf_verify_otp_for_user_for_all_authentication_factor_type,
        {
          p_usr_otp_authentication_factor: phoneE164,
          p_otp: code,
          p_usr_otp_authentication_factor_type: "sms",
        },
      );

      if (res?.returnCode === true) {
        Toast.show({
          type: "success",
          text1: "Phone verified successfully.",
        });

        const validateRes = await callSuggestusAPI(
          spd_processId_config.sgconf_util_validate_user_v2,
          {
            p_username: phoneE164.replace(/^\+/, ""),
            p_password: "",
            p_ai_code: SiteConfig.AI_CODE,
            p_login_type: "external",
          },
        );

        if (
          validateRes?.returnCode === true &&
          validateRes?.returnData?.length > 0
        ) {
          const u = validateRes.returnData[0];
          console.log("usr_id: ", u);
          await Promise.all([
            setUserId(u.usr_id ?? ""),
            setRoleId(u.rol_id ?? ""),
            setUserName(u.usr_name ?? ""),
            saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
            saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
            saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
            saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
            saveDataFromLocalStorage("isLoggedIn", "true"),
            u.usr_patient_id
              ? setPatientId(String(u.usr_patient_id))
              : Promise.resolve(),
          ]);
          router.replace("/(drawer)/tab_bar_home/HomeScreen");
        } else {
          // router.replace("/init_screens/signup");
          router.replace({
            pathname: "/init_screens/personal_details",
            params: { phone_number: rawPhone },
          });
        }
      } else {
        setLoading(false);
        setError("OTP verification failed. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setError("OTP verification failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    const rawPhone = (route.params as any)?.phone_number ?? phoneDisplay;
    const fullPhoneNumber = rawPhone.replace(/\s+/g, " ").trim();

    const res = await callSuggestusAPI(
      spd_processId_config.sgconf_save_mst_user_otp_for_sms,
      {
        p_email_id: "",
        p_usr_phone_number: fullPhoneNumber,
        p_additional_attributes: {
          p_name: "",
          p_usr_additional_attributes: JSON.stringify({
            p_first_name: "",
            p_last_name: "",
          }),
          p_ai_code: SiteConfig.AI_CODE,
          p_domian_url: SiteConfig.ACTION_URL,
        },
      },
    );

    if (res?.returnCode === true) {
      Toast.show({ type: "success", text1: "OTP sent successfully." });
    } else {
      Toast.show({
        type: "error",
        text1: "Some error occurred while resending OTP. Please try again.",
      });
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
          <View
            style={[styles.content, { paddingTop: isSmallScreen ? 40 : 80 }]}
          >
            <View
              style={[
                styles.logoContainer,
                { marginVertical: isSmallScreen ? 15 : 40 },
              ]}
            >
              <Image
                source={require("@/assets/images/logo.png")}
                style={[styles.logoImg, { height: isSmallScreen ? 50 : 70 }]}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.startTitle}>Awesome, Thanks!</Text>
            <Text
              style={[
                styles.startSubtitle,
                { marginBottom: isSmallScreen ? 20 : 40 },
              ]}
            >
              Enter the 6 digit code we sent to {phoneDisplay} to verify your
              number.
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
                    returnKeyType={idx === 5 ? "done" : "next"}
                    onSubmitEditing={() => {
                      if (idx === 5) {
                        handleVerifyOtp();
                      } else {
                        inputRefs.current[idx + 1]?.focus();
                      }
                    }}
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

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBtnContainer,
            {
              paddingBottom:
                Platform.OS === "ios" ? (isSmallScreen ? 16 : 36) : 24,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.verifyBtn, styles.verifyBtnEnabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.label} />
            ) : (
              <Text style={styles.verifyBtnText}>Verify</Text>
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

    width: "100%",
    marginVertical: 40,
  },
  logoImg: {
    width: 280,
    height: 70,
  },
  startTitle: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "left",
  },
  startSubtitle: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
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
    color: Colors.label,
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
    borderColor: Colors.border,
    fontSize: 20,
    textAlign: "center",
    color: "#1B2130",
    backgroundColor: Colors.lightgray,
    fontFamily: "QuicksandBold",
    // @ts-ignore: outlineStyle is web-only
    outlineStyle: "none",
    outlineWidth: 0,
  },
  otpInputFocused: {
    borderColor: Colors.secondary,
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
    color: Colors.label,
    fontSize: 14,
    fontFamily: "QuicksandMedium",
  },
  resendLink: {
    color: Colors.secondary,
    fontFamily: "QuicksandBold",
    fontSize: 14,
  },
  bottomBtnContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  verifyBtn: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  verifyBtnEnabled: {
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
  verifyBtnDisabled: {
    backgroundColor: Colors.inactive,
  },
  verifyBtnText: {
    color: Colors.lightgray,
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});
