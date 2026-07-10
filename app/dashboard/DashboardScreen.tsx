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

const { width, height } = Dimensions.get("window");

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

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [userProfileName, setUserProfileName] = useState<string>("John");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientMeta, setPatientMeta] = useState<{
    age: number;
    gender: string;
  } | null>(null);
  const [hasUpcomingAppointments, setHasUpcomingAppointments] =
    useState(false);

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
          } catch (_) {}
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
              const hasUpcoming = response.returnData.some((a: any) => {
                const histType = (
                  a.appointment_history_type ?? ""
                ).toLowerCase();
                return !histType.includes("hist");
              });
              setHasUpcomingAppointments(hasUpcoming);
            } else {
              setHasUpcomingAppointments(false);
            }
          } catch (_) {
            setHasUpcomingAppointments(false);
          }
        } else {
          setHasUpcomingAppointments(false);
        }
      };
      load();
    }, []),
  );

  const handleSeeAllProviders = () => {};
  const handleSeeAllSpecialties = () => {};

  const Providers = [
    {
      uri: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Dr. Wael Berro",
      specialty: "Family Medicine Consul..",
    },
    {
      uri: "https://randomuser.me/api/portraits/women/68.jpg",
      name: "Dr. Sheena Cherry",
      specialty: "Specialist Internal Med..",
    },
    {
      uri: "https://randomuser.me/api/portraits/men/46.jpg",
      name: "Dr. Yanal Salam",
      specialty: "Consultant Internal Med..",
    },
  ];

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
      Icon: MaterialCommunityIcons,
      iconName: "nose",
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
          navigation.navigate("Appointment");
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
            } catch (_) {}
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
          } catch (e) {}

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
      onPress: () => {},
    },
    {
      label: "Rx refill",
      icon: "pill",
      IconFamily: MaterialCommunityIcons,
      color: "#9B59B6",
      bgColor: "#F5EEF8",
      onPress: () => {},
    },
  ];

  const noPatient = !patientId || patientId === "null";

  // Fetch dynamic sections from backend (with automatic fallback to defaults)
  const { visibleSections, sections } = useDashboardSections(noPatient);

  // Debug log to verify sections are being loaded
  useEffect(() => {
    console.log(
      "[DashboardScreen] visibleSections:",
      visibleSections,
      "sections:",
      sections
    );
  }, [visibleSections, sections]);

  // Renders each "body" section (everything below the greeting hero) by key.
  // Called in the order of `visibleSections`, so the backend's
  // menu_display_order drives the actual render order on screen.
  const renderBodySection = (key: string) => {
    switch (key) {
      case "promoBanner":
        return (
          <React.Fragment key={key}>
            <View style={styles.promoBanner}>
              <View style={styles.promoContent}>
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>SAVE 20%</Text>
                </View>
                <Text style={styles.promoTitle}>
                  20% off on Health Checkups
                </Text>
                <Text style={styles.promoSub}>
                  Book before July 20th • All branches
                </Text>
              </View>
              <FontAwesome5
                name="hospital"
                size={80}
                color="rgba(255,255,255,0.15)"
                style={styles.promoIcon}
              />
            </View>

            {/* Pagination dots */}
            <View style={styles.paginationDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </React.Fragment>
        );

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

      case "upcomingAppointments":
        if (noPatient || !hasUpcomingAppointments) return null;
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Upcoming appointments</Text>
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

            <View style={styles.noAppointmentsCard}>
              <View style={styles.noAppointmentsIconContainer}>
                <Ionicons name="calendar" size={24} color={Colors.secondary} />
                <View style={styles.noApptBadgeDot} />
              </View>
              <View style={styles.noAppointmentsTextContainer}>
                <Text style={styles.noAppointmentsTitle}>
                  No Appointments Yet
                </Text>
                <Text style={styles.noAppointmentsDesc}>
                  Book an appointment to get started. Your upcoming visits
                  will appear here.
                </Text>
              </View>
            </View>
          </View>
        );

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
            <View style={styles.sectionHeaderTitleRow}>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providersScrollList}
            >
              {Providers.map((provider, index) => (
                <Pressable
                  key={index}
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
                      source={{ uri: provider.uri }}
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
          </View>
        );

      case "specialties":
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons
                  name="medkit"
                  size={20}
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
              <Ionicons
                name="menu-outline"
                size={32}
                color={Colors.background}
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
          <View style={styles.bgPlusHorizontal} />
          <View style={styles.bgPlusVertical} />

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
        <View style={styles.bodyContent}>
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
    right: -40,
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 30,
    borderColor: "rgba(255, 255, 255, 0.03)",
    zIndex: 1,
  },
  bgPlusVertical: {
    position: "absolute",
    right: 50,
    top: 60,
    width: 20,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    zIndex: 1,
  },
  bgPlusHorizontal: {
    position: "absolute",
    right: 30,
    top: 80,
    width: 60,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    zIndex: 1,
  },
  bodyContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -24,
    minHeight: height,
  },
  promoBanner: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  promoContent: {
    flex: 1,
    zIndex: 2,
  },
  promoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  promoBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontFamily: FontFamilies.bold,
  },
  promoTitle: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    marginBottom: 6,
  },
  promoSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
  promoIcon: {
    position: "absolute",
    right: -10,
    bottom: -15,
    zIndex: 1,
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
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
