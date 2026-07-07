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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { IS_LOGGED_IN, USER_FULL_DATA } from "../config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import {
  callSuggestusAPI,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";

type CheckStatus = "idle" | "checking" | "exists" | "available" | "error" | "invalid";
interface FieldCheck {
  status: CheckStatus;
  checkedValue: string;
}

// returnCode arrives as string "true" or boolean true; returnData may be [{}] when empty
const hasReturnData = (res: any): boolean => {
  const ok = res?.returnCode === true || res?.returnCode === "true";
  return (
    ok &&
    Array.isArray(res.returnData) &&
    res.returnData.some((item: any) => item && Object.keys(item).length > 0)
  );
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

export default function RegisterNewPatient() {
  const router = useRouter();
  const route = useRoute<any>();
  const isSelf =
    (route.params as any)?.isSelf === true ||
    (route.params as any)?.isSelf === "true";

  const [emiratesId, setEmiratesId] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"Male" | "Female" | "">("Male");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const [emiratesIdCheck, setEmiratesIdCheck] = useState<FieldCheck>({
    status: "idle",
    checkedValue: "",
  });
  const [passportCheck, setPassportCheck] = useState<FieldCheck>({
    status: "idle",
    checkedValue: "",
  });

  const hasExistsError =
    emiratesIdCheck.status === "exists" || passportCheck.status === "exists";
  const isChecking =
    emiratesIdCheck.status === "checking" ||
    passportCheck.status === "checking";
  // At least one ID field must be verified (available) before other fields unlock
  const idVerified =
    emiratesIdCheck.status === "available" ||
    passportCheck.status === "available";
  const isFormValid =
    idVerified &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    gender !== "" &&
    !hasExistsError &&
    !isChecking;

  const handleClose = () => router.back();

  const checkPatientExistence = useCallback(
    async (field: "emirates" | "passport", value: string) => {
      const clean =
        field === "emirates" ? value.replace(/-/g, "") : value.trim();
      if (!clean) return;

      const setCheck =
        field === "emirates" ? setEmiratesIdCheck : setPassportCheck;

      // Format validation before hitting the API
      if (field === "emirates") {
        if (clean.length !== 15 || !clean.startsWith("784")) {
          setCheck({ status: "invalid", checkedValue: value });
          return;
        }
      } else {
        if (clean.length < 6) {
          setCheck({ status: "invalid", checkedValue: value });
          return;
        }
      }

      setCheck({ status: "checking", checkedValue: value });

      try {
        const res = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_additional_attribute: {
              p_emirates_id: field === "emirates" ? clean : "",
              p_passport_no: field === "passport" ? clean : "",
            },
          },
        );

        if (hasReturnData(res)) {
          setCheck({ status: "exists", checkedValue: value });
        } else if (res !== null && res !== undefined) {
          setCheck({ status: "available", checkedValue: value });
        } else {
          setCheck({ status: "error", checkedValue: value });
        }
      } catch {
        setCheck({ status: "error", checkedValue: value });
      }
    },
    [],
  );

  const handleContinue = async () => {
    if (!emiratesId.trim() && !passportNo.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter either your Emirates ID or Passport number.",
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
      const genderCode = gender === "Male" ? "1" : "2";
      const formattedDob = dayjs(dob).format("YYYY-MM-DD");
      const emiratesIdClean = emiratesId.replace(/-/g, "");

      // Only re-check if the field wasn't already verified as available
      const emiratesVerified =
        emiratesIdCheck.status === "available" &&
        emiratesIdCheck.checkedValue === emiratesId;
      const passportVerified =
        passportCheck.status === "available" &&
        passportCheck.checkedValue === passportNo;
      const needsFinalCheck =
        (emiratesIdClean || passportNo.trim()) &&
        !emiratesVerified &&
        !passportVerified;

      if (needsFinalCheck) {
        const checkRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_additional_attribute: {
              p_emirates_id: emiratesIdClean,
              p_passport_no: passportNo.trim(),
            },
          },
        );
        if (hasReturnData(checkRes)) {
          if (emiratesIdClean)
            setEmiratesIdCheck({ status: "exists", checkedValue: emiratesId });
          if (passportNo.trim())
            setPassportCheck({ status: "exists", checkedValue: passportNo });
          Toast.show({
            type: "error",
            text1: "Patient Already Exists",
            text2:
              "A patient with this Emirates ID or Passport is already registered.",
          });
          return;
        }
      }

      const saveRes = await callSuggestusAPI(
        spd_processId_config.xcelpat_save_trn_patient_master,
        {
          p_patient_id: null,
          p_patient_title: genderCode,
          p_name: firstName.trim(),
          p_middle_name: "",
          p_last_name: lastName.trim(),
          p_gender: genderCode,
          p_dob: formattedDob,
          p_age: "",
          p_marital_status: "",
          p_mobile_no: "",
          "p_mobile_no~CTN": "",
          p_email: "",
          ptd_home_phone: "",
          "ptd_home_phone~CTN": "",
          p_additional_attribute: {
            p_father_name: "",
            p_emirates_id: emiratesIdClean,
            p_identification_type: passportNo ? "Passport Number" : "",
            p_identification_num: passportNo,
          },
          p_additional_attributes: {},
        },
      );

      const patientId = String(saveRes?.returnData?.[0]?.p_patient_id ?? "");
      if (!patientId) {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2:
            saveRes?.returnMessage ??
            "Failed to save patient. Please try again.",
        });
        return;
      }

      await setPatientId(patientId);

      let userId = await fetchDataFromLocalStorage("sg_userId");
      if (!userId) {
        const fullDataStr = await fetchDataFromLocalStorage(USER_FULL_DATA);
        if (fullDataStr) {
          try {
            userId = JSON.parse(fullDataStr)?.usr_id ?? "";
          } catch (_) {}
        }
      }

      if (isSelf) {
        await callSuggestusAPI(
          spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
          {
            p_patient_id: patientId,
            p_user_id: userId ?? "",
            p_additional_attribites: {},
          },
        );
      } else {
        await callSuggestusAPI(
          spd_processId_config.xcelpat_save_mst_user_entity_mapping_common,
          {
            p_patient_id: patientId,
            p_user_id: userId ?? "",
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

      await AsyncStorage.setItem(IS_LOGGED_IN, "true");

      Toast.show({
        type: "success",
        text1: "Patient Added Successfully",
        text2: "Welcome to Emirates Hospitals Group",
      });

      router.replace("/patient/registered_patients");
    } catch (error) {
      console.error("Error saving patient details:", error);
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

  const renderFieldStatus = (check: FieldCheck) => {
    if (check.status === "checking") {
      return <ActivityIndicator size="small" color={Colors.secondary} />;
    }
    if (check.status === "available") {
      return <Ionicons name="checkmark-circle" size={20} color="#22C55E" />;
    }
    if (check.status === "exists" || check.status === "error" || check.status === "invalid") {
      return <Ionicons name="close-circle" size={20} color="#EF4444" />;
    }
    return null;
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add New Patient</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.subtext}>
              Enter your details for a personalized healthcare experience.
            </Text>

            {/* Emirates ID / Passport Card */}
            <View style={styles.unifiedCard}>
              {/* Emirates ID */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: "#7D8A9D" }]}>
                  Emirates ID
                </Text>
                <View
                  style={[
                    styles.cardInputWrapper,
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
                    onChangeText={(t) => {
                      const formatted = formatEmiratesId(t);
                      setEmiratesId(formatted);
                      if (formatted !== emiratesIdCheck.checkedValue) {
                        setEmiratesIdCheck({ status: "idle", checkedValue: "" });
                      }
                    }}
                    onFocus={() => setFocusedField("emiratesId")}
                    onBlur={() => {
                      setFocusedField("");
                      if (
                        emiratesId.trim() &&
                        emiratesId !== emiratesIdCheck.checkedValue
                      ) {
                        checkPatientExistence("emirates", emiratesId);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={18}
                    returnKeyType="next"
                  />
                  {renderFieldStatus(emiratesIdCheck)}
                </View>
                {emiratesIdCheck.status === "invalid" && (
                  <Text style={styles.fieldError}>
                    Please enter a valid Emirates ID (784-XXXX-XXXXXXX-X)
                  </Text>
                )}
                {emiratesIdCheck.status === "exists" && (
                  <Text style={styles.fieldError}>
                    Patient already registered with this Emirates ID
                  </Text>
                )}
                {emiratesIdCheck.status === "error" && (
                  <Text style={styles.fieldError}>
                    Unable to verify — please try again
                  </Text>
                )}
              </View>

              <View style={styles.orDividerRow}>
                <View style={styles.dottedLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dottedLine} />
              </View>

              {/* Passport */}
              <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                <Text style={[styles.inputLabel, { color: Colors.label }]}>
                  Passport no.
                </Text>
                <View
                  style={[
                    styles.cardInputWrapper,
                    focusedField === "passportNo" && styles.inputWrapperFocused,
                    passportCheck.status === "exists" &&
                      styles.inputWrapperError,
                    passportCheck.status === "available" &&
                      styles.inputWrapperSuccess,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholder="ABC123456"
                    placeholderTextColor={Colors.inactive}
                    value={passportNo}
                    onChangeText={(t) => {
                      const formatted = formatPassport(t);
                      setPassportNo(formatted);
                      if (formatted !== passportCheck.checkedValue) {
                        setPassportCheck({ status: "idle", checkedValue: "" });
                      }
                    }}
                    onFocus={() => setFocusedField("passportNo")}
                    onBlur={() => {
                      setFocusedField("");
                      if (
                        passportNo.trim() &&
                        passportNo !== passportCheck.checkedValue
                      ) {
                        checkPatientExistence("passport", passportNo);
                      }
                    }}
                    autoCapitalize="characters"
                    maxLength={12}
                    returnKeyType="next"
                  />
                  {renderFieldStatus(passportCheck)}
                </View>
                {passportCheck.status === "invalid" && (
                  <Text style={styles.fieldError}>
                    Please enter a valid Passport number (min. 6 characters)
                  </Text>
                )}
                {passportCheck.status === "exists" && (
                  <Text style={styles.fieldError}>
                    Patient already registered with this Passport
                  </Text>
                )}
                {passportCheck.status === "error" && (
                  <Text style={styles.fieldError}>
                    Unable to verify — please try again
                  </Text>
                )}
              </View>
            </View>

            {/* First Name, Last Name, DOB, Gender — locked until one ID is verified */}
            <View
              pointerEvents={idVerified ? "auto" : "none"}
              style={!idVerified && styles.fieldsDisabled}
            >
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
                    // placeholder="John"
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
                    // placeholder="Doe"
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
                        const d = new Date(e.target.value);
                        const today = new Date();
                        const minDate = new Date(1900, 0, 1);
                        if (d.getFullYear() >= 1000) {
                          setDob(d < minDate ? minDate : d > today ? today : d);
                        } else {
                          setDob(d);
                        }
                      }
                    }}
                    onFocus={() => setFocusedField("dob")}
                    onBlur={() => setFocusedField("")}
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

            </View>{/* end fieldsDisabled wrapper */}

            {/* Continue Button */}
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
                <Text style={styles.continueBtnText}>Continue</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

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
    </Modal>
  );
}

const styles: any = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightgray,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  subtext: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    marginBottom: 20,
    lineHeight: 20,
  },
  unifiedCard: {
    backgroundColor: "#EBF3FC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dottedLine: {
    flex: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Colors.border,
    height: 1,
  },
  orText: {
    fontSize: 12,
    fontFamily: FontFamilies.bold,
    color: Colors.label,
    marginHorizontal: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FontFamilies.semiBold,
    color: Colors.label,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
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
    fontSize: 15,
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
    fontSize: 13,
    fontFamily: FontFamilies.bold,
    color: Colors.secondary,
  },
  genderBox: {
    flex: 1,
    height: 52,
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
    marginRight: 10,
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
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  continueBtn: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
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
  fieldsDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: FontFamilies.bold,
  },
});
