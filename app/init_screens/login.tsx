import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ImageBackground,
} from "react-native";
import { Colors } from "../config/colors";
import { Labels } from "../config/labels";
import { useRouter } from "expo-router";
import { useAuth } from "../auth-context";
import { SiteConfig } from "../config/site_config";
// --- Social Login Config Helpers for Expo Go & Web ---
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import { Platform } from "react-native";
import { useResponsivePlatform } from "../hooks/useResponsivePlatform";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import {
  generateOtp,
  generateOtpEmail,
  setEncryptedID,
} from "../suggestus_plugin/util/util_functions";
import {
  SPD_USER_ID,
  USER_FULL_DATA,
  IS_LOGGED_IN,
  LOGIN_API_URL,
  SPD_USER_NAME,
  SPD_USER_EMAIL,
  SIGNUP_API_URL_STEP_3,
  SOCIAL_LOGIN_API_URL,
  SPD_USER_SUBSCRIPTION,
} from "../config/config";

import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

export default function LoginScreen() {
  const { isWeb } = useResponsivePlatform();
  // Google Auth Request Hook
  // Create redirect URI
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: SiteConfig.google.webClientId,
    });
  }, []);

  async function onGoogleButtonPress() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const signInResult = await GoogleSignin.signIn();
      const type = signInResult.type;
      if (type == "success") {
        const userInfo = signInResult.data?.user;
        const request_body = {
          get_api_url: SiteConfig.on_mood9_API_URL + SOCIAL_LOGIN_API_URL,
          get_api_url_params: {
            socialMediaId: userInfo.id,
            socialMediaType: "google",
            fname: userInfo.givenName,
            lname: userInfo.familyName,
            email: userInfo.email,
            profilePic: userInfo.photo,
          },
        };

        try {
          const response = await callSuggestusAPI(
            spd_processId_config.sgconf_integration_postAPICallJWT,
            request_body
          );

          if (response.returnCode == true) {
            let call_status = response.returnData[0].p_return_result.status;
            let full_data = response.returnData[0].p_return_result.user;
            let active_subscription = "";
            if (
              !!response.returnData[0].p_return_result.subscriptions &&
              response.returnData[0].p_return_result.subscriptions.length > 0
            ) {
              active_subscription =
                response.returnData[0].p_return_result.subscriptions[0].status;
            }
            if (call_status) {
              if (!!full_data) {
                await callSuggestusAPI(
                  spd_processId_config.spdonmood9_update_md_onmood9_users_assets_for_profile,
                  {
                    p_user_id: full_data.id?.toString() || "",
                    p_asset_type: "profile_image",
                    p_asset_url: userInfo.photo,
                  }
                );
                const profile_response = await callSuggestusAPI(
                  spd_processId_config.spdonmood9_get_md_user_accounts_profile,
                  { p_user_id: full_data.id?.toString() || "" }
                );

                if (
                  profile_response?.returnCode === true &&
                  profile_response.returnData
                ) {
                  const userData = profile_response.returnData[0];
                  if (!!userData) {
                    await setEncryptedID(
                      USER_FULL_DATA,
                      JSON.stringify(userData)
                    );
                  }
                }
                // Save full_data array
                // await setEncryptedID(USER_FULL_DATA, JSON.stringify(full_data));
                // Save specific fields
                await setEncryptedID(
                  SPD_USER_ID,
                  full_data.id?.toString() || ""
                );
                await setEncryptedID(
                  SPD_USER_NAME,
                  full_data.fname?.toString() || ""
                );
                await setEncryptedID(
                  SPD_USER_EMAIL,
                  full_data.email?.toString() || ""
                );
                /// lets check subscription status
                if (!!active_subscription) {
                  if (active_subscription === "ACTIVE") {
                    await setEncryptedID(SPD_USER_SUBSCRIPTION, true);
                  } else {
                    await setEncryptedID(SPD_USER_SUBSCRIPTION, false);
                  }
                } else {
                  await setEncryptedID(SPD_USER_SUBSCRIPTION, false);
                }
                /// now lets take user to Home screen
                await AsyncStorage.setItem(IS_LOGGED_IN, "true");
                router.replace("/tab_bar_home/HomeScreen");
              } else {
                if (isWeb) {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response.returnData[0].p_return_result.message,
                  });
                } else {
                  Alert.alert(
                    "Error",
                    response.returnData[0].p_return_result.message
                  );
                }
              }
            }
          } else {
            if (isWeb) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: response.msg,
              });
            } else {
              Alert.alert("Error", response.msg);
            }
          }
        } catch (error) {
          console.log("Exception in handleLogin:", error.message);
        }
      }

      // let idToken = signInResult.data?.idToken || signInResult.idToken;
      // if (!idToken) throw new Error("No ID token found");

      // const googleCredential = GoogleAuthProvider.credential(idToken);
      // await signInWithCredential(auth, googleCredential);
      // console.log("Nitin--Firebase sign-in success");
    } catch (err) {
      console.error("Google sign-in error:", err);
      alert("Google login failed: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  const validateEmail = (value: string) => {
    if (!value) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    return "";
  };

  const handleLogin = async () => {
    setLoading(true);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;
    // const hashedPassword = md5(password).toString();
    const request_body = {
      get_api_url: SiteConfig.on_mood9_API_URL + LOGIN_API_URL,
      get_api_url_params: {
        email: email,
        password: password,
      },
    };
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.sgconf_integration_postAPICallJWT,
        request_body
      );

      if (response.returnCode == true) {
        let call_status = response.returnData[0].p_return_result.status;
        let message = response.returnData[0].p_return_result.message;
        let full_data = response.returnData[0].p_return_result.user;
        if (call_status) {
          if (!!full_data) {
            let active_subscription = "";
            let user_status =
              response.returnData[0].p_return_result.user.status;
            if (
              !!response.returnData[0].p_return_result.subscriptions &&
              response.returnData[0].p_return_result.subscriptions.length > 0
            ) {
              active_subscription =
                response.returnData[0].p_return_result.subscriptions[0].status;
            }
            if (user_status == "Active") {
              // Save full_data array
              const profile_response = await callSuggestusAPI(
                spd_processId_config.spdonmood9_get_md_user_accounts_profile,
                { p_user_id: full_data.id?.toString() || "" }
              );

              if (
                profile_response?.returnCode === true &&
                profile_response.returnData
              ) {
                const userData = profile_response.returnData[0];
                if (!!userData) {
                  await setEncryptedID(
                    USER_FULL_DATA,
                    JSON.stringify(userData)
                  );
                }
              }
              // Save specific fields
              await setEncryptedID(SPD_USER_ID, full_data.id?.toString() || "");
              await setEncryptedID(
                SPD_USER_NAME,
                full_data.fname?.toString() || ""
              );
              await setEncryptedID(
                SPD_USER_EMAIL,
                full_data.email?.toString() || ""
              );
              /// lets check subscription status
              if (!!active_subscription) {
                if (active_subscription === "ACTIVE") {
                  await setEncryptedID(SPD_USER_SUBSCRIPTION, true);
                } else {
                  await setEncryptedID(SPD_USER_SUBSCRIPTION, false);
                }
              } else {
                await setEncryptedID(SPD_USER_SUBSCRIPTION, false);
              }
              /// now lets take user to Home screen
              await AsyncStorage.setItem(IS_LOGGED_IN, "true");
              router.replace("/tab_bar_home/HomeScreen");
            } else {
              handleLoginWithOtp(full_data);
            }
          } else {
            if (isWeb) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: response.returnData[0].p_return_result.message,
              });
            } else {
              Alert.alert(
                "Error",
                response.returnData[0].p_return_result.message
              );
            }
          }
        } else {
          if (message === "Invalid Email/Password") {
            if (isWeb) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: message,
              });
            } else {
              if (isWeb) {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: message,
                });
              } else {
                if (isWeb) {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: message,
                  });
                } else {
                  Alert.alert("Error", message);
                }
              }
            }
          } else {
            let email_user = response.returnData[0].p_return_result.name;
            const check_email_response = await callSuggestusAPI(
              spd_processId_config.spdonmood9_get_md_onmood9_users,
              {
                p_email: email_user,
              }
            );
            if (check_email_response.returnCode == true) {
              let full_data = check_email_response.returnData[0];
              handleLoginWithOtp(full_data);
            }
          }
        }
      } else {
        if (isWeb) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: response.msg,
          });
        } else {
          Alert.alert("Error", response.msg);
        }
      }
    } catch (error) {
      console.log("Exception in handleLogin:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithOtp = async (full_data) => {
    // in this case we will take user to OTP verification screen
    Toast.show({
      type: "error",
      text1: "Account is not verified. New OTP has been sent to your email.",
    });
    let otp = generateOtp();
    // now lets save this OTP and user id on backend
    const step2_response = await callSuggestusAPI(
      spd_processId_config.spdonmood9_update_md_user_accounts_otp,
      {
        p_user_id: full_data.id,
        p_otp: otp,
      }
    );
    if (step2_response.returnCode == true) {
      // lets call step 3 in which we are sending email to user
      let { subject, message } = generateOtpEmail(full_data.fname, otp);
      const step3_response = await callSuggestusAPI(
        spd_processId_config.sgconf_integration_postAPICallJWT,
        {
          get_api_url: SiteConfig.on_mood9_API_URL + SIGNUP_API_URL_STEP_3,
          get_api_url_params: {
            message: message,
            email: full_data.email,
            subject: subject,
          },
        }
      );
      if (step3_response.returnCode == true) {
        let status = step3_response.returnData[0].p_return_result.status;
        if (status == true) {
          await setEncryptedID(SPD_USER_ID, full_data.id?.toString() || "");
          await setEncryptedID(
            SPD_USER_NAME,
            full_data.fname?.toString() || ""
          );
          await setEncryptedID(
            SPD_USER_EMAIL,
            full_data.email?.toString() || ""
          );
          // navigate to otp verification screen
          router.replace({
            pathname: "./otp_verification",
            params: { check_otp: otp },
          });
        }
      }
    }
  };

  const mainContent = (
      <View
               style={[
                 styles.containerNew,
                //  { marginLeft: horizontalMargin, marginRight: horizontalMargin },
               ]}>
  <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
              { flexGrow: 1 },
              Platform.OS === "web" && screenWidth >= 1024 && { justifyContent: 'center', flexGrow:1 } 
            ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* @ts-ignore: webContainer includes web-only style keys */}
        <View style={[styles.container, isWeb && styles.webContainer,
          Platform.OS === "web" && screenWidth >= 1024 && {
                    flex:'0 0 auto'
                  }
        ]}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/splash_icon.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.welcome}>Welcome back!</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Image
                source={require("@/assets/images/email.png")}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.inputNoOutline]}
                placeholder={Labels.emailPlaceholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(validateEmail(text));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={Colors.text + "99"}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  setEmailError(validateEmail(email));
                }}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Image
                source={require("@/assets/images/lock.png")}
                style={styles.inputIcon}
              />
              {/* Attach onKeyPress for web to trigger login on Enter key */}
              <TextInput
                style={[styles.input, styles.inputNoOutline]}
                placeholder={Labels.passwordPlaceholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(validatePassword(text));
                }}
                secureTextEntry={!showPassword}
                placeholderTextColor={Colors.text + "99"}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  setPasswordFocused(false);
                  setPasswordError(validatePassword(password));
                }}
                onKeyPress={
                  isWeb
                    ? (e) => {
                        if (e.nativeEvent.key === "Enter") {
                          handleLogin();
                        }
                      }
                    : undefined
                }
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#B3B7C6"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/init_screens/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              email && password && !emailError && !passwordError && !loading
                ? styles.loginButtonEnabled
                : styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={
              !(email && password && !emailError && !passwordError) || loading
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{Labels.or}</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => onGoogleButtonPress()}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator
                  color="#8646EF"
                  style={{ alignSelf: "center" }}
                />
              ) : (
                <Image
                  source={require("@/assets/images/google.png")}
                  style={styles.socialIcon}
                />
              )}
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require("@/assets/images/fb.png")}
                style={styles.socialIcon}
              />
            </TouchableOpacity> */}
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account yet? </Text>
            <TouchableOpacity
              onPress={() => router.push("/init_screens/signup")}
            >
              <Text style={styles.signupLink}>Sign up</Text>
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
    // @ts-ignore: boxShadow is web-only
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  loginButtonEnabled: {
    backgroundColor: "#8646EF", // vibrant purple
  },
  loginButtonDisabled: {
    backgroundColor: "#9393A3", // medium gray
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  label: {
    fontSize: 16,
    color: "#898D9E",
    marginTop: 8,
    marginBottom: 6,
    fontFamily: "QuicksandSemiBold",
  },
  inputIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    alignSelf: "center",
    resizeMode: "contain",
    tintColor: Colors.text + "80",
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
  inputNoOutline: {
    // @ts-ignore: outlineStyle is web-only
    outlineStyle: "none",
    outlineWidth: 0, // Remove browser default black border on focus (web)
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    width: "100%",
    justifyContent: "center",
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  welcome: {
    fontSize: 24,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 16,
    textAlign: "center",
    width: "100%",
    alignSelf: "flex-start",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  // label: {
  //   fontSize: 14,
  //   fontWeight: "500",
  //   marginTop: 8,
  //   marginBottom: 4,
  // },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: "#8C6FFF",
    fontSize: 13,
  },
  // @ts-ignore: cursor and transition are web-only
  loginButton: {
    width: "100%",
    backgroundColor: "#888CA0",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    // @ts-ignore: cursor is web-only
    cursor: Platform.OS === "web" ? "pointer" : undefined,
    // @ts-ignore: transition is web-only
    transition: Platform.OS === "web" ? "opacity 0.2s" : undefined,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },
  orText: {
    marginHorizontal: 8,
    marginTop: -2,
    color: "#888",
    fontFamily: "QuicksandSemiBold",
  },
  socialContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  socialButton: {
    backgroundColor: "#fafaff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  signupText: {
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
  signupLink: {
    color: "#8B4CFC",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
});
