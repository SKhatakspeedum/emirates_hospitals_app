import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  DeviceEventEmitter,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  fetchDataFromLocalStorage,
  getDecryptedID,
} from "../suggestus_plugin/util/util_functions";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SPD_AI_CODE } from "../config/config";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import Toast from "react-native-toast-message";

export default function ConfirmScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    apptId,
    doctorId,
    doctorName,
    specialty,
    avatar,
    hospital,
    patientId,
    patientName,
    patientAge,
    patientGender,
    appSubtypeId,
    apptypId,
    type,
    date,
    time,
    slotId,
    symptoms,
  } = route.params || {
    doctorId: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    hospital: "",
    patientId: "",
    patientName: "John Doe",
    patientAge: "",
    patientGender: "",
    appSubtypeId: "",
    apptypId: "",
    type: "Video Consult",
    date: "02 Mar 2026",
    time: "09:30 AM",
    slotId: "",
    symptoms: "",
  };

  const [locationText, setLocationText] = useState<string>(hospital ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hospital) return;
    fetchDataFromLocalStorage("sg_org_name").then((val) => {
      if (val) setLocationText(val);
    });
  }, []);

  // Converts "2026-07-03-07:45:00-08:30:00" → "2026-07-03~07:45:00~08:30:00"
  const buildSlotsList = (id: string): string => {
    if (!id) return "";
    const datePart = id.slice(0, 10);
    const startPart = id.slice(11, 19);
    const endPart = id.slice(20, 28);
    return `${datePart}~${startPart}~${endPart}`;
  };

  // React Native Toast message for error feedback
  const showError = (message: string) => {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: message,
    });
  };

  const handleDone = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const orgId = (await fetchDataFromLocalStorage("sg_org_id")) ?? "";
      const pid =
        patientId || (await fetchDataFromLocalStorage("sg_patientId")) || "";
      const pSlotsList = buildSlotsList(slotId ?? "");

      // Mapping patient to organization is now handled elsewhere; removed here.

      const res = await callSuggestusAPI(
        spd_processId_config.hospapp_save_patient_appointment_hv,
        {
          p_doctor_id: doctorId ?? "",
          p_patient_id: pid,
          p_slots_list: pSlotsList,
          // apptId (an existing appointment's own ID) takes precedence when
          // rescheduling; otherwise this is a fresh booking, so fall back to
          // apptyp_id resolved from xcelschconf_get_mst_appointment_subtype_pntapp
          // on the Appointment Reason screen.
          p_appt_id: apptId || apptypId || "",
          p_org_id: orgId,
          p_online_appointment_flag: "Y",
          p_appt_subtype: appSubtypeId ?? "",
          p_reschedule_appointment: "",
          p_remarks: symptoms ?? "",
        },
      );

      if (res?.returnCode === true) {
        DeviceEventEmitter.emit("appointmentBooked");
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Your appointment has been successfully scheduled.",
        });
        setTimeout(() => {
          navigation.navigate("Appointment", {
            fromBooking: true,
          });
        }, 2000);
      } else {
        showError(
          res?.returnMessage ?? "Failed to save appointment. Please try again.",
        );
      }
    } catch (_) {
      showError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getFormattedDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split(" ");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1];
        const year = parseInt(parts[2], 10);

        const monthIndex = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].indexOf(monthStr);
        if (monthIndex !== -1) {
          const d = new Date(year, monthIndex, day);
          const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayName = daysShort[d.getDay()];
          return `${dayName} - ${monthStr} ${String(day).padStart(2, "0")}, ${year}`;
        }
      }
    } catch (e) {
      // Fallback
    }
    return dateStr;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Title Header */}
        <CustomHeader title="Confirm details" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor card */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorCardTopRow}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.doctorAvatar} />
              ) : (
                <View
                  style={[styles.doctorAvatar, styles.doctorAvatarFallback]}
                >
                  <Ionicons name="person" size={18} color={Colors.background} />
                </View>
              )}
              <View style={styles.textColumn}>
                <Text style={styles.doctorName}>{doctorName}</Text>
                {!!specialty && (
                  <Text style={styles.doctorSpecialty}>{specialty}</Text>
                )}
              </View>
            </View>

            {!!symptoms && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonText} numberOfLines={1}>
                  {symptoms}
                </Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={Colors.label}
                />
              </View>
            )}
          </View>

          {/* Date and Time Slot with Change link */}
          <View style={[styles.listItem, styles.listItemSpaceBetween]}>
            <View style={styles.listItemLeft}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primary}
                style={styles.itemIcon}
              />
              <View style={styles.textColumn}>
                <Text style={styles.itemValue}>
                  {getFormattedDateDisplay(date)}
                </Text>
                <Text style={styles.itemSubValue}>{time}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.changeLinkText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Location */}
          {!!locationText && (
            <>
              <View style={styles.listItem}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={Colors.primary}
                  style={styles.itemIcon}
                />
                <Text style={styles.itemValue}>{locationText}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Patient Info */}
          <View style={styles.listItem}>
            <Ionicons
              name="person-outline"
              size={20}
              color={Colors.primary}
              style={styles.itemIcon}
            />
            <View style={styles.textColumn}>
              <Text style={styles.itemValue}>{patientName}</Text>
              {(patientAge || patientGender) && (
                <Text style={styles.itemSubValue}>
                  {[patientAge && `${patientAge} yrs`, patientGender]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer with Continue Button */}
        <View style={styles.footerContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              isSaving && { opacity: 0.6 },
              !isSaving && {
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleDone}
            disabled={isSaving}
          >
            <Text style={styles.confirmButtonText}>
              {isSaving ? "Booking..." : "Book appointment"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
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
  scrollContent: {
    paddingBottom: 120,
  },
  doctorCard: {
    backgroundColor: "#EAF3FF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  doctorCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorName: {
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamilies.semiBold,
    marginTop: 2,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  listItemSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: "center",
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
  },
  doctorAvatarFallback: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  itemSubValue: {
    fontSize: 13,
    color: Colors.label,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: FontFamilies.semiBold,
  },
  textColumn: {
    flexDirection: "column",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  changeLinkText: {
    fontSize: 14,
    color: Colors.secondary,
    fontFamily: FontFamilies.semiBold,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "flex-end",
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontFamily: FontFamilies.bold,
  },
});
