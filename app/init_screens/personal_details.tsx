import React, { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  IS_LOGGED_IN,
  USER_FULL_DATA,
  SPD_USER_NAME,
  SPD_SELECTED_PATIENT,
} from "../config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
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

type CheckStatus = "idle" | "checking" | "exists" | "available" | "error";
interface FieldCheck {
  status: CheckStatus;
  checkedValue: string;
}

const IDLE_CHECK: FieldCheck = { status: "idle", checkedValue: "" };

// returnCode arrives as string "true" or boolean true; returnData may be [{}] when empty
const hasReturnData = (res: any): boolean => {
  const ok = res?.returnCode === true || res?.returnCode === "true";
  return (
    ok &&
    Array.isArray(res.returnData) &&
    res.returnData.some((item: any) => item && Object.keys(item).length > 0)
  );
};

const parseAdditionalAttributes = (raw: any): Record<string, string> => {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const formatEmiratesId = (text: string) => {
  const cleaned = text.replace(/\D/g, "");
  let formatted = "";
  if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
  if (cleaned.length > 3) formatted += "-" + cleaned.substring(3, 7);
  if (cleaned.length > 7) formatted += "-" + cleaned.substring(7, 14);
  if (cleaned.length > 14) formatted += "-" + cleaned.substring(14, 15);
  return formatted;
};

const formatPassport = (text: string) =>
  text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const route = useRoute();

  const [isResident, setIsResident] = useState(true);
  const [emiratesId, setEmiratesId] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"Male" | "Female" | "">("Male");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const [emiratesIdCheck, setEmiratesIdCheck] =
    useState<FieldCheck>(IDLE_CHECK);
  const [passportCheck, setPassportCheck] = useState<FieldCheck>(IDLE_CHECK);

  // The active check is whichever tab is open
  const activeCheck = isResident ? emiratesIdCheck : passportCheck;

  const idFieldFilled = isResident
    ? emiratesId.trim().length > 0
    : passportNo.trim().length > 0;

  // Exists path needs only the ID; normal registration path needs all fields
  const isFormValid =
    activeCheck.status === "checking"
      ? false
      : activeCheck.status === "exists"
        ? idFieldFilled
        : idFieldFilled &&
          firstName.trim().length > 0 &&
          lastName.trim().length > 0 &&
          gender !== "";

  const userAlreadyExists = activeCheck.status === "exists";
  const buttonLabel = userAlreadyExists
    ? "Continue with My Account"
    : "Register";

  // Inline existence check — fires on blur of the ID field
  const checkExistence = useCallback(
    async (field: "emirates" | "passport", value: string) => {
      const clean =
        field === "emirates" ? value.replace(/-/g, "") : value.trim();
      if (!clean) return;

      const setCheck =
        field === "emirates" ? setEmiratesIdCheck : setPassportCheck;
      setCheck({ status: "checking", checkedValue: value });

      try {
        const res = await callSuggestusAPI(
          spd_processId_config.sgconf_get_mst_user_validate_detail_for_ehg_pntapp,
          {
            p_emirates_id: field === "emirates" ? value : "",
            p_passport: field === "passport" ? value : "",
            p_process_flag: "validate_duplicate",
            p_additional_attribute: {},
          },
        );

        if (res?.returnCode) {
          setCheck({ status: "available", checkedValue: value });
          return;
        } else {
          setCheck({ status: "exists", checkedValue: value });
          return;
        }
      } catch (err) {
        console.error("[PersonalDetails] existence check failed:", err);
        setCheck({ status: "error", checkedValue: value });
      }
    },
    [],
  );

  const renderFieldStatus = (check: FieldCheck) => {
    if (check.status === "checking")
      return <ActivityIndicator size="small" color={Colors.secondary} />;
    if (check.status === "available")
      return <Ionicons name="checkmark-circle" size={20} color="#22C55E" />;
    if (check.status === "exists" || check.status === "error")
      return <Ionicons name="close-circle" size={20} color="#EF4444" />;
    return null;
  };

  const handleContinue = async () => {
    // --- Path A: ID already exists → restore session + self-register as patient ---
    if (activeCheck.status === "exists") {
      setLoading(true);
      try {
        const rawPhone = (route.params as any)?.phone_number ?? "";
        const phoneE164 = rawPhone.replace(/\s+/g, "");

        // Step 1: Restore existing user session via phone
        const validateRes = await callSuggestusAPI(
          spd_processId_config.sgconf_util_validate_user_v2,
          {
            p_username: phoneE164.replace(/^\+/, ""),
            p_password: "",
            p_ai_code: SiteConfig.AI_CODE,
            p_login_type: "external",
          },
        );

        const validateOk =
          (validateRes?.returnCode === true ||
            validateRes?.returnCode === "true") &&
          validateRes?.returnData?.length > 0;

        if (!validateOk) {
          Toast.show({
            type: "error",
            text1: "Account Not Found",
            text2: "Unable to locate your account. Please try again.",
          });
          return;
        }

        const u = validateRes.returnData[0];
        let userId = String(u.usr_id ?? "");

        await Promise.all([
          setUserId(userId),
          setRoleId(String(u.rol_id ?? "")),
          setUserName(u.usr_name ?? ""),
          saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
          saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
          saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
          saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
          u.usr_patient_id
            ? setPatientId(String(u.usr_patient_id))
            : Promise.resolve(),
        ]);
        await AsyncStorage.setItem(IS_LOGGED_IN, "true");

        // Step 2: Build patient fields from the returned user profile
        const attrs = parseAdditionalAttributes(u.additional_attributes);
        const name: string = u.usr_name ?? "";
        const dobValue: string = attrs.user_dob ?? u.usr_dob ?? "";
        const age = dobValue ? dayjs().diff(dobValue, "year") : 0;
        const userGender: string = attrs.user_gender ?? u.usr_gender ?? "Male";
        const nameParts = name.trim().split(" ");
        const fName = nameParts[0] ?? "";
        const lName = nameParts.slice(1).join(" ");
        const genderCode = userGender === "Female" ? "2" : "1";
        const formattedDob = dobValue
          ? dayjs(dobValue).format("YYYY-MM-DD")
          : "";

        const emiratesIdClean = isResident ? emiratesId.replace(/-/g, "") : "";
        const passportClean = !isResident ? passportNo.trim() : "";

        // Step 3: Check if a patient record already exists for this ID
        const checkRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_additional_attribute: {
              p_emirates_id: emiratesIdClean,
              p_passport_no: passportClean,
            },
          },
        );

        if (hasReturnData(checkRes)) {
          // Patient record already exists — link it without creating a duplicate
          const existingPatientId = String(
            checkRes.returnData[0]?.p_patient_id ?? "",
          );
          if (existingPatientId) {
            await setPatientId(existingPatientId);
            await AsyncStorage.setItem(
              SPD_SELECTED_PATIENT,
              JSON.stringify({ name, age, gender: userGender }),
            );
            try {
              const stored = JSON.parse(
                (await getDecryptedID(USER_FULL_DATA)) ?? "{}",
              );
              stored.usr_patient_id = existingPatientId;
              await saveDataFromLocalStorage(
                USER_FULL_DATA,
                JSON.stringify(stored),
              );
            } catch (_) {}
          }
          Toast.show({
            type: "success",
            text1: "Welcome back!",
            text2: "Your account has been set up successfully.",
          });
          router.replace("/(drawer)/tab_bar_home/HomeScreen");
          return;
        }

        // Step 4: No patient record yet — create one
        const saveRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_save_trn_patient_master,
          {
            p_patient_id: null,
            p_patient_title: genderCode,
            p_name: fName,
            p_middle_name: "",
            p_last_name: lName,
            p_gender: genderCode,
            p_dob: formattedDob,
            p_age: String(age),
            p_marital_status: "",
            p_mobile_no: "",
            "p_mobile_no~CTN": "",
            p_email: "",
            ptd_home_phone: "",
            "ptd_home_phone~CTN": "",
            p_additional_attribute: {
              p_father_name: "",
              p_emirates_id: emiratesIdClean,
              p_identification_type: isResident ? "emirates_id" : "passport",
              p_identification_num: passportClean,
            },
            p_additional_attributes: {},
          },
        );

        const patientId = String(saveRes?.returnData?.[0]?.p_patient_id ?? "");
        if (patientId) {
          await setPatientId(patientId);
          await AsyncStorage.setItem(
            SPD_SELECTED_PATIENT,
            JSON.stringify({ name, age, gender: userGender }),
          );

          try {
            const stored = JSON.parse(
              (await getDecryptedID(USER_FULL_DATA)) ?? "{}",
            );
            stored.usr_patient_id = patientId;
            await saveDataFromLocalStorage(
              USER_FULL_DATA,
              JSON.stringify(stored),
            );
          } catch (_) {}

          await callSuggestusAPI(
            spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
            {
              p_patient_id: patientId,
              p_user_id: userId,
              p_additional_attribites: {},
            },
          );

          await callSuggestusAPI(
            spd_processId_config.xcelpat_save_mst_user_entity_mapping_common,
            {
              p_patient_id: patientId,
              p_user_id: userId,
              p_entity_code: "EHG_REHAB_PNTAPP_USER_PATIENTS",
              p_entity_reference_id: patientId,
              p_entity_reference_code: "TRN_EHG_EHG_REHAB_PNTAPP_USER_PATIENTS",
              p_active_status: "Y",
              p_process_flag: "Y",
              p_additional_attribites: {},
              p_internal_flag: "N",
            },
          );
        }

        Toast.show({
          type: "success",
          text1: "Welcome back!",
          text2: "Your account has been set up successfully.",
        });
      } catch (err) {
        console.error("[PersonalDetails] link account failed:", err);
        Toast.show({
          type: "error",
          text1: "Something Went Wrong",
          text2: "Unable to link your account. Please try again.",
        });
      } finally {
        setLoading(false);
      }
      router.replace("/(drawer)/tab_bar_home/HomeScreen");
      return;
    }

    // --- Path B: New user registration ---
    if (isResident && !emiratesId.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your Emirates ID to continue.",
      });
      return;
    }
    if (!isResident && !passportNo.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your Passport number to continue.",
      });
      return;
    }
    if (!firstName.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your First name to continue.",
      });
      return;
    }
    if (!lastName.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your Last name to continue.",
      });
      return;
    }
    if (!gender) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please select your gender.",
      });
      return;
    }

    setLoading(true);
    try {
      const fName = firstName.trim();
      const lName = lastName.trim();
      const name = `${fName} ${lName}`;
      const rawPhone = (route.params as any)?.phone_number ?? "";
      const emiratesIdClean = emiratesId.replace(/-/g, "");

      // Final existence check — skip if already verified as available for this value
      const alreadyVerified = isResident
        ? emiratesIdCheck.status === "available" &&
          emiratesIdCheck.checkedValue === emiratesId
        : passportCheck.status === "available" &&
          passportCheck.checkedValue === passportNo;

      if (!alreadyVerified) {
        const checkRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_additional_attribute: {
              p_emirates_id: isResident ? emiratesIdClean : "",
              p_passport_no: !isResident ? passportNo.trim() : "",
            },
          },
        );

        if (hasReturnData(checkRes)) {
          if (isResident) {
            setEmiratesIdCheck({ status: "exists", checkedValue: emiratesId });
          } else {
            setPassportCheck({ status: "exists", checkedValue: passportNo });
          }
          Toast.show({
            type: "error",
            text1: "Already Registered",
            text2: `A user with this ${isResident ? "Emirates ID" : "Passport"} is already registered.`,
          });
          return;
        }
      }

      // Save Full Name
      await setEncryptedID(SPD_USER_NAME, name);

      // Merge into USER_FULL_DATA
      const currentDataStr = await getDecryptedID(USER_FULL_DATA);
      let updatedData: Record<string, string> = {
        fname: name,
        firstName: fName,
        lastName: lName,
        dob: dayjs(dob).format("YYYY-MM-DD"),
        gender,
        emirates_id: isResident ? emiratesId.trim() : "",
        passport_no: !isResident ? passportNo.trim() : "",
        contact: rawPhone,
      };

      if (currentDataStr) {
        try {
          updatedData = { ...JSON.parse(currentDataStr), ...updatedData };
        } catch (_) {}
      }

      await setEncryptedID(USER_FULL_DATA, JSON.stringify(updatedData));

      // Register user
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
            p_first_name: fName,
            p_last_name: lName,
            USER_LOGIN_TYPE: "external",
            USER_LOGIN_TYPE_DETAIL: "otp",
            user_emirates_id: isResident ? emiratesId.trim() : "",
            user_passport_no: !isResident ? passportNo.trim() : "",
            user_dob: dayjs(dob).format("YYYY-MM-DD"),
            user_gender: gender,
          }),
        },
      );

      if (signupRes?.returnCode !== true) {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: signupRes?.returnMessage ?? "Please try again.",
        });
        return;
      }

      // Fetch full user profile
      const phoneE164 = rawPhone.replace(/\s+/g, "");
      try {
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
          await Promise.all([
            setUserId(String(u.usr_id ?? "")),
            setRoleId(String(u.rol_id ?? "")),
            setUserName(u.usr_name ?? ""),
            saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
            saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
            saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
            saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
            u.usr_patient_id
              ? setPatientId(String(u.usr_patient_id))
              : Promise.resolve(),
          ]);
        }
      } catch (validateErr) {
        console.error(
          "[PersonalDetails] profile fetch after signup failed:",
          validateErr,
        );
      }

      await AsyncStorage.setItem(IS_LOGGED_IN, "true");

      Toast.show({
        type: "success",
        text1: "Profile Updated Successfully",
        text2: "Welcome to Emirates Hospitals Group",
      });

      router.replace("/patient/patient_selection");
    } catch (error) {
      console.error("[PersonalDetails] registration error:", error);
      Toast.show({
        type: "error",
        text1: "Something Went Wrong",
        text2:
          "Unable to save your details. Please check your connection and try again.",
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
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={[styles.content, { paddingTop: isSmallScreen ? 20 : 40 }]}
          >
            {/* Resident / Non-Resident tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, isResident && styles.activeTabButton]}
                onPress={() => setIsResident(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isResident && styles.activeTabButtonText,
                  ]}
                >
                  Resident
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  !isResident && styles.activeTabButton,
                ]}
                onPress={() => setIsResident(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    !isResident && styles.activeTabButtonText,
                  ]}
                >
                  Non-Resident
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtext}>
              Complete your profile for a personalized healthcare experience.
            </Text>

            {/* ID field — Emirates ID or Passport based on active tab */}
            {isResident ? (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Emirates ID</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "emiratesId" && styles.inputWrapperFocused,
                    emiratesIdCheck.status === "exists" &&
                      styles.inputWrapperError,
                    emiratesIdCheck.status === "available" &&
                      styles.inputWrapperSuccess,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholder="000-0000-0000000-0"
                    placeholderTextColor={Colors.inactive}
                    value={emiratesId}
                    onChangeText={(text) => {
                      const formatted = formatEmiratesId(text);
                      setEmiratesId(formatted);
                      if (formatted !== emiratesIdCheck.checkedValue) {
                        setEmiratesIdCheck((prev) => ({
                          ...prev,
                          status: "idle",
                        }));
                      }
                    }}
                    onFocus={() => setFocusedField("emiratesId")}
                    onBlur={() => {
                      setFocusedField("");
                      if (
                        emiratesId.trim() &&
                        emiratesId !== emiratesIdCheck.checkedValue
                      ) {
                        checkExistence("emirates", emiratesId);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={18}
                    returnKeyType="next"
                  />
                  {renderFieldStatus(emiratesIdCheck)}
                </View>
                {emiratesIdCheck.status === "exists" && (
                  <Text style={styles.fieldError}>
                    A user with this Emirates ID is already registered
                  </Text>
                )}
                {emiratesIdCheck.status === "error" && (
                  <Text style={styles.fieldError}>
                    Unable to verify — please try again
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Passport no.</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "passportNo" && styles.inputWrapperFocused,
                    passportCheck.status === "exists" &&
                      styles.inputWrapperError,
                    passportCheck.status === "available" &&
                      styles.inputWrapperSuccess,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholder="A1234567"
                    placeholderTextColor={Colors.inactive}
                    value={passportNo}
                    onChangeText={(text) => {
                      const formatted = formatPassport(text);
                      setPassportNo(formatted);
                      if (formatted !== passportCheck.checkedValue) {
                        setPassportCheck((prev) => ({
                          ...prev,
                          status: "idle",
                        }));
                      }
                    }}
                    onFocus={() => setFocusedField("passportNo")}
                    onBlur={() => {
                      setFocusedField("");
                      if (
                        passportNo.trim() &&
                        passportNo !== passportCheck.checkedValue
                      ) {
                        checkExistence("passport", passportNo);
                      }
                    }}
                    autoCapitalize="characters"
                    maxLength={12}
                    returnKeyType="next"
                  />
                  {renderFieldStatus(passportCheck)}
                </View>
                {passportCheck.status === "exists" && (
                  <Text style={styles.fieldError}>
                    A user with this Passport is already registered
                  </Text>
                )}
                {passportCheck.status === "error" && (
                  <Text style={styles.fieldError}>
                    Unable to verify — please try again
                  </Text>
                )}
              </View>
            )}

            {/* First Name & Last Name */}
            <View style={styles.rowContainer}>
              <View
                style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
              >
                <Text style={styles.inputLabel}>First name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "firstName" && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      focusedField === "firstName"
                        ? Colors.secondary
                        : Colors.label
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholderTextColor={Colors.inactive}
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField("")}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Last name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "lastName" && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      focusedField === "lastName"
                        ? Colors.secondary
                        : Colors.label
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholderTextColor={Colors.inactive}
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField("")}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of birth</Text>
              {Platform.OS === "web" ? (
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "dob" && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={
                      focusedField === "dob" ? Colors.secondary : Colors.label
                    }
                    style={styles.inputIcon}
                  />
                  <input
                    type="date"
                    value={dayjs(dob).format("YYYY-MM-DD")}
                    min="1900-01-01"
                    max={dayjs().format("YYYY-MM-DD")}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value);
                        const year = selectedDate.getFullYear();
                        const today = new Date();
                        const minDate = new Date(1900, 0, 1);
                        if (year >= 1000) {
                          setDob(
                            selectedDate < minDate
                              ? minDate
                              : year > today.getFullYear()
                                ? today
                                : selectedDate,
                          );
                        } else {
                          setDob(selectedDate);
                        }
                      }
                    }}
                    onFocus={() => setFocusedField("dob")}
                    onBlur={() => {
                      setFocusedField("");
                      const today = new Date();
                      const minDate = new Date(1900, 0, 1);
                      if (dob > today) setDob(today);
                      else if (dob < minDate) setDob(minDate);
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: "16px",
                      fontFamily: FontFamilies.medium,
                      color: Colors.text,
                      backgroundColor: "transparent",
                      height: "100%",
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.inputWrapper,
                    showDatePicker && styles.inputWrapperFocused,
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={showDatePicker ? Colors.secondary : Colors.label}
                    style={styles.inputIcon}
                  />
                  <Text style={styles.input}>
                    {dayjs(dob).format("MMM DD, YYYY")}
                  </Text>
                  <Text style={styles.changeLinkText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.rowContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderBox,
                    gender === "Male" && styles.genderBoxActive,
                    { marginRight: 8 },
                  ]}
                  onPress={() => setGender("Male")}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        gender === "Male" && styles.radioOuterActive,
                      ]}
                    >
                      {gender === "Male" && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.genderText}>Male</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderBox,
                    gender === "Female" && styles.genderBoxActive,
                    { marginLeft: 8 },
                  ]}
                  onPress={() => setGender("Female")}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        gender === "Female" && styles.radioOuterActive,
                      ]}
                    >
                      {gender === "Female" && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.genderText}>Female</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
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
            style={[
              styles.continueBtn,
              isFormValid
                ? styles.continueBtnEnabled
                : styles.continueBtnDisabled,
            ]}
            disabled={loading || !isFormValid}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.continueBtnText}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={dob}
        minimumDate={new Date(1900, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(date) => {
          const today = new Date();
          const minDate = new Date(1900, 0, 1);
          setDob(date > today ? today : date < minDate ? minDate : date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
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
    paddingBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    padding: 4,
    backgroundColor: Colors.background,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: "#E6F5FC",
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.bold,
    color: Colors.label,
  },
  activeTabButtonText: {
    color: Colors.secondary,
  },
  subtext: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    marginBottom: 24,
    lineHeight: 20,
    textAlign: "left",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
    color: Colors.label,
    marginBottom: 8,
    textAlign: "left",
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
  },
  inputWrapperFocused: {
    borderColor: Colors.secondary,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
  },
  inputWrapperSuccess: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  fieldError: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
    color: "#EF4444",
    marginTop: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
    paddingVertical: 0,
    minWidth: 0,
  },
  inputNoOutline: {
    outlineStyle: "none",
    outlineWidth: 0,
  } as any,
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  changeLinkText: {
    fontSize: 14,
    fontFamily: FontFamilies.bold,
    color: Colors.secondary,
  },
  genderBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.lightgray,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  genderBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.inactive,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  genderText: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  bottomBtnContainer: {
    paddingHorizontal: 24,
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
      android: { elevation: 4 },
    }),
  },
  continueBtnDisabled: {
    backgroundColor: Colors.inactive,
  },
  continueBtnText: {
    color: Colors.lightgray,
    fontSize: 16,
    fontFamily: FontFamilies.bold,
  },
});
