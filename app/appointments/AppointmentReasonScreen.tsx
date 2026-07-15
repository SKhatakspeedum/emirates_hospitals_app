import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";

export default function AppointmentReasonScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    doctorId,
    doctorName,
    specialty,
    avatar,
    hospital,
    patientId,
    patientName,
    patientAge,
    patientGender,
    relationship,
  } = route.params ?? {};

  const [reason, setReason] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const canContinue = reason.trim().length > 0 && !isResolving;

  // Resolves the org's default appointment subtype (spd_org_appsubtyp_code
  // from the cached org config) via xcelschconf_get_mst_appointment_subtype_pntapp
  // and goes straight to ScheduleBook — this replaces the old "Appointment
  // type" picker screen entirely.
  const handleContinue = async () => {
    if (!canContinue) return;
    setIsResolving(true);
    let appSubtypeId = "";
    let appSubtypeName = "";
    let apptypId = "";
    try {
      const defaultJsonStr = await fetchDataFromLocalStorage(
        "DEFAULT_JSON_DATA",
      );
      const defaultJson = defaultJsonStr ? JSON.parse(defaultJsonStr) : {};
      const appsubtypCode = defaultJson?.spd_org_appsubtyp_code ?? "";

      const response = await callSuggestusAPI(
        spd_processId_config.xcelschconf_get_mst_appointment_subtype_pntapp,
        {
          p_apptyp_id: "",
          p_appsubtyp_id: "",
          p_appsubtyp_code: appsubtypCode,
          p_process_flag: "",
          p_additional_attribute: {},
        },
      );
      if (response?.returnCode === true && response.returnData?.length > 0) {
        const subtype = response.returnData[0];
        appSubtypeId = String(subtype.appsubtyp_id ?? subtype.id ?? "");
        appSubtypeName = subtype.appsubtyp_name ?? subtype.description ?? "";
        apptypId = String(subtype.apptyp_id ?? "");
      }
    } catch (e) {
      console.error(
        "[AppointmentReason] appointment-subtype resolution failed:",
        e,
      );
    } finally {
      setIsResolving(false);
    }

    navigation.navigate("ScheduleBook", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      hospital,
      patientId,
      patientName,
      patientAge,
      patientGender,
      relationship,
      symptoms: reason,
      appSubtypeId,
      apptypId,
      type: appSubtypeName,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <CustomHeader title="Appointment reason" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>What brings you in today?</Text>
          <Text style={styles.subTitle}>
            Tell us the reason for your appointment so your healthcare
            provider can prepare for your visit.
          </Text>

          <Text style={styles.inputLabel}>Reason for Visit</Text>
          <TextInput
            style={styles.textArea}
            value={reason}
            onChangeText={setReason}
            placeholder="Briefly describe your symptoms or the reason for your appointment..."
            placeholderTextColor={Colors.label}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            {isResolving ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
    color: Colors.secondary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    height: 160,
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
  },
  footerContainer: {
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: Colors.inactive,
  },
  continueButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontFamily: FontFamilies.bold,
  },
});
