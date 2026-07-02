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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { USER_FULL_DATA } from "../config/config";
import { Colors } from "../config/colors";
import { getDecryptedID } from "../suggestus_plugin/util/util_functions";
import { setPatientId } from "../suggestus_plugin/suggestusClient";
import dayjs from "dayjs";

export default function PatientSelectionScreen() {
  const router = useRouter();
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
          const name = parsed.fname || `${parsed.firstName || "John"} ${parsed.lastName || "Doe"}`;
          const dob = parsed.dob ? dayjs(parsed.dob) : dayjs("1978-08-10");
          const age = dayjs().diff(dob, "year");
          const gender = parsed.gender || "Male";
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
      await setPatientId("345");
    } catch (e) {
      console.error("Error setting static patient ID:", e);
    }
    router.replace("/(drawer)/tab_bar_home/HomeScreen");
  };

  const handleAddNewPatient = () => {
    router.push("/patient/register_new_patient");
  };

  const handleSkip = () => {
    router.push("/patient/registered_patients");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logoImg}
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
              <Text style={styles.registerInnerBtnText}>Register as a patient</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
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
    backgroundColor: "#FFF",
  },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 20,
    width: "100%",
  },
  logoImg: {
    width: 260,
    height: 60,
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
    fontFamily: "QuicksandBold",
    color: "#1B2130",
  },
  userMeta: {
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    color: "#7D8A9D",
  },
  registerInnerBtn: {
    backgroundColor: "#FFF",
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
    fontFamily: "QuicksandBold",
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
