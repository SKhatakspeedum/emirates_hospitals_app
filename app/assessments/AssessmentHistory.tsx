import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { ProgressChart, BarChart } from "react-native-chart-kit";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { FontFamilies } from "../config/fonts";
import { spd_processId_config } from "../config/process_id";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";

// Import formatDate from SleepCheckIn
import { formatDate } from "../sleep_check_in_out/SleepCheckIn";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_ID } from "../config/config";
import Svg, { Path } from "react-native-svg";
import { Image } from "react-native";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const { width } = Dimensions.get("window");

type HistoryItem = {
  id: string;
  assessment_id: string;
  finished_on: string;
  score: string;
  [key: string]: any;
};

const AssessmentHistory = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [showChart, setShowChart] = useState(false);
  // ...
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { title, id } = route.params as { title: string; id: string };

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Popup/modal state for item result ---
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  const horizontalMargin = useResponsiveHorizontalMargin();

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

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
      setError(null);
      try {
        const input = { p_user_id: USER_ID, p_assessment_id: id };
        const response = await callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_user_assessments,
          input
        );
        if (
          response?.returnCode === true &&
          Array.isArray(response.returnData)
        ) {
          setHistory(response.returnData);
        } else if (Array.isArray(response)) {
          setHistory(response);
        } else {
          setError(response?.msg || "Failed to fetch assessment history.");
        }
      } catch (err: any) {
        setError(err?.message || "Unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // --- UPDATED handleItemPress ---
  const handleItemPress = async (item: HistoryItem) => {
    setLoadingItemId(item.id);
    setResultError(null);
    setResultLoading(true);
    setResultData(null);
    try {
      let score = item.score;
      let max_score = item.max_score;
      const input = {
        p_assessment_id: item.assessment_id,
        p_score: score,
      };
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_assessment_rules_for_history,
        input
      );
      if (response?.returnCode === true && response.returnData) {
        let data = response.returnData;
        data[0].max_score = max_score;
        data[0].min_score = score;
        setResultData(data);
        setShowResultPopup(true);
      } else {
        setResultError(response?.msg || "No result data returned.");
      }
    } catch (err: any) {
      setResultError(err?.message || "Failed to fetch result.");
    } finally {
      setResultLoading(false);
      setLoadingItemId(null);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item)}
      disabled={loadingItemId !== null}
    >
      <View style={styles.cardOuter}>
        <View style={styles.cardInner}>
          <View style={styles.cardLeft}>
            <Text style={styles.label}>As on</Text>
            <Text style={styles.date}>{formatDate(item.finished_on)}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.label}>Result</Text>
            <Text style={styles.score}>
              {item.score}/{item.max_score}
            </Text>
          </View>
          {loadingItemId === item.id ? (
            <ActivityIndicator
              size="small"
              color="#8453E3"
              style={styles.arrow}
            />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={22}
              color="#8453E3"
              style={styles.arrow}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- Popup/modal for result ---
  const renderResultPopup = () => {
    // Defensive: parse score and max_score from API, fallback to item values
    let score = 0;
    let maxScore = 1;
    if (!!resultData) {
      if (resultData[0]) {
        score = parseInt(resultData[0].min_score, 10) || 0;
        maxScore = parseInt(resultData[0].max_score, 10) || 1;

        return (
          <Modal visible={showResultPopup} transparent animationType="slide">
            <View style={popupStyles.modalContainer}>
              <View style={popupStyles.popup}>
                <View style={popupStyles.popupHeader}>
                  <Text style={popupStyles.popupTitle}>
                    {resultData[0].remark}
                  </Text>
                  <TouchableOpacity onPress={() => setShowResultPopup(false)}>
                    <Ionicons name="close" size={24} color="#262626" />
                  </TouchableOpacity>
                </View>
                {resultLoading ? (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 80,
                    }}
                  >
                    <ActivityIndicator size="large" color="#8453E3" />
                  </View>
                ) : resultError ? (
                  <Text
                    style={{
                      color: "#D32F2F",
                      fontSize: 16,
                      textAlign: "center",
                      marginVertical: 16,
                    }}
                  >
                    {resultError}
                  </Text>
                ) : resultData ? (
                  <View>
                    <View style={popupStyles.resultDivider} />
                    <View
                      style={[
                        popupStyles.circleScoreWrap,
                        {
                          position: "relative",
                          width: 120,
                          height: 120,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <ProgressChart
                        data={{ data: [score / maxScore] }}
                        width={120}
                        height={120}
                        strokeWidth={10}
                        radius={45}
                        chartConfig={{
                          backgroundGradientFrom: "#fff",
                          backgroundGradientTo: "#fff",
                          color: (opacity = 1) =>
                            `rgba(132, 83, 227, ${opacity})`,
                          strokeWidth: 2,
                        }}
                        hideLegend={true}
                      />
                      <View
                        style={[
                          popupStyles.circleInnerOverlay,
                          {
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 120,
                            height: 120,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text style={popupStyles.circleScoreText}>{score}</Text>
                        <Text style={popupStyles.circleScoreSubText}>
                          {maxScore}
                        </Text>
                      </View>
                    </View>
                    <View style={popupStyles.resultBadge}>
                      <Text style={popupStyles.resultBadgeText}>Result</Text>
                      <Text style={popupStyles.resultLabel}>
                        {resultData[0].remark || "No Result"}
                      </Text>
                    </View>
                    <ScrollView style={popupStyles.resultDescScrollWrap}>
                      <Text style={popupStyles.resultDesc}>
                        {resultData[0].description || ""}
                      </Text>
                    </ScrollView>
                  </View>
                ) : null}
                <View style={popupStyles.resultButtonRow}>
                  <TouchableOpacity
                    style={popupStyles.resultBtnSecondary}
                    onPress={() => setShowResultPopup(false)}
                  >
                    <Text
                      style={{
                        color: "#262626",
                        fontFamily: "QuicksandMedium",
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={popupStyles.resultBtnPrimary}
                    onPress={() => setShowResultPopup(false)}
                  >
                    <Text
                      style={{ color: "#fff", fontFamily: "QuicksandMedium" }}
                    >
                      History
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <>
        {renderResultPopup()}
        <ImageBackground
          source={require("@/assets/images/internal_screen_bg.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <CustomTopHeader title="Back" />
          <View style={[
  styles.container,
  Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}
]}>
            <Stack.Screen
              options={{
                headerShown: false,
              }}
            />
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 200,
                }}
              >
                <ActivityIndicator size="large" color="#8453E3" />
              </View>
            ) : error ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 200,
                }}
              >
                <Text
                  style={{
                    color: "#D32F2F",
                    fontSize: 16,
                    textAlign: "center",
                    fontWeight: "500",
                    marginTop: 12,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : history.length === 0 ? (
              <>
                <View style={styles.chartViewRow}>
                  <TouchableOpacity
                    style={[styles.chartViewBtn, { opacity: 0.5 }]}
                    disabled={true}
                  >
                    <Ionicons name="bar-chart" size={20} color="#C8C8C8" />
                    <Text
                      style={[styles.chartViewBtnText, { color: "#C8C8C8" }]}
                    >
                      Chart view
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flex: 1,
                    minHeight: 200,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: 40,
                  }}
                >
                  <Image
                    source={require("@/assets/images/assess.png")}
                    style={{
                      width: 70,
                      height: 70,
                      opacity: 0.7,
                      marginBottom: 16,
                    }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      color: "#8B4CFC",
                      fontWeight: "bold",
                      marginBottom: 6,
                    }}
                  >
                    No history found
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#888",
                      textAlign: "center",
                      maxWidth: 220,
                    }}
                  >
                    Once you complete an assessment, your results will appear
                    here for easy review.
                  </Text>
                </View>
              </>
            ) : showChart ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "stretch",
                }}
              >
                {/* Legend at the very top, outside the ScrollView */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 10,
                    width: "100%",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        backgroundColor: "#8453E3",
                        borderRadius: 3,
                        marginRight: 6,
                      }}
                    />
                    <Text style={{ fontSize: 13, color: "#262626" }}>
                      Score
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        backgroundColor: "#C8C8C8",
                        borderRadius: 3,
                        marginRight: 6,
                      }}
                    />
                    <Text style={{ fontSize: 13, color: "#262626" }}>
                      Max Score
                    </Text>
                  </View>
                </View>
                {/* Chart in a horizontally scrollable area */}
                <ScrollView
                  horizontal
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  style={{ flex: 1 }}
                >
                  <BarChart
                    data={{
                      labels: history.map((item: HistoryItem) =>
                        formatDate(item.finished_on)
                      ),
                      datasets: [
                        {
                          data: history.map(
                            (item: HistoryItem) => parseInt(item.score, 10) || 0
                          ),
                        },
                        {
                          data: history.map(
                            (item: HistoryItem) =>
                              parseInt(item.max_score, 10) || 0
                          ),
                        },
                      ],
                    }}
                    width={Platform.OS === 'web' ? 800 : Math.max(450, history.slice(-7).length * 60)}
                    height={Math.max(
                      450,
                      Dimensions.get("window").height * 0.45
                    )}
                    yAxisLabel={""}
                    yAxisSuffix={""}
                    fromZero={true}
                    chartConfig={{
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#fff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `#8453E3`,
                      labelColor: (opacity = 1) => `#262626`,
                      style: { borderRadius: 16 },
                      propsForBackgroundLines: { stroke: "#EEE4FF" },
                    }}
                    style={{ borderRadius: 16, marginLeft: 8, marginRight: 8, borderWidth: 1, borderColor: '#8453E3' }}
                    showValuesOnTopOfBars
                  />
                </ScrollView>
              </View>
            ) : (
              <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item, i) => item.id || i.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            )}
            <View style={[styles.buttonRow, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 160, marginRight: 160 } : {}]}>
              <TouchableOpacity
                style={styles.assessmentsBtn}
                onPress={() =>
                  navigation.navigate("assessments/AssessmentHomeScreen")
                }
              >
                <Text style={styles.assessmentsBtnText}>Assessments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chartBtn}
                onPress={() => setShowChart((prev) => !prev)}
              >
                <Text style={styles.chartBtnText}>
                  {showChart ? "Default" : "Chart view"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </>
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

const popupStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  popup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popupTitle: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#262626",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8453E3",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  circleScoreWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginHorizontal: "auto",
  },
  circleInnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  circleScoreText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#8453E3",
  },
  circleScoreSubText: {
    fontSize: 14,
    color: "#262626",
  },
  resultBadge: {
    backgroundColor: "#f4eeff",
    borderRadius: 8,
    padding: 10,
    paddingVertical: 14,
    alignItems: "left",
    marginVertical: 8,
  },
  resultBadgeText: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  resultLabel: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
  },
  resultDescScrollWrap: {
    maxHeight: 180,
    minHeight: 80,
    marginBottom: 12,
  },
  resultDesc: {
    fontSize: 12,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  resultButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  resultBtnSecondary: {
    flex: 0.45,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 100,
  },
  resultBtnPrimary: {
    flex: 0.45,
    backgroundColor: "#8453E3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 100,
  },
});

const styles = StyleSheet.create({
  chartViewRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
    marginRight: 10,
  },
  containerNew: { flex: 1 },
  chartViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chartViewBtnText: {
    color: "#16214C",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    marginLeft: 6,
    fontWeight: "600",
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  headerRow: {
    marginTop: 24,
    marginBottom: 20,
    zIndex: 2,
    width: "100%",
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
  container: {
    flex: 1,
    // backgroundColor: '#FCFBFF',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  header: {
    backgroundColor: "#FCFBFF",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
  },
  list: {
    flex: 1,
    marginTop: 6,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 120,
  },
  cardOuter: {
    borderRadius: 14,
    marginBottom: 13,
    overflow: "hidden",
    backgroundColor: "transparent",
    shadowColor: "#D8CFF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#898d9e66",
  },
  cardLeft: {
    flex: 1.3,
  },
  cardRight: {
    flex: 1,
  },
  label: {
    fontFamily: "QuicksandRegular",
    fontSize: 14,
    color: "#262626",
    marginBottom: 2,
  },
  date: {
    fontFamily: "QuicksandMedium",
    fontSize: 14,
    color: "#262626",
  },
  score: {
    fontFamily: "QuicksandMedium",
    fontSize: 14,
    color: "#262626",
  },
  arrow: {
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 10,
    marginTop: 0,
  },
  assessmentsBtn: {
    flex: 1,
    borderWidth: 1.3,
    borderColor: "#898D9E66",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 10,
    alignItems: "center",
  },
  assessmentsBtnText: {
    fontFamily: "QuicksandMedium",
    fontSize: 16,
    fontWeight: "400",
    color: "#262626",
  },
  chartBtn: {
    flex: 1,
    backgroundColor: "#6C4AD4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 10,
  },
  chartBtnText: {
    fontFamily: "QuicksandMedium",
    fontSize: 16,
    fontWeight: "400",
    color: "#FFF",
  },
  disclaimer: {
    fontSize: 11,
    color: "#A3A3A3",
    marginTop: 10,
    lineHeight: 16,
    marginBottom: 10,
    textAlign: "left",
    paddingHorizontal: 2,
  },
  link: {
    color: "#8453E3",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});

export default AssessmentHistory;
