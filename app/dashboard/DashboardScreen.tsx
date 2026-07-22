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
  Modal,
  FlatList,
  TouchableOpacity,
  DeviceEventEmitter,
} from "react-native";
import {
  useNavigation,
  DrawerActions,
  useFocusEffect,
} from "@react-navigation/native";
import { SvgIonicons } from "../components/icons/SvgIcons";
import {
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  SPD_USER_NAME,
  SPD_SELECTED_PATIENT,
  USER_FULL_DATA,
  SPD_AI_CODE,
} from "@/app/config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import {
  callSuggestusAPI,
  setPatientId as setStoredPatientId,
} from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { getMenuWidgetsByType } from "../services/dashboardApi";
import { getSpecialtyIconMeta } from "../config/specialtyIcons";
import { getMenuIcon } from "../utils/menuIcon";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { Skeleton } from "../components/Skeleton";
import {
  fetchDataFromLocalStorage,
  getDecryptedID,
  saveDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import { useDashboardSections } from "../hooks/useDashboardSections";
import { useSectionInstanceData } from "../hooks/useSectionInstanceData";
import { SectionConfig } from "../config/sectionConfig";
import CarouselBanner from "../components/BannerCarousel";
import { fetchAndApplyOrgConfig } from "../services/orgConfig";
import { SiteConfig } from "../config/site_config";
import dayjs from "dayjs";
import { getStoredAiCode } from "../services/aiCode";
import { getUserEntityReferenceCode } from "../services/entityReferenceCode";
import YoutubePlayer from "react-native-youtube-iframe";
import { Video, ResizeMode } from "expo-av";
import { WebView } from "react-native-webview";

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

// Extracts the 11-char video id from any common YouTube URL shape
// (youtu.be/<id>, watch?v=<id>, embed/<id>, ...) — used to build a thumbnail
// URL and to drive the in-app player, since the backend only sends the
// video's page URL (content_reference_details), not a direct image/id.
const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
  );
  return match && match[2].length === 11 ? match[2] : null;
};

const extractVimeoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(
    /vimeo\.com\/(?:video\/|channels\/\w+\/|groups\/[^/]+\/videos\/)?(\d+)/i,
  );
  return match ? match[1] : null;
};

const isDirectVideoFile = (url: string): boolean =>
  /\.(mp4|m3u8|mov|webm|ogg|ogv|avi|mkv|3gp)(\?.*)?$/i.test(url);

// Classifies any backend-supplied video URL so the modal below can pick the
// right playback strategy — YouTube/Vimeo need their embed players, direct
// file links (mp4/m3u8/...) play natively via expo-av, and anything else
// falls back to loading the URL itself in a WebView/iframe (best-effort,
// since not every site allows being embedded).
type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; url: string }
  | { kind: "embed"; url: string };

const classifyVideoUrl = (url: string): VideoSource | null => {
  if (!url) return null;
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) return { kind: "youtube", id: youtubeId };
  const vimeoId = extractVimeoId(url);
  if (vimeoId) return { kind: "vimeo", id: vimeoId };
  if (isDirectVideoFile(url)) return { kind: "file", url };
  return { kind: "embed", url };
};

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

// Helper to parse date string for the upcoming appointment badge
const parseDateForBadge = (dateStr: string) => {
  if (!dateStr) return { day: "", month: "" };
  // Expected formats: "Friday, Jul 03 2026" or "02 Mar 2026"
  const clean = dateStr.replace(/^\w+,\s*/, "").trim();
  const parts = clean.split(" ");
  if (parts.length >= 2) {
    if (isNaN(Number(parts[0]))) {
      return { month: parts[0], day: parts[1] };
    } else {
      return { day: parts[0], month: parts[1] };
    }
  }
  return { day: "", month: dateStr };
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
  const [userProfileName, setUserProfileName] = useState<string>("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientMeta, setPatientMeta] = useState<{
    age: number;
    gender: string;
  } | null>(null);
  // Bumped on every screen focus so the "recent" upcoming-appointment card
  // (fetched via useSectionInstanceData below) refetches on refocus, matching
  // the previous useFocusEffect-driven behavior.
  const [focusTick, setFocusTick] = useState(0);
  // Full-shape upcoming/history lists — kept so "See all" can pass them
  // straight to AppointmentScreen via navigation params, avoiding a
  // duplicate xcelsch_get_patient_future_appointments... fetch there.
  const [upcomingAppointmentsFull, setUpcomingAppointmentsFull] = useState<
    FullAppointment[]
  >([]);
  const [historyAppointmentsFull, setHistoryAppointmentsFull] = useState<
    FullAppointment[]
  >([]);

  const [orgLocationName, setOrgLocationName] = useState<string>("");
  type LocationOption = {
    id: string;
    name: string;
    area: string;
    orgAiCode: string;
    isDefault: boolean;
  };
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocationCode, setSelectedLocationCode] = useState<string>("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [switchingLocation, setSwitchingLocation] = useState(false);
  // Bumped after a successful org switch so every org-scoped
  // useSectionInstanceData call below (providers/specialties/healthSummary/
  // upcomingAppointments) is forced to refetch — their own effect deps
  // (instanceId, patient id, focus tick) don't change on an org switch alone.
  const [orgRefreshTick, setOrgRefreshTick] = useState(0);

  // In-app player for the Health Awareness widget's video cards — holds the
  // raw backend video URL; classifyVideoUrl() picks the playback strategy.
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Splits a description like "Emirates Hospital - Jumeirah" into a name
  // + area subtitle for the two-line row in the "Switch location" sheet.
  // Falls back to showing the whole string as the name when there's no
  // separator (e.g. a location description with no branch suffix).
  const splitLocationName = (description: string) => {
    const parts = description.split(" - ");
    return parts.length > 1
      ? { name: parts[0].trim(), area: parts.slice(1).join(" - ").trim() }
      : { name: description.trim(), area: "" };
  };

  // Same location list used by the signup flow's location picker
  // (init_screens/personal_details.tsx) — loaded here so the dashboard
  // header can show/switch the patient's currently active hospital branch.
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const [persistedAiCode, persistedOrgName, defaultJsonStr] =
          await Promise.all([
            getDecryptedID(SPD_AI_CODE),
            getDecryptedID("sg_org_name"),
            getDecryptedID("DEFAULT_JSON_DATA"),
          ]);

        if (persistedAiCode) setSelectedLocationCode(persistedAiCode);
        if (persistedOrgName) setOrgLocationName(persistedOrgName);

        let orgCodes = SiteConfig.AI_CODE;
        try {
          const defaultJson = defaultJsonStr ? JSON.parse(defaultJsonStr) : {};
          orgCodes = defaultJson?.spd_app_location_list ?? SiteConfig.AI_CODE;
        } catch (_) { }

        const response = await callSuggestusAPI(
          spd_processId_config.sgconf_get_mst_organization_location_patient_portal_list,
          {
            p_org_ai_code: "",
            p_org_codes: orgCodes,
          },
        );
        if (response?.returnCode === true && response.returnData?.length > 0) {
          const fetched: LocationOption[] = response.returnData.map(
            (r: any) => {
              const { name, area } = splitLocationName(
                r.description ?? r.name ?? "",
              );
              return {
                id: String(r.id ?? ""),
                name,
                area,
                orgAiCode: r.org_ai_code ?? "",
                isDefault: r.usr_org_default === "Y",
              };
            },
          );
          setLocations(fetched);

          const currentOrCode = persistedAiCode || SiteConfig.AI_CODE;
          const activeLocation =
            fetched.find((loc) => loc.orgAiCode === currentOrCode) ??
            fetched.find((loc) => loc.isDefault) ??
            fetched[0];
          if (activeLocation) {
            setSelectedLocationCode(activeLocation.orgAiCode);
            setOrgLocationName(activeLocation.name);
          }
        }
      } catch (e) {
        console.error("Error fetching locations:", e);
      }
    };
    loadLocations();
  }, []);

  // The same user_id can map to a different patient_id per org — the backend
  // already resolves this correctly (xcelpat_get_trn_patient_details_ehg_pntapp
  // scopes "user_patients" by the org context auto-injected into userdata), but
  // sg_patientId is a flat client-side cache of that lookup's result, so it
  // keeps pointing at the previous org's patient until explicitly re-resolved.
  // Mirrors the same lookup/field-mapping patient_selection.tsx's handleSkip
  // already performs at login, just re-run here on every org switch.
  const resolvePatientForActiveOrg = async () => {
    try {
      const userId = (await fetchDataFromLocalStorage("sg_userId")) ?? "";
      const response = await callSuggestusAPI(
        spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
        {
          p_user_id: userId,
          p_search_text: "",
          p_search_additional_attributes: "",
          p_process_flag: "user_patients",
        },
      );

      const firstPatient =
        response?.returnCode === true ? response.returnData?.[0] : null;
      const newPatientId = firstPatient
        ? String(firstPatient.p_patient_id ?? firstPatient.patient_id ?? "")
        : "";

      if (newPatientId) {
        // Patient already exists for this org — just update local cache.
        const name =
          firstPatient.p_patient_name ??
          firstPatient.ptm_name ??
          [
            firstPatient.p_patient_first_name,
            firstPatient.p_patient_middle_name,
            firstPatient.p_patient_last_name,
          ]
            .filter(Boolean)
            .join(" ") ??
          "Unknown";
        const age =
          parseInt(
            String(firstPatient.ptm_age ?? firstPatient.p_age ?? "0"),
            10,
          ) || 0;
        const gender =
          firstPatient.ptm_gender ??
          (firstPatient.p_gender === "2" ? "Female" : "Male");

        await setStoredPatientId(newPatientId);
        await AsyncStorage.setItem(
          SPD_SELECTED_PATIENT,
          JSON.stringify({ name, age, gender }),
        );
        setPatientId(newPatientId);
        return;
      }

      // ── No patient for this org yet — auto-register silently ──────────────
      // Mirrors registered_patients.tsx handleRegisterAsPatient.
      try {
        const fullDataStr = await getDecryptedID(USER_FULL_DATA);
        if (!fullDataStr) {
          await AsyncStorage.removeItem("sg_patientId");
          setPatientId(null);
          return;
        }

        const parsed = JSON.parse(fullDataStr);
        const parseAttrs = (raw: any): Record<string, string> => {
          if (!raw) return {};
          try {
            return typeof raw === "string" ? JSON.parse(raw) : raw;
          } catch (_) {
            return {};
          }
        };
        const attrs = parseAttrs(parsed.additional_attributes);
        const ptName: string = parsed.usr_name ?? "";
        const ptDob = attrs.user_dob ?? parsed.usr_dob ?? "";
        const ptAge = ptDob ? dayjs().diff(ptDob, "year") : 0;
        const ptGender: string =
          attrs.user_gender ?? parsed.usr_gender ?? "Male";
        const ptParts = ptName.trim().split(" ");
        const ptFirst = ptParts[0] ?? "";
        const ptLast = ptParts.slice(1).join(" ");
        const ptGenderCode = ptGender === "Female" ? "2" : "1";
        const ptFormattedDob = ptDob ? dayjs(ptDob).format("YYYY-MM-DD") : "";
        const emiratesIdToCheck = attrs.p_emirates_id ?? "";
        const passportToCheck = attrs.p_identification_num ?? "";

        // Step 1: Duplicate check by Emirates ID / Passport
        let existingPid = "";
        if (emiratesIdToCheck || passportToCheck) {
          const checkRes = await callSuggestusAPI(
            spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
            {
              p_user_id: userId,
              p_additional_attribute: {
                p_emirates_id: emiratesIdToCheck,
                p_passport_no: passportToCheck,
              },
            },
          );
          if (
            checkRes?.returnCode === true &&
            checkRes.returnData?.length > 0
          ) {
            existingPid = String(checkRes.returnData[0]?.p_patient_id ?? "");
          }
        }

        let finalPid = existingPid;

        if (!existingPid) {
          // Step 2: Create patient record
          const saveRes = await callSuggestusAPI(
            spd_processId_config.xcelpat_save_trn_patient_master,
            {
              p_patient_id: null,
              p_patient_title: ptGenderCode,
              p_name: ptFirst,
              p_middle_name: "",
              p_last_name: ptLast,
              p_gender: ptGenderCode,
              p_dob: ptFormattedDob,
              p_age: String(ptAge),
              p_marital_status: "",
              p_mobile_no: "",
              "p_mobile_no~CTN": "",
              p_email: "",
              ptd_home_phone: "",
              "ptd_home_phone~CTN": "",
              p_additional_attribute: {
                p_father_name: "",
                p_emirates_id: "",
                p_identification_type: "",
                p_identification_num: "",
              },
              p_additional_attributes: {},
            },
          );
          finalPid = String(saveRes?.returnData?.[0]?.p_patient_id ?? "");
        }

        if (finalPid) {
          await setStoredPatientId(finalPid);
          await AsyncStorage.setItem(
            SPD_SELECTED_PATIENT,
            JSON.stringify({ name: ptName, age: ptAge, gender: ptGender }),
          );

          // Step 3: Update USER_FULL_DATA
          try {
            const stored = JSON.parse(
              (await getDecryptedID(USER_FULL_DATA)) ?? "{}",
            );
            stored.usr_patient_id = finalPid;
            await saveDataFromLocalStorage(
              USER_FULL_DATA,
              JSON.stringify(stored),
            );
          } catch (_) { }

          if (!existingPid) {
            // Step 4: Link patient → user
            await callSuggestusAPI(
              spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
              {
                p_patient_id: finalPid,
                p_user_id: userId,
                p_additional_attribites: {},
              },
            );

            // Step 5: Entity mapping
            await callSuggestusAPI(
              spd_processId_config.xcelpat_save_mst_user_entity_mapping_common,
              {
                p_patient_id: finalPid,
                p_user_id: userId,
                p_entity_code: await getStoredAiCode(),
                p_entity_reference_id: finalPid,
                p_entity_reference_code: await getUserEntityReferenceCode(),
                p_active_status: "Y",
                p_process_flag: "Y",
                p_additional_attribites: {},
                p_internal_flag: "N",
              },
            );
          }

          // Step 6: Org mapping for the newly active org
          const defaultJsonStr = await getDecryptedID(
            "DEFAULT_JSON_DATA",
          ).catch(() => null);
          const orgCodes = defaultJsonStr
            ? (JSON.parse(defaultJsonStr)?.spd_app_location_list ??
              SiteConfig.AI_CODE)
            : SiteConfig.AI_CODE;
          await callSuggestusAPI(
            spd_processId_config.hosapp_save_update_trn_patient_master_org_mapping_pnt_app,
            {
              p_patient_id: finalPid,
              p_org_codes: orgCodes,
              p_process_flag: "map_multiple_user",
            },
          );

          setPatientId(finalPid);
        } else {
          // Could not create patient — clear stale id
          await AsyncStorage.removeItem("sg_patientId");
          setPatientId(null);
        }
      } catch (autoRegErr) {
        console.error(
          "[Dashboard] auto patient registration on org switch failed:",
          autoRegErr,
        );
        await AsyncStorage.removeItem("sg_patientId");
        setPatientId(null);
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (e) {
      console.error("Error resolving patient for active org:", e);
    }
  };

  const handleSelectLocation = async (location: LocationOption) => {
    if (location.orgAiCode === selectedLocationCode) {
      setShowLocationPicker(false);
      return;
    }
    setSwitchingLocation(true);
    try {
      await fetchAndApplyOrgConfig(location.orgAiCode);
      setSelectedLocationCode(location.orgAiCode);
      setOrgLocationName(location.name);
      // Resolve this org's patient_id for the shared user_id BEFORE refetching
      // widgets, so their fresh fetches read the correct sg_patientId/state.
      await resolvePatientForActiveOrg();
      // Re-pull section config (promo banner, quick actions, etc.) for the
      // new org, and force every per-instance widget fetch to re-run too.
      await refetch();
      setOrgRefreshTick((t) => t + 1);
    } catch (e) {
      console.error("Error switching location:", e);
    } finally {
      setSwitchingLocation(false);
      setShowLocationPicker(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      let resolvedName = "";
      const patStr = await AsyncStorage.getItem(SPD_SELECTED_PATIENT);
      if (patStr) {
        try {
          const p = JSON.parse(patStr);
          if (p.name) resolvedName = p.name;
          if (p.age || p.gender)
            setPatientMeta({ age: p.age ?? 0, gender: p.gender ?? "" });
        } catch (_) { }
      }

      if (!resolvedName) {
        resolvedName = (await AsyncStorage.getItem(SPD_USER_NAME)) || "";
      }
      setUserProfileName(resolvedName);
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
              const histType = (a.appointment_history_type ?? "").toLowerCase();
              if (histType.includes("hist")) {
                historyFull.push(mapFull(a));
              } else {
                upcomingFull.push(mapFull(a));
              }
            });
            setUpcomingAppointmentsFull(upcomingFull);
            setHistoryAppointmentsFull(historyFull);
          } else {
            setUpcomingAppointmentsFull([]);
            setHistoryAppointmentsFull([]);
          }
        } catch (_) {
          setUpcomingAppointmentsFull([]);
          setHistoryAppointmentsFull([]);
        }
      } else {
        setUpcomingAppointmentsFull([]);
        setHistoryAppointmentsFull([]);
      }

      // Bumping this on every focus re-triggers the "recent" upcoming
      // appointment card fetch below (useSectionInstanceData)
      setFocusTick((t) => t + 1);
    };
    load();

    const sub = DeviceEventEmitter.addListener("appointmentBooked", () => {
      load();
    });

    return () => {
      sub.remove();
    };
  }, [orgRefreshTick]);

  // Takes the specific instance's own list and its backend-supplied
  // processId/defaultParams — with more than one "providers" widget on
  // screen (each with its own process_id/default_params), "See all" must
  // refetch using that same card's API/params, not always the first
  // instance's or the screen's hardcoded default.
  const handleSeeAllProviders = (
    providersList: any[],
    processId?: string,
    defaultParams?: Record<string, any>,
  ) => {
    // Preloaded list still seeds initial state so NearbyProvidersScreen
    // isn't empty while it refetches with this widget's own params.
    navigation.navigate("NearbyProviders", {
      preloadedProviders: providersList,
      widgetProcessId: processId,
      widgetDefaultParams: defaultParams,
    });
  };
  // Takes the specific instance's own list/processId/defaultParams, same as
  // handleSeeAllProviders — AllSpecialtiesScreen refetches with this
  // widget's own API/params instead of its hardcoded default.
  const handleSeeAllSpecialties = (
    specialtiesList: any[],
    processId?: string,
    defaultParams?: Record<string, any>,
  ) => {
    navigation.navigate("AllSpecialties", {
      preloadedSpecialties: specialtiesList,
      widgetProcessId: processId,
      widgetDefaultParams: defaultParams,
    });
  };

  // Providers/specialties/health-summary data is fetched further down (see the
  // useSectionInstanceData calls after useDashboardSections), driven per
  // widget-instance by the backend's process_id / default_params_json. A
  // widget instance whose call fails or returns no data simply doesn't render
  // — see the `!isLoading && data.length === 0 -> return null` checks below.

  // Template for the 3 health-summary tiles (title/color/bgColor) — the
  // fetched vitals fill in `value` per tile; a tile stays "--" when that
  // specific vital wasn't captured at the last visit.
  const FALLBACK_HEALTH_SUMMARY = [
    {
      title: "Blood pressure",
      value: "--",
      color: "#E74C3C",
      bgColor: "#FDEDEC",
    },
    { title: "Heart rate", value: "--", color: "#3498DB", bgColor: "#EBF5FB" },
    { title: "BMI", value: "--", color: "#E91E63", bgColor: "#FCE4EC" },
    // { title: "Medications", value: "--", color: "#2ECC71", bgColor: "#EAF6F0" },
    // { title: "Allergies", value: "--", color: "#9B59B6", bgColor: "#F5EEF8" },
    // { title: "Last visit", value: "--", color: "#F39C12", bgColor: "#FEF5E7" },
  ];

  // Backend-controlled: code, label, order — used as-is until the
  // "quickActions" p_menu_type bucket resolves (see fetchQuickActions below).
  const FALLBACK_QUICK_ACTIONS = [
    { code: "appointments", label: "Appointments" },
    { code: "healthPackages", label: "Health pkgs" },
    { code: "orders", label: "Orders" },
    { code: "rxRefill", label: "Rx refill" },
  ];

  // Local-only: icon/color/behavior per stable code. The backend can
  // reorder/relabel/hide buttons but never owns what tapping one does.
  const QUICK_ACTION_CODE_MAP: Record<
    string,
    {
      icon: string;
      IconFamily: typeof SvgIonicons | typeof MaterialCommunityIcons;
      color: string;
      bgColor: string;
      onPress: () => void | Promise<void>;
    }
  > = {
    appointments: {
      icon: "calendar-outline",
      IconFamily: SvgIonicons,
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
    healthPackages: {
      icon: "medkit-outline",
      IconFamily: SvgIonicons,
      color: "#F39C12",
      bgColor: "#FEF5E7",
      onPress: () => navigation.navigate("HealthPackages"),
    },
    orders: {
      icon: "receipt-outline",
      IconFamily: SvgIonicons,
      color: "#2ECC71",
      bgColor: "#EAF6F0",
      onPress: () => navigation.navigate("OrderScreen"),
    },
    rxRefill: {
      icon: "pill",
      IconFamily: MaterialCommunityIcons,
      color: "#9B59B6",
      bgColor: "#F5EEF8",
      onPress: () => { },
    },
  };

  // Neutral fallback for a code the backend sends that the app doesn't
  // recognize yet — avoids a crash or a silently-missing button.
  const DEFAULT_QUICK_ACTION_META = {
    icon: "apps-outline",
    IconFamily: SvgIonicons,
    color: "#6B7280",
    bgColor: "#F3F4F6",
    onPress: () => { },
  };

  const [quickActionsData, setQuickActionsData] = useState<
    { code: string; label: string; sequence?: number }[]
  >(FALLBACK_QUICK_ACTIONS);

  // Populates the Home dashboard's Quick Actions row (code/label/order)
  // from the "quickActions" widget's menu_additional_attributes — the
  // backend models this as ONE widget row (widget_code "quickActions")
  // carrying the button list nested inside additionalAttributes, e.g.
  // [{ code: "appointments", label: "Appointments", enable: "Y" }, ...]
  // — same nested-JSON idiom already used for promoBanner's bannerUrls.
  // No loading gate here — unlike Specialties/Providers, the fallback is
  // the fully correct, currently-shipped set of buttons, so we render it
  // instantly and just relabel/reorder in place if/when the backend list
  // resolves.
  useEffect(() => {
    const fetchQuickActions = async () => {
      try {
        const widgets = await getMenuWidgetsByType("quickActions");
        if (!widgets || widgets.length === 0) return;

        const quickActionsWidget = widgets.find(
          (w) => w.widget_code === "quickActions",
        );
        const rawItems = quickActionsWidget?.additionalAttributes;
        const items = Array.isArray(rawItems) ? rawItems : [];
        const mapped = items
          .filter((it: any) => it?.enable !== "N" && it?.code)
          .map((it: any) => ({ code: it.code, label: it.label ?? it.code }));
        if (mapped.length > 0) {
          setQuickActionsData(mapped);
        }
        // empty/malformed -> keep FALLBACK_QUICK_ACTIONS
      } catch (e) {
        console.error("Error fetching quick actions:", e);
      }
    };
    fetchQuickActions();
  }, []);

  // Recomputed every render so onPress always closes over the *current*
  // Providers/appointments state rather than whatever it was when the
  // fetch above resolved.
  const quickActions = quickActionsData.map((item) => ({
    ...item,
    ...(QUICK_ACTION_CODE_MAP[item.code] ?? DEFAULT_QUICK_ACTION_META),
  }));

  const noPatient = !patientId || patientId === "null";

  // Fetch dynamic sections from backend (with automatic fallback to defaults)
  const {
    visibleSections,
    isLoading: isLayoutLoading,
    refetch,
  } = useDashboardSections(noPatient);

  // Providers/specialties/health-summary/upcoming-appointment data is fetched
  // once per matching widget instance (not once globally) — each instance uses
  // its own backend-supplied processId/defaultParams (see useSectionInstanceData),
  // merged under the dynamic runtime params computed here, so the same widget
  // can appear more than once in the backend response and render independently.
  const providerInstances = visibleSections.filter(
    (s) => s.key === "providers",
  );
  const {
    dataByInstance: providersByInstance,
    loadingByInstance: loadingProvidersByInstance,
  } = useSectionInstanceData(
    providerInstances,
    spd_processId_config.hospapp_get_resources,
    async () => {
      const pid = await fetchDataFromLocalStorage("sg_patientId");
      const orgId = await fetchDataFromLocalStorage("sg_org_id");
      const now = new Date();
      return {
        p_patient_id: pid ?? "",
        p_org_id: orgId,
        p_month: now.getMonth() + 1,
        p_year: now.getFullYear(),
      };
    },
    (returnData) =>
      returnData.map((r: any) => ({
        id: String(r.resource_id ?? r.id ?? Math.random()),
        name: r.resource_name ?? r.name ?? "",
        specialty: r.dpt_description ?? r.dept_name ?? "",
        qualification: r.doctor_education ?? r.doctor_short_description ?? "",
        hospital: r.org_name ?? "",
        distance: r.distance ?? "",
        rating: String(r.rating ?? ""),
        reviews: String(r.reviews ?? ""),
        avatar: r.resource_image_url ?? "",
        nextAvailable: r.next_available ?? r.next_slot ?? "",
      })),
    [],
    String(orgRefreshTick),
  );
  // "See all" / quick-action pass-through need a single Providers list — use the
  // first occurrence's data (there's normally only one providers instance).
  const firstProviderInstanceId = providerInstances[0]?.instanceId;
  const Providers =
    (firstProviderInstanceId && providersByInstance[firstProviderInstanceId]) ||
    [];

  const specialtyInstances = visibleSections.filter(
    (s) => s.key === "specialties",
  );
  const {
    dataByInstance: specialtiesByInstance,
    loadingByInstance: loadingSpecialtiesByInstance,
  } = useSectionInstanceData(
    specialtyInstances,
    spd_processId_config.hosapp_get_ct_department_pntapp,
    async () => ({}),
    (returnData) =>
      returnData.map((d: any) => {
        const label = d.dpt_description ?? d.dpt_name ?? d.ct_description ?? "";
        return { label, ...getSpecialtyIconMeta(label) };
      }),
    [],
    String(orgRefreshTick),
  );

  const healthAwarenessInstances = visibleSections.filter(
    (s) => s.key === "healthAwareness",
  );
  const {
    dataByInstance: healthAwarenessByInstance,
    loadingByInstance: loadingHealthAwarenessByInstance,
  } = useSectionInstanceData(
    healthAwarenessInstances,
    spd_processId_config.hosapp_get_mst_lm_course_for_public_pnt_app,
    async () => ({}),
    // content_reference_details is the YouTube page URL (not a direct video
    // id or image) — derive both the video id (for the in-app player) and a
    // thumbnail from it via extractYoutubeId. html_description carries the
    // real title as HTML ("<p><b>Title</b></p>"), description is blank.
    (returnData) =>
      returnData
        .filter((c: any) => c.content_type === "video_url")
        .map((c: any) => {
          const videoUrl = c.content_reference_details ?? "";
          const youtubeId = extractYoutubeId(videoUrl);
          return {
            id: String(c.id ?? Math.random()),
            title: stripHtml(c.html_description ?? c.description ?? ""),
            videoUrl,
            // Only YouTube has a free thumbnail endpoint — other sources
            // (Vimeo, direct files, generic embeds) fall back to a plain
            // play-button card via videoThumbnail's placeholder background.
            thumbnail: youtubeId
              ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
              : "",
          };
        })
        .filter((v) => !!v.videoUrl),
    [],
    String(orgRefreshTick),
  );

  const healthSummaryInstances = visibleSections.filter(
    (s) => s.key === "healthSummary",
  );
  // Populates the "My health summary" tiles from the latest-vitals endpoint.
  // The response is a single "latest reading" row with named fields
  // (p_heart_rate, p_bp_sys/p_bp_dias, p_body_height, p_weight_measured, ...)
  // rather than a list of vital rows — any field left as "" simply means that
  // vital wasn't captured at the last visit. Only Blood pressure / Heart rate /
  // BMI map to this vitals domain.
  const {
    dataByInstance: healthSummaryByInstance,
    loadingByInstance: loadingHealthSummaryByInstance,
  } = useSectionInstanceData(
    healthSummaryInstances,
    spd_processId_config.hosapp_get_fb_trn_ff_data_detail_patient_vitals_details_pnt_app,
    async () => {
      const pid = await fetchDataFromLocalStorage("sg_patientId");
      return { p_patient_id: pid };
    },
    (returnData) => {
      const row = returnData[0];
      const heartRate = row.p_heart_rate;
      const hrValue = heartRate ? `${heartRate} bpm` : null;
      const sys = row.p_bp_sys;
      const dias = row.p_bp_dias;
      const bpValue = sys && dias ? `${sys}/${dias}` : null;
      // Backend doesn't send a computed BMI field — derive it from
      // height/weight when both are present. Assumes cm and kg.
      const heightCm = parseFloat(row.p_body_height);
      const weightKg = parseFloat(row.p_weight_measured);
      const bmiValue =
        heightCm > 0 && weightKg > 0
          ? (weightKg / (heightCm / 100) ** 2).toFixed(1)
          : null;
      return FALLBACK_HEALTH_SUMMARY.map((item) => {
        if (item.title === "Blood pressure" && bpValue)
          return { ...item, value: bpValue };
        if (item.title === "Heart rate" && hrValue)
          return { ...item, value: hrValue };
        if (item.title === "BMI" && bmiValue)
          return { ...item, value: bmiValue };
        return item;
      });
    },
    [],
    String(orgRefreshTick),
  );

  const upcomingInstances = visibleSections.filter(
    (s) => s.key === "upcomingAppointments",
  );
  // The "recent" card only — the full upcoming/history lists used for
  // navigation pass-through are fetched separately above (useFocusEffect),
  // since they aren't rendered as a widget themselves.
  const { dataByInstance: upcomingByInstance } = useSectionInstanceData<
    UpcomingAppointment[]
  >(
    upcomingInstances,
    spd_processId_config.xcelsch_get_patient_future_appointments_pntportal_hv_patient_dashboard,
    async () => ({ p_patient_id: patientId ?? "" }),
    (returnData) => {
      const a = returnData[0];
      const statusStyle = getStatusStyle(a.appstat_html_name ?? "");
      return [
        {
          id: String(a.p_appt_id ?? a.appt_id ?? ""),
          doctorName: a.resource_name ?? "",
          specialty: a.dpt_description ?? "",
          avatar: a.p_doc_image_url ?? "",
          date: a.appt_date_dashboard ?? "",
          time: formatAmPm(a.appt_start_time ?? ""),
          statusLabel:
            stripHtml(a.appstat_html_name ?? "") ||
            (a.appstat_name ?? "Confirmed"),
          statusColor: statusStyle.color,
          statusBg: statusStyle.bg,
        },
      ];
    },
    [],
    `${patientId ?? ""}_${focusTick}_${orgRefreshTick}`,
  );

  // Renders each "body" section (everything below the greeting hero) by
  // instance. Called in the order of `visibleSections`, so the backend's
  // menu_display_order drives the actual render order on screen, and the same
  // widget_code can appear more than once — each occurrence is its own instance.
  const renderBodySection = (section: SectionConfig) => {
    const key = section.key;
    const instanceId = section.instanceId ?? key;
    switch (key) {
      case "promoBanner": {
        // Use this instance's own bannerUrls — looking it up by widget_code
        // instead of instanceId would make every promoBanner occurrence show
        // the first one's banners.
        const promoBannerUrls = section.bannerUrls ?? [];

        return (
          <View key={instanceId} style={{ marginBottom: 14 }}>
            <CarouselBanner urls={promoBannerUrls} itemWidth={width - 40} />
          </View>
        );
      }

      case "quickActions":
        return (
          <View key={instanceId} style={styles.quickActionsContainer}>
            {quickActions.map((action) => {
              const Icon = action.IconFamily;
              return (
                <Pressable
                  key={action.code}
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
        const upcomingForInstance = upcomingByInstance[instanceId] ?? [];
        if (noPatient || upcomingForInstance.length === 0) return null;
        // Preloaded lists seed initial state so AppointmentScreen isn't
        // empty while it refetches with this widget's own processId/params.
        const goToAppointments = () =>
          navigation.navigate("Appointment", {
            preloadedUpcoming: upcomingAppointmentsFull,
            preloadedHistory: historyAppointmentsFull,
            preloadedProviders: Providers,
            widgetProcessId: section.processId,
            widgetDefaultParams: section.defaultParams,
          });
        return (
          <View key={instanceId}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.sectionHeaderIcon}>
                  {getMenuIcon(
                    section.menuImageType,
                    section.menuImage,
                    <SvgIonicons
                      name="calendar"
                      size={13}
                      color={Colors.secondary}
                    />,
                    13,
                  )}
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  {section.menuName?.trim() || "Upcoming appointments"}
                </Text>
              </View>
              <Pressable
                onPress={goToAppointments}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <SvgIonicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            {upcomingForInstance.map((appt) => {
              const { day, month } = parseDateForBadge(appt.date);
              return (
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
                    <Text
                      style={styles.appointmentDoctorName}
                      numberOfLines={1}
                    >
                      {appt.doctorName}
                    </Text>
                    <Text style={styles.appointmentSpecialty} numberOfLines={1}>
                      {appt.specialty}
                    </Text>
                    <View style={styles.appointmentMetaRow}>
                      <SvgIonicons
                        name="time-outline"
                        size={14}
                        color={Colors.secondary}
                      />
                      <Text style={styles.appointmentTimeText}>
                        {appt.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.appointmentDateBadge}>
                    <Text style={styles.appointmentDateDay}>{day}</Text>
                    <Text style={styles.appointmentDateMonth}>{month}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      }

      case "healthAwareness": {
        const healthAwarenessForInstance =
          healthAwarenessByInstance[instanceId] ?? [];
        const isLoadingHealthAwarenessInstance =
          loadingHealthAwarenessByInstance[instanceId] ?? true;

        if (
          !isLoadingHealthAwarenessInstance &&
          healthAwarenessForInstance.length === 0
        )
          return null;

        return (
          <View key={instanceId} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.sectionHeaderIcon}>
                  {getMenuIcon(
                    section.menuImageType,
                    section.menuImage,
                    <SvgIonicons name="play" size={13} color={Colors.secondary} />,
                    13,
                  )}
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  {section.menuName?.trim() || "Health awareness"}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <SvgIonicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            {isLoadingHealthAwarenessInstance ? (
              <Skeleton style={styles.videoCard} />
            ) : healthAwarenessForInstance.length === 1 ? (
              <Pressable
                onPress={() =>
                  setPlayingVideoUrl(healthAwarenessForInstance[0].videoUrl)
                }
                style={({ pressed }) => [
                  styles.videoCard,
                  {
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Image
                  source={{ uri: healthAwarenessForInstance[0].thumbnail }}
                  style={styles.videoThumbnail}
                />
                <View style={styles.playButtonOverlay}>
                  <SvgIonicons name="play" size={40} color={Colors.background} />
                </View>
              </Pressable>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.healthAwarenessScrollList}
              >
                {healthAwarenessForInstance.map((video) => (
                  <Pressable
                    key={video.id}
                    onPress={() => setPlayingVideoUrl(video.videoUrl)}
                    style={({ pressed }) => [
                      styles.videoCardHorizontal,
                      {
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: video.thumbnail }}
                      style={styles.videoThumbnail}
                    />
                    <View style={styles.playButtonOverlay}>
                      <SvgIonicons
                        name="play"
                        size={32}
                        color={Colors.background}
                      />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        );
      }

      case "healthSummary": {
        if (noPatient) return null;
        const healthSummaryForInstance =
          healthSummaryByInstance[instanceId] ?? [];
        const isLoadingHealthSummaryInstance =
          loadingHealthSummaryByInstance[instanceId] ?? false;
        // Hide if all vital values are still the placeholder "--"
        if (healthSummaryForInstance.every((item: any) => item.value === "--"))
          return null;

        return (
          <View key={instanceId} style={styles.sectionContainer}>
            <View style={[styles.sectionHeaderTitleRow, { marginBottom: 16 }]}>
              <View style={styles.sectionHeaderIcon}>
                {getMenuIcon(
                  section.menuImageType,
                  section.menuImage,
                  <SvgIonicons name="heart" size={13} color={Colors.secondary} />,
                  13,
                )}
              </View>
              <Text style={styles.sectionTitle}>
                {section.menuName?.trim() || "My health summary"}
              </Text>
            </View>
            {isLoadingHealthSummaryInstance ? (
              <View style={styles.healthSummaryGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} style={styles.healthSummarySkeletonItem} />
                ))}
              </View>
            ) : (
              <View style={styles.healthSummaryGrid}>
                {healthSummaryForInstance.map((item, index) => (
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
            )}
          </View>
        );
      }

      case "providers": {
        // A widget instance with its own process_id (from
        // menu_additional_attributes) shows its own fetched data; otherwise
        // it falls back to the shared default Providers list/state.
        const providersForInstance = section.processId
          ? (providersByInstance[instanceId] ?? [])
          : Providers;
        const isLoadingProvidersInstance = section.processId
          ? (loadingProvidersByInstance[instanceId] ?? true)
          : firstProviderInstanceId
            ? (loadingProvidersByInstance[firstProviderInstanceId] ?? false)
            : false;

        if (!isLoadingProvidersInstance && providersForInstance.length === 0)
          return null;

        return (
          <View key={instanceId} style={styles.sectionContainerNoShadow}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.sectionHeaderIcon}>
                  {getMenuIcon(
                    section.menuImageType,
                    section.menuImage,
                    <SvgIonicons
                      name="person"
                      size={13}
                      color={Colors.secondary}
                    />,
                    13,
                  )}
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  {section.menuName?.trim() || "Providers"}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  handleSeeAllProviders(
                    providersForInstance,
                    section.processId,
                    section.defaultParams,
                  )
                }
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <SvgIonicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            {isLoadingProvidersInstance ? (
              <View style={styles.providersScrollList}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} style={styles.providerCardSkeleton} />
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.providersScrollList}
              >
                {providersForInstance.map((provider) => (
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
                    onPress={() =>
                      navigation.navigate("PatientDetails", {
                        doctorId: provider.id,
                        doctorName: provider.name,
                        specialty: provider.specialty,
                        avatar: provider.avatar,
                        hospital: provider.hospital,
                      })
                    }
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
      }

      case "specialties": {
        const firstSpecialtyInstanceId = specialtyInstances[0]?.instanceId;
        const specialties = firstSpecialtyInstanceId
          ? (specialtiesByInstance[firstSpecialtyInstanceId] ?? [])
          : [];
        const loadingSpecialties = firstSpecialtyInstanceId
          ? (loadingSpecialtiesByInstance[firstSpecialtyInstanceId] ?? false)
          : false;

        const specialtiesForInstance = section.processId
          ? (specialtiesByInstance[instanceId] ?? [])
          : specialties;
        const isLoadingSpecialtiesInstance = section.processId
          ? (loadingSpecialtiesByInstance[instanceId] ?? true)
          : loadingSpecialties;

        if (
          !isLoadingSpecialtiesInstance &&
          specialtiesForInstance.length === 0
        )
          return null;

        return (
          <View key={instanceId} style={styles.sectionContainerNoShadow}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.sectionHeaderIcon}>
                  {getMenuIcon(
                    section.menuImageType,
                    section.menuImage,
                    <SvgIonicons
                      name="medkit"
                      size={13}
                      color={Colors.secondary}
                    />,
                    13,
                  )}
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  {section.menuName?.trim() || "Specialties"}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  handleSeeAllSpecialties(
                    specialtiesForInstance,
                    section.processId,
                    section.defaultParams,
                  )
                }
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all{" "}
                  <SvgIonicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.secondary}
                  />
                </Text>
              </Pressable>
            </View>

            {isLoadingSpecialtiesInstance ? (
              <View style={styles.specialtiesScrollList}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} style={styles.specialtyIconSkeleton} />
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.specialtiesScrollList}
              >
                {specialtiesForInstance.map((item, index) => {
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
                      onPress={() =>
                        navigation.navigate("NearbyProviders", {
                          initialCategory: item.label,
                        })
                      }
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
            )}
          </View>
        );
      }
      default:
        return null;
    }
  };

  const providerKeys = providerInstances.map((inst) => String(inst.instanceId));
  const isProvidersLoading =
    providerInstances.length > 0 &&
    providerKeys.some((key) => loadingProvidersByInstance[key] !== false);

  const specialtyKeys = specialtyInstances.map((inst) =>
    String(inst.instanceId),
  );
  const isSpecialtiesLoading =
    specialtyInstances.length > 0 &&
    specialtyKeys.some((key) => loadingSpecialtiesByInstance[key] !== false);

  const isDashboardLoading =
    isLayoutLoading || isProvidersLoading || isSpecialtiesLoading;

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
              {/* <SvgIonicons 
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

            <Pressable
              style={({ pressed }) => [
                styles.locationTrigger,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setShowLocationPicker(true)}
              disabled={switchingLocation}
            >
              <SvgIonicons
                name="location-sharp"
                size={16}
                color={Colors.background}
              />
              <Text style={styles.locationTriggerText} numberOfLines={1}>
                {orgLocationName || "Select location"}
              </Text>
              {switchingLocation ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <SvgIonicons
                  name="chevron-down"
                  size={16}
                  color={Colors.background}
                />
              )}
            </Pressable>

            <View style={styles.headerIconsRight}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <SvgIonicons
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
                  <SvgIonicons
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

      {isDashboardLoading ? (
        <>
          <View style={styles.stickyHeaderSpacer} />
          <DashboardSkeleton />
        </>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.stickyHeaderSpacer} />

          {/* Greeting Section */}
          {visibleSections.some((s) => s.key === "greeting") && (
            <View style={styles.headerGreetingSection}>
              <View style={styles.bgCircleLarge} />
              <FontAwesome name="plus" size={40} style={styles.bgPlus} />

              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  {noPatient
                    ? userProfileName
                      ? `Welcome, ${userProfileName}!`
                      : "Welcome!"
                    : userProfileName
                      ? `${getGreetingTime()}, ${userProfileName}!`
                      : `${getGreetingTime()}!`}
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
              .filter((section) => section.key !== "greeting")
              .map((section) => renderBodySection(section))}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      )}

      {/* Location Picker Sheet */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <Pressable
          style={styles.locationSheetOverlay}
          onPress={() => setShowLocationPicker(false)}
        >
          <Pressable style={styles.locationSheetCard} onPress={() => { }}>
            <View style={styles.locationSheetHandle} />
            <Text style={styles.locationSheetTitle}>Switch location</Text>
            {locations.length === 0 ? (
              <Text style={styles.locationEmptyText}>
                No locations available.
              </Text>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = item.orgAiCode === selectedLocationCode;
                  return (
                    <TouchableOpacity
                      style={styles.locationSheetRow}
                      onPress={() => handleSelectLocation(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.locationSheetIconWrap,
                          {
                            borderColor: isSelected
                              ? Colors.primary
                              : Colors.border,
                          },
                        ]}
                      >
                        <SvgIonicons
                          name="location"
                          size={18}
                          color={isSelected ? Colors.primary : Colors.gray}
                        />
                      </View>
                      <View style={styles.locationSheetTextCol}>
                        <View style={styles.locationSheetNameRow}>
                          <Text style={styles.locationSheetName}>
                            {item.name}
                          </Text>
                          {item.isDefault && (
                            <View style={styles.locationSheetDefaultBadge}>
                              <Text style={styles.locationSheetDefaultText}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                        {!!item.area && (
                          <Text style={styles.locationSheetArea}>
                            {item.area}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <SvgIonicons
                          name="checkmark-circle"
                          size={25}
                          color={Colors.secondary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Health Awareness video player — supports YouTube, Vimeo, direct
          file links (mp4/m3u8/...), and generic embeddable page URLs. */}
      <Modal
        visible={!!playingVideoUrl}
        animationType="fade"
        transparent
        onRequestClose={() => setPlayingVideoUrl(null)}
      >
        <View style={styles.videoModalOverlay}>
          <View
            style={[
              styles.videoModalContent,
              { width: width - 40, height: ((width - 40) * 9) / 16 },
            ]}
          >
            <TouchableOpacity
              style={styles.videoModalCloseButton}
              onPress={() => setPlayingVideoUrl(null)}
            >
              <SvgIonicons name="close" size={28} color={Colors.background} />
            </TouchableOpacity>
            {playingVideoUrl &&
              (() => {
                const source = classifyVideoUrl(playingVideoUrl);
                const playerWidth = width - 40;
                const playerHeight = ((width - 40) * 9) / 16;
                if (!source) return null;

                if (source.kind === "youtube") {
                  return Platform.OS === "web" ? (
                    // react-native-youtube-iframe's bridge relies on
                    // react-native-webview's native postMessage channel,
                    // which doesn't exist under react-native-web (no real
                    // native WebView) — render a plain HTML iframe instead.
                    React.createElement("iframe", {
                      src: `https://www.youtube.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1`,
                      width: playerWidth,
                      height: playerHeight,
                      style: { border: 0 },
                      allow:
                        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                      allowFullScreen: true,
                    })
                  ) : (
                    <YoutubePlayer
                      height={playerHeight}
                      width={playerWidth}
                      play
                      videoId={source.id}
                      onChangeState={(state: string) => {
                        if (state === "ended") setPlayingVideoUrl(null);
                      }}
                      initialPlayerParams={{
                        preventFullScreen: false,
                        controls: true,
                        rel: false,
                      }}
                      webViewProps={{
                        scrollEnabled: false,
                        bounces: false,
                        androidLayerType:
                          Platform.OS === "android" ? "hardware" : undefined,
                        // The library only blocks youtube.com navigation on
                        // iOS — override here so tapping the embed's own
                        // end-screen / "Watch on YouTube" card never leaves
                        // the app, on any platform, for the initial load or
                        // any in-page navigation.
                        onShouldStartLoadWithRequest: (request: {
                          url: string;
                        }) =>
                          !/youtube\.com|youtu\.be|google\.com\/url/.test(
                            request.url,
                          ),
                        // Those same cards often open via window.open()
                        // rather than a top-level navigation, which the
                        // check above can't see — block Android's new-window
                        // popups outright, and no-op any window the WebView
                        // still tries to open on iOS/other.
                        setSupportMultipleWindows: false,
                        onOpenWindow: () => { },
                      }}
                      webViewStyle={{ opacity: 0.99 }}
                    />
                  );
                }

                if (source.kind === "file") {
                  // Direct media file (mp4/m3u8/...) — expo-av's Video
                  // component plays natively on iOS/Android and via the
                  // HTML5 <video> tag on web, no embed/bridge needed.
                  return (
                    <Video
                      source={{ uri: source.url }}
                      style={{ width: playerWidth, height: playerHeight }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                      onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded && status.didJustFinish)
                          setPlayingVideoUrl(null);
                      }}
                    />
                  );
                }

                // Vimeo or any other URL: load the appropriate embed page.
                // Best-effort for arbitrary "embed" URLs — some sites block
                // being iframed via X-Frame-Options, which no client-side
                // workaround can bypass.
                const embedUrl =
                  source.kind === "vimeo"
                    ? `https://player.vimeo.com/video/${source.id}?autoplay=1`
                    : source.url;

                return Platform.OS === "web" ? (
                  React.createElement("iframe", {
                    src: embedUrl,
                    width: playerWidth,
                    height: playerHeight,
                    style: { border: 0 },
                    allow:
                      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                    allowFullScreen: true,
                  })
                ) : (
                  <WebView
                    source={{ uri: embedUrl }}
                    style={{ width: playerWidth, height: playerHeight }}
                    allowsFullscreenVideo
                    mediaPlaybackRequiresUserAction={false}
                  />
                );
              })()}
          </View>
        </View>
      </Modal>
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
  locationTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.background,
    backgroundColor: Colors.overlayOnDark,
    gap: 8,
    maxWidth: "55%",
  },
  locationTriggerText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: FontFamilies.medium,
    color: Colors.background,
  },
  badgeDot: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
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
    fontSize: 20,
    fontFamily: FontFamilies.bold,
    color: Colors.background,
    marginBottom: 6,
  },
  subGreetingText: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    color: Colors.textDark,
  },
  patientMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  patientMetaBadge: {
    backgroundColor: Colors.overlayOnDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  patientMetaText: {
    fontSize: 13,
    fontFamily: FontFamilies.semiBold,
    color: Colors.background,
  },
  bgCircleLarge: {
    position: "absolute",
    right: -30,
    top: 20,
    width: 110,
    height: 110,
    borderRadius: 100,
    borderWidth: 17,
    borderColor: Colors.overlayOnDark,
    opacity: 0.2,
    zIndex: 1,
  },
  bgPlus: {
    position: "absolute",
    right: 12,
    top: 50,
    color: Colors.overlayOnDark,
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
    backgroundColor: Colors.notificationBadge,
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
    borderRadius: 10,
    backgroundColor: Colors.backgroundLight,
    padding: 7,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
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
    backgroundColor: Colors.backgroundLight,
    padding: 7,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  sectionContainerNoShadow: {
    marginBottom: 28,
    backgroundColor: Colors.backgroundLight,
    padding: 7,
    borderRadius: 10,
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
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  noAppointmentsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundCardLight,
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
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  appointmentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.border,
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctorName: {
    fontSize: 15,
    fontFamily: FontFamilies.medium,
    color: Colors.text,
  },
  appointmentSpecialty: {
    fontSize: 13,
    fontFamily: FontFamilies.regular,
    color: Colors.secondary,
    marginTop: 2,
  },
  appointmentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  appointmentTimeText: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    color: Colors.primary,
  },
  appointmentDateBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  appointmentDateDay: {
    fontSize: 15,
    fontFamily: FontFamilies.medium,
    color: Colors.secondary,
    lineHeight: 18,
  },
  appointmentDateMonth: {
    fontSize: 12,
    fontFamily: FontFamilies.regular,
    color: Colors.text,
    lineHeight: 14,
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
    backgroundColor: Colors.pressed,
    borderRadius: 3,
  },
  videoCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
    position: "relative",
    backgroundColor: Colors.lightgray,
  },
  healthAwarenessScrollList: {
    paddingRight: 10,
  },
  videoCardHorizontal: {
    width: 220,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.lightgray,
    marginRight: 12,
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
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalContent: {
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  videoModalCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
  healthSummarySkeletonItem: {
    width: "31%",
    height: 64,
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
  providerCardSkeleton: {
    width: 140,
    height: 160,
    borderRadius: 16,
    marginRight: 12,
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
    backgroundColor: Colors.lightgray,
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
  specialtyIconSkeleton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 20,
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
  locationSheetOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayOnDark,
    justifyContent: "flex-end",
  },
  locationSheetCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    maxHeight: "70%",
  },
  locationSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  locationSheetTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.medium,
    color: Colors.secondary,
    marginBottom: 12,
  },
  locationEmptyText: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    paddingVertical: 24,
    textAlign: "center",
  },
  locationSheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationSheetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  locationSheetTextCol: {
    flex: 1,
  },
  locationSheetNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationSheetName: {
    fontSize: 15,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
  },
  locationSheetArea: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    marginTop: 2,
  },
  locationSheetDefaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.pressed,
  },
  locationSheetDefaultText: {
    fontSize: 10,
    fontFamily: FontFamilies.bold,
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
});
