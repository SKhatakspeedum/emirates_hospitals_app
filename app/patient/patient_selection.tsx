import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { USER_FULL_DATA, SPD_SELECTED_PATIENT } from "../config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import {
  getDecryptedID,
  fetchDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import {
  callSuggestusAPI,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import dayjs from "dayjs";

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
  const { height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenHeight < 680;

  const [userData, setUserData] = useState<{
    name: string;
    age: number;
    gender: string;
  } | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const fullDataStr = await getDecryptedID(USER_FULL_DATA);
        if (fullDataStr) {
          const parsed = JSON.parse(fullDataStr);
          const attrs = parseAdditionalAttributes(parsed.additional_attributes);
          const name = parsed.usr_name ?? "";
          const dob = attrs.user_dob ?? parsed.usr_dob;
          const age = dob ? dayjs().diff(dob, "year") : 0;
          const gender = attrs.user_gender ?? parsed.usr_gender ?? "Male";
          setUserData({ name, age, gender });
        } else {
          setUserData({ name: "John Doe", age: 48, gender: "Male" });
        }
      } catch (e) {
        console.error("Error loading user data in PatientSelectionScreen:", e);
        setUserData({ name: "John Doe", age: 48, gender: "Male" });
      }
    };
    loadUserData();
  }, []);

  const handleRegisterAsPatient = async () => {
    try {
      const fullDataStr = await getDecryptedID(USER_FULL_DATA);
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
      setUserData({ name, age, gender });

      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");
      const genderCode = gender === "Female" ? "2" : "1";
      const formattedDob = dob ? dayjs(dob).format("YYYY-MM-DD") : "";

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

        let userId = await fetchDataFromLocalStorage("sg_userId");
        if (!userId) {
          try {
            userId = parsed?.usr_id ?? "";
          } catch (_) { }
        }

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
      }
    } catch (e) {
      console.error("Error registering as patient:", e);
    }
    router.replace("/(drawer)/tab_bar_home/HomeScreen");
  };

  const handleAddNewPatient = () => {
    router.push("/patient/register_new_patient");
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.removeItem("sg_patientId");
    } catch (_) {}
    router.replace("/(drawer)/tab_bar_home/HomeScreen");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View
        style={[
          styles.header,
          {
            paddingTop: isSmallScreen ? 55 : 130, // 80 (content) + 50 (logo margin)
            paddingBottom: isSmallScreen ? 15 : 50,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={[styles.logoImg, { height: isSmallScreen ? 50 : 70 }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        {userData && (
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

            <TouchableOpacity
              style={styles.registerInnerBtn}
              onPress={handleRegisterAsPatient}
              activeOpacity={0.8}
            >
              <Text style={styles.registerInnerBtnText}>
                Register as a patient
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
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
        </TouchableOpacity>

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
    paddingHorizontal: 24,
    paddingTop: 40,
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
    fontSize: 18,
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
    color: Colors.secondary,
    marginRight: 6,
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
    color: Colors.secondary,
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
});
