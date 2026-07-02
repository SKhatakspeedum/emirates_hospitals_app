import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import { USER_FULL_DATA } from "../config/config";

export default function PatientDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { doctorId, doctorName, specialty, avatar } = route.params || {
    doctorId: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  };

  const [patients, setPatients] = useState([
    {
      id: "1",
      name: "John Doe",
      age: "30",
      gender: "Male",
      relationship: "Self",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<"self" | "family">(
    "self",
  );
  const [patientName, setPatientName] = useState("");
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Female");
  const [relationship, setRelationship] = useState("Spouse");
  const [symptoms, setSymptoms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const patientId = await fetchDataFromLocalStorage("sg_patientId");
      fetchPatientData(patientId ?? undefined);
    };
    init();
  }, []);

  const fetchPatientData = async (p_patient_id?: string) => {
    setIsLoading(true);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
        {
          p_patient_id: p_patient_id,
          p_search_text: "",
          p_search_additional_attributes: "",
        },
        "",
        "",
        "",
        "",
        undefined,
        false,
      );
      if (response?.returnCode === true && response.returnData?.length > 0) {
        const fetched = response.returnData.map((p: any) => ({
          id: String(p.p_patient_id ?? p.patient_id ?? Date.now()),
          name:
            p.p_patient_name ??
            p.ptm_name ??
            [p.p_patient_first_name, p.p_patient_middle_name, p.p_patient_last_name]
              .filter(Boolean)
              .join(" ") ??
            "",
          age: String(p.ptm_age ?? p.p_age ?? ""),
          gender: p.ptm_gender ?? (p.p_gender === "1" ? "Male" : "Female"),
          relationship: "Self",
        }));
        setPatients(fetched);
      }
    } catch (_) {
      // keep default patient on error
    } finally {
      setIsLoading(false);
    }
  };

  const savePatient = async (): Promise<string | null> => {
    const nameParts = patientName.trim().split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") ?? "";
    const genderCode = patientGender === "Male" ? "1" : "2";

    setIsSaving(true);
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.xcelpat_save_trn_patient_master,
        {
          p_patient_id: null,

          p_patient_title: genderCode,
          p_name: firstName,
          p_middle_name: "",
          p_last_name: lastName,
          p_gender: genderCode,
          p_dob: "",
          p_age: patientAge,
          p_marital_status: "",

          p_mobile_no: "",
          "p_mobile_no~CTN": "",
          p_email: "",
          ptd_home_phone: "",
          "ptd_home_phone~CTN": "",

          p_additional_attribute: {
            p_father_name: "",
            p_emirates_id: "", //312-3232-1332132-1
            p_identification_type: "", //Passport Number
            p_identification_num: "", //PASPORT3213213232
          },
          p_additional_attributes: {},
        },
      );
      const patientId = response?.returnData?.[0]?.p_patient_id ?? null;
      return patientId !== null ? String(patientId) : null;
    } catch (_) {
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const handleSelectPatientAndContinue = (patient: (typeof patients)[0]) => {
    navigation.navigate("AppointmentType", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      relationship: patient.relationship,
      symptoms: symptoms,
    });
  };

  const handleSelectPatientType = (type: "self" | "family") => {
    setSelectedPatient(type);
    if (type === "self") {
      setPatientName("John Doe");
      setPatientAge("30");
      setPatientGender("Male");
      setRelationship("Self");
    } else {
      setPatientName("");
      setPatientAge("");
      setPatientGender("Female");
      setRelationship("Spouse");
    }
  };

  const handleContinue = async () => {
    if (!patientName.trim()) {
      alert("Please enter patient name");
      return;
    }
    if (!patientAge.trim()) {
      alert("Please enter patient age");
      return;
    }

    const savedPatientId = await savePatient();

    if (savedPatientId) {
      let userId = await fetchDataFromLocalStorage("sg_userId");
      if (!userId) {
        const fullDataStr = await fetchDataFromLocalStorage(USER_FULL_DATA);
        if (fullDataStr) {
          try { userId = JSON.parse(fullDataStr)?.usr_id ?? ""; } catch (_) {}
        }
      }
      await callSuggestusAPI(
        spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
        {
          p_patient_id: savedPatientId,
          p_user_id: userId ?? "",
          p_additional_attribites: {},
        },
      );
      await fetchPatientData(savedPatientId);
    } else {
      setPatients((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: patientName,
          age: patientAge,
          gender: patientGender,
          relationship: relationship,
        },
      ]);
    }

    setShowAddForm(false);

    navigation.navigate("AppointmentType", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      patientId: savedPatientId,
      patientName,
      patientAge,
      patientGender,
      relationship,
      symptoms,
    });
  };

  const handleBack = () => {
    if (showAddForm) {
      setShowAddForm(false);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Title Header */}
        <CustomHeader title="Patient Details" onBackPress={handleBack} />

        {!showAddForm ? (
          <ScrollView
            contentContainerStyle={styles.listScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.mainQuestionText}>
              Who is the appointment for?
            </Text>

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={{ marginTop: 40 }}
              />
            ) : (
              patients.map((patient) => (
                <Pressable
                  key={patient.id}
                  style={({ pressed }) => [
                    styles.patientCard,
                    {
                      backgroundColor: pressed ? Colors.pressed : Colors.border,
                      borderWidth: pressed ? 1 : 0,
                      borderColor: pressed
                        ? Colors.activeBorder
                        : Colors.border,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                  onPress={() => handleSelectPatientAndContinue(patient)}
                >
                  <View style={styles.initialsCircle}>
                    <Text style={styles.initialsText}>
                      {getInitials(patient.name)}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientCardName}>{patient.name}</Text>
                    <Text style={styles.patientMeta}>
                      {patient.age} year old {patient.gender.toLowerCase()}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.text}
                    style={{ marginLeft: "auto" }}
                  />
                </Pressable>
              ))
            )}

            <Pressable
              style={({ pressed }) => [
                styles.addPatientButton,
                {
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  opacity: pressed ? 0.5 : 1,
                },
              ]}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color={Colors.secondary}
              />
              <Text style={styles.addPatientText}>Add patient</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Doctor Brief Info */}
            <View style={styles.doctorCard}>
              <Image source={{ uri: avatar }} style={styles.doctorAvatar} />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctorName}</Text>
                <Text style={styles.doctorSpecialty}>{specialty}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Add New Patient</Text>

            {/* Patient Switcher */}
            <View style={styles.patientTabs}>
              <TouchableOpacity
                style={[
                  styles.patientTabBtn,
                  selectedPatient === "self" && styles.patientTabBtnActive,
                ]}
                onPress={() => handleSelectPatientType("self")}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={
                    selectedPatient === "self" ? Colors.background : Colors.text
                  }
                />
                <Text
                  style={[
                    styles.patientTabText,
                    selectedPatient === "self" && styles.patientTabTextActive,
                  ]}
                >
                  Myself
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.patientTabBtn,
                  selectedPatient === "family" && styles.patientTabBtnActive,
                ]}
                onPress={() => handleSelectPatientType("family")}
              >
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={
                    selectedPatient === "family"
                      ? Colors.background
                      : Colors.text
                  }
                />
                <Text
                  style={[
                    styles.patientTabText,
                    selectedPatient === "family" && styles.patientTabTextActive,
                  ]}
                >
                  Someone Else
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput
                style={styles.input}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter full name"
                placeholderTextColor={Colors.label}
                editable={selectedPatient === "family"}
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={patientAge}
                    onChangeText={setPatientAge}
                    placeholder="e.g. 28"
                    placeholderTextColor={Colors.label}
                    keyboardType="numeric"
                    editable={selectedPatient === "family"}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  {selectedPatient === "family" ? (
                    <View style={styles.genderSelectRow}>
                      <TouchableOpacity
                        style={[
                          styles.genderChip,
                          patientGender === "Male" && styles.genderChipActive,
                        ]}
                        onPress={() => setPatientGender("Male")}
                      >
                        <Text
                          style={[
                            styles.genderChipText,
                            patientGender === "Male" &&
                              styles.genderChipTextActive,
                          ]}
                        >
                          Male
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderChip,
                          patientGender === "Female" && styles.genderChipActive,
                        ]}
                        onPress={() => setPatientGender("Female")}
                      >
                        <Text
                          style={[
                            styles.genderChipText,
                            patientGender === "Female" &&
                              styles.genderChipTextActive,
                          ]}
                        >
                          Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      value={patientGender}
                      editable={false}
                    />
                  )}
                </View>
              </View>

              {selectedPatient === "family" && (
                <>
                  <Text style={styles.inputLabel}>Relationship</Text>
                  <View style={styles.relationRow}>
                    {["Spouse", "Child", "Parent", "Sibling", "Friend"].map(
                      (rel) => (
                        <TouchableOpacity
                          key={rel}
                          style={[
                            styles.relationChip,
                            relationship === rel && styles.relationChipActive,
                          ]}
                          onPress={() => setRelationship(rel)}
                        >
                          <Text
                            style={[
                              styles.relationText,
                              relationship === rel && styles.relationTextActive,
                            ]}
                          >
                            {rel}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>
                Describe Symptoms (Optional)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={symptoms}
                onChangeText={setSymptoms}
                placeholder="Describe what you or the patient are feeling (e.g. fever, headache, skin rash...)"
                placeholderTextColor={Colors.label}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        )}

        {showAddForm && (
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.continueButton, isSaving && { opacity: 0.6 }]}
              onPress={handleContinue}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    marginLeft: 5,
    fontFamily: FontFamilies.bold,
  },
  listScrollContent: {
    paddingBottom: 40,
  },
  mainQuestionText: {
    fontSize: 22,
    color: Colors.primary,
    textAlign: "center",
    marginVertical: 28,
    fontFamily: FontFamilies.bold,
  },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.border,
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initialsText: {
    color: Colors.background,
    fontSize: 18,
    fontFamily: FontFamilies.bold,
  },
  patientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientCardName: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  patientMeta: {
    fontSize: 13,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
    marginTop: 2,
  },
  addPatientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginVertical: 30,
  },
  addPatientText: {
    fontSize: 16,
    color: Colors.secondary,
    fontFamily: FontFamilies.semiBold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  doctorCard: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginBottom: 20,
  },
  doctorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.secondary,
    fontFamily: FontFamilies.medium,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  patientTabs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  patientTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  patientTabBtnActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  patientTabText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  patientTabTextActive: {
    color: Colors.background,
    fontFamily: FontFamilies.bold,
  },
  form: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
    marginBottom: 16,
  },
  disabledInput: {
    color: Colors.label,
    backgroundColor: Colors.border,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  genderSelectRow: {
    flexDirection: "row",
    gap: 8,
    height: 48,
    marginBottom: 16,
  },
  genderChip: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.lightgray,
  },
  genderChipActive: {
    backgroundColor: Colors.pressed,
    borderColor: Colors.activeBorder,
  },
  genderChipText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  genderChipTextActive: {
    color: Colors.secondary,
    fontFamily: FontFamilies.bold,
  },
  relationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  relationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relationChipActive: {
    backgroundColor: Colors.pressed,
    borderColor: Colors.activeBorder,
  },
  relationText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
  },
  relationTextActive: {
    color: Colors.secondary,
    fontFamily: FontFamilies.bold,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
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
  continueButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontFamily: FontFamilies.bold,
  },
});
