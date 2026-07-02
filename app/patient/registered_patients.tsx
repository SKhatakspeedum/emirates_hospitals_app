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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { USER_FULL_DATA } from "../config/config";
import { Colors } from "../config/colors";
import { getDecryptedID } from "../suggestus_plugin/util/util_functions";
import { setPatientId } from "../suggestus_plugin/suggestusClient";
import dayjs from "dayjs";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  initials: string;
  bgColor: string;
}

export default function RegisteredPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([
    { id: "345", name: "John Doe", age: 48, gender: "Male", initials: "JD", bgColor: "#E3EEF9" },
    { id: "346", name: "Olive Yew", age: 42, gender: "Female", initials: "OY", bgColor: "#F9EAF2" },
    { id: "347", name: "Jack Slive", age: 20, gender: "Male", initials: "JS", bgColor: "#EBF7EC" },
  ]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const fullDataStr = await getDecryptedID(USER_FULL_DATA);
        if (fullDataStr) {
          const parsed = JSON.parse(fullDataStr);
          const name = parsed.fname || `${parsed.firstName || "John"} ${parsed.lastName || "Doe"}`;
          const dob = parsed.dob ? dayjs(parsed.dob) : dayjs("1978-08-10");
          const age = dayjs().diff(dob, "year");
          const gender = parsed.gender || "Male";

          setPatients(prev => [
            {
              ...prev[0],
              name,
              age,
              gender,
              initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
            },
            prev[1],
            prev[2],
          ]);
        }
      } catch (e) {
        console.error("Error loading user data in RegisteredPatientsScreen:", e);
      }
    };
    loadUserData();
  }, []);

  const handleSelectPatient = async (patientId: string) => {
    try {
      await setPatientId(patientId);
    } catch (e) {
      console.error("Error setting patient ID:", e);
    }
    router.replace("/(drawer)/tab_bar_home/HomeScreen");
  };

  const handleAddNewPatient = () => {
    router.push("/patient/register_new_patient");
  };

  const handleSkip = () => {
    router.push("/init_screens/success");
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Centered Brand Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.sectionTitle}>Registered patients</Text>

        <View style={styles.patientsList}>
          {patients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientRow}
              onPress={() => handleSelectPatient(patient.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarCircle, { backgroundColor: patient.bgColor }]}>
                <Text style={styles.avatarText}>{patient.initials}</Text>
              </View>

              <View style={styles.patientInfoCol}>
                <Text style={styles.patientName}>
                  {patient.name}{" "}
                  <Text style={styles.patientMeta}>
                    {patient.age} Yrs / {patient.gender}
                  </Text>
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addNewPatientBtn}
          onPress={handleAddNewPatient}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={20} color={Colors.secondary} style={styles.btnIcon} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 40 : 60,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
    marginBottom: 16,
    marginTop: 10,
  },
  patientsList: {
    width: "100%",
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F9",
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
    fontFamily: "QuicksandBold",
    color: "#2C5D9E",
  },
  patientInfoCol: {
    flex: 1,
    marginLeft: 16,
  },
  patientName: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: "#1B2130",
  },
  patientMeta: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#7D8A9D",
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
    backgroundColor: "#FFF",
  },
  btnIcon: {
    marginRight: 8,
  },
  addNewPatientBtnText: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
  },
});
