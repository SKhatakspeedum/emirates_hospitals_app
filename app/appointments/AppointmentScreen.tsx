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
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import CustomTabs from "../components/CustomTabs";
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
  endTime: string;
  status: string;
  statusHtml: string;
  type: string;
  apptypName: string;
  patientDet: string;
  resourceId: string;
  appSubtypeId: string;
  hospitalName: string;
  hospitalArea: string;
};


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

// "Friday, Jul 03 2026" or "02 Mar 2026" → "Fri - Jul 03, 2026"
const formatDateWithDay = (dateStr: string): string => {
  if (!dateStr) return "";
  const clean = dateStr.replace(/^\w+,\s*/, "").trim();
  const parts = clean.split(" ");
  if (parts.length < 3) return dateStr;

  let month: string, day: string, year: string;
  if (isNaN(Number(parts[0]))) {
    [month, day, year] = parts; // "Jul 03 2026"
  } else {
    [day, month, year] = parts; // "02 Mar 2026"
  }

  const monthIndex = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ].indexOf(month);
  if (monthIndex === -1 || !day || !year) return dateStr;

  const d = new Date(Number(year), monthIndex, Number(day));
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${daysShort[d.getDay()]} - ${month} ${String(day).padStart(2, "0")}, ${year}`;
};

// "09:15:00" → "09:15" (strips seconds; leaves already-short strings as-is)
const toHHMM = (timeStr: string): string => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
};

export default function AppointmentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const fromBooking = route.params?.fromBooking === true;
  const preloadedUpcoming: Appointment[] | undefined =
    route.params?.preloadedUpcoming;
  const preloadedHistory: Appointment[] | undefined =
    route.params?.preloadedHistory;
  const hasPreloaded =
    Array.isArray(preloadedUpcoming) || Array.isArray(preloadedHistory);
  // Forwarded from Dashboard so "Book an appointment" → NearbyProviders
  // doesn't have to re-hit hospapp_get_resources either.
  const preloadedProviders = route.params?.preloadedProviders;
  const goToNearbyProviders = () =>
    navigation.navigate("NearbyProviders", { preloadedProviders });

  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [upcomingList, setUpcomingList] = useState<Appointment[]>(
    preloadedUpcoming ?? [],
  );
  const [historyList, setHistoryList] = useState<Appointment[]>(
    preloadedHistory ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const appointments = activeTab === "upcoming" ? upcomingList : historyList;

  useEffect(() => {
    // Dashboard already fetched this via the same
    // xcelsch_get_patient_future_appointments_pntportal_hv_patient_dashboard
    // call and passed both lists along — skip the redundant re-fetch.
    if (hasPreloaded) return;

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
            p_process_type: "fetch_all_appointments",
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
            endTime: a.appt_end_time ?? a.sch_end_time ?? a.appointment_end_time ?? "",
            statusHtml: a.appstat_html_name ?? "",
            type: a.appsubtyp_name ?? a.appointment_type ?? a.visit_type ?? "In-Clinic",
            apptypName: stripHtml(a.apptyp_name ?? ""),
            patientDet: a.patient_det ?? "",
            resourceId: String(a.appt_resource_id ?? a.resource_id ?? ""),
            appSubtypeId: String(a.appsubtyp_id ?? ""),
            hospitalName: a.org_name ?? a.hospital_name ?? "",
            hospitalArea: a.area_name ?? a.city ?? a.branch_name ?? "",
          });

          const upcoming: Appointment[] = [];
          const history: Appointment[] = [];
          response.returnData.forEach((a: any) => {
            const histType = (a.appointment_history_type ?? "").toLowerCase();
            if (histType.includes("hist")) {
              history.push(mapItem(a));
            } else {
              upcoming.push(mapItem(a));
            }
          });

          setUpcomingList(upcoming);
          setHistoryList(history);
        }
      } catch (_) {
        // keep fallback lists on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (fromBooking) {
      const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
        e.preventDefault();
        goToNearbyProviders();
      });
      return unsubscribe;
    }
  }, [fromBooking, navigation]);

  // react-native-web's Alert.alert doesn't render anything for multi-button
  // dialogs (it's a native-only API) — on web the "Yes, Cancel" callback
  // simply never fires, so tapping Cancel looked like it did nothing.
  // window.confirm/alert are the web-native equivalents.
  const confirmCancel = (message: string): Promise<boolean> => {
    if (Platform.OS === "web") {
      return Promise.resolve(
        typeof window !== "undefined" ? window.confirm(message) : false,
      );
    }
    return new Promise((resolve) => {
      Alert.alert("Cancel Appointment", message, [
        { text: "No", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ]);
    });
  };

  const showError = (message: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.alert(message);
    } else {
      Alert.alert("Error", message);
    }
  };

  const handleCancelAppointment = async (id: string, name: string) => {
    const confirmed = await confirmCancel(
      `Are you sure you want to cancel your appointment with ${name}?`,
    );
    if (!confirmed) return;

    try {
      const res = await callSuggestusAPI(
        spd_processId_config.xcelsch_update_trn_appointment_status_hv_patient_portal,
        {
          p_appt_id: id,
          appt_id: id,
          p_status: "CANC",
        },
      );
      if (res?.returnCode !== true) {
        showError(
          res?.returnMessage ?? "Failed to cancel appointment. Please try again.",
        );
        return;
      }
    } catch (e) {
      showError("Something went wrong. Please try again.");
      return;
    }

    if (activeTab === "upcoming") {
      setUpcomingList((prev: Appointment[]) => prev.filter((item: Appointment) => item.id !== id));
    } else {
      setHistoryList((prev: Appointment[]) => prev.filter((item: Appointment) => item.id !== id));
    }
  };

  const handleReschedule = (item: Appointment) => {
    navigation.navigate("ScheduleBook", {
      apptId: item.id,
      doctorId: item.resourceId || item.id,
      doctorName: item.doctorName,
      specialty: item.specialty,
      avatar: item.avatar,
      patientName: item.patientDet,
      type: item.type || "Primary care visit",
      appSubtypeId: item.appSubtypeId,
      rescheduleDate: item.date,
    });
  };

  const handleBookAgain = (item: Appointment) => {
    navigation.navigate("PatientDetails", {
      doctorId: item.resourceId || item.id,
      doctorName: item.doctorName,
      specialty: item.specialty,
      avatar: item.avatar,
      hospital: item.hospitalName,
    });
  };

  return (
    <View style={styles.container}>

      <SafeAreaView style={styles.safeArea}>

        {/* Title Header */}
        <CustomHeader title="Appointments" />

        {/* Tab Segment Controls */}
        <View style={styles.tabWrapper}>
          <CustomTabs
            tabs={["Upcoming", "History"]}
            activeTab={activeTab === "upcoming" ? "Upcoming" : "History"}
            onTabChange={(tab) => setActiveTab(tab === "Upcoming" ? "upcoming" : "history")}
          />
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
                  onPress={goToNearbyProviders}
                >
                  <Text style={styles.outlineBookButtonText}>Book an appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Populated State UI (Screen 3)
            appointments.map((item: Appointment) => {
              const dateDisplay = formatDateWithDay(item.date);
              const timeDisplay = item.endTime
                ? `${toHHMM(item.time)} - ${toHHMM(item.endTime)}`
                : formatAmPm(item.time.split(" - ")[0] || item.time);
              const statusLabel = item.statusHtml ? stripHtml(item.statusHtml) : item.status;
              const statusStyle = getStatusStyle(item.statusHtml ?? "");
              const isUpcoming = activeTab === "upcoming";

              return (
                <View key={item.id} style={styles.card}>
                  <View>
                    {/* Doctor row */}
                    <View style={styles.cardTopRow}>
                      <Image
                        source={{ uri: item.avatar }}
                        style={styles.cardAvatar}
                      />
                      <View style={styles.cardDoctorCol}>
                        <Text style={styles.cardDoctorName} numberOfLines={1}>
                          {item.doctorName}
                        </Text>
                        {!!item.specialty && (
                          <Text style={styles.cardSpecialty} numberOfLines={1}>
                            {item.specialty}
                          </Text>
                        )}
                      </View>
                      {!!statusLabel && (
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusStyle.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: statusStyle.color },
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      )}
                    </View>

                    {isUpcoming ? (
                      <>
                        {/* Date */}
                        {!!dateDisplay && (
                          <View style={styles.metaRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={15}
                              color={styles.iconColor.color}
                            />
                            <Text style={styles.metaText}>{dateDisplay}</Text>
                          </View>
                        )}

                        {/* Time */}
                        {!!timeDisplay && (
                          <View style={styles.metaRow}>
                            <Ionicons
                              name="time-outline"
                              size={15}
                              color={styles.iconColor.color}
                            />
                            <Text style={styles.metaText}>{timeDisplay}</Text>
                          </View>
                        )}

                        {/* Location */}
                        {!!(item.hospitalName || item.hospitalArea) && (
                          <View style={styles.metaRow}>
                            <Ionicons
                              name="location-outline"
                              size={15}
                              color={styles.iconColor.color}
                            />
                            <View>
                              {!!item.hospitalName && (
                                <Text style={styles.metaText}>
                                  {item.hospitalName}
                                </Text>
                              )}
                              {!!item.hospitalArea && (
                                <Text style={styles.metaSubText}>
                                  {item.hospitalArea}
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                      </>
                    ) : (
                      // History: date/time and location sit side-by-side in
                      // two columns instead of stacked rows.
                      <View style={styles.cardInfoRow}>
                        <View style={styles.cardInfoCol}>
                          {!!dateDisplay && (
                            <View style={styles.metaRow}>
                              <Ionicons
                                name="calendar-outline"
                                size={15}
                                color={styles.iconColor.color}
                              />
                              <Text style={styles.metaText}>{dateDisplay}</Text>
                            </View>
                          )}
                          {!!timeDisplay && (
                            <Text style={styles.metaIndentedText}>
                              {timeDisplay}
                            </Text>
                          )}
                        </View>

                        <View style={styles.cardInfoCol}>
                          {!!(item.hospitalName || item.hospitalArea) && (
                            <>
                              <View style={styles.metaRow}>
                                <Ionicons
                                  name="location-outline"
                                  size={15}
                                  color={styles.iconColor.color}
                                />
                                <Text style={styles.metaText}>
                                  {item.hospitalName}
                                </Text>
                              </View>
                              {!!item.hospitalArea && (
                                <Text style={styles.metaIndentedText}>
                                  {item.hospitalArea}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Reschedule / Cancel (Upcoming only) */}
                  {isUpcoming && (
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.rescheduleButton}
                        activeOpacity={0.8}
                        onPress={() => handleReschedule(item)}
                      >
                        <Text style={styles.rescheduleButtonText}>
                          Reschedule
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        activeOpacity={0.8}
                        onPress={() =>
                          handleCancelAppointment(item.id, item.doctorName)
                        }
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Re-Book (History only) */}
                  {!isUpcoming && (
                    <View style={styles.rebookRow}>
                      <TouchableOpacity
                        style={styles.rebookButton}
                        activeOpacity={0.8}
                        onPress={() => handleBookAgain(item)}
                      >
                        <Text style={styles.rebookButtonText}>Re-Book</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Floating Action Button (Only visible on Upcoming tab when list is not empty) */}
        {appointments.length > 0 && activeTab === "upcoming" && (
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              {
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              }
            ]}
            onPress={goToNearbyProviders}
            disabled={false}
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
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
    fontFamily: FontFamilies.bold,
    marginLeft: 5,
  },

  tabWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
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
    color: Colors.label,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: FontFamilies.medium,
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
    fontFamily: FontFamilies.bold,
  },
  card: {
    backgroundColor: "#EAF3FF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.lightgray,
    marginRight: 12,
  },
  cardDoctorCol: {
    flex: 1,
  },
  cardDoctorName: {
    fontSize: 15,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  cardSpecialty: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamilies.semiBold,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
  },
  metaSubText: {
    fontSize: 12,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
    marginTop: 1,
  },
  cardInfoRow: {
    flexDirection: "row",
  },
  cardInfoCol: {
    flex: 1,
  },
  metaIndentedText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
    marginLeft: 23,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  rescheduleButtonText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FDECEC",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    color: "#DC2626",
    fontFamily: FontFamilies.semiBold,
  },
  rebookRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  rebookButton: {
    backgroundColor: Colors.pressed,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  rebookButtonText: {
    fontSize: 13,
    color: Colors.secondary,
    fontFamily: FontFamilies.semiBold,
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
    fontFamily: FontFamilies.semiBold,
  },
});
