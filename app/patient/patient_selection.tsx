import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { USER_FULL_DATA, SPD_SELECTED_PATIENT } from "../config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import {
  getDecryptedID,
  fetchDataFromLocalStorage,
  saveDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import {
  callSuggestusAPI,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { mapPatientToAllOrgs } from "../services/patientOrgMapping";
import dayjs from "dayjs";
import { useOrgLogo } from "../hooks/useOrgLogo";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  initials: string;
  bgColor: string;
}

const AVATAR_COLORS = ["#E3EEF9", "#F9EAF2", "#EBF7EC", "#FFF3E0", "#F3E5F5"];

const parseAdditionalAttributes = (raw: any): Record<string, string> => {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return {};
  }
};

export default function PatientSelectionScreen() {
  const router = useRouter();
  const logoSource = useOrgLogo();
  const { height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenHeight < 680;

  const [userData, setUserData] = useState<{
    name: string;
    age: number;
    gender: string;
  } | null>(null);
  const [isAlreadyPatient, setIsAlreadyPatient] = useState(false);
  const [alreadyAssigned, setAlreadyAssigned] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringAsSelf, setRegisteringAsSelf] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let fullDataStr = await getDecryptedID(USER_FULL_DATA);
      if (!fullDataStr) {
        fullDataStr = await fetchDataFromLocalStorage(USER_FULL_DATA);
      }

      let userId = (await fetchDataFromLocalStorage("sg_userId")) ?? "";
      let emiratesIdToCheck = "";
      let passportToCheck = "";
      let selfMobile = "";

      if (fullDataStr) {
        const parsed = JSON.parse(fullDataStr);
        const attrs = parseAdditionalAttributes(parsed.additional_attributes);
        const name = parsed.usr_name ?? "";
        const dob = attrs.user_dob ?? parsed.usr_dob;
        const age = dob ? dayjs().diff(dob, "year") : 0;
        const gender = attrs.user_gender ?? parsed.usr_gender ?? "Male";
        setUserData({ name, age, gender });
        if (parsed.usr_patient_id) setIsAlreadyPatient(true);
        if (!userId) userId = parsed.usr_id ?? "";
        selfMobile =
          parsed.usr_phone ?? parsed.usr_mobile ?? parsed.p_mobile_no ?? "";
        emiratesIdToCheck = attrs.p_emirates_id ?? "";
        passportToCheck = attrs.p_identification_num ?? "";

        // Check by Emirates ID / Passport — catches patient registered via different mobile
        if (emiratesIdToCheck || passportToCheck) {
          const idCheckRes = await callSuggestusAPI(
            spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
            {
              p_user_id: userId,
              p_ptm_mobile_number: selfMobile,
              p_additional_attribute: {
                p_emirates_id: emiratesIdToCheck,
                p_passport_no: passportToCheck,
              },
              p_process_flag: "user_patients",
            },
          );
          if (
            idCheckRes?.returnCode === true &&
            idCheckRes.returnData?.length > 0
          ) {
            setAlreadyAssigned(true);
          }
        }
      }

      // Fetch registered patients — pass user's ID credentials so backend can cross-check
      const response = await callSuggestusAPI(
        spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
        {
          p_user_id: userId,
          p_ptm_mobile_number: selfMobile,
          p_additional_attribute: {
            p_emirates_id: emiratesIdToCheck,
            p_passport_no: passportToCheck,
          },
          p_search_text: "",
          p_search_additional_attributes: "",
          p_process_flag: "user_patients",
        },
      );

      if (response?.returnCode === true && response.returnData?.length > 0) {
        const mapped: Patient[] = response.returnData.map(
          (p: any, idx: number) => {
            const name =
              p.p_patient_name ??
              p.ptm_name ??
              [
                p.p_patient_first_name,
                p.p_patient_middle_name,
                p.p_patient_last_name,
              ]
                .filter(Boolean)
                .join(" ") ??
              "Unknown";
            const age = parseInt(String(p.ptm_age ?? p.p_age ?? "0"), 10) || 0;
            const gender =
              p.ptm_gender ?? (p.p_gender === "2" ? "Female" : "Male");
            return {
              id: String(p.p_patient_id ?? p.patient_id ?? idx),
              name,
              age,
              gender,
              initials: name
                .split(" ")
                .map((n: string) => n[0] ?? "")
                .join("")
                .toUpperCase()
                .slice(0, 2),
              bgColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
            };
          },
        );
        setPatients(mapped);
        // If patients already exist (possibly registered via a different mobile),
        // treat the user as already registered — hide the "Register as a patient" card
        setIsAlreadyPatient(true);
      }
    } catch (e) {
      console.error("Error loading patient selection screen:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Runs on every screen focus — fresh isolated check using only Emirates ID / Passport
  const UserAsPatient = async () => {
    try {
      let fullDataStr = await getDecryptedID(USER_FULL_DATA);
      if (!fullDataStr)
        fullDataStr = await fetchDataFromLocalStorage(USER_FULL_DATA);
      if (!fullDataStr) return;

      const parsed = JSON.parse(fullDataStr);
      const attrs = parseAdditionalAttributes(parsed.additional_attributes);

      const emiratesId = (
        attrs.p_emirates_id ||
        attrs.user_emirates_id ||
        attrs.emirates_id ||
        parsed.emirates_id ||
        parsed.usr_emirates_id ||
        ""
      ).replace(/-/g, "");
      const passportNo =
        attrs.p_identification_num ||
        attrs.user_passport_no ||
        attrs.passport_no ||
        parsed.passport_no ||
        parsed.usr_passport_no ||
        "";

      if (!emiratesId && !passportNo) return;

      const idCheckRes = await callSuggestusAPI(
        spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
        {
          p_additional_attribute: {
            p_emirates_id: emiratesId,
            p_passport_no: passportNo,
          },
        },
      );

      if (
        idCheckRes?.returnCode === true &&
        idCheckRes.returnData?.length > 0
      ) {
        setAlreadyAssigned(true);
        Alert.alert(
          "Patient Found",
          "A patient already exists with this Emirates ID / Passport number.",
        );
      }
    } catch (e) {
      console.error("UserAsPatient check error:", e);
    }
  };

  useEffect(() => {
    UserAsPatient();
  }, []);

  const handleRegisterAsPatient = async () => {
    setRegisteringAsSelf(true);
    try {
      let fullDataStr = await getDecryptedID(USER_FULL_DATA);
      if (!fullDataStr)
        fullDataStr = await fetchDataFromLocalStorage(USER_FULL_DATA);
      if (!fullDataStr) {
        router.replace("/(drawer)/tab_bar_home/HomeScreen");
        return;
      }

      const parsed = JSON.parse(fullDataStr);
      const attrs = parseAdditionalAttributes(parsed.additional_attributes);
      const name: string = parsed.usr_name ?? "";
      const dob = attrs.user_dob ?? parsed.usr_dob;
      const age = dob ? dayjs().diff(dob, "year") : 0;
      const gender: string = attrs.user_gender ?? parsed.usr_gender ?? "Male";

      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");
      const genderCode = gender === "Female" ? "2" : "1";
      const formattedDob = dob ? dayjs(dob).format("YYYY-MM-DD") : "";

      const emiratesIdToCheck = attrs.p_emirates_id ?? "";
      const passportToCheck = attrs.p_identification_num ?? "";
      const _selfUserId =
        (await fetchDataFromLocalStorage("sg_userId")) ?? parsed?.usr_id ?? "";
      const _selfMobile =
        parsed?.usr_phone ?? parsed?.usr_mobile ?? parsed?.p_mobile_no ?? "";
      if (emiratesIdToCheck || passportToCheck) {
        const checkRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_user_id: _selfUserId,
            p_additional_attribute: {
              // p_ptm_mobile_number: _selfMobile,
              p_emirates_id: emiratesIdToCheck,
              p_passport_no: passportToCheck,
            },
            p_process_flag: "user_patients",
          },
        );
        if (checkRes?.returnCode === true && checkRes.returnData?.length > 0) {
          Alert.alert(
            "Patient Already Exists",
            "A patient with this Emirates ID or Passport is already registered.",
          );
          setRegisteringAsSelf(false);
          return;
        }
      }

      const saveRes = await callSuggestusAPI(
        spd_processId_config.xcelpat_save_trn_patient_master,
        {
          p_patient_id: null,
          p_patient_title: genderCode,
          p_name: firstName,
          p_middle_name: "",
          p_last_name: lastName,
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
            p_emirates_id: "",
            p_identification_type: "",
            p_identification_num: "",
          },
          p_additional_attributes: {},
        },
      );

      const patientId = String(saveRes?.returnData?.[0]?.p_patient_id ?? "");
      if (patientId) {
        await setPatientId(patientId);
        await AsyncStorage.setItem(
          SPD_SELECTED_PATIENT,
          JSON.stringify({ name, age, gender }),
        );

        try {
          const stored = JSON.parse(
            (await getDecryptedID(USER_FULL_DATA)) ??
              (await fetchDataFromLocalStorage(USER_FULL_DATA)) ??
              "{}",
          );
          stored.usr_patient_id = patientId;
          await saveDataFromLocalStorage(
            USER_FULL_DATA,
            JSON.stringify(stored),
          );
        } catch (_) {}

        let userId = await fetchDataFromLocalStorage("sg_userId");
        if (!userId) {
          try {
            userId = parsed?.usr_id ?? "";
          } catch (_) {}
        }

        await mapPatientToAllOrgs(patientId, userId ?? "");

        await callSuggestusAPI(
          spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
          {
            p_patient_id: patientId,
            p_user_id: userId ?? "",
            p_additional_attribites: {},
          },
        );

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

        setIsAlreadyPatient(true);
        await loadData();
      }
    } catch (e) {
      console.error("Error registering as patient:", e);
    }
    setRegisteringAsSelf(false);
  };

  const handleSelectPatient = async (patient: Patient) => {
    try {
      await setPatientId(patient.id);
      await AsyncStorage.setItem(
        SPD_SELECTED_PATIENT,
        JSON.stringify({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
        }),
      );
    } catch (e) {
      console.error("Error setting patient:", e);
    }
    router.replace("/(drawer)/tab_bar_home/HomeScreen");
  };

  const handleAddNewPatient = () => {
    router.push("/patient/registered_patients");
  };

  const handleSkip = async () => {
    try {
      const userId = (await fetchDataFromLocalStorage("sg_userId")) ?? "";

      const response = await callSuggestusAPI(
        spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
        {
          p_user_id: userId,
          p_search_text: "",
          p_search_additional_attributes: "",
          p_process_flag: "user_patients",
        },
      );

      if (response?.returnCode === true && response.returnData?.length > 0) {
        const firstPatient = response.returnData[0];
        const patientId = String(
          firstPatient.p_patient_id ?? firstPatient.patient_id ?? "",
        );

        const name =
          firstPatient.p_patient_name ??
          firstPatient.ptm_name ??
          [
            firstPatient.p_patient_first_name,
            firstPatient.p_patient_middle_name,
            firstPatient.p_patient_last_name,
          ]
            .filter(Boolean)
            .join(" ") ??
          "Unknown";
        const age =
          parseInt(
            String(firstPatient.ptm_age ?? firstPatient.p_age ?? "0"),
            10,
          ) || 0;
        const gender =
          firstPatient.ptm_gender ??
          (firstPatient.p_gender === "2" ? "Female" : "Male");

        if (patientId) {
          await setPatientId(patientId);
          await AsyncStorage.setItem(
            SPD_SELECTED_PATIENT,
            JSON.stringify({ name, age, gender }),
          );
        } else {
          await AsyncStorage.removeItem("sg_patientId");
        }
      } else {
        await AsyncStorage.removeItem("sg_patientId");
      }
    } catch (e) {
      console.error("Error in handleSkip:", e);
      try {
        await AsyncStorage.removeItem("sg_patientId");
      } catch (_) {}
    }
    router.replace("/(drawer)/tab_bar_home/HomeScreen");
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor={Colors.background} /> */}
      <View
        style={[
          styles.header,
          {
            paddingTop: isSmallScreen ? 55 : 130, // 80 (content) + 50 (logo margin)
            paddingBottom: isSmallScreen ? 10 : 25,
          },
        ]}
      >
        <Image
          source={logoSource}
          style={[styles.logoImg, { height: isSmallScreen ? 40 : 60 }]}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            {/* Self-registration card — only if not already a patient */}
            {!isAlreadyPatient && userData && (
              <View style={styles.userCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={24} color="#FFF" />
                  </View>
                  <View style={styles.userInfoCol}>
                    <Text style={styles.userName}>{userData.name}</Text>
                  </View>
                  <Text style={styles.userMeta}>
                    {userData.age} Yrs / {userData.gender}
                  </Text>
                </View>

                {alreadyAssigned ? (
                  <View style={styles.alreadyAssignedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22C55E"
                    />
                    <Text style={styles.alreadyAssignedText}>
                      Already assigned as a patient
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.registerInnerBtn}
                    onPress={handleRegisterAsPatient}
                    disabled={registeringAsSelf}
                    activeOpacity={0.8}
                  >
                    {registeringAsSelf ? (
                      <ActivityIndicator
                        color={Colors.secondary}
                        size="small"
                      />
                    ) : (
                      <>
                        <Text style={styles.registerInnerBtnText}>
                          Register as a patient
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={Colors.secondary}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Registered patients list */}
            {patients.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Registered patients</Text>
                <View style={styles.patientsList}>
                  {patients.map((patient) => (
                    <TouchableOpacity
                      key={patient.id}
                      style={styles.patientRow}
                      onPress={() => handleSelectPatient(patient)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: patient.bgColor },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {patient.initials}
                        </Text>
                      </View>
                      <View style={styles.patientInfoCol}>
                        <Text style={styles.patientName}>{patient.name}</Text>
                        <Text style={styles.patientMeta}>
                          {patient.age} Yrs / {patient.gender}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={Colors.secondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* <TouchableOpacity
          style={styles.addNewPatientBtn}
          onPress={handleAddNewPatient}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color={Colors.secondary}
            style={styles.btnIcon}
          />
          <Text style={styles.addNewPatientBtnText}>Add new patient</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Skip &gt;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    width: "100%",
  },
  logoImg: {
    width: 280,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    // paddingTop: 10,
  },
  userCard: {
    backgroundColor: "#F2F7FC",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#A8BFDC",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  userMeta: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
  },
  registerInnerBtn: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  registerInnerBtnText: {
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: Colors.primary,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.secondary,
    marginBottom: 16,
    marginTop: 20,
  },
  patientsList: {
    width: "100%",
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: "#2C5D9E",
  },
  patientInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  patientName: {
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  patientMeta: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    width: "100%",
  },
  addNewPatientBtn: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  btnIcon: {
    marginRight: 8,
  },
  addNewPatientBtnText: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.primary,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.secondary,
  },
  alreadyAssignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  alreadyAssignedText: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
    color: "#16A34A",
  },
});
