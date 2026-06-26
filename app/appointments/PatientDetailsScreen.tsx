import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
    { id: "1", name: "John Doe", age: "30", gender: "Male", relationship: "Self" }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<"self" | "family">("self");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Female");
  const [relationship, setRelationship] = useState("Spouse");
  const [symptoms, setSymptoms] = useState("");

  const getInitials = (name: string) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const handleSelectPatientAndContinue = (patient: typeof patients[0]) => {
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

  const handleContinue = () => {
    if (!patientName.trim()) {
      alert("Please enter patient name");
      return;
    }
    if (!patientAge.trim()) {
      alert("Please enter patient age");
      return;
    }

    const newPatient = {
      id: Date.now().toString(),
      name: patientName,
      age: patientAge,
      gender: patientGender,
      relationship: relationship,
    };

    setPatients((prev) => [...prev, newPatient]);
    setShowAddForm(false);

    navigation.navigate("AppointmentType", {
      doctorId,
      doctorName,
      specialty,
      avatar,
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
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={22} color="#262626" />
            <Text style={styles.headerTitle}>Patient details</Text>
          </TouchableOpacity>
        </View>

        {!showAddForm ? (
          <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.mainQuestionText}>Who is the appointment for?</Text>

            {patients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                activeOpacity={0.8}
                onPress={() => handleSelectPatientAndContinue(patient)}
              >
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>{getInitials(patient.name)}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientCardName}>{patient.name}</Text>
                  <Text style={styles.patientMeta}>
                    {patient.age} year old {patient.gender.toLowerCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#374151" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addPatientButton}
              activeOpacity={0.7}
              onPress={() => {
                handleSelectPatientType("family");
                setShowAddForm(true);
              }}
            >
              <Ionicons name="person-add-outline" size={20} color="#0076D6" />
              <Text style={styles.addPatientText}>Add patient</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                  color={selectedPatient === "self" ? "#fff" : "#4B5563"}
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
                  color={selectedPatient === "family" ? "#fff" : "#4B5563"}
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
                placeholderTextColor="#B3B7C6"
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
                    placeholderTextColor="#B3B7C6"
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
                        <Text style={[styles.genderChipText, patientGender === "Male" && styles.genderChipTextActive]}>
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
                        <Text style={[styles.genderChipText, patientGender === "Female" && styles.genderChipTextActive]}>
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
                    {["Spouse", "Child", "Parent", "Sibling", "Friend"].map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={[
                          styles.relationChip,
                          relationship === rel && styles.relationChipActive,
                        ]}
                        onPress={() => setRelationship(rel)}
                      >
                        <Text style={[styles.relationText, relationship === rel && styles.relationTextActive]}>
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>Describe Symptoms (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={symptoms}
                onChangeText={setSymptoms}
                placeholder="Describe what you or the patient are feeling (e.g. fever, headache, skin rash...)"
                placeholderTextColor="#B3B7C6"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        )}

        {/* Continue Button (Only shown when adding a patient) */}
        {showAddForm && (
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.continueButton} activeOpacity={0.8} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    color: "#262626",
    marginLeft: 5,
    fontFamily: "Quicksand",
  },
  listScrollContent: {
    paddingBottom: 40,
  },
  mainQuestionText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#001871",
    textAlign: "center",
    marginVertical: 28,
    fontFamily: "Quicksand",
  },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F5F8",
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
    backgroundColor: "#001871",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initialsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  patientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232323",
  },
  patientMeta: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  addPatientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 24,
  },
  addPatientText: {
    fontSize: 16,
    color: "#0076D6",
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  doctorCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    fontWeight: "bold",
    color: "#232323",
  },
  doctorSpecialty: {
    fontSize: 13,
    color: "#0076D6",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232323",
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
  },
  patientTabBtnActive: {
    backgroundColor: "#0076D6",
    borderColor: "#0076D6",
  },
  patientTabText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  patientTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: "#232323",
    marginBottom: 16,
  },
  disabledInput: {
    color: "#757575",
    backgroundColor: "#F3F4F6",
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
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  genderChipActive: {
    backgroundColor: "#E6F0FA",
    borderColor: "#0076D6",
  },
  genderChipText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  genderChipTextActive: {
    color: "#0076D6",
    fontWeight: "700",
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
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  relationChipActive: {
    backgroundColor: "#E6F0FA",
    borderColor: "#0076D6",
  },
  relationText: {
    fontSize: 13,
    color: "#4B5563",
  },
  relationTextActive: {
    color: "#0076D6",
    fontWeight: "600",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  footerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    backgroundColor: "#002075",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
});
