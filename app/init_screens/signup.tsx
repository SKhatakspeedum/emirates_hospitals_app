import React, { useEffect, useState } from "react";
import { ImageBackground, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../config/colors";
import { MaterialIcons } from "@expo/vector-icons";
import {
  generateOtp,
  generateOtpEmail,
  setEncryptedID,
} from "../suggestus_plugin/util/util_functions";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import {
  IS_LOGGED_IN,
  SIGNUP_API_URL_STEP_1,
  SIGNUP_API_URL_STEP_3,
  SOCIAL_LOGIN_API_URL,
  SPD_USER_EMAIL,
  SPD_USER_ID,
  SPD_USER_NAME,
  SPD_USER_SUBSCRIPTION,
  USER_FULL_DATA,
} from "../config/config";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useResponsivePlatform } from "../hooks/useResponsivePlatform";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

export default function SignupScreen() {
  const { isWeb } = useResponsivePlatform();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Error states for each field
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
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
            let user_status =
              response.returnData[0].p_return_result.user.status;
            if (
              !!response.returnData[0].p_return_result.subscriptions &&
              response.returnData[0].p_return_result.subscriptions.length > 0
            ) {
              active_subscription =
                response.returnData[0].p_return_result.subscriptions[0].status;
            }
            if (call_status) {
              if (!!full_data) {
                // Save full_data array
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
  // Validation logic (reuse login.tsx approach)
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
  const validateFullName = (value: string) => {
    if (!value) return "Full name is required.";
    return "";
  };
  const validateConfirmPassword = (value: string) => {
    if (!value) return "Please confirm your password.";
    if (value !== password) return "Passwords do not match.";
    return "";
  };

  const isFormFilled = fullName && email && password && confirmPassword;
  const isFormValid =
    !fullNameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    isFormFilled;

  const handleSignup = async () => {
    // Validate all fields before submit
    const fullNameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);
    setFullNameError(fullNameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);
    if (fullNameErr || emailErr || passwordErr || confirmPasswordErr) return;
    setLoading(true);
    try {
      const step1_response = await callSuggestusAPI(
        spd_processId_config.sgconf_integration_postAPICallJWT,
        {
          get_api_url: SiteConfig.on_mood9_API_URL + SIGNUP_API_URL_STEP_1,
          get_api_url_params: {
            fName: fullName,
            email: email,
            pwd: password,
          },
        }
      );
      if (step1_response.returnCode == true) {
        let status = step1_response.returnData[0].p_return_result.status;
        if (status == true) {
          let mood_user_id =
            step1_response.returnData[0].p_return_result.mood_user_id;
          let otp = generateOtp();
          // now lets save this OTP and user id on backend
          const step2_response = await callSuggestusAPI(
            spd_processId_config.spdonmood9_update_md_user_accounts_otp,
            {
              p_user_id: mood_user_id,
              p_otp: otp,
            }
          );
          if (step2_response.returnCode == true) {
            // lets call step 3 in which we are sending email to user
            let { subject, message } = generateOtpEmail(fullName, otp);
            const step3_response = await callSuggestusAPI(
              spd_processId_config.sgconf_integration_postAPICallJWT,
              {
                get_api_url:
                  SiteConfig.on_mood9_API_URL + SIGNUP_API_URL_STEP_3,
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
                await setEncryptedID(
                  SPD_USER_ID,
                  mood_user_id?.toString() || ""
                );
                await setEncryptedID(SPD_USER_NAME, fullName?.toString() || "");
                await setEncryptedID(SPD_USER_EMAIL, email?.toString() || "");
                // navigate to otp verification screen
                router.replace({
                  pathname: "./otp_verification",
                  params: { check_otp: otp },
                });
              }
            }
          }
          // // Save full_data array
          // await setEncryptedID(USER_FULL_DATA, JSON.stringify(full_data));
          // // Save specific fields
          // await setEncryptedID(SPD_USER_ID, full_data.id?.toString() || "");
          // await setEncryptedID(SPD_USER_NAME, full_data.fname?.toString() || "");
          // await setEncryptedID(SPD_USER_EMAIL, full_data.email?.toString() || "");
          // /// now lets take user to Home screen
          // await AsyncStorage.setItem(IS_LOGGED_IN, "true");
          // router.replace("/tab_bar_home/HomeScreen");
          // const step2_response = await callSuggestusAPI(spd_processId_config.sgconf_integration_postAPICallJWT, {
          //   get_api_url: SiteConfig.on_mood9_API_URL + SIGNUP_API_URL_STEP_2,
          //   get_api_url_params: {
          //     fName: fullName,
          //     email: email,
          //     pwd: password,
          //   },
          // });

          // console.log("Nitin--step2_response", step2_response);
        } else {
          if (isWeb) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: step1_response.returnData[0].p_return_result.error,
            });
          } else {
            Alert.alert(
              "Error",
              step1_response.returnData[0].p_return_result.error
            );
          }
        }
      } else {
        if (isWeb) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: step1_response.msg,
          });
        } else {
          Alert.alert("Error", step1_response.msg);
        }
      }
    } catch (error) {
      if (isWeb) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Something went wrong. Please try again later.",
        });
      } else {
        Alert.alert("Error", "Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mainContent = (
     <View
               style={[
                 styles.containerNew,
                 { marginLeft: horizontalMargin, marginRight: horizontalMargin },
                  Platform.OS === "web" && screenWidth >= 1024 && { justifyContent: 'center', flexGrow:1 } 
               ]}>
            <View style={[styles.container, isWeb && styles.webContainer,
                      Platform.OS === "web" && screenWidth >= 1024 && {
                                flex:'0 0 auto'
                              }]}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require("@/assets/images/splash_icon.png")}
                      style={styles.logo}
                    />
                    {/* <Text style={styles.title}>OnMood9</Text> */}
                  </View>
                  <Text style={styles.signupTitle}>Create your account</Text>

                  <ScrollView
                    style={{ flex: 1, width: "100%" }}
                    contentContainerStyle={{
                      flexGrow: 1,
                      paddingHorizontal: 0,
                    }}
                    contentInsetAdjustmentBehavior="never"
                    automaticallyAdjustContentInsets={false}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={[{ paddingBottom: 30, width: "100%" },
                            Platform.OS === "web" && screenWidth >= 1024 && {
                                      paddingBottom:'0'
                                    }]}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Full name</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === "fullName" && styles.inputWrapperFocused,
                          ]}
                        >
                          <Image
                            source={require("@/assets/images/user.png")}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, styles.inputNoOutline]}
                            placeholder="Enter Your Name"
                            placeholderTextColor="#B3B7C6"
                            value={fullName}
                            onChangeText={(text) => {
                              setFullName(text);
                              if (fullNameError) setFullNameError(validateFullName(text));
                            }}
                            onFocus={() => setFocusedField("fullName")}
                            onBlur={() => {
                              setFocusedField("");
                              setFullNameError(validateFullName(fullName));
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                        {fullNameError ? (
                          <Text style={styles.errorText}>{fullNameError}</Text>
                        ) : null}

                        <Text style={styles.inputLabel}>Email</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === "email" && styles.inputWrapperFocused,
                          ]}
                        >
                          <Image
                            source={require("@/assets/images/email.png")}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, styles.inputNoOutline]}
                            placeholder="Enter Your Email"
                            placeholderTextColor="#B3B7C6"
                            value={email}
                            onChangeText={(text) => {
                              setEmail(text);
                              if (emailError) setEmailError(validateEmail(text));
                            }}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => {
                              setFocusedField("");
                              setEmailError(validateEmail(email));
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            textContentType="emailAddress"
                          />
                        </View>
                        {emailError ? (
                          <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}

                        <Text style={styles.inputLabel}>Password</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === "password" && styles.inputWrapperFocused,
                          ]}
                        >
                          <Image
                            source={require("@/assets/images/lock.png")}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, styles.inputNoOutline]}
                            placeholder="Password"
                            placeholderTextColor="#B3B7C6"
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              if (passwordError) setPasswordError(validatePassword(text));
                            }}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => {
                              setFocusedField("");
                              setPasswordError(validatePassword(password));
                            }}
                            secureTextEntry={!showPassword}
                            textContentType="newPassword"
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

                        <Text style={styles.inputLabel}>Confirm password</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === "confirmPassword" &&
                              styles.inputWrapperFocused,
                          ]}
                        >
                          <Image
                            source={require("@/assets/images/lock.png")}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, styles.inputNoOutline]}
                            placeholder="Confirm password"
                            placeholderTextColor="#B3B7C6"
                            value={confirmPassword}
                            onChangeText={(text) => {
                              setConfirmPassword(text);
                              if (confirmPasswordError)
                                setConfirmPasswordError(validateConfirmPassword(text));
                            }}
                            onFocus={() => setFocusedField("confirmPassword")}
                            onBlur={() => {
                              setFocusedField("");
                              setConfirmPasswordError(
                                validateConfirmPassword(confirmPassword)
                              );
                            }}
                            secureTextEntry={!showConfirmPassword}
                            textContentType="newPassword"
                            onKeyPress={
                              isWeb
                                ? (e) => {
                                    if (e.nativeEvent.key === "Enter") {
                                      handleSignup();
                                    }
                                  }
                                : undefined
                            }
                          />
                          <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <MaterialIcons
                              name={showConfirmPassword ? "visibility" : "visibility-off"}
                              size={20}
                              color="#B3B7C6"
                            />
                          </TouchableOpacity>
                        </View>
                        {confirmPasswordError ? (
                          <Text style={styles.errorText}>{confirmPasswordError}</Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.signupButton,
                          isFormValid && !loading
                            ? styles.signupButtonActive
                            : styles.signupButtonInactive,
                        ]}
                        disabled={!isFormValid || loading}
                        activeOpacity={isFormValid && !loading ? 0.7 : 1}
                        onPress={handleSignup}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.signupButtonText}>Create account</Text>
                        )}
                      </TouchableOpacity>

                      <View style={styles.orContainer}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>Or</Text>
                        <View style={styles.line} />
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

                      <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity
                          onPress={() => router.replace("/init_screens/login")}
                        >
                          <Text style={styles.loginLink}>Sign in</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
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
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    // justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
    // marginTop: 24,
    borderRadius: 32,
    backgroundColor: "#888CA0",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: "#898D9E",
    marginTop: 8,
    marginBottom: 6,
    fontFamily: "QuicksandSemiBold",
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
    outlineWidth: 0,
  },
  inputIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    alignSelf: "center",
    resizeMode: "contain",
    // @ts-ignore: tintColor is web-only
    tintColor: Colors.text + "80",
  },
  eyeIcon: {
    padding: 4,
  },
  // @ts-ignore: cursor and transition are web-only
  signupButton: {
    width: "100%",
    backgroundColor: "#888CA0",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    cursor: Platform.OS === "web" ? "pointer" : undefined,
    transition: Platform.OS === "web" ? "opacity 0.2s" : undefined,
    fontFamily: "QuicksandSemiBold",
  },
  signupButtonActive: {
    backgroundColor: "#8B4CFC",
    shadowColor: "#8B4CFC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  signupButtonInactive: {
    backgroundColor: "#898D9E",
    fontFamily: "QuicksandSemiBold",
  },
  signupButtonText: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
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
    alignContent: "center",
    justifyContent: "center",
    width: "100%",
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
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 24,
  },
  loginText: {
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
  loginLink: {
    color: "#8B4CFC",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
  signupTitle: {
    fontSize: 24,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 16,
    textAlign: "center",
    width: "100%",
    alignSelf: "flex-start",
  },
});
