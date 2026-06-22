import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { spd_processId_config } from "../config/process_id";
import Svg, { Path } from "react-native-svg";
const TEXT = "#262626";
const SUBTEXT = "#888";
// Explicit process IDs for clarity
const PROCESS_ID_SAVE =
  spd_processId_config.spdonmood9_save_md_user_sleep_hygiene_check_in;
const PROCESS_ID_UPDATE =
  spd_processId_config.spdonmood9_update_md_user_sleep_hygiene_check_in;
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_ID } from "../config/config";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const checklistData = [
  {
    key: "timeCheck",
    title: "Time Check",
    desc: "Sleep time between 10 - 11 PM",
    default: true,
  },
  {
    key: "checkIntake",
    title: "Check Intake",
    desc: "Stop food, caffeine, tobacco, 2Hr before bed",
    default: true,
  },
  {
    key: "bedCheck",
    title: "Bed Check",
    desc: "Prepared clean and comfortable bed yourself",
    default: false,
  },
  {
    key: "roomCheck",
    title: "Room Check",
    desc: "Optimal Temp, Noise, Light",
    default: true,
  },
  {
    key: "digitalDetox",
    title: "Digital Detox",
    desc: "Close all media and silent your devices",
    default: false,
  },
  {
    key: "stressCheck",
    title: "Stress Check",
    desc: "De-stress your self before going to bed",
    default: true,
  },
  {
    key: "calmMind",
    title: "Calm your Mind",
    desc: "By stretching, music, meditation etc.",
    default: true,
  },
];

const PURPLE = "#8B4CFC";

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SleepCheckIn = () => {
  const navigation = useNavigation();
  const horizontalMargin = useResponsiveHorizontalMargin();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [switches, setSwitches] = useState({});
  const [initialSwitches, setInitialSwitches] = useState({});
  const [fetchedDataExists, setFetchedDataExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [score, setScore] = useState(0);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingScore, setPendingScore] = useState(null);
  const [isResultPopupVisible, setIsResultPopupVisible] = useState(false);
  const [resultPopupLoading, setResultPopupLoading] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  // Init switches
  useEffect(() => {
    const defaultSwitches = {};
    checklistData.forEach((item) => (defaultSwitches[item.key] = item.default));
    setSwitches(defaultSwitches);
    setInitialSwitches(defaultSwitches);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    let isMounted = true;
    const fetchCheckIn = async () => {
      setLoading(true);
      const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
      try {
        const payload = {
          p_user_id: USER_ID,
          p_sleep_checkin_date: selectedDate,
        };
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_in,
          payload
        );

        let toggles = {};
        if (response?.returnData[0]?.check_in_data) {
          const parsed = JSON.parse(response.returnData[0].check_in_data);
          toggles = {
            timeCheck: parsed.Q1 === 1,
            checkIntake: parsed.Q2 === 1,
            bedCheck: parsed.Q3 === 1,
            roomCheck: parsed.Q4 === 1,
            digitalDetox: parsed.Q5 === 1,
            stressCheck: parsed.Q6 === 1,
            calmMind: parsed.Q7 === 1,
          };
          setFetchedDataExists(true);
        } else {
          checklistData.forEach((item) => (toggles[item.key] = false));
          setFetchedDataExists(false);
        }

        if (isMounted) {
          setSwitches(toggles);
          setInitialSwitches(toggles);
        }
      } catch {
        checklistData.forEach((item) => (toggles[item.key] = false));
        setFetchedDataExists(false);
        setSwitches(toggles);
        setInitialSwitches(toggles);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckIn();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const handleSwitch = (key) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCheckinPayload = () => {
    const data = {
      Q1: switches.timeCheck ? 1 : 0,
      Q2: switches.checkIntake ? 1 : 0,
      Q3: switches.bedCheck ? 1 : 0,
      Q4: switches.roomCheck ? 1 : 0,
      Q5: switches.digitalDetox ? 1 : 0,
      Q6: switches.stressCheck ? 1 : 0,
      Q7: switches.calmMind ? 1 : 0,
    };
    const sum = Object.values(data).reduce((a, b) => a + b, 0);
    return { check_in_data: JSON.stringify(data), score: sum.toString() };
  };

  const handleSubmit = async () => {
    setResultPopupLoading(true);
    try {
      const payload = pendingPayload;
      const score = pendingScore;
      if (fetchedDataExists) {
        await callSuggestusAPI(PROCESS_ID_UPDATE, payload);
      } else {
        await callSuggestusAPI(PROCESS_ID_SAVE, payload);
      }
      setScore(Number(score));
      setIsResultPopupVisible(false);
      setIsModalVisible(true); // (optional) show success feedback
      // Navigate to SleepHygiene chart screen
      navigation.navigate("sleep_check_in_out/SleepHygiene");
    } catch (err) {
      // Optionally handle error
    } finally {
      setResultPopupLoading(false);
    }
  };

  // On submit/update button click, show result popup with score and payload
  const handleShowResultPopup = async () => {
    const { check_in_data, score } = getCheckinPayload();
    const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
    const payload = {
      p_user_id: USER_ID,
      p_sleep_checkin_date: selectedDate,
      p_check_in_data: check_in_data,
      p_score: score,
    };
    setPendingPayload(payload);
    setPendingScore(score);
    setIsResultPopupVisible(true);
  };

  const buttonText = fetchedDataExists ? "Update" : "Submit";

  const mainContent = (
    <View
      style={[
        styles.container,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <ImageBackground
        source={require("@/assets/images/internal_screen_bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Top Header for screen */}
        <CustomTopHeader title="Back" />
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              { padding: 16, paddingTop: 0 },
              Platform.OS === "web" && screenWidth >= 1024
                ? { marginLeft: 100, marginRight: 100 }
                : { marginLeft: 0, marginRight: 0 }
            ]}
            // showsVerticalScrollIndicator={false}
          >
            {/* Date Picker Card - Updated UI */}
            <View
              style={{
                backgroundColor: "#f7f3ff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f7f3ff",
                padding: 16,
                marginBottom: 20,
                shadowColor: "#f7f3ff",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: TEXT,
                  fontWeight: "500",
                  marginBottom: 8,
                  fontFamily: "QuicksandMedium",
                }}
              >
                Night Sleep Hygiene
              </Text>
              <TouchableOpacity
                onPress={() => setDropdownOpen(true)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#898D9E66",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: TEXT,
                    fontWeight: "600",
                    fontFamily: "QuicksandRegular",
                  }}
                >
                  {formatDate(selectedDate)}
                </Text>
                <Svg width={14} height={8} viewBox="0 0 14 8" fill="none">
                  <Path
                    d="M13 1L8.41421 5.58578C7.63317 6.36683 6.36683 6.36683 5.58579 5.58579L1 1"
                    stroke="#8B4CFC"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>

                {/* <Ionicons name="chevron-down" size={18} color={PURPLE} style={{ marginLeft: 8 }} /> */}
              </TouchableOpacity>
              {/* Calendar Modal Popup */}
              <Modal
                visible={dropdownOpen}
                animationType="fade"
                transparent
                onRequestClose={() => setDropdownOpen(false)}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      minWidth: 320,
                      elevation: 4,
                    }}
                  >
                    <Calendar
                      current={selectedDate}
                      onDayPress={(day) => {
                        const date = day.dateString;
                        if (date <= getToday() && date >= getMinDate()) {
                          setSelectedDate(date);
                          setDropdownOpen(false);
                        }
                      }}
                      markedDates={{
                        [selectedDate]: {
                          selected: true,
                          selectedColor: PURPLE,
                        },
                      }}
                      minDate={getMinDate()}
                      maxDate={getToday()}
                      theme={{
                        backgroundColor: "#fff",
                        calendarBackground: "#fff",
                        todayTextColor: PURPLE,
                        selectedDayBackgroundColor: PURPLE,
                        selectedDayTextColor: "#fff",
                        dayTextColor: TEXT,
                        textDisabledColor: "#ccc",
                        arrowColor: PURPLE,
                        monthTextColor: TEXT,
                        textMonthFontWeight: "700",
                        textDayFontFamily: "QuicksandRegular",
                        textMonthFontFamily: "QuicksandMedium",
                        textDayHeaderFontFamily: "QuicksandMedium",
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setDropdownOpen(false)}
                      style={{ marginTop: 10, alignSelf: "flex-end" }}
                    >
                      <Text
                        style={{
                          color: PURPLE,
                          fontFamily: "QuicksandSemiBold",
                          fontSize: 15,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>

            {/* Checklist */}
            {loading ? (
              <ActivityIndicator
                color={PURPLE}
                size="large"
                style={{ marginTop: 50 }}
              />
            ) : (
              checklistData.map((item) => (
                <View
                  key={item.key}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: "#CCC",
                  }}
                >
                  <View style={{ paddingRight: 15, flexGrow: 1, flexBasis: 0 }}>
                    <Text
                      style={{
                        fontFamily: "QuicksandSemiBold",
                        fontSize: 16,
                        color: "#262626",
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "QuicksandMedium",
                        fontSize: 14,
                        color: "#262626",
                      }}
                    >
                      {item.desc}
                    </Text>
                  </View>
                  <Switch
                    value={switches[item.key]}
                    onValueChange={() => handleSwitch(item.key)}
                    trackColor={{ false: "#CCC", true: PURPLE }}
                    thumbColor={switches[item.key] ? "#ffffff" : "#f4f3f4"}
                  />
                </View>
              ))
            )}

            {/* Result Popup (Score + Cancel/Done) */}
            <Modal
              visible={isResultPopupVisible}
              transparent
              animationType="fade"
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    padding: 20,
                    borderRadius: 10,
                    width:
                      Platform.OS === "web" && screenWidth >= 1024
                        ? 420
                        : "90%",
                    minHeight:
                      Platform.OS === "web" && screenWidth >= 1024
                        ? 320
                        : undefined,
                    alignItems: "center",
                  }}
                >
                  {/* <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>Sleep Hygiene Score</Text> */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Confirmation</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setIsResultPopupVisible(false)}
                    >
                      <Text style={{ fontSize: 16, color: "#888" }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Image
                    source={require("@/assets/images/sleep_illustration.png")}
                    style={{
                      width: 120,
                      height: 120,
                      marginBottom: 16,
                      resizeMode: "contain",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: "QuicksandMedium",
                      textAlign: "center",
                      marginBottom: 16,
                    }}
                  >
                    Your Sleep Hygiene {"\n"} Score is: {pendingScore}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      width: "100%",
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#fff",
                        borderColor: "#ddd",
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        marginRight: 8,
                        alignItems: "center",
                      }}
                      disabled={resultPopupLoading}
                      onPress={() => setIsResultPopupVisible(false)}
                    >
                      <Text
                        style={{
                          color: "#262626",
                          fontFamily: "QuicksandSemiBold",
                          fontSize: 16,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#8B4CFC",
                        borderRadius: 8,
                        padding: 12,
                        alignItems: "center",
                      }}
                      disabled={resultPopupLoading}
                      onPress={handleSubmit}
                    >
                      {resultPopupLoading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text
                          style={{
                            color: "#fff",
                            fontFamily: "QuicksandSemiBold",
                            fontSize: 16,
                          }}
                        >
                          Done
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>

          {/* Submit Button */}
          <View style={{ padding: 16, paddingTop: 0 }}>
            <TouchableOpacity
              style={{
                backgroundColor: PURPLE,
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 5,
                ...(Platform.OS === "web" && screenWidth >= 1024
                  ? { width: 320, alignSelf: "center" }
                  : {}),
              }}
              onPress={handleShowResultPopup}
              disabled={submitLoading}
            >
              {submitLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text
                  style={{ color: "#FFF", fontFamily: "QuicksandSemiBold" }}
                >
                  {buttonText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  container: { flex: 1 },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  screen: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  topBar: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 5,
    paddingLeft: 18,
    paddingBottom: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 0,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
    fontFamily: "QuicksandRegular",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 0,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
    marginBottom: 18,
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
  },
  scrollContent: {
    padding: 18,
    paddingTop: 0,
    paddingBottom: 32,
  },
  dropdownSection: {
    marginBottom: 20,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4edff",
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    // borderWidth: 1,
    // borderColor: '#E5E0F5',
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
    fontWeight: "600",
    flex: 1,
    fontFamily: "QuicksandRegular",
  },
  dropdownIcon: {
    fontSize: 12,
    color: PURPLE,
    marginLeft: 8,
  },
  dropdownCalendar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
  },
  checklistSection: {
    // backgroundColor: '#fff',
    // borderRadius: 12,
    paddingVertical: 4,
    marginBottom: 22,
    // borderWidth: 1,
    // borderColor: '#ECECEC',
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
  },
  checklistTitle: {
    fontSize: 16,
    color: TEXT,
    fontWeight: "600",
    marginBottom: 5,
    fontFamily: "QuicksandRegular",
  },
  checklistDesc: {
    fontSize: 14,
    color: SUBTEXT,
    fontWeight: "400",
    marginBottom: 0,
    fontFamily: "QuicksandRegular",
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  submitBtn: {
    width: "100%",
    backgroundColor: PURPLE,
    borderRadius: 12,
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
    fontFamily: "QuicksandMedium",
  },
  closeButton: {
    padding: 4,
    position: "absolute",
    right: 0,
    fontWeight: 600,
    top: -5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    position: "relative",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    marginBottom: 30,
    flex: 1,
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
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#898D9E66",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#262626",
    fontSize: 16,
    fontFamily: "QuicksandMedium",
  },
  doneButton: {
    backgroundColor: "#7E3AF2",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
  },
  doneButtonText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontFamily: "QuicksandMedium",
  },
});
export default SleepCheckIn;
