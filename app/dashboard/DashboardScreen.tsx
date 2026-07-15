import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  useNavigation,
  DrawerActions,
  useFocusEffect,
} from "@react-navigation/native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  SPD_USER_NAME,
  SPD_SELECTED_PATIENT,
  USER_FULL_DATA,
} from "@/app/config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import { useDashboardSections } from "../hooks/useDashboardSections";
import CarouselBanner from "../components/BannerCarousel";



const getGreetingTime = () => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    return "Morning";
  } else if (currentHour < 18) {
    return "Afternoon";
  } else {
    return "Evening";
  }
};

// Strips HTML tags: "<div class="badge-success">BOOKED</div>" → "BOOKED"
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

// Converts "09:15:00" or "09:15 AM" → "09:15 AM"
const formatAmPm = (timeStr: string): string => {
  if (!timeStr) return "";
  if (/am|pm/i.test(timeStr)) return timeStr.trim();
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  if (isNaN(h)) return timeStr;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${m} ${suffix}`;
};

// Returns color/bg from badge class: badge-outline-success, badge-outline-danger, etc.
const getStatusStyle = (htmlStr: string) => {
  if (htmlStr.includes("success")) return { color: "#16a34a", bg: "#dcfce7" };
  if (htmlStr.includes("danger")) return { color: "#dc2626", bg: "#fee2e2" };
  if (htmlStr.includes("warning")) return { color: "#d97706", bg: "#fef3c7" };
  return { color: Colors.primary, bg: "#e0f2fe" };
};

type UpcomingAppointment = {
  id: string;
  doctorName: string;
  specialty: string;
  avatar: string;
  date: string;
  time: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
};

// Matches AppointmentScreen's Appointment shape exactly, so the lists
// fetched here can be passed straight through via navigation params
// without AppointmentScreen needing to re-fetch xcelsch_get_patient_...
type FullAppointment = {
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

export default function DashboardScreen() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const [userProfileName, setUserProfileName] = useState<string>("John");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientMeta, setPatientMeta] = useState<{
    age: number;
    gender: string;
  } | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  // Full-shape upcoming/history lists — kept so "See all" can pass them
  // straight to AppointmentScreen via navigation params, avoiding a
  // duplicate xcelsch_get_patient_future_appointments... fetch there.
  const [upcomingAppointmentsFull, setUpcomingAppointmentsFull] = useState<
    FullAppointment[]
  >([]);
  const [historyAppointmentsFull, setHistoryAppointmentsFull] = useState<
    FullAppointment[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const patStr = await AsyncStorage.getItem(SPD_SELECTED_PATIENT);
        if (patStr) {
          try {
            const p = JSON.parse(patStr);
            if (p.name) setUserProfileName(p.name);
            if (p.age || p.gender)
              setPatientMeta({ age: p.age ?? 0, gender: p.gender ?? "" });
          } catch (_) { }
        } else {
          const name = await AsyncStorage.getItem(SPD_USER_NAME);
          if (name) setUserProfileName(name);
        }
        const pid = await AsyncStorage.getItem("sg_patientId");
        setPatientId(pid);

        if (pid && pid !== "null") {
          try {
            const response = await callSuggestusAPI(
              spd_processId_config.xcelsch_get_patient_future_appointments_pntportal_hv_patient_dashboard,
              {
                p_patient_id: pid,
                p_visit_id: null,
                menu_name: "Wellness",
                menu_tab_type: "always_patient_specific",
                maximization_redirection_label: "Make appointment",
                p_max_offset: 100,
                p_process_type: "fetch_all_appointments",
                p_offset: 0,
              },
            );
            if (
              response?.returnCode === true &&
              response.returnData?.length > 0
            ) {
              // Same mapping AppointmentScreen uses, so the full lists are
              // directly usable there without remapping.
              const mapFull = (a: any): FullAppointment => ({
                id: String(a.p_appt_id ?? a.appt_id ?? ""),
                doctorName: a.resource_name ?? "",
                specialty: a.dpt_description ?? "",
                avatar: a.p_doc_image_url ?? "",
                date: a.appt_date_dashboard ?? "",
                time: a.appt_start_time ?? "",
                status: a.appstat_name ?? "Confirmed",
                statusHtml: a.appstat_html_name ?? "",
                type: a.appsubtyp_name ?? "In-Clinic",
                apptypName: stripHtml(a.apptyp_name ?? ""),
                patientDet: a.patient_det ?? "",
                resourceId: String(a.appt_resource_id ?? a.resource_id ?? ""),
                appSubtypeId: String(a.appsubtyp_id ?? ""),
              });

              const upcomingFull: FullAppointment[] = [];
              const historyFull: FullAppointment[] = [];
              response.returnData.forEach((a: any) => {
                const histType = (
                  a.appointment_history_type ?? ""
                ).toLowerCase();
                if (histType.includes("hist")) {
                  historyFull.push(mapFull(a));
                } else {
                  upcomingFull.push(mapFull(a));
                }
              });
              setUpcomingAppointmentsFull(upcomingFull);
              setHistoryAppointmentsFull(historyFull);

              // Simplified subset used by this screen's own dashboard card.
              const upcoming: UpcomingAppointment[] = upcomingFull.map(
                (a) => {
                  const statusStyle = getStatusStyle(a.statusHtml);
                  return {
                    id: a.id,
                    doctorName: a.doctorName,
                    specialty: a.specialty,
                    avatar: a.avatar,
                    date: a.date,
                    time: formatAmPm(a.time),
                    statusLabel: stripHtml(a.statusHtml) || a.status,
                    statusColor: statusStyle.color,
                    statusBg: statusStyle.bg,
                  };
                },
              );
              setUpcomingAppointments(upcoming);
            } else {
              setUpcomingAppointments([]);
              setUpcomingAppointmentsFull([]);
              setHistoryAppointmentsFull([]);
            }
          } catch (_) {
            setUpcomingAppointments([]);
            setUpcomingAppointmentsFull([]);
            setHistoryAppointmentsFull([]);
          }
        } else {
          setUpcomingAppointments([]);
          setUpcomingAppointmentsFull([]);
          setHistoryAppointmentsFull([]);
        }
      };
      load();
    }, []),
  );

  const handleSeeAllProviders = () => {
    // Pass the already-fetched list along so NearbyProvidersScreen doesn't
    // have to re-hit hospapp_get_resources — it reuses this data directly.
    navigation.navigate("NearbyProviders", { preloadedProviders: Providers });
  };
  const handleSeeAllSpecialties = () => { };

  // Fallback shown only if the backend fetch below fails or returns nothing.
  // Matches NearbyProvidersScreen's Provider shape so this same list can be
  // passed straight through via navigation params without remapping.
  const FALLBACK_PROVIDERS = [
    {
      id: "fallback-1",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Dr. Wael Berro",
      specialty: "Family Medicine Consul..",
      qualification: "",
      hospital: "",
      distance: "",
      rating: "",
      reviews: "",
      nextAvailable: "",
    },
    {
      id: "fallback-2",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      name: "Dr. Sheena Cherry",
      specialty: "Specialist Internal Med..",
      qualification: "",
      hospital: "",
      distance: "",
      rating: "",
      reviews: "",
      nextAvailable: "",
    },
    {
      id: "fallback-3",
      avatar: "https://randomuser.me/api/portraits/men/46.jpg",
      name: "Dr. Yanal Salam",
      specialty: "Consultant Internal Med..",
      qualification: "",
      hospital: "",
      distance: "",
      rating: "",
      reviews: "",
      nextAvailable: "",
    },
  ];

  const [Providers, setProviders] = useState(FALLBACK_PROVIDERS);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Same hospapp_get_resources call used by NearbyProvidersScreen — fetches
  // here too so the Home dashboard's "Providers" carousel shows real data,
  // and the full result is passed to NearbyProvidersScreen on "See all" so
  // it doesn't need to re-fetch (see handleSeeAllProviders above).
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const patientId = await fetchDataFromLocalStorage("sg_patientId");
        const now = new Date();
        const response = await callSuggestusAPI(
          spd_processId_config.hospapp_get_resources,
          {
            p_patient_id: patientId ?? "",
            p_resource_code: "",
            p_month: now.getMonth() + 1,
            p_year: now.getFullYear(),
            p_process_type: "",
            p_visit_id: null,
            p_category_code: "CAT005",
          },
        );
        if (response?.returnCode === true && response.returnData?.length > 0) {
          const fetched = response.returnData.map((r: any) => ({
            id: String(r.resource_id ?? r.id ?? Math.random()),
            name: r.resource_name ?? r.name ?? "",
            specialty: r.dpt_description ?? r.dept_name ?? "",
            qualification:
              r.doctor_education ?? r.doctor_short_description ?? "",
            hospital: r.org_name ?? "",
            distance: r.distance ?? "",
            rating: String(r.rating ?? ""),
            reviews: String(r.reviews ?? ""),
            avatar: r.resource_image_url ?? "",
            nextAvailable: r.next_available ?? r.next_slot ?? "",
          }));
          setProviders(fetched);
        }
      } catch (e) {
        console.error("Error fetching providers:", e);
        // Keep the fallback list on error
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  const specialties = [
    {
      label: "Neurology",
      Icon: MaterialCommunityIcons,
      iconName: "brain",
      iconSize: 28,
      iconColor: "#6B7280",
      bgColor: "#F3F4F6",
    },
    {
      label: "ENT",
      Icon: FontAwesome5,
      iconName: "diagnoses",
      iconSize: 26,
      iconColor: "#E87722",
      bgColor: "#FDF1EB",
    },
    {
      label: "Gen. Medicine",
      Icon: FontAwesome5,
      iconName: "briefcase-medical",
      iconSize: 22,
      iconColor: "#2ECC71",
      bgColor: "#EAF6F0",
    },
    {
      label: "Pediatrics",
      Icon: MaterialCommunityIcons,
      iconName: "baby-face-outline",
      iconSize: 28,
      iconColor: "#F1C40F",
      bgColor: "#FEF9E7",
    },
  ];

  const healthSummary = [
    {
      title: "Blood pressure",
      value: "--",
      color: "#E74C3C",
      bgColor: "#FDEDEC",
    },
    { title: "Heart rate", value: "--", color: "#3498DB", bgColor: "#EBF5FB" },
    { title: "BMI", value: "--", color: "#E91E63", bgColor: "#FCE4EC" },
    { title: "Medications", value: "--", color: "#2ECC71", bgColor: "#EAF6F0" },
    { title: "Allergies", value: "--", color: "#9B59B6", bgColor: "#F5EEF8" },
    { title: "Last visit", value: "--", color: "#F39C12", bgColor: "#FEF5E7" },
  ];

  const quickActions = [
    {
      label: "Appointments",
      icon: "calendar-outline",
      IconFamily: Ionicons,
      color: "#3498DB",
      bgColor: "#EBF5FB",
      onPress: async () => {
        const pid = await AsyncStorage.getItem("sg_patientId");
        if (pid && pid !== "null") {
          navigation.navigate("Appointment", {
            preloadedUpcoming: upcomingAppointmentsFull,
            preloadedHistory: historyAppointmentsFull,
            preloadedProviders: Providers,
          });
        } else {
          try {
            const userId = (await fetchDataFromLocalStorage("sg_userId")) ?? "";
            let _mobile = "";
            try {
              const _d = await fetchDataFromLocalStorage(USER_FULL_DATA);
              if (_d) {
                const _j = JSON.parse(_d);
                _mobile = _j.usr_phone ?? _j.usr_mobile ?? _j.p_mobile_no ?? "";
              }
            } catch (_) { }
            const response = await callSuggestusAPI(
              spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
              {
                p_user_id: userId,
                // p_ptm_mobile_number: _mobile,
                p_search_text: "",
                p_search_additional_attributes: "",
                p_process_flag: "user_patients",
              },
            );

            if (
              response?.returnCode === true &&
              response.returnData?.length > 0
            ) {
              // router.push({
              //   pathname: "/patient/registered_patients",
              //   params: { hideSkip: "true" },
              // });
              router.push({
                pathname: "/patient/registered_patients",
                params: { fromDrawer: "true" },
              });
              return;
            }
          } catch (error) {
            console.error("Error checking patients in Dashboard:", error);
          }

          let phone = "";
          try {
            const fullDataStr = await AsyncStorage.getItem("sg_user_full_data");
            if (fullDataStr) {
              const parsed = JSON.parse(fullDataStr);
              phone = parsed.contact || "";
            }
          } catch (e) { }

          // router.push({
          //   pathname: "/patient/registered_patients",
          //   params: { hideSkip: "true" },
          // });
          // router.push({
          //   pathname: "/patient/register_new_patient",
          //   params: { phone_number: phone },
          // });
          router.push({
            pathname: "/patient/registered_patients",
            params: { fromDrawer: "true" },
          });
        }
      },
    },
    {
      label: "Health pkgs",
      icon: "medkit-outline",
      IconFamily: Ionicons,
      color: "#F39C12",
      bgColor: "#FEF5E7",
      onPress: () => navigation.navigate("HealthPackages"),
    },
    {
      label: "Orders",
      icon: "receipt-outline",
      IconFamily: Ionicons,
      color: "#2ECC71",
      bgColor: "#EAF6F0",
      onPress: () => { },
    },
    {
      label: "Rx refill",
      icon: "pill",
      IconFamily: MaterialCommunityIcons,
      color: "#9B59B6",
      bgColor: "#F5EEF8",
      onPress: () => { },
    },
  ];

  const noPatient = !patientId || patientId === "null";

  // Fetch dynamic sections from backend (with automatic fallback to defaults)
  const { visibleSections, sections } = useDashboardSections(noPatient);

  // Debug log to verify sections are being loaded

  // useEffect(() => {
  //   console.log(
  //     "[DashboardScreen] visibleSections:",
  //     visibleSections,
  //     "sections:",
  //     sections,
  //   );
  // }, [visibleSections, sections]);

  // Renders each "body" section (everything below the greeting hero) by key.
  // Called in the order of `visibleSections`, so the backend's
  // menu_display_order drives the actual render order on screen.
  const renderBodySection = (key: string) => {
    switch (key) {
      case "promoBanner": {
        const promoBannerUrls =
          sections.find((s) => s.key === "promoBanner")?.bannerUrls ?? [];


        return (
          <View key={key} style={{ marginBottom: 14 }}>
            <CarouselBanner urls={promoBannerUrls} itemWidth={width - 40} />
          </View>
        );
      }

      case "quickActions":
        return (
          <View key={key} style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => {
              const Icon = action.IconFamily;
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.quickActionItem,
                    {
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                  onPress={action.onPress}
                >
                  <View
                    style={[
                      styles.quickActionIconBg,
                      { backgroundColor: action.bgColor },
                    ]}
                  >
                    <Icon
                      name={action.icon as any}
                      size={24}
                      color={action.color}
                    />
                  </View>
                  <Text style={styles.quickActionText}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        );

      case "upcomingAppointments": {
        if (noPatient || upcomingAppointments.length === 0) return null;
        // Pass the already-fetched lists so AppointmentScreen doesn't
        // re-hit xcelsch_get_patient_future_appointments_pntportal_hv_patient_dashboard.
        const goToAppointments = () =>
          navigation.navigate("Appointment", {
            preloadedUpcoming: upcomingAppointmentsFull,
            preloadedHistory: historyAppointmentsFull,
            preloadedProviders: Providers,
          });
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Upcoming appointments</Text>
              <Pressable
                onPress={goToAppointments}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            {upcomingAppointments.map((appt) => (
              <Pressable
                key={appt.id}
                style={({ pressed }) => [
                  styles.appointmentCard,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={goToAppointments}
              >
                <Image
                  source={{ uri: appt.avatar }}
                  style={styles.appointmentAvatar}
                />
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentDoctorName} numberOfLines={1}>
                    {appt.doctorName}
                  </Text>
                  <Text style={styles.appointmentSpecialty} numberOfLines={1}>
                    {appt.specialty}
                  </Text>
                  <View style={styles.appointmentMetaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={Colors.label}
                    />
                    <Text style={styles.appointmentMetaText}>
                      {appt.date} • {appt.time}
                    </Text>
                  </View>
                </View>
                {/* {!!appt.statusLabel && (
                  <View
                    style={[
                      styles.appointmentStatusBadge,
                      { backgroundColor: appt.statusBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.appointmentStatusText,
                        { color: appt.statusColor },
                      ]}
                    >
                      {appt.statusLabel}
                    </Text>
                  </View>
                )} */}
              </Pressable>
            ))}
          </View>
        );
      }

      case "healthAwareness":
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons
                  name="play"
                  size={13}
                  color={Colors.secondary}
                  style={styles.sectionHeaderIcon}
                />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Health awareness
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.videoCard,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                }}
                style={styles.videoThumbnail}
              />
              <View style={styles.playButtonOverlay}>
                <Ionicons name="play" size={40} color={Colors.background} />
              </View>
            </Pressable>
          </View>
        );

      case "healthSummary":
        if (noPatient) return null;
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={[styles.sectionHeaderTitleRow, { marginBottom: 16 }]}>
              <Ionicons
                name="heart"
                size={13}
                color={Colors.secondary}
                style={styles.sectionHeaderIcon}
              />
              <Text style={styles.sectionTitle}>My health summary</Text>
            </View>
            <View style={styles.healthSummaryGrid}>
              {healthSummary.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.healthSummaryItem,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <Text
                    style={[styles.healthSummaryTitle, { color: item.color }]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.healthSummaryValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case "providers":
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons
                  name="person"
                  size={13}
                  color={Colors.secondary}
                  style={styles.sectionHeaderIcon}
                />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Providers
                </Text>
              </View>
              <Pressable
                onPress={handleSeeAllProviders}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            {loadingProviders ? (
              <ActivityIndicator
                size="small"
                color={Colors.secondary}
                style={{ marginVertical: 16 }}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.providersScrollList}
              >
                {Providers.map((provider) => (
                  <Pressable
                    key={provider.id}
                    style={({ pressed }) => [
                      styles.providerCard,
                      {
                        backgroundColor: pressed
                          ? Colors.pressed
                          : Colors.background,
                        borderColor: pressed
                          ? Colors.activeBorder
                          : Colors.border,
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <View style={styles.providerAvatarBg}>
                      <Image
                        source={{ uri: provider.avatar }}
                        style={styles.providerAvatar}
                      />
                    </View>
                    <Text style={styles.providerName} numberOfLines={1}>
                      {provider.name}
                    </Text>
                    <Text style={styles.providerSpecialty} numberOfLines={2}>
                      {provider.specialty}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case "specialties":
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons
                  name="medkit"
                  size={13}
                  color={Colors.secondary}
                  style={styles.sectionHeaderIcon}
                />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Specialties
                </Text>
              </View>
              <Pressable
                onPress={handleSeeAllSpecialties}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtiesScrollList}
            >
              {specialties.map((item, index) => {
                const Icon = item.Icon;
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.specialtyItem,
                      {
                        opacity: pressed ? 0.7 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.specialtyIconCircle,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      <Icon
                        name={item.iconName as any}
                        size={item.iconSize}
                        color={item.iconColor}
                      />
                    </View>
                    <Text style={styles.specialtyLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Sticky Header Top Bar */}
      <View style={styles.stickyHeader}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                padding: 4,
              })}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              {/* <Ionicons
                name="menu-outline"
                size={32}
                color={Colors.background}
                /> */}
              <Image
                source={require("../../assets/images/hamburger_icon.png")}
                style={{ width: 24, height: 24, tintColor: Colors.background }}
                resizeMode="contain"
              />
            </Pressable>
            <View style={styles.headerIconsRight}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={Colors.background}
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={Colors.background}
                  />
                  <View style={styles.badgeDot} />
                </View>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stickyHeaderSpacer} />

        {/* Greeting Section */}
        {visibleSections.includes("greeting") && (
          <View style={styles.headerGreetingSection}>
            <View style={styles.bgCircleLarge} />
            <FontAwesome name="plus" size={35} style={styles.bgPlus} />


            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                {noPatient
                  ? `Welcome, ${userProfileName}!`
                  : `${getGreetingTime()}, ${userProfileName}!`}
              </Text>

              <Text style={styles.subGreetingText}>
                {noPatient
                  ? "Start exploring healthcare services\n& specialist - all in one place."
                  : "Welcome back. How can we support\nyour health today?"}
              </Text>
            </View>
          </View>
        )}

        {/* White Content Area — body sections render in backend sequence order */}
        <View style={[styles.bodyContent, { minHeight: height }]}>
          {visibleSections
            .filter((key) => key !== "greeting")
            .map((key) => renderBodySection(key))}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 50,
    paddingBottom: 12,
    zIndex: 10,
  },
  stickyHeaderSpacer: {
    height:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 72 : 110,
    backgroundColor: Colors.primary,
  },
  headerSafeArea: {
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIconsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 16,
  },
  badgeDot: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  headerGreetingSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    position: "relative",
    overflow: "hidden",
  },
  greetingContainer: {
    marginTop: 1,
    zIndex: 2,
  },
  greetingText: {
    fontSize: 22,
    fontFamily: FontFamilies.bold,
    color: Colors.background,
    marginBottom: 6,
  },
  subGreetingText: {
    fontSize: 16,
    fontFamily: FontFamilies.medium,
    color: "rgba(255, 255, 255, 0.8)",
  },
  patientMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  patientMetaBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  patientMetaText: {
    fontSize: 13,
    fontFamily: FontFamilies.semiBold,
    color: "rgba(255, 255, 255, 0.9)",
  },
  bgCircleLarge: {
    position: "absolute",
    right: -25,
    top: 30,
    width: 100,
    height: 100,
    borderRadius: 100,
    borderWidth: 17,
    borderColor: "rgba(255, 255, 255, 0.03)",
    zIndex: 1,
  },
  bgPlus: {
    position: "absolute",
    right: 12,
    top: 65,
    color: "rgba(255, 255, 255, 0.03)",
    zIndex: 1,
  },
  bodyContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -24,
  },


  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.secondary,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  quickActionItem: {
    flex: 1,
    alignItems: "center",
  },
  quickActionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
    color: Colors.text,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: FontFamilies.semiBold,
    color: Colors.secondary,
  },
  noAppointmentsCard: {
    backgroundColor: "#F3F8FE",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  noAppointmentsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E1EEFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  noApptBadgeDot: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  noAppointmentsTextContainer: {
    flex: 1,
  },
  noAppointmentsTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  noAppointmentsDesc: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    lineHeight: 18,
  },
  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F8FE",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  appointmentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctorName: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
  },
  appointmentSpecialty: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
    color: Colors.secondary,
    marginTop: 2,
  },
  appointmentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  appointmentMetaText: {
    fontSize: 11,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
  },
  appointmentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontFamily: FontFamilies.semiBold,
  },
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderIcon: {
    marginRight: 8,
    padding: 3,
    backgroundColor: Colors.lightgray,
    borderRadius: 3,
  },
  videoCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  healthSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: -4,
  },
  healthSummaryItem: {
    width: "31%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  healthSummaryTitle: {
    fontSize: 11,
    fontFamily: FontFamilies.semiBold,
    marginBottom: 8,
  },
  healthSummaryValue: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  providersScrollList: {
    paddingRight: 10,
  },
  providerCard: {
    width: 140,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  providerAvatarBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  providerName: {
    fontSize: 13,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  providerSpecialty: {
    fontSize: 11,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    textAlign: "center",
    lineHeight: 14,
  },
  specialtiesScrollList: {
    paddingRight: 10,
  },
  specialtyItem: {
    alignItems: "center",
    marginRight: 20,
    width: 76,
  },
  specialtyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  specialtyLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 40,
  },
});
