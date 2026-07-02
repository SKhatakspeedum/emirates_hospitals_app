import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";


type Appointment = {
  id: string;
  doctorName: string;
  specialty: string;
  avatar: string;
  date: string;
  time: string;
  status: string;
  statusHtml: string;
  type: string;
  apptypName: string;
  patientDet: string;
  resourceId: string;
  appSubtypeId: string;
};

const HISTORY_APPOINTMENTS: Appointment[] = [
  { id: "3", doctorName: "Dr. Sheena Cherry", specialty: "Specialist Medicine", avatar: "https://randomuser.me/api/portraits/women/68.jpg", date: "20 Feb 2026", time: "02:00 PM", status: "Completed", statusHtml: "", type: "Video Consult", apptypName: "", patientDet: "", resourceId: "", appSubtypeId: "" },
  { id: "4", doctorName: "Dr. Yanal Salam", specialty: "Consultant Medicine", avatar: "https://randomuser.me/api/portraits/men/46.jpg", date: "15 Feb 2026", time: "10:30 AM", status: "Cancelled", statusHtml: "", type: "In-Clinic", apptypName: "", patientDet: "", resourceId: "", appSubtypeId: "" },
];

// Strips HTML tags: "<div class="badge-success">BOOKED</div>" → "BOOKED"
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

// Returns color/bg from badge class: badge-outline-success, badge-outline-danger, etc.
const getStatusStyle = (htmlStr: string) => {
  if (htmlStr.includes("success")) return { color: "#16a34a", bg: "#dcfce7" };
  if (htmlStr.includes("danger")) return { color: "#dc2626", bg: "#fee2e2" };
  if (htmlStr.includes("warning")) return { color: "#d97706", bg: "#fef3c7" };
  return { color: Colors.primary, bg: "#e0f2fe" };
};

// Converts "09:15:00" or "09:15 AM" → "09:15 AM"
const formatAmPm = (timeStr: string): string => {
  if (!timeStr) return "";
  // Already has AM/PM
  if (/am|pm/i.test(timeStr)) return timeStr.trim();
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  if (isNaN(h)) return timeStr;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${m} ${suffix}`;
};

// Parses "Friday, Jul 03 2026" or "02 Mar 2026" → { month, day }
const parseDateBadge = (dateStr: string) => {
  const clean = dateStr.replace(/^\w+,\s*/, "").trim(); // strip "Friday, "
  const parts = clean.split(" ");
  if (parts.length >= 3) {
    if (isNaN(Number(parts[0]))) return { month: parts[0], day: parts[1] }; // "Jul 03 2026"
    return { month: parts[1], day: parts[0] };                              // "02 Mar 2026"
  }
  return { month: "Mar", day: "02" };
};

export default function AppointmentScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [upcomingList, setUpcomingList] = useState<Appointment[]>([]);
  const [historyList, setHistoryList] = useState(HISTORY_APPOINTMENTS);
  const [isLoading, setIsLoading] = useState(false);

  const appointments = activeTab === "upcoming" ? upcomingList : historyList;

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const patientId = await fetchDataFromLocalStorage("sg_patientId");
        const response = await callSuggestusAPI(
          spd_processId_config.xcelsch_get_patient_future_appointments_pntportal_hv_patient_dashboard,
          {
            p_patient_id: patientId ?? "",
            p_visit_id: null,
            menu_name: "Wellness",
            menu_tab_type: "always_patient_specific",
            maximization_redirection_label: "Make appointment",
            p_max_offset: 100,
            p_offset: 0,
          },
        );
        if (response?.returnCode === true && response.returnData?.length > 0) {
          const mapItem = (a: any): Appointment => ({
            id: String(a.p_appt_id ?? a.sch_id ?? a.appointment_id ?? ""),
            doctorName: a.resource_name ?? a.phy_name ?? a.doctor_name ?? "",
            specialty: a.dpt_description ?? a.dept_name ?? a.speciality_name ?? "",
            avatar: a.p_doc_image_url ?? a.phy_photo ?? a.doctor_photo ?? "",
            date: a.appt_date_dashboard ?? a.sch_date ?? a.appointment_date ?? "",
            time: a.appt_start_time ?? a.sch_time ?? a.appointment_time ?? "",
            status: a.appstat_name ?? a.sch_status ?? a.appointment_status ?? "Confirmed",
            statusHtml: a.appstat_html_name ?? "",
            type: a.appsubtyp_name ?? a.appointment_type ?? a.visit_type ?? "In-Clinic",
            apptypName: stripHtml(a.apptyp_name ?? ""),
            patientDet: a.patient_det ?? "",
            resourceId: String(a.appt_resource_id ?? a.resource_id ?? ""),
            appSubtypeId: String(a.appsubtyp_id ?? ""),
          });

          const upcoming: Appointment[] = [];
          const history: Appointment[] = [];
          response.returnData.forEach((a: any) => {
            const histType = (a.appointment_history_type ?? "").toLowerCase();
            if (histType === "history") {
              history.push(mapItem(a));
            } else {
              upcoming.push(mapItem(a));
            }
          });

          setUpcomingList(upcoming);
          if (history.length > 0) setHistoryList(history);
        }
      } catch (_) {
        // keep fallback lists on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancelAppointment = (id: string, name: string) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${name}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            if (activeTab === "upcoming") {
              setUpcomingList((prev: Appointment[]) => prev.filter((item: Appointment) => item.id !== id));
            } else {
              setHistoryList((prev: Appointment[]) => prev.filter((item: Appointment) => item.id !== id));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      <SafeAreaView style={styles.safeArea}>

        {/* Title Header */}
        <CustomHeader title="Appointments" />

        {/* Tab Segment Controls */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabSegmentContainer}>
            <TouchableOpacity
              style={[
                styles.tabSegmentButton,
                activeTab === "upcoming" && styles.tabSegmentButtonActive,
              ]}
              onPress={() => setActiveTab("upcoming")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSegmentText,
                  activeTab === "upcoming" && styles.tabSegmentTextActive,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabSegmentButton,
                activeTab === "history" && styles.tabSegmentButtonActive,
              ]}
              onPress={() => setActiveTab("history")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSegmentText,
                  activeTab === "history" && styles.tabSegmentTextActive,
                ]}
              >
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: 60 }}
            />
          ) : appointments.length === 0 ? (
            // Empty State UI (Screen 1 & Screen 2)
            <View style={styles.emptyContainer}>
              <Image
                source={require("@/assets/images/doctors_illustrations.png")}
                style={styles.illustration}
              />

              <Text style={styles.emptyText}>
                {activeTab === "upcoming"
                  ? "You don't have any appointments.\nLet's change that"
                  : "You don't have any history\nin appointments."}
              </Text>

              {activeTab === "upcoming" && (
                <TouchableOpacity
                  style={styles.outlineBookButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("NearbyProviders")}
                >
                  <Text style={styles.outlineBookButtonText}>Book an appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Populated State UI (Screen 3)
            appointments.map((item: Appointment) => {
              const { month: dateMonth, day: dateNum } = parseDateBadge(item.date);
              const startTime = formatAmPm(item.time.split(" - ")[0] || item.time);
              const statusLabel = item.statusHtml ? stripHtml(item.statusHtml) : item.status;
              const statusStyle = getStatusStyle(item.statusHtml ?? "");

              return (
                <View key={item.id} style={styles.appointmentRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.rowClickArea,
                      { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                    ]}
                    onPress={() => navigation.navigate("AppointmentDetails", {
                      apptId: item.id,
                      doctorId: item.resourceId || item.id,
                      doctorName: item.doctorName,
                      specialty: item.specialty,
                      avatar: item.avatar,
                      patientDet: item.patientDet,
                      type: item.type || "Primary care visit",
                      apptypName: item.apptypName,
                      appSubtypeId: item.appSubtypeId,
                      date: item.date,
                      time: startTime,
                      isHistory: activeTab === "history",
                    })}
                  >
                    {/* Date Badge */}
                    <View style={styles.dateBadge}>
                      <View style={styles.dateBadgeHeader}>
                        <Text style={styles.dateMonthText}>{dateMonth}</Text>
                      </View>
                      <View style={styles.dateBadgeBody}>
                        <Text style={styles.dateNumText}>{dateNum}</Text>
                      </View>
                    </View>

                    {/* Details Column */}
                    <View style={styles.detailsCol}>
                      {/* resource_name */}
                      <Text style={styles.appointmentTitle}>{item.doctorName}</Text>

                      {/* appt_date (time part) */}
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={14} color={styles.iconColor.color} />
                        <Text style={styles.metaText}>{startTime}</Text>
                      </View>

                      {/* appstat_html_name → status badge */}
                      {!!statusLabel && (
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                            {statusLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {/* Options Ellipsis */}
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => handleCancelAppointment(item.id, item.doctorName)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#757575" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Floating Action Button (Only visible when list is not empty) */}
        {appointments.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              {
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              }
            ]}
            onPress={() => navigation.navigate("NearbyProviders")}
          >
            <Ionicons name="add" size={28} color={Colors.background} />
          </Pressable>
        )}
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    marginLeft: 5,
  },

  tabWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tabSegmentContainer: {
    flexDirection: "row",
    height: 42,
    backgroundColor: "#EBEBEF",
    borderRadius: 10,
    padding: 3,
  },
  tabSegmentButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  tabSegmentButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "600",
  },
  tabSegmentTextActive: {
    color: "#232323",
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  illustration: {
    width: 230,
    height: 230,
    resizeMode: "contain",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  outlineBookButton: {
    marginTop: 36,
    width: "100%",
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  outlineBookButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
  appointmentRow: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    alignItems: "center",
  },
  dateBadge: {
    width: 46,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateBadgeHeader: {
    backgroundColor: Colors.primary,
    width: "100%",
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  dateBadgeBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  dateMonthText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  dateNumText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsCol: {
    flex: 1,
    justifyContent: "center",
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#555",
  },
  menuButton: {
    padding: 8,
  },
  rowClickArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 100,
  },
  iconColor: {
    color: Colors.primary,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
