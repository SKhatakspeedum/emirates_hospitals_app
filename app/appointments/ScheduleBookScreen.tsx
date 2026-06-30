import React, { useState } from "react";
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";

const getDynamicScheduleData = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

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

  return [
    {
      dateId: "1",
      dateStr: formatDateStr(today),
      dayLabel: days[today.getDay()],
      fullDate: formatFullDate(today),
      showDoctor: true,
      slots: ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM"],
    },
    {
      dateId: "2",
      dateStr: formatDateStr(tomorrow).toUpperCase(),
      dayLabel: days[tomorrow.getDay()],
      fullDate: formatFullDate(tomorrow),
      showDoctor: false,
      slots: ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
    },
  ];
};

const SCHEDULE_DATA = getDynamicScheduleData();


export default function ScheduleBookScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    doctorId,
    doctorName,
    specialty,
    avatar,
    patientName,
    patientAge,
    patientGender,
    relationship,
    symptoms,
    type,
  } = route.params || {
    doctorId: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    patientName: "John Doe",
    patientAge: "28",
    patientGender: "Male",
    relationship: "Self",
    symptoms: "",
    type: "Virtual urgent care",
  };

  const [selectedDate, setSelectedDate] = useState(SCHEDULE_DATA[0]);
  const [selectedSlot, setSelectedSlot] = useState("09:30 AM");

  const handleConfirm = () => {
    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    navigation.navigate("ConfirmScreen", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      patientName,
      patientAge,
      patientGender,
      relationship,
      symptoms,
      type,
      date: selectedDate.fullDate,
      time: selectedSlot,
    });
  };

  const isSlotActive = (dateId: string, slot: string) => {
    return selectedDate.dateId === dateId && selectedSlot === slot;
  };

  const handleSlotSelect = (dateItem: typeof SCHEDULE_DATA[0], slot: string) => {
    setSelectedDate(dateItem);
    setSelectedSlot(slot);
  };

  const getServiceIcon = (serviceType: string): any => {
    const t = (serviceType || "").toLowerCase();
    if (t.includes("counselling")) return "chatbubbles";
    if (t.includes("clinical")) return "document-text";
    if (t.includes("family")) return "people";
    if (t.includes("cognitive") || t.includes("behavioral")) return "git-network";
    if (t.includes("psychotherapy")) return "happy";
    if (t.includes("diagnostic")) return "flask";
    return "videocam";
  };

  return (
    <View style={styles.container}>

      {/* Title Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
          <Text style={styles.headerTitle}>Date & Time</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Notice/Disclaimer Box */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            To give our clinical team adequate time to prepare for your appointment, you must complete the booking at least 20 minutes before the scheduled start time.
          </Text>
        </View>

        {/* Service Type Row */}
        <View style={styles.serviceRow}>
          <Ionicons name={getServiceIcon(type)} size={24} color={Colors.primary} />
          <Text style={styles.serviceText}>{type || "Virtual urgent care"}</Text>
        </View>

        {/* Date and Slots Sections */}
        {SCHEDULE_DATA.map((item) => (
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
            <View style={styles.slotsGrid}>
              {item.slots.map((slot) => {
                const active = isSlotActive(item.dateId, slot);
                return (
                  <Pressable
                    key={slot}
                    style={({ pressed }) => [
                      styles.slotButton,
                      active && styles.slotButtonActive,
                      {
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                    onPress={() => handleSlotSelect(item, slot)}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
            }
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
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
