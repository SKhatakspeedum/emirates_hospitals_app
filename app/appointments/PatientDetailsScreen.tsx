import React, { useState } from "react";
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
  Modal,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";

const formatEmiratesId = (text: string) => {
  const cleaned = text.replace(/\D/g, "");
  let formatted = "";
  if (cleaned.length > 0) {
    formatted += cleaned.substring(0, 3);
  }
  if (cleaned.length > 3) {
    formatted += "-" + cleaned.substring(3, 7);
  }
  if (cleaned.length > 7) {
    formatted += "-" + cleaned.substring(7, 14);
  }
  if (cleaned.length > 14) {
    formatted += "-" + cleaned.substring(14, 15);
  }
  return formatted;
};

const formatPassport = (text: string) => {
  return text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

const { width } = Dimensions.get("window");

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
  const [symptoms, setSymptoms] = useState("");

  // New Patient Form States
  const [idType, setIdType] = useState<"emirates" | "passport">("emirates");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState<Date>(new Date(1990, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [relationship, setRelationship] = useState("Spouse");
  const [focusedField, setFocusedField] = useState("");

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

  const handleAddPatient = () => {
    if (!idNumber.trim()) {
      alert(`Please enter ${idType === "emirates" ? "Emirates ID" : "Passport number"}`);
      return;
    }
    if (!firstName.trim()) {
      alert("Please enter First name");
      return;
    }
    if (!lastName.trim()) {
      alert("Please enter Last name");
      return;
    }
    if (!gender) {
      alert("Please select gender");
      return;
    }
    if (!relationship) {
      alert("Please select relationship");
      return;
    }

    const fName = firstName.trim();
    const lName = lastName.trim();
    const name = `${fName} ${lName}`;

    // calculate age from dob
    const age = (new Date().getFullYear() - dob.getFullYear()).toString();

    const newPatient = {
      id: Date.now().toString(),
      name: name,
      age: age,
      gender: gender,
      relationship: relationship,
      idNumber: idNumber.trim(),
      dob: dayjs(dob).format("YYYY-MM-DD"),
    };

    setPatients((prev) => [...prev, newPatient]);
    setShowAddForm(false);

    // Reset form fields
    setIdType("emirates");
    setFirstName("");
    setLastName("");
    setIdNumber("");
    setDob(new Date(1990, 0, 1));
    setGender("Male");
    setRelationship("Spouse");

    // Automatically navigate forward with the new patient
    navigation.navigate("AppointmentType", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      patientName: name,
      patientAge: age,
      patientGender: gender,
      relationship: relationship,
      symptoms: symptoms,
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

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainQuestionText}>Who is the appointment for?</Text>

          {patients.map((patient) => (
            <Pressable
              key={patient.id}
              style={({ pressed }) => [
                styles.patientCard,
                {
                  backgroundColor: pressed ? Colors.pressed : Colors.border,
                  borderWidth: pressed ? 1 : 0,
                  borderColor: pressed ? Colors.activeBorder : Colors.border,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                }
              ]}
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
              <Ionicons name="chevron-forward" size={20} color={Colors.text} style={{ marginLeft: "auto" }} />
            </Pressable>
          ))}

          {/* Add Patient Trigger */}
          <Pressable
            style={({ pressed }) => [
              styles.addPatientButton,
              {
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: pressed ? 0.5 : 1,
              }
            ]}
            onPress={() => {
              setIdType("emirates");
              setFirstName("");
              setLastName("");
              setIdNumber("");
              setDob(new Date(1990, 0, 1));
              setGender("Male");
              setRelationship("Spouse");
              setShowAddForm(true);
            }}
          >
            <Ionicons name="person-add-outline" size={20} color={Colors.secondary} />
            <Text style={styles.addPatientText}>Add patient</Text>
          </Pressable>


        </ScrollView>

        {/* Bottom Sheet Modal for Adding Patient */}
        <Modal
          visible={showAddForm}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddForm(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalDismissArea} onPress={() => setShowAddForm(false)} />
            <View style={styles.bottomSheetContainer}>
              <View style={styles.sheetGrabber} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Add New Patient</Text>
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >

                {/* ID Type Selection (Radio Buttons) */}
                <View style={styles.inputContainer}>
                  {/* <Text style={styles.inputLabel}>Document Type</Text> */}
                  <View style={[styles.rowContainer, { marginBottom: 4, alignItems: "center" }]}>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", marginRight: 24 }}
                      onPress={() => {
                        setIdType("emirates");
                        setIdNumber("");
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          idType === "emirates" && styles.radioOuterActive,
                          { width: 18, height: 18, borderRadius: 9, marginRight: 8 }
                        ]}
                      >
                        {idType === "emirates" && <View style={[styles.radioInner, { width: 8, height: 8, borderRadius: 4 }]} />}
                      </View>
                      <Text style={{ fontSize: 14, fontFamily: "QuicksandBold", color: Colors.text }}>Emirates ID</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center" }}
                      onPress={() => {
                        setIdType("passport");
                        setIdNumber("");
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          idType === "passport" && styles.radioOuterActive,
                          { width: 18, height: 18, borderRadius: 9, marginRight: 8 }
                        ]}
                      >
                        {idType === "passport" && <View style={[styles.radioInner, { width: 8, height: 8, borderRadius: 4 }]} />}
                      </View>
                      <Text style={{ fontSize: 14, fontFamily: "QuicksandBold", color: Colors.text }}>Passport no.</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Emirates ID / Passport field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {idType === "emirates" ? "Emirates ID" : "Passport no."}
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "idNumber" && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      style={[styles.input, styles.inputNoOutline]}
                      placeholder={idType === "emirates" ? "123-0000-5505123-1" : "K5012250"}
                      placeholderTextColor="#B3B7C6"
                      value={idNumber}
                      onChangeText={(text) => {
                        if (idType === "emirates") {
                          setIdNumber(formatEmiratesId(text));
                        } else {
                          setIdNumber(formatPassport(text));
                        }
                      }}
                      onFocus={() => setFocusedField("idNumber")}
                      onBlur={() => setFocusedField("")}
                      autoCapitalize="characters"
                      keyboardType={idType === "emirates" ? "numeric" : "default"}
                      maxLength={idType === "emirates" ? 18 : 12}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* First Name & Last Name row */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
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
                        color={focusedField === "firstName" ? Colors.secondary : Colors.label}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, styles.inputNoOutline]}
                        placeholder="John"
                        placeholderTextColor="#B3B7C6"
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
                        color={focusedField === "lastName" ? Colors.secondary : Colors.label}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, styles.inputNoOutline]}
                        placeholder="Doe"
                        placeholderTextColor="#B3B7C6"
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

                {/* Date of birth */}
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
                        color={focusedField === "dob" ? Colors.secondary : Colors.label}
                        style={styles.inputIcon}
                      />
                      <input
                        type="date"
                        value={dayjs(dob).format("YYYY-MM-DD")}
                        onChange={(e) => {
                          if (e.target.value) {
                            setDob(new Date(e.target.value));
                          }
                        }}
                        onFocus={() => setFocusedField("dob")}
                        onBlur={() => setFocusedField("")}
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          fontSize: "16px",
                          fontFamily: "QuicksandMedium",
                          color: "#1B2130",
                          backgroundColor: "transparent",
                          width: "100%",
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
                      <Text style={styles.inputFieldText}>
                        {dayjs(dob).format("MMM DD, YYYY")}
                      </Text>
                      <Text style={styles.changeLinkText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Gender Select */}
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
                          {gender === "Female" && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.genderText}>Female</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Relationship Select */}
                <View style={styles.inputContainer}>
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
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.modalRegisterBtn}
                  onPress={handleAddPatient}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalRegisterBtnText}>Register</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={dob}
          maximumDate={new Date()}
          onConfirm={(date) => {
            setDob(date);
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listScrollContent: {
    paddingBottom: 40,
  },
  mainQuestionText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginVertical: 28,
    fontFamily: "QuicksandBold",
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
    fontWeight: "bold",
  },
  patientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  patientMeta: {
    fontSize: 13,
    color: Colors.label,
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
    fontWeight: "600",
  },
  symptomsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  symptomsInput: {
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },

  // Modal / Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetGrabber: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "QuicksandBold",
    color: Colors.text,
  },
  sheetSubtitle: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    marginBottom: 24,
    lineHeight: 20,
    textAlign: "left",
  },
  sheetScrollContent: {
    paddingBottom: 40,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
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
    width: "100%",
  },
  inputWrapperFocused: {
    borderColor: Colors.secondary,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1B2130",
    fontFamily: "QuicksandMedium",
    paddingVertical: 0,
  },
  // @ts-ignore: outlineStyle is web-only
  inputNoOutline: {
    outlineStyle: "none",
    outlineWidth: 0,
  } as any,
  inputFieldText: {
    flex: 1,
    fontSize: 16,
    color: "#1B2130",
    fontFamily: "QuicksandMedium",
  },
  changeLinkText: {
    fontSize: 14,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
  },
  rowContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "flex-start",
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
    borderColor: "#B3B7C6",
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
    fontFamily: "QuicksandBold",
    color: Colors.text,
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
  },
  relationTextActive: {
    color: Colors.secondary,
    fontWeight: "600",
  },
  modalRegisterBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  modalRegisterBtnText: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: Colors.background,
  },
});
