import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import Toast from "react-native-toast-message";

const MONTHS = [
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

const formatDateStr = (d: Date) => {
  const monthStr = MONTHS[d.getMonth()];
  const dayNum = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${monthStr} ${dayNum}, ${year}`;
};

const formatFullDate = (d: Date) => {
  const dayNum = String(d.getDate()).padStart(2, "0");
  const monthStr = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayNum} ${monthStr} ${year}`;
};

const formatAPIDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateInfo = (apiDate: string) => {
  const d = new Date(`${apiDate}T00:00:00`);
  return {
    apiDate,
    dateStr: formatDateStr(d),
    fullDate: formatFullDate(d),
  };
};

const TODAY_API_DATE = formatAPIDate(new Date());

const MONTHS_PATTERN = MONTHS.join("|");
const DATE_TEXT_REGEX = new RegExp(
  `(${MONTHS_PATTERN})[a-z]*\\s+(\\d{1,2})\\D{0,3}(\\d{4})`,
  "i",
);

const parseFullDateToAPIDate = (fullDate: string): string | null => {
  const raw = (fullDate || "").trim();
  if (!raw) return null;

  // Already an ISO date, e.g. "2026-07-10"
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return raw.slice(0, 10);

  // Free-text formats like "Friday, Jul 10 2026", "Jul 10, 2026", "10 Jul 2026"
  const textMatch = raw.match(DATE_TEXT_REGEX);
  if (textMatch) {
    const [, monthStr, dayStr, yearStr] = textMatch;
    const monthIndex = MONTHS.findIndex(
      (m) => m.toLowerCase() === monthStr.slice(0, 3).toLowerCase(),
    );
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);
    if (monthIndex !== -1 && !Number.isNaN(day) && !Number.isNaN(year)) {
      return formatAPIDate(new Date(year, monthIndex, day));
    }
  }

  return null;
};

type Slot = { display: string; id: string };

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
    rescheduleDate,
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

  const initialAPIDate =
    parseFullDateToAPIDate(rescheduleDate) || TODAY_API_DATE;
  const [selectedDate, setSelectedDate] = useState(
    buildDateInfo(initialAPIDate),
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  const fetchSlots = useCallback(
    async (apiDate: string) => {
      setIsLoading(true);
      setSelectedSlot(null);
      try {
        const orgId = (await fetchDataFromLocalStorage("sg_org_id")) ?? "";
        const res = await callSuggestusAPI(
          spd_processId_config.hospapp_get_doctor_schedule,
          {
            p_resource_id: doctorId ?? "",
            p_date: apiDate,
            p_org_id: orgId,
            p_appt_subtype: appSubtypeId ?? "",
          },
        );

        if (res?.returnCode === true && res.returnData?.length > 0) {
          const availableSlots = res.returnData
            .filter((s: any) => s.valid_flag === "Y")
            .map((s: any) => ({
              display: s.appt_start_time ?? "",
              id: s.id ?? "",
            }))
            .filter((s: Slot) => s.display);
          setSlots(availableSlots);
          if (availableSlots.length > 0) setSelectedSlot(availableSlots[0]);
        } else {
          setSlots([]);
        }
      } catch (_) {
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [doctorId, appSubtypeId],
  );

  useEffect(() => {
    fetchSlots(selectedDate.apiDate);
  }, [selectedDate.apiDate, fetchSlots]);

  const handleDayPress = (day: { dateString: string }) => {
    if (day.dateString < TODAY_API_DATE) return;
    setSelectedDate(buildDateInfo(day.dateString));
    setIsCalendarVisible(false);
  };

  const handleConfirm = () => {
    if (!selectedSlot) {
      Toast.show({
        type: "error",
        text1: "Selection Required",
        text2: "Please select a time slot",
      });
      return;
    }

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

  const handleSlotSelect = (slot: Slot) => {
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
      <CustomHeader title="Date & Time" />

      {/* Fixed Top Section */}
      <View style={styles.fixedTop}>
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

        {/* Doctor + Date Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.doctorRow}>
            <Image source={{ uri: avatar }} style={styles.doctorAvatar} />
            <Text style={styles.doctorNameText}>{doctorName}</Text>
          </View>

          <Pressable
            style={styles.dateRow}
            onPress={() => setIsCalendarVisible(true)}
          >
            <View style={styles.dateRowLeft}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.dateRowText}>{selectedDate.dateStr}</Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
      </View>

      {/* Slots Grid (scrollable area) */}
      {isLoading ? (
        <View style={styles.slotsScroll}>
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={{ marginVertical: 24 }}
          />
        </View>
      ) : slots.length === 0 ? (
        <View style={styles.slotsScroll}>
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconWrap}>
              <Ionicons
                name="calendar-clear-outline"
                size={40}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyStateTitle}>No Available Slots</Text>
            <Text style={styles.emptyStateSubtitle}>
              We couldn't find any available slots for your selected date.
              Please choose another day.
            </Text>
          </View>
        </View>
        ) : (
          <ScrollView
            style={styles.slotsScroll}
            contentContainerStyle={styles.slotsGrid}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {slots.map((slot) => {
              const active = selectedSlot?.id === slot.id;
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
                  onPress={() => handleSlotSelect(slot)}
                >
                  <Text
                    style={[styles.slotText, active && styles.slotTextActive]}
                  >
                    {slot.display}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

      {/* Fade effect above footer */}
      <LinearGradient
        colors={["rgba(255,255,255,0)", Colors.background]}
        style={styles.footerFade}
        pointerEvents="none"
      />

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

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Calendar
              current={selectedDate.apiDate}
              onDayPress={handleDayPress}
              minDate={TODAY_API_DATE}
              markedDates={{
                [selectedDate.apiDate]: {
                  selected: true,
                  selectedColor: Colors.primary,
                },
              }}
              theme={{
                backgroundColor: Colors.background,
                calendarBackground: Colors.background,
                todayTextColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: Colors.background,
                dayTextColor: Colors.text,
                textDisabledColor: Colors.inactive,
                arrowColor: Colors.primary,
                monthTextColor: Colors.text,
                textMonthFontWeight: "700",
                textDayFontFamily: FontFamilies.regular,
                textMonthFontFamily: FontFamilies.semiBold,
                textDayHeaderFontFamily: FontFamilies.medium,
              }}
            />
            <Pressable
              onPress={() => setIsCalendarVisible(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontFamily: FontFamilies.medium,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  serviceText: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.pressed,
    borderRadius: 12,
    padding: 12,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  doctorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  doctorNameText: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateRowText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  changeText: {
    fontSize: 14,
    color: Colors.secondary,
    fontFamily: FontFamilies.bold,
  },
  fixedTop: {
    paddingTop: 4,
  },
  slotsScroll: {
    flex: 1,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  slotButton: {
    width: "48%",
    height: 48,
    backgroundColor: Colors.lightgray,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  slotButtonActive: {
    backgroundColor: Colors.pressed,
    borderWidth: 1.5,
    borderColor: Colors.activeBorder,
  },
  slotText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.bold,
  },
  slotTextActive: {
    color: Colors.primary,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyStateIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.lightgray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: Colors.label,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: FontFamilies.medium,
  },
  footerFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    minWidth: 320,
    elevation: 4,
  },
  modalCancelButton: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  modalCancelText: {
    color: Colors.primary,
    fontFamily: FontFamilies.semiBold,
    fontSize: 15,
  },
});
