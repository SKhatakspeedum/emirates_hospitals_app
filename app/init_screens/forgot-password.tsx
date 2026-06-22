import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../config/colors";
import {
  checkEmailExists,
  generatePasswordResetEmail,
  generateRandomPassword,
  getDecryptedID,
  hashPasswordAsync,
  setEncryptedID,
} from "../suggestus_plugin/util/util_functions";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import {
  SIGNUP_API_URL_STEP_3,
  SPD_ORG_ID,
  SPD_USER_EMAIL_ID,
} from "../config/config";
import Toast from "react-native-toast-message";
import { SiteConfig } from "../config/site_config";
import { useResponsivePlatform } from "../hooks/useResponsivePlatform";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

export default function ForgotPasswordScreen() {
  const { isWeb } = useResponsivePlatform();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const horizontalMargin = useResponsiveHorizontalMargin();

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

  // Simulated async password reset function

  let p_org_id = getDecryptedID(SPD_ORG_ID);
  // console.log(p_org_id)

  const handlePasswordReset = async () => {
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (isWeb) {
        Toast.show({
          type: "error",
          text1: "Invalid Email",
          text2: "Please enter a valid email address.",
        });
      } else {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
      }
      return;
    }

    setLoading(true);
    try {
      // Step 1: Check if the email exists
      const emailCheck = await checkEmailExists(email);
      if (!emailCheck.success) {
        setLoading(false);
        Alert.alert("Email Not Found", emailCheck.message); // Show toast or alert
        Toast.show({
          type: "error",
          text1: "Error",
          text2: emailCheck.message,
        });
        return;
      }
      // Step 2: Proceed with OTP
      setEncryptedID(SPD_USER_EMAIL_ID, email);

      const randomStr = generateRandomPassword();
      const generatedPassword = await hashPasswordAsync(randomStr);
      const res = await callSuggestusAPI(
        spd_processId_config.spdonmood9_update_md_onmood9_users_forgot_password,
        {
          p_email: email,
          p_password: generatedPassword,
        }
      );

      if (res.returnCode === true) {
        setLoading(false);

        if (res.returnCode === true) {
          let { subject, message } = generatePasswordResetEmail(randomStr);
          const step3_response = await callSuggestusAPI(
            spd_processId_config.sgconf_integration_postAPICallJWT,
            {
              get_api_url: SiteConfig.on_mood9_API_URL + SIGNUP_API_URL_STEP_3,
              get_api_url_params: {
                message: message,
                email: email,
                subject: subject,
              },
            }
          );
          if (step3_response.returnCode == true) {
            let status = step3_response.returnData[0].p_return_result.status;
            if (status == true) {
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Password reset email sent successfully.",
              });
              router.replace({
                pathname: "/init_screens/login",
                params: { email },
              });
            } else {
              setLoading(false);
              if (isWeb) {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2:
                    step3_response.msg ||
                    "Failed to send OTP. Please try again.",
                });
              } else {
                Alert.alert(
                  "Error",
                  step3_response.msg || "Failed to send OTP. Please try again."
                );
              }
            }
          } else {
            setLoading(false);
            if (isWeb) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  step3_response.msg || "Failed to send OTP. Please try again.",
              });
            } else {
              Alert.alert(
                "Error",
                step3_response.msg || "Failed to send OTP. Please try again."
              );
            }
          }

          setLoading(false);
        }
      } else {
        setLoading(false);
        if (isWeb) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: res.msg || "Failed to send OTP. Please try again.",
          });
        } else {
          Alert.alert(
            "Error",
            res.msg || "Failed to send OTP. Please try again."
          );
        }
      }
    } catch (error) {
      setLoading(false);
      if (isWeb) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Something went wrong. Please try again later.",
        });
      } else {
        Alert.alert("Error", "Something went wrong. Please try again later.");
      }
      console.error(error);
    }
  };

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
                          Platform.OS === "web" && screenWidth >= 1024 && { justifyContent: 'center', flexGrow:1 } 
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          {/* @ts-ignore: webContainer includes web-only style keys */}
          <View style={[styles.container, isWeb && styles.webContainer,
                                Platform.OS === "web" && screenWidth >= 1024 && {
                                          flex:'0 0 auto'
                                        }]}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/splash_icon.png")}
                style={styles.logo}
              />
            </View>

            <Text style={styles.title}>Reset your Password!</Text>
            <Text style={styles.subtitle}>
              Please enter your registered Email below
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused && styles.inputWrapperFocused,
                ]}
              >
                <Image
                  source={require("@/assets/images/email.png")}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, isWeb && styles.inputNoOutline]}
                  placeholder="Enter Your Email"
                  placeholderTextColor="#B3B7C6"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  onKeyPress={
                    isWeb
                      ? (e) => {
                          if (e.nativeEvent.key === "Enter") {
                            handlePasswordReset();
                          }
                        }
                      : undefined
                  }
                />
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => router.replace("/init_screens/login")}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                // @ts-ignore: cursor and transition are web-only
                style={[
                  styles.submitBtn,
                  email ? styles.submitBtnActive : styles.submitBtnInactive,
                  isWeb && styles.webSubmitBtn,
                ]}
                disabled={!email || loading}
                onPress={handlePasswordReset}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: "#fff",
    alignItems: "center",
    // justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
    borderRadius: 32,
    backgroundColor: "#888CA0",
  },
  title: {
    fontSize: 24,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 16,
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#575757",
    alignSelf: "flex-start",
    marginBottom: 18,
    fontFamily: "QuicksandSemiBold",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: "#898D9E",
    marginTop: 8,
    marginBottom: 6,
    fontFamily: "QuicksandMedium",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F1F9",
    borderRadius: 8,
    backgroundColor: "#FAFAFF",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputWrapperFocused: {
    backgroundColor: "#FAFAFF",
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  // @ts-ignore: outlineStyle is web-only
  inputNoOutline: {
    outlineStyle: "none",
    outlineWidth: 0, // Remove browser default black border on focus (web)
  },
  inputIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    alignSelf: "center",
    resizeMode: "contain",
    tintColor: Colors.text + "80",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelBtnText: {
    color: "#232323",
    fontWeight: "500",
    fontSize: 15,
  },
  submitBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#898D9E",
  },
  // @ts-ignore: cursor and transition are web-only
  webSubmitBtn: {
    cursor: Platform.OS === "web" ? "pointer" : undefined,
    transition: Platform.OS === "web" ? "opacity 0.2s" : undefined,
  },
  submitBtnActive: {
    backgroundColor: "#8B4CFC",
    shadowColor: "#8B4CFC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  submitBtnInactive: {
    backgroundColor: "#888CA0",
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
