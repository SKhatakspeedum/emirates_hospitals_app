import React, { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import { Calendar } from "react-native-calendars";
import {
  IS_LOGGED_IN,
  USER_FULL_DATA,
  SPD_USER_NAME,
  SPD_SELECTED_PATIENT,
} from "../config/config";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import { FontSizes } from "../config/typography";
import { Spacing, BorderRadius } from "../config/spacing";
import {
  setEncryptedID,
  getDecryptedID,
  saveDataFromLocalStorage,
  fetchDataFromLocalStorage,
} from "../suggestus_plugin/util/util_functions";
import {
  callSuggestusAPI,
  setUserId,
  setRoleId,
  setUserName,
  setPatientId,
} from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import CustomTabs from "../components/CustomTabs";
import { fetchAndApplyOrgConfig } from "../services/orgConfig";
import { getUserEntityReferenceCode } from "../services/entityReferenceCode";
import { getStoredAiCode } from "../services/aiCode";
import { CameraView, useCameraPermissions } from "expo-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";

type CheckStatus =
  | "idle"
  | "checking"
  | "exists"
  | "available"
  | "error"
  | "invalid";
interface FieldCheck {
  status: CheckStatus;
  checkedValue: string;
}

const IDLE_CHECK: FieldCheck = { status: "idle", checkedValue: "" };

// Scan frame dimensions — shared between the layout styles and the scan-line
// animation's translation range.
const SCAN_FRAME_WIDTH = 335;
const SCAN_FRAME_HEIGHT = 230;

// Low-opacity tints derived from the theme's status colors — avoids
// hardcoding separate near-duplicate rgba literals for badge/surface
// backgrounds (hex + alpha suffix, same convention as Colors.label/grayDark).
const SUCCESS_TINT = `${Colors.success}1F`;
const ERROR_TINT = `${Colors.error}1F`;
const NEUTRAL_TINT = `${Colors.textLabel}26`;
const SUCCESS_SURFACE = `${Colors.success}14`;
const ERROR_SURFACE = `${Colors.error}14`;

// returnCode arrives as string "true" or boolean true; returnData may be [{}] when empty
const hasReturnData = (res: any): boolean => {
  const ok = res?.returnCode === true || res?.returnCode === "true";
  return (
    ok &&
    Array.isArray(res.returnData) &&
    res.returnData.some((item: any) => item && Object.keys(item).length > 0)
  );
};

const parseAdditionalAttributes = (raw: any): Record<string, string> => {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const formatEmiratesId = (text: string) => {
  const cleaned = text.replace(/\D/g, "");
  let formatted = "";
  if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
  if (cleaned.length > 3) formatted += "-" + cleaned.substring(3, 7);
  if (cleaned.length > 7) formatted += "-" + cleaned.substring(7, 14);
  if (cleaned.length > 14) formatted += "-" + cleaned.substring(14, 15);
  return formatted;
};

const formatPassport = (text: string) =>
  text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

type ScanTarget = "emirates" | "passport";

type ParsedIdScan = {
  idNumber: string;
  firstName: string;
  lastName: string;
  dob: Date | null;
  gender?: "Male" | "Female" | "";
};

// Best-effort parser for Emirates ID card OCR text (ML Kit's recognized
// text doesn't preserve visual layout perfectly, so this uses label-based
// heuristics rather than fixed positions). Returns null if no valid
// Emirates ID number was found — that's the one field we can't proceed
// without; name/DOB are filled in on a best-effort basis.
const parseEmiratesIdText = (rawText: string): ParsedIdScan | null => {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // ID Number — 784-XXXX-XXXXXXX-X (15 digits total, starts with 784)
  const idMatch = rawText.match(/784[\s-]?\d{4}[\s-]?\d{7}[\s-]?\d/);
  if (!idMatch) return null;
  const idDigits = idMatch[0].replace(/\D/g, "");
  if (idDigits.length !== 15) return null;
  const idNumber = formatEmiratesId(idDigits);

  // Name — look for a line containing "Name" (but not "Nationality"),
  // take whatever follows a colon on that line, else the next line.
  let firstName = "";
  let lastName = "";
  const nameLineIdx = lines.findIndex(
    (l) => /\bname\b/i.test(l) && !/nationality/i.test(l),
  );
  if (nameLineIdx !== -1) {
    const sameLine = lines[nameLineIdx].split(/name\s*[:\-]?/i)[1]?.trim();
    const candidate =
      sameLine && sameLine.length > 1 ? sameLine : lines[nameLineIdx + 1];
    if (candidate) {
      const parts = candidate
        .replace(/[^a-zA-Z\s]/g, "")
        .trim()
        .split(/\s+/);
      firstName = parts[0] ?? "";
      lastName = parts.slice(1).join(" ");
    }
  }

  // Date of Birth — a date near a line mentioning "Birth"
  let dob: Date | null = null;
  const dobLineIdx = lines.findIndex((l) => /birth/i.test(l));
  const searchLines =
    dobLineIdx !== -1
      ? [lines[dobLineIdx], lines[dobLineIdx + 1] ?? ""]
      : lines;
  for (const line of searchLines) {
    const dateMatch = line.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (dateMatch) {
      const [, d, m, y] = dateMatch;
      const year = y.length === 2 ? Number(`19${y}`) : Number(y);
      const parsed = new Date(year, Number(m) - 1, Number(d));
      if (!isNaN(parsed.getTime())) {
        dob = parsed;
        break;
      }
    }
  }

  let gender: "Male" | "Female" | "" = "";
  const sexMatch = rawText.match(/\b(?:sex|gender)\b.*?([MF])/i);
  if (sexMatch) {
    gender = sexMatch[1].toUpperCase() === "M" ? "Male" : "Female";
  } else {
    const sexLine = lines.find((l) => /sex/i.test(l));
    if (sexLine) {
      const match = sexLine.match(/\b(M|F)\b/i);
      if (match) gender = match[1].toUpperCase() === "M" ? "Male" : "Female";
    }
  }

  return { idNumber, firstName, lastName, dob, gender };
};

// Best-effort parser for passport bio-page OCR text. Primary source is the
// MRZ (the two "P<CCCSURNAME<<GIVEN<<<<" / dense "<"-filled lines at the
// bottom of the page) since it's a fixed, machine-readable format; falls
// back to label-based heuristics (mirroring parseEmiratesIdText) when the
// MRZ wasn't captured cleanly. Returns null if no passport number was found.
const parsePassportText = (rawText: string): ParsedIdScan | null => {
  const lines = rawText
    .split("\n")
    .map((l) => l.replace(/\s/g, ""))
    .filter(Boolean);

  const mrzLines = lines.filter(
    (l) => l.length >= 20 && l.includes("<") && /^[A-Z0-9<]+$/.test(l),
  );
  const mrzLine1 = mrzLines.find((l) => /^P[A-Z<]/.test(l));
  const mrzLine2 = mrzLines.find((l) => l !== mrzLine1);

  let idNumber = "";
  let firstName = "";
  let lastName = "";
  let dob: Date | null = null;
  let gender: "Male" | "Female" | "" = "";

  if (mrzLine1) {
    const [surname, given] = mrzLine1.slice(5).split("<<");
    if (surname) lastName = surname.replace(/</g, " ").trim();
    if (given)
      firstName = given.replace(/</g, " ").trim().split(/\s+/)[0] ?? "";
  }

  if (mrzLine2) {
    const passportNoRaw = mrzLine2.slice(0, 9).replace(/</g, "");
    if (passportNoRaw) idNumber = passportNoRaw;

    // DOB occupies positions 13-18 (YYMMDD) of the TD3 second MRZ line
    const dobMatch = mrzLine2.slice(13, 19).match(/^(\d{2})(\d{2})(\d{2})$/);
    if (dobMatch) {
      const [, yy, mm, dd] = dobMatch;
      const currentYY = dayjs().year() % 100;
      const year =
        Number(yy) > currentYY ? 1900 + Number(yy) : 2000 + Number(yy);
      const parsed = new Date(year, Number(mm) - 1, Number(dd));
      if (!isNaN(parsed.getTime())) dob = parsed;
    }

    const sexChar = mrzLine2.charAt(20);
    if (sexChar === "M") gender = "Male";
    else if (sexChar === "F") gender = "Female";
  }

  // Fallback — no clean MRZ, look for a labeled passport number instead
  if (!idNumber) {
    const rawLines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const idLineIdx = rawLines.findIndex((l) =>
      /passport\s*(no\.?|number)?/i.test(l),
    );
    if (idLineIdx !== -1) {
      const sameLine = rawLines[idLineIdx]
        .split(/passport\s*(?:no\.?|number)?[:\-]?/i)[1]
        ?.trim();
      const candidate =
        sameLine && sameLine.length > 1 ? sameLine : rawLines[idLineIdx + 1];
      const match = candidate?.match(/[A-Z][A-Z0-9]{5,9}/i);
      if (match) idNumber = match[0].toUpperCase();
    }
  }

  if (!idNumber) return null;

  // Fallback name lookup from a "Name" label if the MRZ didn't yield one
  if (!firstName && !lastName) {
    const rawLines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const nameLineIdx = rawLines.findIndex(
      (l) => /\bname\b/i.test(l) && !/nationality/i.test(l),
    );
    if (nameLineIdx !== -1) {
      const sameLine = rawLines[nameLineIdx].split(/name\s*[:\-]?/i)[1]?.trim();
      const candidate =
        sameLine && sameLine.length > 1 ? sameLine : rawLines[nameLineIdx + 1];
      if (candidate) {
        const parts = candidate
          .replace(/[^a-zA-Z\s]/g, "")
          .trim()
          .split(/\s+/);
        firstName = parts[0] ?? "";
        lastName = parts.slice(1).join(" ");
      }
    }
  }

  if (!gender) {
    const sexMatch = rawText.match(/\b(?:sex|gender)\b.*?([MF])/i);
    if (sexMatch) {
      gender = sexMatch[1].toUpperCase() === "M" ? "Male" : "Female";
    }
  }

  return {
    idNumber: formatPassport(idNumber),
    firstName,
    lastName,
    dob,
    gender,
  };
};

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const route = useRoute();

  const [isResident, setIsResident] = useState(true);
  const [emiratesId, setEmiratesId] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [gender, setGender] = useState<"Male" | "Female" | "">("Male");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  type LocationOption = {
    id: string;
    name: string;
    orgAiCode: string;
    isDefault: boolean;
  };
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationOption | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Real camera capture + on-device ML Kit OCR. "searching" waits on the
  // user to tap; "processing" captures a photo and runs text recognition;
  // "success"/"error" reflect whether a valid ID number was found. Shared
  // between Emirates ID and Passport scanning — scanTarget picks which
  // parser/labels/fields apply.
  type ScanPhase = "searching" | "processing" | "success" | "error";
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget>("emirates");
  const [scanPhase, setScanPhase] = useState<ScanPhase>("searching");
  const [scanErrorMessage, setScanErrorMessage] = useState("");
  const [scannedData, setScannedData] = useState<ParsedIdScan | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const cameraRef = React.useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanDocLabel = scanTarget === "emirates" ? "Emirates ID" : "Passport";

  // Animated scan-line sweeping over the captured image while OCR runs.
  const scanLineProgress = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (scanPhase !== "processing") return;
    scanLineProgress.setValue(0);
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineProgress, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineProgress, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    sweep.start();
    return () => sweep.stop();
  }, [scanPhase]);

  useEffect(() => {
    if (!showScanModal) return;
    setScanPhase("searching");
    setScannedData(null);
    setScanErrorMessage("");
    setCapturedImageUri(null);
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [showScanModal]);

  // Shared by both the camera capture and the "Upload Document" fallback —
  // runs OCR on whatever image URI it's given and updates scan state.
  const processScannedImage = async (uri: string) => {
    setScanPhase("processing");
    // @react-native-ml-kit/text-recognition is a native module with no web
    // implementation — it can only run on a real device/simulator via a
    // native build (npx expo run:android / run:ios or an EAS dev build),
    // never in a browser preview. Fail clearly here instead of surfacing
    // the raw "package doesn't seem to be linked" native error.
    if (Platform.OS === "web") {
      setScanErrorMessage(
        `${scanDocLabel} scanning isn't supported in the web preview. Please use the mobile app (Android/iOS build) to scan or upload your ID.`,
      );
      setScanPhase("error");
      return;
    }
    try {
      const result = await TextRecognition.recognize(uri);
      const parsed =
        scanTarget === "emirates"
          ? parseEmiratesIdText(result.text)
          : parsePassportText(result.text);

      if (!parsed) {
        setScanErrorMessage(
          `Couldn't read the ${scanDocLabel} clearly. Please try again with better lighting or a clearer photo.`,
        );
        setScanPhase("error");
        return;
      }

      setScannedData(parsed);
      setScanPhase("success");
    } catch (e) {
      console.error(`${scanDocLabel} scan error:`, e);
      setScanErrorMessage(
        "Something went wrong while scanning. Please try again.",
      );
      setScanPhase("error");
    }
  };

  const handleCaptureTap = async () => {
    if (scanPhase !== "searching" || !cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanPhase("processing");
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        shutterSound: false,
      });
      if (!photo?.uri) throw new Error("No image captured");

      const { width: screenWidth, height: screenHeight } =
        Dimensions.get("window");
      const scale = Math.max(
        photo.width / screenWidth,
        photo.height / screenHeight,
      );

      const cropWidth = SCAN_FRAME_WIDTH * scale;
      const cropHeight = SCAN_FRAME_HEIGHT * scale;

      const originX = (photo.width - cropWidth) / 2;
      const originY = (photo.height - cropHeight) / 2;

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: Math.min(photo.width, cropWidth),
              height: Math.min(photo.height, cropHeight),
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      setCapturedImageUri(manipResult.uri);
      await processScannedImage(manipResult.uri);
    } catch (e) {
      console.error(`${scanDocLabel} capture error:`, e);
      setScanErrorMessage(
        "Something went wrong while scanning. Please try again.",
      );
      setScanPhase("error");
    }
  };

  const handleUploadDocument = async () => {
    if (scanPhase !== "searching") return;
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setScanErrorMessage(
          `Please allow photo library access to upload your ${scanDocLabel}.`,
        );
        setScanPhase("error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      setCapturedImageUri(result.assets[0].uri);
      await processScannedImage(result.assets[0].uri);
    } catch (e) {
      console.error(`${scanDocLabel} upload error:`, e);
      setScanErrorMessage(
        "Something went wrong while reading the document. Please try again.",
      );
      setScanPhase("error");
    }
  };

  const handleScanRetry = () => {
    setScannedData(null);
    setScanErrorMessage("");
    setCapturedImageUri(null);
    setScanPhase("searching");
  };

  const handleScanDone = () => {
    if (!scannedData) return;
    setShowScanModal(false);
    if (scanTarget === "emirates") {
      setEmiratesId(scannedData.idNumber);
      checkExistence("emirates", scannedData.idNumber);
    } else {
      setPassportNo(scannedData.idNumber);
      checkExistence("passport", scannedData.idNumber);
    }
    if (scannedData.firstName) setFirstName(scannedData.firstName);
    if (scannedData.lastName) setLastName(scannedData.lastName);
    if (scannedData.dob) setDob(scannedData.dob);
    if (scannedData.gender) setGender(scannedData.gender);
  };

  const scanFrameColor =
    scanPhase === "searching"
      ? Colors.error
      : scanPhase === "processing"
        ? Colors.secondary
        : scanPhase === "error"
          ? Colors.error
          : Colors.success;

  const scanStatusText =
    scanPhase === "searching"
      ? `Position your ${scanDocLabel} within the frame and tap to scan`
      : scanPhase === "processing"
        ? "Reading document..."
        : "";

  useEffect(() => {
    const loadLocations = async () => {
      setLoadingLocations(true);
      try {
        // spd_app_location_list ("INPATIENT,ORG0001") is a field inside the
        // cached org config (DEFAULT_JSON_DATA), written by
        // fetchAndApplyOrgConfig() in app/services/orgConfig.ts.
        const defaultJsonStr = await getDecryptedID("DEFAULT_JSON_DATA");
        let orgCodes = SiteConfig.AI_CODE;
        try {
          const defaultJson = defaultJsonStr ? JSON.parse(defaultJsonStr) : {};
          orgCodes = defaultJson?.spd_app_location_list ?? SiteConfig.AI_CODE;
        } catch (parseError) {
          console.error("Error parsing DEFAULT_JSON_DATA:", parseError);
        }

        const response = await callSuggestusAPI(
          spd_processId_config.sgconf_get_mst_organization_location_patient_portal_list,
          {
            p_org_ai_code: "",
            p_org_codes: orgCodes,
          },
        );
        if (response?.returnCode === true && response.returnData?.length > 0) {
          const fetched = response.returnData.map((r: any) => ({
            id: String(r.id ?? ""),
            name: r.description ?? r.name ?? "",
            orgAiCode: r.org_ai_code ?? "",
            isDefault: r.usr_org_default === "Y",
          }));
          setLocations(fetched);

          // Default location = whichever the backend flags usr_org_default
          // "Y" for, falling back to the site's configured AI code (then
          // the first entry) when no location is flagged yet — e.g. a
          // brand-new user with no prior default set.
          const defaultLocation =
            fetched.find((loc: LocationOption) => loc.isDefault) ??
            fetched.find(
              (loc: LocationOption) => loc.orgAiCode === SiteConfig.AI_CODE,
            ) ??
            fetched[0];
          if (defaultLocation) setSelectedLocation(defaultLocation);
        }
      } catch (e) {
        console.error("Error fetching locations:", e);
      } finally {
        setLoadingLocations(false);
      }
    };
    loadLocations();
  }, []);

  // Refresh org config (sgOrgId + branding/theme) scoped to whichever
  // location is currently selected — runs as soon as a location is picked
  // (including the initial default selection above), so every subsequent
  // API call on this screen (ID verification, registration, etc.) uses the
  // right sgOrgId, not just the one fired at final submission.
  //
  // If an Emirates ID / Passport was already typed and verified under the
  // PREVIOUS location's org, that result is now stale — re-run the
  // existence check under the newly selected location's org once the
  // refresh completes.
  useEffect(() => {
    if (!selectedLocation?.orgAiCode) return;
    let cancelled = false;

    const refreshOrgAndRevalidate = async () => {
      try {
        await fetchAndApplyOrgConfig(selectedLocation.orgAiCode);
      } catch (e) {
        console.error("Error refreshing org config for location:", e);
      }
      if (cancelled) return;

      if (isResident && emiratesId.trim()) {
        checkExistence("emirates", emiratesId);
      } else if (!isResident && passportNo.trim()) {
        checkExistence("passport", passportNo);
      }
    };

    refreshOrgAndRevalidate();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.orgAiCode]);

  const [emiratesIdCheck, setEmiratesIdCheck] =
    useState<FieldCheck>(IDLE_CHECK);
  const [passportCheck, setPassportCheck] = useState<FieldCheck>(IDLE_CHECK);
  // Patient record found via xcelpat_get_trn_patient_details_ehg_pntapp after ID is verified
  const [linkedPatientId, setLinkedPatientId] = useState("");

  // The active check is whichever tab is open
  const activeCheck = isResident ? emiratesIdCheck : passportCheck;

  const idFieldFilled = isResident
    ? emiratesId.trim().length > 0
    : passportNo.trim().length > 0;

  const idVerified = activeCheck.status === "available";

  const isFormValid =
    activeCheck.status !== "checking" &&
    activeCheck.status !== "exists" &&
    activeCheck.status !== "invalid" &&
    idFieldFilled &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    gender !== "" &&
    dob !== null;

  const buttonLabel =
    (emiratesIdCheck.status === "available" ||
      passportCheck.status === "available") &&
    linkedPatientId
      ? "Continue"
      : "Register";

  // Inline existence check — fires on blur of the ID field
  const checkExistence = useCallback(
    async (field: "emirates" | "passport", value: string) => {
      const clean =
        field === "emirates" ? value.replace(/-/g, "") : value.trim();
      if (!clean) return;

      const setCheck =
        field === "emirates" ? setEmiratesIdCheck : setPassportCheck;

      // Format validation before hitting the API
      if (field === "emirates") {
        if (clean.length !== 15 || !clean.startsWith("784")) {
          setCheck({ status: "invalid", checkedValue: value });
          return;
        }
      } else {
        if (clean.length < 6) {
          setCheck({ status: "invalid", checkedValue: value });
          return;
        }
      }

      setCheck({ status: "checking", checkedValue: value });

      try {
        const res = await callSuggestusAPI(
          spd_processId_config.sgconf_get_mst_user_validate_detail_for_ehg_pntapp,
          {
            p_emirates_id: field === "emirates" ? value : "",
            p_passport: field === "passport" ? value : "",
            p_process_flag: "validate_duplicate",
            p_additional_attribute: {},
          },
          "",
          "",
          "",
          "",
          "",
          false,
        );

        if (res?.returnCode) {
          setCheck({ status: "available", checkedValue: value });
          // Background: check if a patient record already exists for this ID
          try {
            const _userId =
              (await fetchDataFromLocalStorage("sg_userId")) ?? "";
            let _mobile = "";
            try {
              const _d = await getDecryptedID(USER_FULL_DATA);
              if (_d) {
                const _j = JSON.parse(_d);
                _mobile = _j.usr_phone ?? _j.usr_mobile ?? _j.p_mobile_no ?? "";
              }
            } catch (_) {}
            if (!_mobile) _mobile = (route.params as any)?.phone_number ?? "";
            const patientRes = await callSuggestusAPI(
              spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
              {
                // p_user_id: _userId,

                p_additional_attribute: {
                  p_ptm_mobile_number: _mobile,
                  p_emirates_id: field === "emirates" ? clean : "",
                  p_passport_no: field === "passport" ? clean : "",
                },
                p_process_flag: "validate_duplicate",
              },
            );
            if (hasReturnData(patientRes)) {
              const p = patientRes.returnData[0];
              setLinkedPatientId(String(p?.p_patient_id ?? ""));

              // Prefill form with patient data
              const pFirst = p?.ptm_first_name ?? p?.p_patient_first_name ?? "";
              const pLast = p?.ptm_last_name ?? p?.p_patient_last_name ?? "";
              const pGender: string =
                p?.ptm_gender ??
                (p?.p_gender === "2"
                  ? "Female"
                  : p?.p_gender === "1"
                    ? "Male"
                    : "");
              const pDobRaw: string = p?.ptm_date_of_birth ?? p?.p_dob ?? "";

              if (pFirst) setFirstName(pFirst);
              if (pLast) setLastName(pLast);
              if (pGender === "Male" || pGender === "Female")
                setGender(pGender);
              if (pDobRaw) {
                // API sends "Jul,07 1980" — normalize comma to space for Date
                const normalized = pDobRaw.replace(/,/g, " ").trim();
                const parsed = new Date(normalized);
                if (!isNaN(parsed.getTime())) setDob(parsed);
              }
            } else {
              setLinkedPatientId("");
            }
          } catch {
            setLinkedPatientId("");
          }
          return;
        } else {
          setLinkedPatientId("");
          setCheck({ status: "exists", checkedValue: value });
          return;
        }
      } catch (err) {
        console.error("[PersonalDetails] existence check failed:", err);
        setCheck({ status: "error", checkedValue: value });
      }
    },
    [],
  );

  const renderFieldStatus = (check: FieldCheck) => {
    if (check.status === "checking")
      return <ActivityIndicator size="small" color={Colors.secondary} />;
    if (check.status === "available")
      return (
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
      );
    if (
      check.status === "exists" ||
      check.status === "error" ||
      check.status === "invalid"
    )
      return <Ionicons name="close-circle" size={20} color={Colors.error} />;
    return null;
  };

  const handleContinue = async () => {
    // Org config (sgOrgId/theme) for the selected location is already kept
    // in sync by the useEffect above as soon as a location is picked — no
    // need to re-fetch it here at submit time.

    // Every ai_code field sent from this screen must reflect the currently
    // selected location, not the app's static default.
    const currentOrgAiCode = selectedLocation?.orgAiCode || SiteConfig.AI_CODE;

    // --- Path A: ID already exists → restore session + self-register as patient ---
    if (activeCheck.status === "exists") {
      setLoading(true);
      try {
        const rawPhone = (route.params as any)?.phone_number ?? "";
        const phoneE164 = rawPhone.replace(/\s+/g, "");

        // Step 1: Restore existing user session via phone
        const validateRes = await callSuggestusAPI(
          spd_processId_config.sgconf_util_validate_user_v2,
          {
            p_username: phoneE164.replace(/^\+/, ""),
            p_password: "",
            p_ai_code: currentOrgAiCode,
            p_login_type: "external",
          },
        );

        const validateOk =
          (validateRes?.returnCode === true ||
            validateRes?.returnCode === "true") &&
          validateRes?.returnData?.length > 0;

        if (!validateOk) {
          Toast.show({
            type: "error",
            text1: "Account Not Found",
            text2: "Unable to locate your account. Please try again.",
          });
          return;
        }

        const u = validateRes.returnData[0];
        let userId = String(u.usr_id ?? "");

        const lookupEmiratesId = isResident ? emiratesId.replace(/-/g, "") : "";
        const lookupPassportNo = !isResident ? passportNo.trim() : "";
        const patientRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_additional_attribute: {
              p_ptm_mobile_number: phoneE164,
              p_emirates_id: lookupEmiratesId,
              p_passport_no: lookupPassportNo,
            },
            p_process_flag: "validate_duplicate",
          },
        );
        const resolvedPatientId =
          patientRes?.returnData?.[0]?.p_patient_id ??
          patientRes?.returnData?.[0]?.patient_id ??
          "";

        await Promise.all([
          setUserId(userId),
          setRoleId(String(u.rol_id ?? "")),
          setUserName(u.usr_name ?? ""),
          saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
          // saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
          // saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
          saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
          resolvedPatientId
            ? setPatientId(String(resolvedPatientId))
            : Promise.resolve(),
        ]);
        await AsyncStorage.setItem(IS_LOGGED_IN, "true");

        // Step 2: Build patient fields from the returned user profile
        const attrs = parseAdditionalAttributes(u.additional_attributes);
        const name: string = u.usr_name ?? "";
        const dobValue: string = attrs.user_dob ?? u.usr_dob ?? "";
        const age = dobValue ? dayjs().diff(dobValue, "year") : 0;
        const userGender: string = attrs.user_gender ?? u.usr_gender ?? "Male";
        const nameParts = name.trim().split(" ");
        const fName = nameParts[0] ?? "";
        const lName = nameParts.slice(1).join(" ");
        const genderCode = userGender === "Female" ? "2" : "1";
        const formattedDob = dobValue
          ? dayjs(dobValue).format("YYYY-MM-DD")
          : "";

        const emiratesIdClean = isResident ? emiratesId.replace(/-/g, "") : "";
        const passportClean = !isResident ? passportNo.trim() : "";

        // Step 3: Check if a patient record already exists for this ID

        const checkRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            p_user_id: userId,
            p_additional_attribute: {
              // p_ptm_mobile_number: rawPhone,
              p_emirates_id: emiratesIdClean,
              p_passport_no: passportClean,
            },
            p_process_flag: "user_patients",
          },
        );

        if (hasReturnData(checkRes)) {
          // Patient record already exists — link it without creating a duplicate
          const existingPatientId = String(
            checkRes.returnData[0]?.p_patient_id ?? "",
          );
          if (existingPatientId) {
            await setPatientId(existingPatientId);
            await AsyncStorage.setItem(
              SPD_SELECTED_PATIENT,
              JSON.stringify({ name, age, gender: userGender }),
            );
            try {
              const stored = JSON.parse(
                (await getDecryptedID(USER_FULL_DATA)) ?? "{}",
              );
              stored.usr_patient_id = existingPatientId;
              await saveDataFromLocalStorage(
                USER_FULL_DATA,
                JSON.stringify(stored),
              );
            } catch (_) {}
          }
          Toast.show({
            type: "success",
            text1: "Welcome back!",
            text2: "Your account has been set up successfully.",
          });
          router.replace("/(drawer)/tab_bar_home/HomeScreen");
          return;
        }

        // Step 4: No patient record yet — create one
        const saveRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_save_trn_patient_master,
          {
            p_patient_id: null,
            p_patient_title: genderCode,
            p_name: fName,
            p_middle_name: "",
            p_last_name: lName,
            p_gender: genderCode,
            p_dob: formattedDob,
            p_age: String(age),
            p_marital_status: "",
            p_mobile_no: "",
            "p_mobile_no~CTN": "",
            p_email: "",
            ptd_home_phone: "",
            "ptd_home_phone~CTN": "",
            p_additional_attribute: {
              p_father_name: "",
              p_emirates_id: emiratesIdClean,
              p_identification_type: isResident ? "emirates_id" : "passport",
              p_identification_num: passportClean,
            },
            p_additional_attributes: {},
          },
        );

        const patientId = String(saveRes?.returnData?.[0]?.p_patient_id ?? "");
        if (patientId) {
          await setPatientId(patientId);
          await AsyncStorage.setItem(
            SPD_SELECTED_PATIENT,
            JSON.stringify({ name, age, gender: userGender }),
          );

          try {
            const stored = JSON.parse(
              (await getDecryptedID(USER_FULL_DATA)) ?? "{}",
            );
            stored.usr_patient_id = patientId;
            await saveDataFromLocalStorage(
              USER_FULL_DATA,
              JSON.stringify(stored),
            );
          } catch (_) {}

          await callSuggestusAPI(
            spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
            {
              p_patient_id: patientId,
              p_user_id: userId,
              p_additional_attribites: {},
            },
          );

          await callSuggestusAPI(
            spd_processId_config.xcelpat_save_mst_user_entity_mapping_common,
            {
              p_patient_id: patientId,
              p_user_id: userId,
              p_entity_code: await getStoredAiCode(),
              p_entity_reference_id: patientId,
              p_entity_reference_code: await getUserEntityReferenceCode(),
              p_active_status: "Y",
              p_process_flag: "Y",
              p_additional_attribites: {},
              p_internal_flag: "N",
            },
          );
        }

        Toast.show({
          type: "success",
          text1: "Welcome back!",
          text2: "Your account has been set up successfully.",
        });
      } catch (err) {
        console.error("[PersonalDetails] link account failed:", err);
        Toast.show({
          type: "error",
          text1: "Something Went Wrong",
          text2: "Unable to link your account. Please try again.",
        });
      } finally {
        setLoading(false);
      }
      router.replace("/(drawer)/tab_bar_home/HomeScreen");
      return;
    }

    // --- Path B: New user registration ---
    if (isResident && !emiratesId.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your Emirates ID to continue.",
      });
      return;
    }
    if (!isResident && !passportNo.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your Passport number to continue.",
      });
      return;
    }
    if (!firstName.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your First name to continue.",
      });
      return;
    }
    if (!lastName.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please enter your Last name to continue.",
      });
      return;
    }
    if (!gender) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please select your gender.",
      });
      return;
    }
    if (!dob) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Please select your date of birth.",
      });
      return;
    }

    setLoading(true);
    try {
      const fName = firstName.trim();
      const lName = lastName.trim();
      const name = `${fName} ${lName}`;
      const rawPhone = (route.params as any)?.phone_number ?? "";
      const emiratesIdClean = emiratesId.replace(/-/g, "");

      // Final existence check — skip if already verified as available for this value
      const alreadyVerified = isResident
        ? emiratesIdCheck.status === "available" &&
          emiratesIdCheck.checkedValue === emiratesId
        : passportCheck.status === "available" &&
          passportCheck.checkedValue === passportNo;

      if (!alreadyVerified) {
        const regUserId = (await fetchDataFromLocalStorage("sg_userId")) ?? "";

        console.log("regUserId :>>", regUserId);
        const checkRes = await callSuggestusAPI(
          spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
          {
            // p_user_id: regUserId,
            p_additional_attribute: {
              // p_ptm_mobile_number: rawPhone,
              p_emirates_id: isResident ? emiratesIdClean : "",
              p_passport_no: !isResident ? passportNo.trim() : "",
            },
            // p_ptm_first_name: "validate_duplicate",
          },
        );

        if (hasReturnData(checkRes)) {
          if (isResident) {
            setEmiratesIdCheck({ status: "exists", checkedValue: emiratesId });
          } else {
            setPassportCheck({ status: "exists", checkedValue: passportNo });
          }
          Toast.show({
            type: "error",
            text1: "Already Registered",
            text2: `A user with this ${isResident ? "Emirates ID" : "Passport"} is already registered.`,
          });
          return;
        }
      }

      // Save Full Name
      await setEncryptedID(SPD_USER_NAME, name);

      // Merge into USER_FULL_DATA
      const currentDataStr = await getDecryptedID(USER_FULL_DATA);
      let updatedData: Record<string, string> = {
        fname: name,
        firstName: fName,
        lastName: lName,
        dob: dayjs(dob).format("YYYY-MM-DD"),
        gender,
        emirates_id: isResident ? emiratesId.trim() : "",
        passport_no: !isResident ? passportNo.trim() : "",
        contact: rawPhone,
      };

      if (currentDataStr) {
        try {
          updatedData = { ...JSON.parse(currentDataStr), ...updatedData };
        } catch (_) {}
      }

      await setEncryptedID(USER_FULL_DATA, JSON.stringify(updatedData));

      // Register user
      const signupRes = await callSuggestusAPI(
        spd_processId_config.sgconf_save_mst_user_from_signup_wrapper,
        {
          p_create_ai_code: currentOrgAiCode,
          p_next_process_id:
            "sgconf_get_mst_user_profile_for_authentic_token_v2",
          p_register_new_patient_flag: "N",
          p_usr_phone: rawPhone,
          p_usr_name: name,
          p_usr_additional_attributes: JSON.stringify({
            p_first_name: fName,
            p_last_name: lName,
            USER_LOGIN_TYPE: "external",
            USER_LOGIN_TYPE_DETAIL: "otp",
            user_emirates_id: isResident ? emiratesId.trim() : "",
            user_passport_no: !isResident ? passportNo.trim() : "",
            user_dob: dayjs(dob).format("YYYY-MM-DD"),
            user_gender: gender,
            user_location_id: selectedLocation?.id ?? "",
            user_location_name: selectedLocation?.name ?? "",
          }),
        },
      );

      if (signupRes?.returnCode !== true) {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: signupRes?.returnMessage ?? "Please try again.",
        });
        return;
      }

      // Fetch full user profile
      const phoneE164 = rawPhone.replace(/\s+/g, "");
      let newUserId = "";
      try {
        const validateRes = await callSuggestusAPI(
          spd_processId_config.sgconf_util_validate_user_v2,
          {
            p_username: phoneE164.replace(/^\+/, ""),
            p_password: "",
            p_ai_code: currentOrgAiCode,
            p_login_type: "external",
          },
        );

        const validateOk =
          (validateRes?.returnCode === true ||
            validateRes?.returnCode === "true") &&
          validateRes?.returnData?.length > 0;

        if (validateOk) {
          const u = validateRes.returnData[0];
          newUserId = String(u.usr_id ?? "");

          const patientRes = await callSuggestusAPI(
            spd_processId_config.xcelpat_get_trn_patient_details_ehg_pntapp,
            {
              p_additional_attribute: {
                p_ptm_mobile_number: phoneE164,
                p_emirates_id: isResident ? emiratesIdClean : "",
                p_passport_no: !isResident ? passportNo.trim() : "",
              },
              p_process_flag: "validate_duplicate",
            },
          );
          const resolvedPatientId =
            patientRes?.returnData?.[0]?.p_patient_id ??
            patientRes?.returnData?.[0]?.patient_id ??
            "";

          await Promise.all([
            setUserId(newUserId),
            setRoleId(String(u.rol_id ?? "")),
            setUserName(u.usr_name ?? ""),
            saveDataFromLocalStorage("sg_userEmail", u.usr_email ?? ""),
            // saveDataFromLocalStorage("sg_org_id", u.org_id ?? ""),
            // saveDataFromLocalStorage("sg_org_name", u.org_name ?? ""),
            saveDataFromLocalStorage(USER_FULL_DATA, JSON.stringify(u)),
            resolvedPatientId
              ? setPatientId(String(resolvedPatientId))
              : Promise.resolve(),
          ]);
        }
      } catch (validateErr) {
        console.error(
          "[PersonalDetails] profile fetch after signup failed:",
          validateErr,
        );
      }

      await AsyncStorage.setItem(IS_LOGGED_IN, "true");

      // Map the newly created user to every location org from
      // sgconf_get_mst_organization_location_patient_portal_list (the same
      // list populating the Location dropdown), not just the one selected.
      // sgUserId / sgRoleId / sgOrgId are "userdata" — auto-injected by
      // callSuggestusAPI from the session set just above, not passed here.
      if (newUserId) {
        try {
          const defaultJsonStr = await getDecryptedID("DEFAULT_JSON_DATA");
          const defaultJson = defaultJsonStr ? JSON.parse(defaultJsonStr) : {};
          const orgCodes = defaultJson?.spd_app_location_list ?? "";
          await callSuggestusAPI(
            spd_processId_config.sgconf_save_update_mst_user_org_mapping_custom,
            {
              p_map_user_id: newUserId,
              p_org_codes: orgCodes || "",
              p_process_flag: "map_multiple_user",
              p_additional_attribute: "",
            },
          );
        } catch (orgMapErr) {
          console.error(
            "[PersonalDetails] user-org mapping failed:",
            orgMapErr,
          );
        }

        // Mark the location the user actually registered under (not every
        // mapped org above) as their default, so it's the one restored on
        // login/logout instead of falling back to the static site config.
        try {
          await callSuggestusAPI(
            spd_processId_config.sgconf_save_update_mst_user_org_mapping_custom_mark_default,
            {
              p_map_user_id: newUserId,
              p_org_codes: currentOrgAiCode,
              p_process_flag: "mark_default_single",
              p_additional_attribute: "",
              p_internal_flag: "N",
            },
          );
        } catch (markDefaultErr) {
          console.error(
            "[PersonalDetails] mark-default-location failed:",
            markDefaultErr,
          );
        }
      }

      // If a patient record already existed for this Emirates ID / Passport,
      // link it to the new user account and go straight to HomeScreen.
      if (linkedPatientId && newUserId) {
        try {
          await setPatientId(linkedPatientId);
          await Promise.all([
            callSuggestusAPI(
              spd_processId_config.xcelpat_update_trn_patient_user_mapping_ehg_pntapp,
              {
                p_patient_id: linkedPatientId,
                p_user_id: newUserId,
                p_additional_attribites: {},
              },
            ),
            callSuggestusAPI(
              spd_processId_config.xcelpat_save_mst_user_entity_mapping_common,
              {
                p_patient_id: linkedPatientId,
                p_user_id: newUserId,
                p_entity_code: await getStoredAiCode(),
                p_entity_reference_id: linkedPatientId,
                p_entity_reference_code: await getUserEntityReferenceCode(),
                p_active_status: "Y",
                p_process_flag: "Y",
                p_additional_attribites: {},
                p_internal_flag: "N",
              },
            ),
          ]);
        } catch (linkErr) {
          console.error("[PersonalDetails] patient linking failed:", linkErr);
        }
        Toast.show({
          type: "success",
          text1: "Registration Complete",
          text2: "Welcome to Emirates Hospitals Group",
        });
        router.replace({
          pathname: "/init_screens/terms_and_privacy",
          params: {
            user_id: newUserId,
            next: "/(drawer)/tab_bar_home/HomeScreen",
          },
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Profile Updated Successfully",
          text2: "Welcome to Emirates Hospitals Group",
        });
        router.replace({
          pathname: "/init_screens/terms_and_privacy",
          params: { user_id: newUserId, next: "/patient/patient_selection" },
        });
      }
    } catch (error) {
      console.error("[PersonalDetails] registration error:", error);
      Toast.show({
        type: "error",
        text1: "Something Went Wrong",
        text2:
          "Unable to save your details. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const { height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenHeight < 680;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
        >
          <View
            style={[
              styles.content,
              { paddingTop: isSmallScreen ? Spacing.xl : Spacing["4xl"] },
            ]}
          >
            {/* Resident / Non-Resident tabs */}
            <CustomTabs
              tabs={["Resident", "Non-Resident"]}
              activeTab={isResident ? "Resident" : "Non-Resident"}
              onTabChange={(tab) => setIsResident(tab === "Resident")}
            />

            <Text style={styles.subtext}>
              Complete your profile for a personalized healthcare experience.
            </Text>

            {/* ID field — Emirates ID or Passport based on active tab */}
            {isResident ? (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Emirates ID</Text>
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => {
                      setScanTarget("emirates");
                      setShowScanModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="scan-outline"
                      size={16}
                      color={Colors.secondary}
                    />
                    <Text style={styles.scanButtonText}>Scan</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "emiratesId" && styles.inputWrapperFocused,
                    emiratesIdCheck.status === "exists" &&
                      styles.inputWrapperError,
                    emiratesIdCheck.status === "available" &&
                      styles.inputWrapperSuccess,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholder="784-0000-0000000-0"
                    placeholderTextColor={Colors.inactive}
                    value={emiratesId}
                    onChangeText={(text) => {
                      const formatted = formatEmiratesId(text);
                      setEmiratesId(formatted);
                      if (formatted !== emiratesIdCheck.checkedValue) {
                        if (emiratesIdCheck.status === "available") {
                          setFirstName("");
                          setLastName("");
                          setDob(null);
                          setGender("Male");
                          setLinkedPatientId("");
                        }
                        setEmiratesIdCheck({
                          status: "idle",
                          checkedValue: "",
                        });
                      }
                    }}
                    onFocus={() => setFocusedField("emiratesId")}
                    onBlur={() => {
                      setFocusedField("");
                      if (
                        emiratesId.trim() &&
                        emiratesId !== emiratesIdCheck.checkedValue
                      ) {
                        checkExistence("emirates", emiratesId);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={18}
                    returnKeyType="next"
                  />
                  {renderFieldStatus(emiratesIdCheck)}
                </View>
                {emiratesIdCheck.status === "invalid" && (
                  <Text style={styles.fieldError}>
                    Please enter a valid Emirates ID (784-XXXX-XXXXXXX-X)
                  </Text>
                )}
                {emiratesIdCheck.status === "exists" && (
                  <Text style={styles.fieldError}>
                    A user with this Emirates ID is already registered
                  </Text>
                )}
                {emiratesIdCheck.status === "error" && (
                  <Text style={styles.fieldError}>
                    Unable to verify — please try again
                  </Text>
                )}
                {emiratesIdCheck.status === "available" && linkedPatientId ? (
                  <Text style={styles.fieldInfo}>
                    {`Patient with the same Emirates ID "${emiratesId}" already exists. Click Below to continue with the existing patient.`}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Passport no.</Text>
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => {
                      setScanTarget("passport");
                      setShowScanModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="scan-outline"
                      size={16}
                      color={Colors.secondary}
                    />
                    <Text style={styles.scanButtonText}>Scan</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "passportNo" && styles.inputWrapperFocused,
                    passportCheck.status === "exists" &&
                      styles.inputWrapperError,
                    passportCheck.status === "available" &&
                      styles.inputWrapperSuccess,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.inputNoOutline]}
                    placeholder="A1234567"
                    placeholderTextColor={Colors.inactive}
                    value={passportNo}
                    onChangeText={(text) => {
                      const formatted = formatPassport(text);
                      setPassportNo(formatted);
                      if (formatted !== passportCheck.checkedValue) {
                        if (passportCheck.status === "available") {
                          setFirstName("");
                          setLastName("");
                          setDob(null);
                          setGender("Male");
                          setLinkedPatientId("");
                        }
                        setPassportCheck({ status: "idle", checkedValue: "" });
                      }
                    }}
                    onFocus={() => setFocusedField("passportNo")}
                    onBlur={() => {
                      setFocusedField("");
                      if (
                        passportNo.trim() &&
                        passportNo !== passportCheck.checkedValue
                      ) {
                        checkExistence("passport", passportNo);
                      }
                    }}
                    autoCapitalize="characters"
                    maxLength={12}
                    returnKeyType="next"
                  />
                  {renderFieldStatus(passportCheck)}
                </View>
                {passportCheck.status === "invalid" && (
                  <Text style={styles.fieldError}>
                    Please enter a valid Passport number (min. 6 characters)
                  </Text>
                )}
                {passportCheck.status === "exists" && (
                  <Text style={styles.fieldError}>
                    A user with this Passport is already registered
                  </Text>
                )}
                {passportCheck.status === "error" && (
                  <Text style={styles.fieldError}>
                    Unable to verify — please try again
                  </Text>
                )}
                {passportCheck.status === "available" && linkedPatientId ? (
                  <Text style={styles.fieldInfo}>
                    {`Patient with the same Passport No. "${passportNo}" already exists. Click Below to continue with the existing patient.`}
                  </Text>
                ) : null}
              </View>
            )}

            {/* First Name, Last Name, DOB, Gender — locked until ID is verified */}
            <View
              pointerEvents={idVerified ? "auto" : "none"}
              style={!idVerified && styles.fieldsDisabled}
            >
              {/* First Name & Last Name */}
              <View style={styles.rowContainer}>
                <View
                  style={[
                    styles.inputContainer,
                    { flex: 1, marginRight: Spacing.sm },
                  ]}
                >
                  <Text style={styles.inputLabel}>First name</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "firstName" &&
                        styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={Colors.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.inputNoOutline]}
                      placeholderTextColor={Colors.inactive}
                      value={firstName}
                      onChangeText={setFirstName}
                      onFocus={() => setFocusedField("firstName")}
                      onBlur={() => setFocusedField("")}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    { flex: 1, marginLeft: Spacing.sm },
                  ]}
                >
                  <Text style={styles.inputLabel}>Last name</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "lastName" && styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={Colors.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.inputNoOutline]}
                      placeholderTextColor={Colors.inactive}
                      value={lastName}
                      onChangeText={setLastName}
                      onFocus={() => setFocusedField("lastName")}
                      onBlur={() => setFocusedField("")}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>

              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of birth</Text>
                <TouchableOpacity
                  style={[
                    styles.inputWrapper,
                    showDatePicker && styles.inputWrapperFocused,
                  ]}
                  onPress={() => {
                    setCalendarMonth(
                      dayjs(dob ?? undefined).format("YYYY-MM-DD"),
                    );
                    setShowYearGrid(false);
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.input, !dob && styles.inputPlaceholderText]}
                  >
                    {dob ? dayjs(dob).format("MMM DD, YYYY") : "MMM DD, YYYY"}
                  </Text>
                  <Text style={styles.changeLinkText}>
                    {dob ? (
                      "Change"
                    ) : (
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={Colors.secondary}
                        style={styles.inputIcon}
                      />
                    )}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.rowContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderBox,
                      gender === "Male" && styles.genderBoxActive,
                      { marginRight: Spacing.sm },
                    ]}
                    onPress={() => setGender("Male")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          gender === "Male" && styles.radioOuterActive,
                        ]}
                      >
                        {gender === "Male" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.genderText}>Male</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderBox,
                      gender === "Female" && styles.genderBoxActive,
                      { marginLeft: Spacing.sm },
                    ]}
                    onPress={() => setGender("Female")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          gender === "Female" && styles.radioOuterActive,
                        ]}
                      >
                        {gender === "Female" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.genderText}>Female</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* end fieldsDisabled wrapper */}

            {/* Location — always enabled, not gated by ID verification */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.8}
                disabled={loadingLocations}
              >
                <Text
                  style={[
                    styles.input,
                    !selectedLocation && styles.inputPlaceholderText,
                  ]}
                >
                  {selectedLocation ? selectedLocation.name : "Select location"}
                </Text>
                {loadingLocations ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.textLabel}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBtnContainer,
            {
              paddingBottom:
                Platform.OS === "ios"
                  ? isSmallScreen
                    ? Spacing.lg
                    : Spacing["3xl"] + Spacing.xs
                  : Spacing["2xl"],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueBtn,
              isFormValid
                ? styles.continueBtnEnabled
                : styles.continueBtnDisabled,
            ]}
            disabled={loading || !isFormValid}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.continueBtnText}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.dobModalOverlay}>
          <View style={styles.dobModalCard}>
            {showYearGrid ? (
              <View style={styles.yearGridContainer}>
                <Text style={styles.yearGridTitle}>Select year</Text>
                <ScrollView
                  style={styles.yearGridScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.yearGrid}>
                    {Array.from(
                      { length: dayjs().year() - 1900 + 1 },
                      (_, i) => dayjs().year() - i,
                    ).map((year) => {
                      const isSelected = dayjs(calendarMonth).year() === year;
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.yearCell,
                            isSelected && styles.yearCellSelected,
                          ]}
                          onPress={() => {
                            const next = dayjs(calendarMonth).year(year);
                            const today = dayjs();
                            setCalendarMonth(
                              (next.isAfter(today) ? today : next).format(
                                "YYYY-MM-DD",
                              ),
                            );
                            setShowYearGrid(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.yearCellText,
                              isSelected && styles.yearCellTextSelected,
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <Calendar
                key={calendarMonth}
                current={calendarMonth}
                hideArrows
                renderHeader={() => {
                  const jumpTo = (unit: "year" | "month", amount: number) => {
                    const next = dayjs(calendarMonth).add(amount, unit);
                    const today = dayjs();
                    const minMonth = dayjs("1900-01-01");
                    const clamped = next.isAfter(today)
                      ? today
                      : next.isBefore(minMonth)
                        ? minMonth
                        : next;
                    setCalendarMonth(clamped.format("YYYY-MM-DD"));
                  };
                  return (
                    <View style={styles.calendarHeaderRow}>
                      <TouchableOpacity
                        onPress={() => jumpTo("year", -1)}
                        style={styles.calendarNavBtn}
                      >
                        <Ionicons
                          name="play-back"
                          size={16}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => jumpTo("month", -1)}
                        style={styles.calendarNavBtn}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={20}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowYearGrid(true)}
                        style={styles.calendarHeaderLabelBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.calendarHeaderText}>
                          {dayjs(calendarMonth).format("MMMM YYYY")}
                        </Text>
                        <Ionicons
                          name="caret-down"
                          size={12}
                          color={Colors.primary}
                          style={{ marginLeft: Spacing.xs }}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => jumpTo("month", 1)}
                        style={styles.calendarNavBtn}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => jumpTo("year", 1)}
                        style={styles.calendarNavBtn}
                      >
                        <Ionicons
                          name="play-forward"
                          size={16}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }}
                onMonthChange={(m: { dateString: string }) =>
                  setCalendarMonth(m.dateString)
                }
                onDayPress={(day: { dateString: string }) => {
                  const selectedDate = new Date(`${day.dateString}T00:00:00`);
                  const today = new Date();
                  const minDate = new Date(1900, 0, 1);
                  setDob(
                    selectedDate > today
                      ? today
                      : selectedDate < minDate
                        ? minDate
                        : selectedDate,
                  );
                  setShowDatePicker(false);
                }}
                minDate="1900-01-01"
                maxDate={dayjs().format("YYYY-MM-DD")}
                markedDates={
                  dob
                    ? {
                        [dayjs(dob).format("YYYY-MM-DD")]: {
                          selected: true,
                          selectedColor: Colors.primary,
                        },
                      }
                    : {}
                }
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
            )}
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={styles.dobModalCancelButton}
            >
              <Text style={styles.dobModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          <Pressable style={styles.locationSheetCard} onPress={() => {}}>
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
                  const isSelected = selectedLocation?.id === item.id;
                  const isDefault = item.isDefault;
                  return (
                    <TouchableOpacity
                      style={styles.locationSheetRow}
                      onPress={() => {
                        setSelectedLocation(item);
                        setShowLocationPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.locationSheetIconWrap}>
                        <Ionicons
                          name="location"
                          size={18}
                          color={Colors.secondary}
                        />
                      </View>
                      <View style={styles.locationSheetTextCol}>
                        <View style={styles.locationSheetNameRow}>
                          <Text style={styles.locationSheetName}>
                            {item.name}
                          </Text>
                          {isDefault && (
                            <View style={styles.locationSheetDefaultBadge}>
                              <Text style={styles.locationSheetDefaultText}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name={
                          isSelected ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={22}
                        color={isSelected ? Colors.secondary : Colors.border}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Emirates ID / Passport scan — real camera + on-device ML Kit OCR */}
      <Modal
        visible={showScanModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowScanModal(false)}
      >
        <View style={styles.scanOverlay}>
          {scanPhase === "success" && scannedData ? (
            <View style={styles.scanSuccessCard}>
              <View
                style={[
                  styles.scanSuccessIconWrap,
                  { backgroundColor: SUCCESS_TINT },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={36}
                  color={Colors.success}
                />
              </View>
              <Text style={styles.scanSuccessTitle}>Scan Successful!</Text>
              <Text style={styles.scanSuccessSubtitle}>
                {scanDocLabel} : {scannedData.idNumber}
              </Text>
              <View style={styles.scanSuccessDivider} />
              <View style={styles.scanSuccessRow}>
                <Text style={styles.scanSuccessLabel}>Name</Text>
                <Text
                  style={[
                    styles.scanSuccessValue,
                    !(scannedData.firstName || scannedData.lastName) && {
                      color: Colors.inactive,
                    },
                  ]}
                >
                  {scannedData.firstName || scannedData.lastName
                    ? `${scannedData.firstName} ${scannedData.lastName}`.trim()
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.scanSuccessRow}>
                <Text style={styles.scanSuccessLabel}>Date of Birth</Text>
                <Text
                  style={[
                    styles.scanSuccessValue,
                    !scannedData.dob && { color: Colors.inactive },
                  ]}
                >
                  {scannedData.dob
                    ? dayjs(scannedData.dob).format("MMM DD, YYYY")
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.scanSuccessRow}>
                <Text style={styles.scanSuccessLabel}>Gender</Text>
                <Text
                  style={[
                    styles.scanSuccessValue,
                    !scannedData.gender && { color: Colors.inactive },
                  ]}
                >
                  {scannedData.gender || "N/A"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.scanDoneButton}
                onPress={handleScanDone}
                activeOpacity={0.85}
              >
                <Text style={styles.scanDoneButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleScanRetry}
                style={styles.scanCancelButton}
              >
                <Text
                  style={[styles.scanCancelText, { color: Colors.textLabel }]}
                >
                  Retake
                </Text>
              </TouchableOpacity>
            </View>
          ) : scanPhase === "error" ? (
            <View style={styles.scanSuccessCard}>
              <View
                style={[
                  styles.scanSuccessIconWrap,
                  { backgroundColor: ERROR_TINT },
                ]}
              >
                <Ionicons name="alert-circle" size={36} color={Colors.error} />
              </View>
              <Text style={styles.scanSuccessTitle}>Scan Failed</Text>
              <Text style={styles.scanSuccessSubtitle}>{scanErrorMessage}</Text>
              <TouchableOpacity
                style={styles.scanDoneButton}
                onPress={handleScanRetry}
                activeOpacity={0.85}
              >
                <Text style={styles.scanDoneButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowScanModal(false)}
                style={styles.scanCancelButton}
              >
                <Text
                  style={[styles.scanCancelText, { color: Colors.textLabel }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : !cameraPermission?.granted ? (
            <View style={styles.scanSuccessCard}>
              <View
                style={[
                  styles.scanSuccessIconWrap,
                  { backgroundColor: NEUTRAL_TINT },
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={36}
                  color={Colors.textLabel}
                />
              </View>
              <Text style={styles.scanSuccessTitle}>Camera Access Needed</Text>
              <Text style={styles.scanSuccessSubtitle}>
                Please allow camera access to scan your {scanDocLabel}.
              </Text>
              <TouchableOpacity
                style={styles.scanDoneButton}
                onPress={requestCameraPermission}
                activeOpacity={0.85}
              >
                <Text style={styles.scanDoneButtonText}>Grant Access</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowScanModal(false)}
                style={styles.scanCancelButton}
              >
                <Text
                  style={[styles.scanCancelText, { color: Colors.textLabel }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanFullScreen}>
              {/* Always mounted — never unmounted/remounted between phases,
                  so there's no black gap while swapping in the captured
                  photo underneath the scanning overlay. */}
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
              />

              {/* Dimmed scrim with a clear cutout around the frame */}
              <View style={styles.scanScrimColumn} pointerEvents="none">
                <View style={styles.scanScrimBlock} />
                <View style={styles.scanScrimMiddleRow}>
                  <View style={styles.scanScrimBlock} />
                  <View style={styles.scanFrameWindow}>
                    {/* Captured photo pops in on top of the live feed the
                        moment it's ready — the dim + scan-line overlay
                        (already running since the instant of the tap)
                        masks the swap so it reads as one continuous
                        freeze rather than a flicker. */}
                    {scanPhase === "processing" && capturedImageUri && (
                      <Image
                        source={{ uri: capturedImageUri }}
                        style={styles.scanCapturedImage}
                        resizeMode="cover"
                      />
                    )}
                    {scanPhase === "processing" && (
                      <>
                        <View style={styles.scanCapturedImageDim} />
                        <Animated.View
                          style={[
                            styles.scanLine,
                            { backgroundColor: scanFrameColor },
                            {
                              transform: [
                                {
                                  translateY: scanLineProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, SCAN_FRAME_HEIGHT - 3],
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                      </>
                    )}
                    <View
                      style={[
                        styles.scanCorner,
                        styles.scanCornerTL,
                        { borderColor: scanFrameColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.scanCorner,
                        styles.scanCornerTR,
                        { borderColor: scanFrameColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.scanCorner,
                        styles.scanCornerBL,
                        { borderColor: scanFrameColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.scanCorner,
                        styles.scanCornerBR,
                        { borderColor: scanFrameColor },
                      ]}
                    />
                  </View>
                  <View style={styles.scanScrimBlock} />
                </View>
                <View style={styles.scanScrimBlock} />
              </View>

              {/* Header */}
              <View style={styles.scanHeader}>
                <TouchableOpacity
                  onPress={() => setShowScanModal(false)}
                  style={styles.scanHeaderCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={Colors.lightgray} />
                </TouchableOpacity>
                <Text style={styles.scanHeaderTitle}>Scan {scanDocLabel}</Text>
                <View style={styles.scanHeaderSpacer} />
              </View>

              {/* Bottom controls */}
              <View style={styles.scanBottomPanel}>
                {scanPhase === "processing" && (
                  <ActivityIndicator
                    color={scanFrameColor}
                    style={{ marginBottom: Spacing.md }}
                  />
                )}
                <Text
                  style={[styles.scanStatusText, { color: scanFrameColor }]}
                >
                  {scanStatusText}
                </Text>
                {scanPhase === "searching" && (
                  <>
                    <TouchableOpacity
                      style={styles.scanShutterButton}
                      onPress={handleCaptureTap}
                      activeOpacity={0.8}
                    >
                      <View style={styles.scanShutterInner} />
                    </TouchableOpacity>
                    <Text style={styles.scanShutterHint}>Tap to capture</Text>
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
      <Toast />
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dobModalOverlay: {
    flex: 1,
    backgroundColor: `${Colors.text}26`,
    justifyContent: "center",
    alignItems: "center",
  },
  dobModalCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minWidth: 320,
    elevation: 4,
  },
  dobModalCancelButton: {
    marginTop: Spacing.sm,
    alignSelf: "flex-end",
  },
  dobModalCancelText: {
    color: Colors.primary,
    fontFamily: FontFamilies.semiBold,
    fontSize: FontSizes.lg,
  },
  locationList: {
    maxHeight: 320,
  },
  locationRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationRowText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.medium,
    color: Colors.text,
  },
  locationEmptyText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.medium,
    color: Colors.textLabel,
    paddingVertical: Spacing.xl,
    textAlign: "center",
  },
  locationSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginBottom: 12,
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
    backgroundColor: Colors.pressed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  scanOverlay: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFullScreen: {
    width: "100%",
    height: "100%",
  },
  scanScrimColumn: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  scanScrimMiddleRow: {
    height: SCAN_FRAME_HEIGHT,
    flexDirection: "row",
  },
  scanScrimBlock: {
    flex: 1,
    backgroundColor: Colors.shadow,
  },
  scanFrameWindow: {
    width: SCAN_FRAME_WIDTH,
    height: SCAN_FRAME_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  scanCapturedImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scanCapturedImageDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.shadowMedium,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    borderRadius: BorderRadius.sm,
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scanCorner: {
    position: "absolute",
    width: 32,
    height: 32,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BorderRadius.lg,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BorderRadius.lg,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BorderRadius.lg,
  },
  scanHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop:
      Platform.OS === "ios" ? Spacing["4xl"] + Spacing.md : Spacing["2xl"],
    paddingBottom: Spacing.md,
  },
  scanHeaderCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlayOnDark,
    alignItems: "center",
    justifyContent: "center",
  },
  scanHeaderTitle: {
    color: Colors.lightgray,
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.semiBold,
  },
  scanHeaderSpacer: {
    width: 36,
  },
  scanBottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingTop: Spacing["2xl"],
    paddingBottom:
      Platform.OS === "ios" ? Spacing["4xl"] + Spacing.sm : Spacing["3xl"],
    paddingHorizontal: Spacing["3xl"],
  },
  scanStatusText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.semiBold,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  scanShutterButton: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: Colors.lightgray,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  scanShutterInner: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightgray,
  },
  scanShutterHint: {
    marginTop: Spacing.sm,
    color: Colors.lightgray,
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.medium,
  },
  scanCancelButton: {
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
  },
  scanCancelText: {
    color: Colors.lightgray,
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.semiBold,
  },
  scanSuccessCard: {
    width: 300,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing["2xl"],
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  scanSuccessIconWrap: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  scanSuccessTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  scanSuccessSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.medium,
    color: Colors.textLabel,
    marginBottom: Spacing.lg,
  },
  scanSuccessDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  scanSuccessRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  scanSuccessLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.medium,
    color: Colors.textLabel,
  },
  scanSuccessValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
  },
  scanDoneButton: {
    width: "100%",
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  scanDoneButtonText: {
    color: Colors.lightgray,
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.bold,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.sm,
  },
  calendarNavBtn: {
    padding: Spacing.sm,
  },
  calendarHeaderLabelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarHeaderText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
  },
  yearGridContainer: {
    minHeight: 300,
  },
  yearGridTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  yearGridScroll: {
    maxHeight: 300,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  yearCell: {
    width: "31%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.sm,
    backgroundColor: Colors.lightgray,
  },
  yearCellSelected: {
    backgroundColor: Colors.primary,
  },
  yearCellText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.medium,
    color: Colors.text,
  },
  yearCellTextSelected: {
    color: Colors.background,
    fontFamily: FontFamilies.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing["2xl"],
  },

  subtext: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    marginBottom: Spacing["2xl"],
    lineHeight: 20,
    textAlign: "left",
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.semiBold,
    color: Colors.textLabel,
    marginBottom: Spacing.sm,
    textAlign: "left",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  scanButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.semiBold,
    color: Colors.secondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: Colors.secondary,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: ERROR_SURFACE,
  },
  inputWrapperSuccess: {
    borderColor: Colors.success,
    backgroundColor: SUCCESS_SURFACE,
  },
  fieldError: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamilies.medium,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  fieldInfo: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamilies.medium,
    color: Colors.warning,
    marginTop: Spacing.xs + Spacing.xs,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.lg,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
    paddingVertical: 0,
    minWidth: 0,
  },
  inputPlaceholderText: {
    color: Colors.inactive,
    fontFamily: FontFamilies.medium,
  },
  inputNoOutline: {
    outlineStyle: "none",
    outlineWidth: 0,
  } as any,
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  changeLinkText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.bold,
    color: Colors.secondary,
  },
  genderBox: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.lightgray,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  genderBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.inactive,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  genderText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
  bottomBtnContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  continueBtn: {
    width: "100%",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  continueBtnEnabled: {
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  continueBtnDisabled: {
    backgroundColor: Colors.inactive,
  },
  fieldsDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: Colors.lightgray,
    fontSize: FontSizes.lg,
    fontFamily: FontFamilies.bold,
  },
});
