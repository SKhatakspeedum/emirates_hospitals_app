import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Animated,
  SafeAreaView,
  Image,
  FlatList,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import WebTimePicker from "../components/WebTimePicker";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { spd_processId_config } from "../config/process_id";
// Import API client (same as SleepCheckIn)
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_ID } from "../config/config";
import Svg, { Path } from "react-native-svg";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const PURPLE = "#8B4CFC";
const LIGHT_PURPLE = "#ECE6FB";
const BORDER = "#E6E6E6";
const TEXT = "#262626";
const SUBTEXT = "#888";

const getToday = () => {
  // Use current date in YYYY-MM-DD
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split("T")[0];
};

const getMinDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pad(num: number) {
  return num < 10 ? "0" + num : num;
}

const PROCESS_ID_GET =
  spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_out;
const PROCESS_ID_SAVE =
  spd_processId_config.spdonmood9_save_md_user_sleep_hygiene_check_out;
const PROCESS_ID_UPDATE =
  spd_processId_config.spdonmood9_update_md_user_sleep_hygiene_check_out;

const SleepCheckOut: React.FC = () => {
  const navigation = useNavigation();
  const horizontalMargin = useResponsiveHorizontalMargin();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false); // for GET
  const [submitLoading, setSubmitLoading] = useState(false); // for submit/update
  const [fetchedDataExists, setFetchedDataExists] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());
  // For storing the last fetched payload for update
  const [lastFetchedPayload, setLastFetchedPayload] = useState<any>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const [bedTime, setBedTime] = useState(new Date()); // JS Date object
  // Add a flag to prevent useEffect on initial mount from triggering twice
  const [didInitialFetch, setDidInitialFetch] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [fallAsleepDuration, setFallAsleepDuration] = useState({
    hours: 0,
    minutes: 0,
  });
  const [isFallAsleepDurationVisible, setFallAsleepDurationVisible] =
    useState(false);

  const [wakeTime, setWakeTime] = useState(new Date(2025, 4, 2, 6, 0));
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  const [getOutOfBedDuration, setGetOutOfBedDuration] = useState({
    hours: 0,
    minutes: 0,
  });
  const [isGetOutOfBedDurationVisible, setGetOutOfBedDurationVisible] =
    useState(false);

  const [wakeups, setWakeups] = useState(0);
  const [isWakeupsPickerVisible, setWakeupsPickerVisible] = useState(false);

  // New question 7: total awake duration
  const [awakeDuration, setAwakeDuration] = useState({
    hours: 0,
    minutes: 0,
  });
  const [isAwakeDurationVisible, setAwakeDurationVisible] = useState(false);

  // New question 8: sleep quality
  const qualityOptions = [
    "Very Poor",
    "Poor",
    "Good",
    "Very Good",
    "Excellent",
  ];
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [isQualityPickerVisible, setQualityPickerVisible] = useState(false);

  const [isSubmitModalVisible, setSubmitModalVisible] = useState(false);
  const [dropdownAnim] = useState(new Animated.Value(0));

  const [hours, setHours] = useState(bedTime.getHours() % 12 || 12);
  const [minutes, setMinutes] = useState(bedTime.getMinutes());
  const [amPm, setAmPm] = useState(bedTime.getHours() >= 12 ? "PM" : "AM");

  const [wakeHours, setWakeHours] = useState(wakeTime.getHours() % 12 || 12);
  const [wakeMinutes, setWakeMinutes] = useState(wakeTime.getMinutes());
  const [wakeAmPm, setWakeAmPm] = useState(
    wakeTime.getHours() >= 12 ? "PM" : "AM"
  );

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen((open) => {
      Animated.timing(dropdownAnim, {
        toValue: open ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return !open;
    });
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date.toISOString().slice(0, 10));
    setDatePickerVisible(false);
  };

  const handleBedTimeConfirm = (date: Date) => {
    setBedTime(date);
    setShowTimePicker(false);
  };

  const handleWakeTimeConfirm = (date: Date) => {
    setWakeTime(date);
    setShowWakeTimePicker(false);
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setDropdownOpen(false);
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // --- Fetch Data Logic ---
  useEffect(() => {
    // Only fetch after mount or date change
    if (!didInitialFetch) {
      setDidInitialFetch(true);
      fetchCheckOut(selectedDate);
    } else {
      fetchCheckOut(selectedDate);
    }
    // eslint-disable-next-line
  }, [selectedDate]);

  const fetchCheckOut = async (date: string) => {
    setLoading(true);
    const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
    try {
      const payload = {
        p_user_id: USER_ID,
        p_sleep_checkout_date: date,
      };
      const response = await callSuggestusAPI(PROCESS_ID_GET, payload);
      if (response?.returnData && response.returnData[0]?.check_out_data) {
        const data = JSON.parse(response.returnData[0].check_out_data);
        // Populate all fields from data
        parseAndSetFieldsFromData(data);
        setFetchedDataExists(true);
        setLastFetchedPayload(data);
      } else {
        resetFieldsToDefault();
        setFetchedDataExists(false);
        setLastFetchedPayload(null);
      }
    } catch (e) {
      resetFieldsToDefault();
      setFetchedDataExists(false);
      setLastFetchedPayload(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to set all fields from API data
  const parseAndSetFieldsFromData = (data: any) => {
    // Format: { bed_time, minutes_to_fall_asleep, wakeup_time, minutes_after_wakeup, sleep_interruptions, awake_time, sleep_rating }
    // bed_time: "10:00:PM", wakeup_time: "6:00:AM" (convert to Date)
    // minutes_to_fall_asleep: 60 (convert to {h,m})
    // minutes_after_wakeup: 240 (convert to {h,m})
    // sleep_interruptions: "6" (number)
    // awake_time: 180 (convert to {h,m})
    // sleep_rating: "5" (string/option)
    // ---
    // Bed time
    if (data.bed_time) {
      setBedTime(parseTimeStringToDate(data.bed_time, selectedDate));
    } else {
      setBedTime(new Date(selectedDate + "T22:00:00"));
    }
    // Fall asleep duration
    if (data.minutes_to_fall_asleep !== undefined) {
      setFallAsleepDuration(minutesToDuration(data.minutes_to_fall_asleep));
    } else {
      setFallAsleepDuration({ hours: 0, minutes: 0 });
    }
    // Wake time
    if (data.wakeup_time) {
      setWakeTime(parseTimeStringToDate(data.wakeup_time, selectedDate));
    } else {
      setWakeTime(new Date(selectedDate + "T06:00:00"));
    }
    // Get out of bed duration
    if (data.minutes_after_wakeup !== undefined) {
      setGetOutOfBedDuration(minutesToDuration(data.minutes_after_wakeup));
    } else {
      setGetOutOfBedDuration({ hours: 0, minutes: 0 });
    }
    // Sleep interruptions (wakeups)
    setWakeups(Number(data.sleep_interruptions) || 0);
    // Awake duration
    if (data.awake_time !== undefined) {
      setAwakeDuration(minutesToDuration(data.awake_time));
    } else {
      setAwakeDuration({ hours: 0, minutes: 0 });
    }
    // Sleep quality
    setSleepQuality(
      data.sleep_rating ? mapSleepRatingToQuality(data.sleep_rating) : "Good"
    );
  };

  // Reset all fields to default
  const resetFieldsToDefault = () => {
    setBedTime(new Date(selectedDate + "T22:00:00"));
    setFallAsleepDuration({ hours: 0, minutes: 0 });
    setWakeTime(new Date(selectedDate + "T06:00:00"));
    setGetOutOfBedDuration({ hours: 0, minutes: 0 });
    setWakeups(0);
    setAwakeDuration({ hours: 0, minutes: 0 });
    setSleepQuality("Good");
  };

  // Helpers
  function parseTimeStringToDate(timeStr: string, dateStr: string) {
    // "10:00:PM" or "6:00:AM" to Date
    const [h, m, ampm] = timeStr.split(":");
    let hour = parseInt(h, 10);
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    const dt = new Date(dateStr + "T00:00:00");
    dt.setHours(hour, parseInt(m, 10), 0, 0);
    return dt;
  }
  function minutesToDuration(mins: number) {
    return { hours: Math.floor(mins / 60), minutes: mins % 60 };
  }
  function durationToMinutes(dur: { hours: number; minutes: number }) {
    return (Number(dur.hours) || 0) * 60 + (Number(dur.minutes) || 0);
  }
  function mapSleepRatingToQuality(rating: string) {
    // "1" = Very Poor ... "5" = Excellent
    const idx = Number(rating) - 1;
    return qualityOptions[idx] || "Good";
  }
  function mapQualityToSleepRating(quality: string) {
    // Inverse map
    const idx = qualityOptions.indexOf(quality);
    return idx === -1 ? "3" : String(idx + 1);
  }

  const renderDurationPicker = (
    visible: boolean,
    onClose: () => void,
    duration: { hours: number; minutes: number },
    setDuration: (d: { hours: number; minutes: number }) => void
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.durationModalContainer,
          Platform.OS === "web" && screenWidth >= 1024 ? { width: 420, minHeight: 320 } : {}
        ]}>
          <Text style={styles.modalTitle}>Select Duration</Text>
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginVertical: 16,
              },
              Platform.OS === "web" && screenWidth >= 1024 ? { width: 320, height: 220 } : {}
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                setDuration({
                  ...duration,
                  hours: duration.hours === 0 ? 12 : duration.hours - 1,
                })
              }
              style={styles.pickerBtn}
            >
              <Text style={styles.pickerBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.durationNumber}>{pad(duration.hours)}</Text>
            <TouchableOpacity
              onPress={() =>
                setDuration({
                  ...duration,
                  hours: duration.hours === 12 ? 0 : duration.hours + 1,
                })
              }
              style={styles.pickerBtn}
            >
              <Text style={styles.pickerBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, marginHorizontal: 8 }}>:</Text>
            <TouchableOpacity
              onPress={() =>
                setDuration({
                  ...duration,
                  minutes: duration.minutes === 0 ? 59 : duration.minutes - 1,
                })
              }
              style={styles.pickerBtn}
            >
              <Text style={styles.pickerBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.durationNumber}>{pad(duration.minutes)}</Text>
            <TouchableOpacity
              onPress={() =>
                setDuration({
                  ...duration,
                  minutes: duration.minutes === 59 ? 0 : duration.minutes + 1,
                })
              }
              style={styles.pickerBtn}
            >
              <Text style={styles.pickerBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderWakeupsPicker = () => (
    <Modal
      visible={isWakeupsPickerVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setWakeupsPickerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.durationModalContainer,
          Platform.OS === "web" && screenWidth >= 1024 ? { width: 420, minHeight: 320 } : {}
        ]}>
          <Text style={styles.modalTitle}>How many times did you wake up?</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              marginVertical: 16,
            }}
          >
            {Array.from({ length: 11 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.wakeupsNumber,
                  wakeups === i && { backgroundColor: PURPLE },
                ]}
                onPress={() => {
                  setWakeups(i);
                  setWakeupsPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.wakeupsNumberText,
                    wakeups === i && { color: "#fff" },
                  ]}
                >
                  {i}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setWakeupsPickerVisible(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // --- Submit/Update Logic ---
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [resultPopupMessage, setResultPopupMessage] = useState("");

  const handleSubmit = async () => {
    // Prepare the payload
    const payload = await getCheckOutPayload();
    setPendingPayload(payload);
    setResultPopupMessage("Please review your Sleep Diary data.");
    setSubmitModalVisible(true);
  };

  // Prepare the request object for submit/update
  const getCheckOutPayload = async () => {
    const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
    // Format all fields as per API spec
    const bedTimeStr = formatTimeToString(bedTime);
    const wakeTimeStr = formatTimeToString(wakeTime);
    const checkOutData = {
      bed_time: bedTimeStr,
      minutes_to_fall_asleep: durationToMinutes(fallAsleepDuration),
      wakeup_time: wakeTimeStr,
      minutes_after_wakeup: durationToMinutes(getOutOfBedDuration),
      sleep_interruptions: String(wakeups),
      awake_time: durationToMinutes(awakeDuration),
      sleep_rating: mapQualityToSleepRating(sleepQuality),
    };
    return {
      p_sleep_checkout_date: selectedDate,
      p_user_id: USER_ID,
      p_check_out_data: JSON.stringify(checkOutData),
    };
  };

  function formatTimeToString(date: Date) {
    // Returns "10:00:PM" etc.
    let h = date.getHours();
    const m = pad(date.getMinutes());
    let ampm = "AM";
    if (h >= 12) ampm = "PM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}:${ampm}`;
  }

  // --- Handle Done/Cancel in Popup ---
  const handlePopupCancel = () => {
    setSubmitModalVisible(false);
    setPendingPayload(null);
  };

  const handlePopupDone = async () => {
    setSubmitLoading(true);
    try {
      if (fetchedDataExists) {
        await callSuggestusAPI(PROCESS_ID_UPDATE, pendingPayload);
      } else {
        await callSuggestusAPI(PROCESS_ID_SAVE, pendingPayload);
      }
      setSubmitModalVisible(false);
      setPendingPayload(null);
      // Optionally, refetch data
      fetchCheckOut(selectedDate);
      // Navigate to SleepHygiene chart screen
      navigation.navigate("sleep_check_in_out/SleepCheckoutCharts");
    } catch (e) {
      // Optionally show error
      setSubmitModalVisible(false);
      setPendingPayload(null);
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Calendar Date Restriction ---
  // Only allow today and previous 7 days
  const minDate = getMinDate();
  const maxDate = getToday();
  function isDateSelectable(dateStr: string) {
    return dateStr >= minDate && dateStr <= maxDate;
  }

  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 340],
  });


  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <ImageBackground
        source={require("@/assets/images/internal_screen_bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <CustomTopHeader title="Back" />
        <SafeAreaView style={styles.screen}>
          {/* Loader Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={PURPLE} />
            </View>
          )}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              Platform.OS === "web" && screenWidth >= 1024
                ? { marginLeft: 100, marginRight: 100 }
                : { marginLeft: 0, marginRight: 0 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dropdownSection}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={toggleDropdown}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownLabel}>Night Sleep Diary</Text>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateInputText}>
                      {formatDate(selectedDate)}
                    </Text>
                    <Text style={styles.dropdownIcon}>
                      {dropdownOpen ? (
                        <Svg
                          width={14}
                          height={8}
                          viewBox="0 0 14 8"
                          fill="none"
                        >
                          <Path
                            d="M0.996296 6.99258L5.58775 2.41247C6.36976 1.63239 7.63609 1.63395 8.41617 2.41596L12.9963 7.00742"
                            stroke="#8B4CFC"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                        </Svg>
                      ) : (
                        <Svg
                          width={14}
                          height={8}
                          viewBox="0 0 14 8"
                          fill="none"
                        >
                          <Path
                            d="M13 1L8.41421 5.58578C7.63317 6.36683 6.36683 6.36683 5.58579 5.58579L1 1"
                            stroke="#8B4CFC"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                        </Svg>
                      )}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Animated.View
                style={[
                  styles.dropdownCalendar,
                  {
                    height: dropdownHeight,
                    opacity: dropdownAnim,
                    transform: [
                      {
                        translateY: dropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {dropdownOpen && (
                  <Calendar
                    current={selectedDate}
                    onDayPress={handleDateSelect}
                    markedDates={{
                      [selectedDate]: { selected: true, selectedColor: PURPLE },
                    }}
                    minDate={getMinDate()}
                    maxDate={getToday()}
                    disableAllTouchEventsForDisabledDays
                    theme={{
                      selectedDayBackgroundColor: PURPLE,
                      todayTextColor: PURPLE,
                      arrowColor: PURPLE,
                      textSectionTitleColor: TEXT,
                      dayTextColor: TEXT,
                      textDisabledColor: SUBTEXT,
                    }}
                    style={{ borderRadius: 12, marginTop: 10 }}
                  />
                )}
              </Animated.View>
            </View>

            {/* Bedtime */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => {
                setShowTimePicker(true);
              }}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  What time did you get into bed?
                </Text>
                <Text style={styles.inputValue}>
                  {formatTimeToString(bedTime)}
                </Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>

             
            </TouchableOpacity>
 {/* Time Picker Modal */}
 {Platform.OS === "web" ? (
                <Modal
                  visible={showTimePicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowTimePicker(false)}
                >
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
                    <WebTimePicker
                      value={bedTime || new Date()}
                      onChange={date => {
                        setBedTime(date);
                        // setShowTimePicker(false);
                      }}
                      onClose={() => {
                        setShowTimePicker(false);
                      }}
                    />
                  </View>
                </Modal>
              ) : (
                <DateTimePickerModal
                  isVisible={showTimePicker}
                  mode="time"
                  date={bedTime || new Date()}
                  is24Hour={false}
                  onConfirm={selectedDate => {
                    setShowTimePicker(false);
                    if (selectedDate) setBedTime(selectedDate);
                  }}
                  onCancel={() => setShowTimePicker(false)}
                />
              )}
            {/* Fall Asleep Duration */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setFallAsleepDurationVisible(true)}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  How long did it take you to fall asleep?
                </Text>
                <Text style={styles.inputValue}>
                  {fallAsleepDuration.hours}h {fallAsleepDuration.minutes}m
                </Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>
            </TouchableOpacity>

            {/* Wakeup Time */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setShowWakeTimePicker(true)}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  What time did you wake up?
                </Text>
                <Text style={styles.inputValue}>
                  {formatTimeToString(wakeTime)}
                </Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>
            </TouchableOpacity>

            {/* Wake Time Picker Modal */}
            {Platform.OS === "web" ? (
              <Modal
                visible={showWakeTimePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowWakeTimePicker(false)}
              >
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
                  <WebTimePicker
                    value={wakeTime || new Date()}
                    onChange={date => {
                      setWakeTime(date);
                      setShowWakeTimePicker(false);
                    }}
                    onClose={() => setShowWakeTimePicker(false)}
                    title="Select Wake Time"
                  />
                </View>
              </Modal>
            ) : (
              <DateTimePickerModal
                isVisible={showWakeTimePicker}
                mode="time"
                date={wakeTime || new Date()}
                is24Hour={false}
                onConfirm={selectedDate => {
                  setShowWakeTimePicker(false);
                  if (selectedDate) setWakeTime(selectedDate);
                }}
                onCancel={() => setShowWakeTimePicker(false)}
              />
            )}

            {/* Get Out of Bed Duration */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setGetOutOfBedDurationVisible(true)}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  How much time you took to get out of bed, in morning?
                </Text>
                <Text style={styles.inputValue}>
                  {getOutOfBedDuration.hours}h {getOutOfBedDuration.minutes}m
                </Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>
            </TouchableOpacity>

            {/* Wakeups */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setWakeupsPickerVisible(true)}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  Due to sleep interruptions, how many times did you wake up ?
                </Text>
                <Text style={styles.inputValue}>{wakeups}</Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>
            </TouchableOpacity>

            {/* Awake Duration */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setAwakeDurationVisible(true)}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  Due to all sleep intruptions, total how long were you awake ?
                </Text>
                <Text style={styles.inputValue}>
                  {awakeDuration.hours}h {awakeDuration.minutes}m
                </Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>
            </TouchableOpacity>

            {/* Sleep Quality */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setQualityPickerVisible(true)}
            >
              <View style={styles.inputCardRow}>
                <Text style={styles.inputLabel}>
                  How well do you think you slept?
                </Text>
                <Text style={styles.inputValue}>{sleepQuality}</Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path
                  d="M1 1L5.58579 5.58579C6.36683 6.36683 6.36683 7.63316 5.58579 8.41421L1 13"
                  stroke="#262626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </Svg>
            </TouchableOpacity>
          </ScrollView>

          <View style={{
  paddingHorizontal: 16,
  paddingTop: 0,
  ...(Platform.OS === "web" && screenWidth >= 1024
    ? { width: 320, alignSelf: "center" }
    : {}),
}}>
  <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
    <Text style={styles.submitBtnText}>Review</Text>
  </TouchableOpacity>
</View>
          {/* Duration pickers */}
          {renderDurationPicker(
            isFallAsleepDurationVisible,
            () => setFallAsleepDurationVisible(false),
            fallAsleepDuration,
            setFallAsleepDuration
          )}
          {renderDurationPicker(
            isGetOutOfBedDurationVisible,
            () => setGetOutOfBedDurationVisible(false),
            getOutOfBedDuration,
            setGetOutOfBedDuration
          )}
          {renderDurationPicker(
            isAwakeDurationVisible,
            () => setAwakeDurationVisible(false),
            awakeDuration,
            setAwakeDuration
          )}
          {renderWakeupsPicker()}

          {/* Sleep Quality Picker */}
          <Modal
            visible={isQualityPickerVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setQualityPickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.durationModalContainer,
                Platform.OS === "web" && screenWidth >= 1024 ? { width: 420, minHeight: 320 } : {}
              ]}>
                <Text style={styles.modalTitle}>
                  How well do you think you slept?
                </Text>
                <View
                  style= {[
                    {
                    marginBottom: 16,
                    width: "100%",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                  },
                  Platform.OS === "web" && screenWidth >= 1024 ? { width: 320, height: 120 } : {}
                ]}
                >
                  {qualityOptions.map((option, idx) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.inputCard,
                        {
                          backgroundColor:
                            sleepQuality === option ? "#7E3AF2" : "#fff",
                          marginBottom: 0,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() => {
                        setSleepQuality(option);
                        setQualityPickerVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.inputLabel,
                          {
                            color: sleepQuality === option ? "#fff" : "#262626",
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setQualityPickerVisible(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Review Modal */}
          <Modal
            visible={isSubmitModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSubmitModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContainer,
                Platform.OS === "web" && screenWidth >= 1024 ? { width: 420, minHeight: 320 } : {}
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Review</Text>
                  <TouchableOpacity
                    onPress={() => setSubmitModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Text style={{ fontSize: 15 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("@/assets/images/sleep_illustration.png")}
                  style={{ width: 144, height: 160, resizeMode: "contain" }}
                />
                <Text style={styles.modalMessage}>{resultPopupMessage}</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSubmitModalVisible(false)}
                    disabled={submitLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.doneButton, { flex: 1 }]}
                    onPress={handlePopupDone}
                    disabled={submitLoading}
                  >
                    <Text style={styles.doneButtonText}>
                      {submitLoading ? "Saving..." : "Done"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
  if (Platform.OS === "web" && screenWidth >= 1024) {
    return (
      <ImageBackground
        source={require("../../assets/images/background_new_web.png")}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        {mainContent}
      </ImageBackground>
    );
  }
  return mainContent;
};

const styles = StyleSheet.create({
  containerNew: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // dim background
    justifyContent: "center",
    alignItems: "center",
  },

  durationModalContainer: {
    backgroundColor: "#fff", // ensure visible on dark mode
    padding: 20,
    borderRadius: 10,
    width: "80%",
    minHeight: 180,
    elevation: 5, // shadow for Android
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 20, // added padding to prevent Done button from being squeezed
  },

  inputCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  inputLabel: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#262626", // fallback color
  },

  doneButton: {
    backgroundColor: "#7E3AF2",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    // marginTop: 20,
    minWidth: 85,
    // marginBottom: 20, // added margin to ensure proper spacing
  },

  doneButtonText: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
  },

  inputCardRow: {
    display: "flex",
    flexDirection: "column",
    paddingRight: 15,
    flexGrow: 1,
    flexBasis: 0,
  },

  inputValue: {
    color: "#262626",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    marginTop: 2,
    marginLeft: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  screen: {
    flex: 1,
  },
  centeredModal: {
    width: "90%",
    maxWidth: 400,
  },
  timePickerModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#222",
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
  },
  pickerColumn: {
    width: 80,
    height: 200,
    marginHorizontal: 5,
  },
  pickerItem: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "#7E3AF2",
    borderRadius: 20,
  },
  pickerItemText: {
    fontSize: 18,
    color: "#333",
  },
  headerRow: {
    // flexDirection: "row",
    // alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    zIndex: 2,
    width: "100%",
    // borderBottomWidth: 1,
    // borderBottomColor: "#898d9e80",
    // marginBottom: 18,
    marginTop: 24,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  backBtn: {
    padding: 0,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandRegular",
    width: "100%",
    textAlign: "center",
  },
  timePickerButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "#7E3AF2",
    borderRadius: 10,
    alignSelf: "stretch",
    alignItems: "center",
  },
  timePickerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 0,
    paddingBottom: 0,
    // marginLeft and marginRight will be applied inline for responsive behavior
  },
  dropdownSection: {
    marginBottom: 18,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4edff",
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
  },
  dropdownCalendar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
  },
  dropdownLabel: {
    fontSize: 16,
    color: "#262626",
    fontWeight: "500",
    marginBottom: 5,
    fontFamily: "QuicksandMedium",
  },
  dateInputContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#898D9E66",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputText: {
    fontSize: 16,
    color: TEXT,
    flex: 1,
    fontFamily: "QuicksandMedium",
  },
  dropdownIcon: {
    fontSize: 16,
    color: PURPLE,
    marginLeft: 8,
  },
  inputCardSection: {
    marginBottom: 20,
  },
  inputCardLabel: {
    fontSize: 16,
    color: TEXT,
    flex: 1,
    marginRight: 10,
    marginBottom: 6,
    fontFamily: "QuicksandMedium",
  },
  inputCardValue: {
    fontSize: 16,
    color: TEXT,
    minWidth: 54,
    textAlign: "left",
    fontFamily: "QuicksandSemiBold",
  },
  submitBtn: {
    width: "100%",
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 1,
    fontFamily: "QuicksandSemiBold",
  },

  modalTitle: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    marginBottom: 30,
    flex: 1,
  },
  pickerBtn: {
    backgroundColor: "#edededb3",
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 6,
  },
  pickerBtnText: {
    fontSize: 20,
    color: PURPLE,
    fontFamily: "QuicksandSemiBold",
  },
  durationNumber: {
    fontSize: 28,
    color: PURPLE,
    fontFamily: "QuicksandSemiBold",
    minWidth: 36,
    textAlign: "center",
  },
  wakeupsNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#edededb3",
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  wakeupsNumberText: {
    fontSize: 18,
    color: PURPLE,
    fontFamily: "QuicksandSemiBold",
  },

  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    position: "relative",
  },
  modalIllustration: {
    alignItems: "center",
    marginVertical: 12,
  },
  modalMessage: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: "QuicksandMedium",
    marginTop: 12,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    width: "100%",
  },
  closeButton: {
    padding: 4,
    position: "absolute",
    right: 0,
    top: -5,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#898D9E66",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#262626",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});

export default SleepCheckOut;
