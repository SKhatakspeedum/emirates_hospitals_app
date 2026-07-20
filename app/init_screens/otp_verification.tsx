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
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import {
  getDecryptedID,
  saveDataFromLocalStorage,
  fetchDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import {
  SPD_USER_EMAIL,
  USER_FULL_DATA,
  SPD_SELECTED_PATIENT,
} from "../config/config";
import {
  setUserId,
  setRoleId,
  setUserName,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import { useRoute } from "@react-navigation/native";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import Toast from "react-native-toast-message";
import { useOrgLogo } from "../hooks/useOrgLogo";
import { Messages } from "../config/messages";
import { getStoredAiCode } from "../services/aiCode";
import { getUserEntityReferenceCode } from "../services/entityReferenceCode";

export default function OTPVerificationScreen() {
  const logoSource = useOrgLogo();
  const route = useRoute();
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<any[]>([]);

  const [email_id, setEmail_id] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  const isOtpComplete = otp.join("").length === 6;

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
    if (text.length === 6 && /^[0-9]+$/.test(text)) {
      const newOtp = text.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      setError("");
      return;
    }

    const lastChar = text.length > 0 ? text[text.length - 1] : "";
    if (lastChar && /[^0-9]/.test(lastChar)) return;

    const newOtp = [...otp];
    newOtp[idx] = lastChar;
    setOtp(newOtp);
    setError("");

    if (lastChar && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[idx] === "") {
        if (idx > 0) {
          newOtp[idx - 1] = "";
          setOtp(newOtp);
          inputRefs.current[idx - 1]?.focus();
        }
      } else {
        newOtp[idx] = "";
        setOtp(newOtp);
      }
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
        "",
        "",
        "",
        "",
        undefined,
        // This screen already shows a red inline error below the OTP
        // boxes on failure — suppress callSuggestusAPI's own generic
        // "check your internet connection" toast so the error isn't
        // reported twice.
        false,
      );

      if (res?.returnCode === true) {
        const validateRes = await callSuggestusAPI(
          spd_processId_config.sgconf_util_validate_user_v2,
          {
            p_username: phoneE164.replace(/^\+/, ""),
            p_password: "",
            p_ai_code: SiteConfig.AI_CODE,
            p_login_type: "external",
          },
          "",
          "",
          "",
          "",
          undefined,
          false,
        );

        if (
          validateRes?.returnCode === true &&
          validateRes?.returnData?.length > 0
        ) {
          const u = validateRes.returnData[0];

          const patientRes = await callSuggestusAPI(
            spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
            {
              p_additional_attribute: {
                p_ptm_mobile_number: phoneE164,
                p_emirates_id: "",
                p_passport_no: "",
              },
              p_process_flag: "validate_duplicate",
            },
            "",
            "",
            "",
            "",
            undefined,
            false,
          );
          const resolvedPatientId =
            patientRes?.returnData?.[0]?.p_patient_id ??
            patientRes?.returnData?.[0]?.patient_id ??
            "";

          await Promise.all([
            setUserId(u.usr_id ?? ""),
            setRoleId(u.rol_id ?? ""),
            setUserName(u.usr_name ?? ""),
            saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
            // saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
            // saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
            saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
            saveDataFromLocalStorage("isLoggedIn", "true"),
            resolvedPatientId
              ? setPatientId(String(resolvedPatientId))
              : Promise.resolve(),
          ]);

          // Secondary check by user_id — session is now set so callSuggestusAPI
          // will inject the correct sg_userId. This catches patients that are
          // already linked to this user but weren't found by the mobile-number
          // lookup above (e.g. registered via personal_details or a different
          // phone). Without this, the registration block below would fire on
          // every login and create a new patient record each time.
          let effectivePatientId = resolvedPatientId;
          if (!effectivePatientId) {
            try {
              const userPatsRes = await callSuggestusAPI(
                spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
                {
                  p_user_id: String(u.usr_id ?? ""),
                  p_process_flag: "user_patients",
                },
                "",
                "",
                "",
                "",
                undefined,
                false,
              );
              if (
                userPatsRes?.returnCode === true &&
                userPatsRes.returnData?.length > 0
              ) {
                effectivePatientId = String(
                  userPatsRes.returnData[0]?.p_patient_id ??
                    userPatsRes.returnData[0]?.patient_id ??
                    "",
                );
                if (effectivePatientId) {
                  await setPatientId(effectivePatientId);
                }
              }
            } catch (_) {}
          }

          // Only auto-register as patient if truly no patient exists for this user.
          if (!effectivePatientId) {
            try {
              // Parse user fields from the validated profile
              const parseAttrs = (raw: any): Record<string, string> => {
                if (!raw) return {};
                try {
                  return typeof raw === "string" ? JSON.parse(raw) : raw;
                } catch (_) {
                  return {};
                }
              };
              const attrs = parseAttrs(u.additional_attributes);
              const ptName: string = u.usr_name ?? "";
              const ptDob = attrs.user_dob ?? u.usr_dob ?? "";
              const ptAge = ptDob ? dayjs().diff(ptDob, "year") : 0;
              const ptGender: string =
                attrs.user_gender ?? u.usr_gender ?? "Male";
              const ptParts = ptName.trim().split(" ");
              const ptFirst = ptParts[0] ?? "";
              const ptLast = ptParts.slice(1).join(" ");
              const ptGenderCode = ptGender === "Female" ? "2" : "1";
              const ptFormattedDob = ptDob
                ? dayjs(ptDob).format("YYYY-MM-DD")
                : "";
              const ptEmiratesId = attrs.p_emirates_id ?? "";
              const ptPassport = attrs.p_identification_num ?? "";
              const ptUserId = String(u.usr_id ?? "");

              // Step 1: Check for existing patient by Emirates ID / Passport
              let existingPid = "";
              if (ptEmiratesId || ptPassport) {
                const checkRes = await callSuggestusAPI(
                  spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
                  {
                    p_user_id: ptUserId,
                    p_additional_attribute: {
                      p_emirates_id: ptEmiratesId,
                      p_passport_no: ptPassport,
                    },
                  },
                );
                if (
                  checkRes?.returnCode === true &&
                  checkRes.returnData?.length > 0
                ) {
                  existingPid = String(
                    checkRes.returnData[0]?.p_patient_id ?? "",
                  );
                }
              }

              let finalPid = existingPid;

              if (!existingPid) {
                // Step 2: Create the patient record
                const saveRes = await callSuggestusAPI(
                  spd_processId_config.xcelpat_save_trn_patient_master,
                  {
                    p_patient_id: null,
                    p_patient_title: ptGenderCode,
                    p_name: ptFirst,
                    p_middle_name: "",
                    p_last_name: ptLast,
                    p_gender: ptGenderCode,
                    p_dob: ptFormattedDob,
                    p_age: String(ptAge),
                    p_marital_status: "",
                    p_mobile_no: "",
                    "p_mobile_no~CTN": "",
                    p_email: "",
                    ptd_home_phone: "",
                    "ptd_home_phone~CTN": "",
                    p_additional_attribute: {
                      p_father_name: "",
                      p_emirates_id: "",
                      p_identification_type: "",
                      p_identification_num: "",
                    },
                    p_additional_attributes: {},
                  },
                );
                finalPid = String(saveRes?.returnData?.[0]?.p_patient_id ?? "");
              }

              if (finalPid) {
                await setPatientId(finalPid);
                await AsyncStorage.setItem(
                  SPD_SELECTED_PATIENT,
                  JSON.stringify({
                    name: ptName,
                    age: ptAge,
                    gender: ptGender,
                  }),
                );

                // Step 3: Update USER_FULL_DATA with patient id
                try {
                  const stored = JSON.parse(
                    (await getDecryptedID(USER_FULL_DATA)) ?? "{}",
                  );
                  stored.usr_patient_id = finalPid;
                  await saveDataFromLocalStorage(
                    USER_FULL_DATA,
                    JSON.stringify(stored),
                  );
                } catch (_) {}

                if (!existingPid) {
                  // Step 4: Link patient → user
                  await callSuggestusAPI(
                    spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
                    {
                      p_patient_id: finalPid,
                      p_user_id: ptUserId,
                      p_additional_attribites: {},
                    },
                  );

                  // Step 5: Entity mapping
                  await callSuggestusAPI(
                    spd_processId_config.xcelpat_save_mst_user_entity_mapping_common,
                    {
                      p_patient_id: finalPid,
                      p_user_id: ptUserId,
                      p_entity_code: await getStoredAiCode(),
                      p_entity_reference_id: finalPid,
                      p_entity_reference_code:
                        await getUserEntityReferenceCode(),
                      p_active_status: "Y",
                      p_process_flag: "Y",
                      p_additional_attribites: {},
                      p_internal_flag: "N",
                    },
                  );
                }

                // Step 6: Org mapping
                const djs = await getDecryptedID("DEFAULT_JSON_DATA").catch(
                  () => null,
                );
                const orgCodes = djs
                  ? (JSON.parse(djs)?.spd_app_location_list ??
                    SiteConfig.AI_CODE)
                  : SiteConfig.AI_CODE;
                await callSuggestusAPI(
                  spd_processId_config.hosapp_save_update_trn_patient_master_org_mapping_pnt_app,
                  {
                    p_patient_id: finalPid,
                    p_org_codes: orgCodes,
                    p_process_flag: "map_multiple_user",
                  },
                );
              }
            } catch (autoRegErr) {
              // Non-fatal — user still lands on HomeScreen
              console.error(
                "[OtpVerification] auto patient registration failed:",
                autoRegErr,
              );
            }
          }

          Toast.show({
            type: "success",
            text1: "Phone verified successfully.",
            visibilityTime: 3000,
          });
          router.replace("/(drawer)/tab_bar_home/HomeScreen");
          // router.replace("/patient/registered_patients");

          // router.replace({
          //   pathname: "/init_screens/personal_details",
          // });
        } else {
          Toast.show({
            type: "success",
            text1: "Phone verified successfully.",
            visibilityTime: 3000,
          });
          router.replace({
            pathname: "/init_screens/personal_details",
            params: { phone_number: rawPhone },
          });
        }
      } else {
        setLoading(false);
        setError(`Invalid OTP. ${Messages.error.tryAgain}`);
      }
    } catch (err) {
      setLoading(false);
      setError(Messages.error.generic);
    }
  };

  const handleResendOtp = async () => {
    // Clear OTP inputs, focus the first field, and clear errors
    setOtp(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();

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
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={logoSource}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.startTitle}>Awesome, Thanks!</Text>
            <Text style={styles.startSubtitle}>
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
                    maxLength={6}
                    value={digit}
                    onChangeText={(text) => handleChange(text, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
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

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              isOtpComplete
                ? styles.verifyBtnEnabled
                : styles.verifyBtnDisabled,
            ]}
            onPress={handleVerifyOtp}
            disabled={loading || !isOtpComplete}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.lightgray} />
            ) : (
              <Text style={styles.verifyBtnText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* <Toast /> */}
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
    marginVertical: 50,
    width: "100%",
  },
  logoImg: {
    width: "80%",
    maxWidth: 280,
    aspectRatio: 4,
    height: 70,
  },
  startTitle: {
    fontSize: 22,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "left",
  },
  startSubtitle: {
    fontSize: 16,
    fontFamily: FontFamilies.medium,
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
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Colors.textLabel,
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 20,
    textAlign: "center",
    color: Colors.text,
    backgroundColor: Colors.lightgray,
    fontFamily: FontFamilies.bold,
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
    fontFamily: FontFamilies.medium,
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
    fontSize: 16,
    fontFamily: FontFamilies.medium,
  },
  resendLink: {
    color: Colors.secondary,
    fontFamily: FontFamilies.bold,
    fontSize: 16,
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
    fontFamily: FontFamilies.bold,
  },
});
