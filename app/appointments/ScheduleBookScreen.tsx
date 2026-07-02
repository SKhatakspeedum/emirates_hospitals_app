import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";

const getDynamicScheduleData = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const months = [
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
  ];
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const formatDateStr = (d: Date) => {
    const monthStr = months[d.getMonth()];
    const dayNum = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${monthStr} ${dayNum}, ${year}`;
  };

  const formatFullDate = (d: Date) => {
    const dayNum = String(d.getDate()).padStart(2, "0");
    const monthStr = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayNum} ${monthStr} ${year}`;
  };

  const formatAPIDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return [
    {
      dateId: "1",
      dateStr: formatDateStr(today),
      dayLabel: days[today.getDay()],
      fullDate: formatFullDate(today),
      apiDate: formatAPIDate(today),
      showDoctor: true,
      slots: [] as { display: string; id: string }[],
    },
    {
      dateId: "2",
      dateStr: formatDateStr(tomorrow),
      dayLabel: days[tomorrow.getDay()],
      fullDate: formatFullDate(tomorrow),
      apiDate: formatAPIDate(tomorrow),
      showDoctor: false,
      slots: [] as { display: string; id: string }[],
    },
  ];
};

const SCHEDULE_DATA = getDynamicScheduleData();

export default function ScheduleBookScreen() {
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
    relationship,
    symptoms,
    type,
    appSubtypeId,
  } = route.params || {
    doctorId: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    hospital: "",
    patientId: "",
    patientName: "John Doe",
    patientAge: "28",
    patientGender: "Male",
    relationship: "Self",
    symptoms: "",
    type: "Virtual urgent care",
    appSubtypeId: "",
  };

  const [scheduleData, setScheduleData] = useState(SCHEDULE_DATA);
  const [selectedDate, setSelectedDate] = useState(SCHEDULE_DATA[0]);
  const [selectedSlot, setSelectedSlot] = useState<{
    display: string;
    id: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const orgId = (await fetchDataFromLocalStorage("sg_org_id")) ?? "3";
        const results = await Promise.all(
          SCHEDULE_DATA.map((item) =>
            callSuggestusAPI(spd_processId_config.hospapp_get_doctor_schedule, {
              p_resource_id: doctorId ?? "",
              p_date: item.apiDate,
              p_org_id: orgId,
              p_appt_subtype: appSubtypeId ?? "",
            }).then((res) => {
              if (res?.returnCode === true && res.returnData?.length > 0) {
                const slots = res.returnData
                  .filter((s: any) => s.valid_flag === "Y")
                  .map((s: any) => ({
                    display: s.appt_start_time ?? "",
                    id: s.id ?? "",
                  }))
                  .filter((s: { display: string; id: string }) => s.display);
                return { ...item, slots };
              }
              return item;
            }),
          ),
        );
        setScheduleData(results);
        setSelectedDate(results[0]);
        if (results[0].slots.length > 0) setSelectedSlot(results[0].slots[0]);
      } catch (_) {
        // keep empty slots on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const handleConfirm = () => {
    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    console.log("apptId 1111:>>", apptId);
    navigation.navigate("ConfirmScreen", {
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
      relationship,
      symptoms,
      appSubtypeId,
      type,
      date: selectedDate.fullDate,
      time: selectedSlot.display,
      slotId: selectedSlot.id,
    });
  };

  const isSlotActive = (
    dateId: string,
    slot: { display: string; id: string },
  ) => {
    return selectedDate.dateId === dateId && selectedSlot?.id === slot.id;
  };

  const handleSlotSelect = (
    dateItem: (typeof SCHEDULE_DATA)[0],
    slot: { display: string; id: string },
  ) => {
    setSelectedDate(dateItem);
    setSelectedSlot(slot);
  };

  const getServiceIcon = (serviceType: string): any => {
    const t = (serviceType || "").toLowerCase();
    if (t.includes("counselling")) return "chatbubbles";
    if (t.includes("clinical")) return "document-text";
    if (t.includes("family")) return "people";
    if (t.includes("cognitive") || t.includes("behavioral"))
      return "git-network";
    if (t.includes("psychotherapy")) return "happy";
    if (t.includes("diagnostic")) return "flask";
    return "videocam";
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <CustomHeader title="Date & Time" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notice/Disclaimer Box */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            To give our clinical team adequate time to prepare for your
            appointment, you must complete the booking at least 20 minutes
            before the scheduled start time.
          </Text>
        </View>

        {/* Service Type Row */}
        <View style={styles.serviceRow}>
          <Ionicons
            name={getServiceIcon(type)}
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.serviceText}>
            {type || "Virtual urgent care"}
          </Text>
        </View>

        {/* Date and Slots Sections */}
        {scheduleData.map((item) => (
          <View key={item.dateId} style={styles.dateSection}>
            {/* Date Header Row */}
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateHeaderLeft}>
                <View style={styles.verticalBar} />
                <Text style={styles.dateStrText}>{item.dateStr}</Text>
              </View>
              <Text style={styles.dayLabelText}>{item.dayLabel}</Text>
            </View>

            {/* Doctor Info Row (only if showDoctor is true) */}
            {item.showDoctor && (
              <View style={styles.doctorRow}>
                <Image source={{ uri: avatar }} style={styles.doctorAvatar} />
                <Text style={styles.doctorNameText}>{doctorName}</Text>
              </View>
            )}

            {/* Slots Grid */}
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : item.slots.length === 0 ? (
              <Text style={styles.noSlotsText}>No slots available</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {item.slots.map((slot) => {
                  const active = isSlotActive(item.dateId, slot);
                  return (
                    <Pressable
                      key={slot.id || slot.display}
                      style={({ pressed }) => [
                        styles.slotButton,
                        active && styles.slotButtonActive,
                        {
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      onPress={() => handleSlotSelect(item, slot)}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          active && styles.slotTextActive,
                        ]}
                      >
                        {slot.display}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer / Confirm CTA */}
      <View style={styles.footerContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            {
              transform: [{ scale: pressed ? 0.95 : 1 }],
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.background} />
        </Pressable>
      </View>
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
    fontFamily: "Quicksand",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  disclaimerContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.label,
    textAlign: "center",
    lineHeight: 18,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  serviceText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  dateSection: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  verticalBar: {
    width: 2.5,
    height: 18,
    backgroundColor: Colors.primary,
    marginRight: 8,
    borderRadius: 1,
  },
  dateStrText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  dayLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  doctorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  doctorNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  slotButton: {
    width: "48%",
    height: 48,
    backgroundColor: Colors.border,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  slotButtonActive: {
    backgroundColor: Colors.primary,
  },
  noSlotsText: {
    fontSize: 13,
    color: Colors.label,
    marginVertical: 12,
  },
  slotText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  slotTextActive: {
    color: Colors.background,
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
    fontWeight: "700",
  },
});
