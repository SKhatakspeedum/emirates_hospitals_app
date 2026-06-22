import React, { useState } from "react";
import { ActivityIndicator, Platform } from "react-native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import HTMLView from "react-native-htmlview";
import { ProgressChart } from "react-native-chart-kit";
import { spd_processId_config } from "../config/process_id";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { useNavigation } from "expo-router";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASSESSMENT_API_URL_SAVE, SPD_USER_ID } from "../config/config";
import { SiteConfig } from "../config/site_config";
import Svg, { Path } from "react-native-svg";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";
// Main component
const AssessmentDetailScreen = () => {
  const route = useRoute();
  const horizontalMargin = useResponsiveHorizontalMargin();
  let { assessment } = route.params as { assessment: string };
  const navigation = useNavigation();
  const data = assessment ? JSON.parse(assessment) : {};

  const [descExpanded, setDescExpanded] = useState(false);
  const DESCRIPTION_LINE_LIMIT = 3;
  const isDescLong =
    data?.description && data.description.split(" ").length > 25;

  const questions = data?.questions || [];
  const rules = data?.rules || [];

  // Submission and timing state
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ optionId: string; score: number }[]>(
    []
  );
  const [showResult, setShowResult] = useState(false);
  const [startedOn, setStartedOn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // Capture start time when survey starts
  const openSurvey = () => {
    setStartedOn(new Date().toISOString().replace("T", " ").substring(0, 19));
    setShowSurvey(true);
  };

  const currentQuestion = questions[currentQ];

  const handleNext = async () => {
    if (!selectedOption || !currentQuestion) return;

    const option = currentQuestion.options.find(
      (opt) => opt.id === selectedOption
    );
    const score = option ? parseInt(option.score, 10) : 0;

    const updatedAnswers = [...answers];
    updatedAnswers[currentQ] = { optionId: selectedOption, score };
    setAnswers(updatedAnswers);

    setSelectedOption(null);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setLoading(true);
      setSubmitError(null);
      try {
        await submitAssessments(updatedAnswers);
        setShowResult(true);
      } catch (err: any) {
        setSubmitError(err?.message || "Submission failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      const prevAnswer = answers[currentQ - 1];
      setSelectedOption(prevAnswer ? prevAnswer.optionId : null);
    }
  };

  // Unified totalScore calculation
  const getTotalScore = (new_answers: any) =>
    new_answers
      .filter((ans) => ans && typeof ans.score === "number")
      .reduce((sum, ans) => sum + ans.score, 0);

  const totalScore = getTotalScore(answers);

  const matchingRule = rules.find(
    (rule) =>
      totalScore >= parseInt(rule.min_score, 10) &&
      totalScore <= parseInt(rule.max_score, 10)
  );

  const maxPossibleScore = Math.max(
    ...(rules.map((rule) => parseInt(rule.max_score, 10)) || [0])
  );

  const cleanDescriptionText = (input: string | undefined | null): string => {
    if (!input) return "";
    return input
      .replace(/\\n/g, "<br/>")
      .replace(/\\t/g, " ")
      .replace(/\\"/g, '"');
  };

  const submitAssessments = async (updatedAnswers: any) => {
    // Prepare finishedOn
    const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
    const finishedOn = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    // Prepare options array
    const optionsArr = questions.map((q: any, idx: number) => {
      const answer = updatedAnswers[idx];
      return {
        question_id: q.id,
        option_id: answer?.optionId,
        score: answer?.score?.toString() ?? "0",
      };
    });
    // Prepare request
    const request = {
      get_api_url: SiteConfig.on_mood9_API_URL + ASSESSMENT_API_URL_SAVE,
      get_api_url_params: {
        user_id: USER_ID,
        assessment_id: data.id,
        started_on: startedOn,
        finished_on: finishedOn,
        total_score: getTotalScore(updatedAnswers).toString(),
        options: optionsArr,
      },
    };
    const response = await callSuggestusAPI(
      spd_processId_config.sgconf_integration_postAPICallJWT,
      request
    );
    if (!response || response.returnCode !== true) {
      throw new Error(response?.msg || "Submission failed.");
    }
  };

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
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.container,
              Platform.OS === "web" && screenWidth >= 1024
                ? { marginLeft: 'auto', marginRight: 'auto', maxWidth: 620 }
                : {},
            ]}
          >
            <View style={styles.flexContent}>
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: data.assessment_image }}
                  style={[
                    styles.image,
                    Platform.OS === "web" && screenWidth >= 1024
                      ? { height: 300 }
                      : {},
                  ]}
                />
                <Text style={styles.title}>{data.title}</Text>
                <HTMLView
                  value={`<div>${cleanDescriptionText(data.description)}</div>`}
                  stylesheet={{
                    div: styles.desc,
                    p: styles.desc,
                  }}
                />
              </ScrollView>
              <View 
               style={[
                styles.fixedButtonRow,
                Platform.OS === "web" && screenWidth >= 1024
                  ? {  alignItems: "center" }
                  : {},
              ]}>
                <View
                  style={[
                    styles.buttonRow,
                    Platform.OS === "web" && screenWidth >= 1024
                      ? { width: 520  }
                      : {},
                  ]}>
                  <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() =>
                      navigation.navigate("assessments/AssessmentHistory", {
                        title: data.title,
                        id: data.id,
                      })
                    }
                  >
                    <Text style={styles.historyBtnText}>View history</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={openSurvey}
                  >
                    <Text style={styles.primaryBtnText}>Begin your test</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.disclaimer}>
                  By clicking the{" "}
                  <Text style={{ fontWeight: "600" }}>"Above Button"</Text> you
                  acknowledge that this is not a diagnostic instrument and is
                  only to be used for self-awareness.
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>

        <Modal visible={showSurvey} transparent animationType="fade">
          <View style={styles.modalContainer}>
            {!showResult ? (
              <View style={[styles.popup, Platform.OS === "web" && screenWidth >= 1024 ? { width: 520 } : {}]}>
                <View style={styles.popupHeader}>
                  <Text style={styles.popupTitle}>Question</Text>
                  <TouchableOpacity
                    style={{ opacity: ".5" }}
                    onPress={() => setShowSurvey(false)}
                  >
                    <Ionicons name="close" size={22} color="#262626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            ((currentQ + 1) / questions.length) * 100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressCount}>
                      {currentQ + 1}/{questions.length} Ques.
                    </Text>
                  </View>
                </View>

                <HTMLView
                  value={`<div>${cleanDescriptionText(
                    currentQuestion?.title
                  )}</div>`}
                  style={styles.questionText}
                />

                {currentQuestion?.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionBtn,
                      selectedOption === opt.id && styles.optionSelected,
                    ]}
                    onPress={() => setSelectedOption(opt.id)}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selectedOption === opt.id &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selectedOption === opt.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          selectedOption === opt.id &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {opt.answer}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={styles.navButtons}>
                  <TouchableOpacity
                    style={[
                      styles.navBtnSecondary,
                      currentQ === 0 && { opacity: 0.5 },
                    ]}
                    disabled={currentQ === 0}
                    onPress={handleBack}
                  >
                    <Text
                      style={{
                        color: "#262626",
                        fontSize: 16,
                        fontFamily: "QuicksandSemiBold",
                      }}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.navBtnPrimary,
                      (!selectedOption || loading) && { opacity: 0.5 },
                    ]}
                    disabled={!selectedOption || loading}
                    onPress={handleNext}
                  >
                    {loading ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontFamily: "QuicksandSemiBold",
                            marginRight: 8,
                            fontSize: 16,
                          }}
                        >
                          Submitting
                        </Text>
                        <ActivityIndicator color="#fff" size="small" />
                      </View>
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "QuicksandSemiBold",
                          fontSize: 16,
                        }}
                      >
                        {currentQ === questions.length - 1 ? "Submit" : "Next"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.popup, Platform.OS === "web" && screenWidth >= 1024 ? { width: 520 } : {}]}>
                <Text style={styles.resultTitle}>Anxiety Score</Text>
                <View style={styles.resultDivider} />

                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <ProgressChart
                    data={{
                      data: [totalScore / maxPossibleScore],
                    }}
                    width={150}
                    height={150}
                    strokeWidth={10}
                    radius={50}
                    chartConfig={{
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#fff",
                      color: (opacity = 1) => `rgba(132, 83, 227, ${opacity})`,
                      strokeWidth: 2,
                    }}
                    hideLegend={true}
                  />
                  <View
                    style={{
                      position: "absolute",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: "700" }}>
                      {totalScore}
                    </Text>
                    <Text style={{ fontSize: 14 }}>
                      out of {maxPossibleScore}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>Result</Text>
                  <Text style={styles.resultLabel}>
                    {matchingRule?.remark || "No Result"}
                  </Text>
                </View>

                <View style={styles.resultDescScrollWrap}>
                  <ScrollView>
                    <HTMLView
                      value={`<div>${cleanDescriptionText(
                        matchingRule?.description
                      )}</div>`}
                      style={styles.resultDesc}
                    />
                  </ScrollView>
                </View>

                <View style={styles.resultButtonRow}>
                  <TouchableOpacity
                    style={styles.resultBtnSecondary}
                    onPress={() => {
                      setShowSurvey(false);
                      setCurrentQ(0);
                      setSelectedOption(null);
                      setAnswers([]);
                      setShowResult(false);
                      navigation.navigate("assessments/AssessmentHistory", {
                        title: data.title,
                        id: data.id,
                      });
                    }}
                  >
                    <Text
                      style={{
                        color: "#262626",
                        fontFamily: "QuicksandMedium",
                        fontSize: 16,
                      }}
                    >
                      History
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resultBtnPrimary}
                    onPress={() => {
                      setShowSurvey(false);
                      setCurrentQ(0);
                      setSelectedOption(null);
                      setAnswers([]);
                      setShowResult(false);
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "QuicksandMedium",
                        fontSize: 16,
                      }}
                    >
                      Assessments
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>
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

// 👇 Styles added/updated for modal and survey popup
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  containerNew: { flex: 1 },
  safeArea: {
    flex: 1,
    // backgroundColor: '#F6F8FC',
  },
  container: {
    flex: 1,
    // backgroundColor: '#F6F8FC',
    paddingHorizontal: 16,
    paddingTop: 0,
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
  flexContent: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 16,
  },
  image: {
    width: "100%",
    height: 170,
    borderRadius: 16,
    marginBottom: 18,
    backgroundColor: "#EEE",
    resizeMode: "cover",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#262626",
    marginBottom: 10,
    fontFamily: "QuicksandRegular",
  },
  desc: {
    fontSize: 14,
    color: "#262626",
    // fontWeight: '500',
    // lineHeight: 22,
    marginBottom: 8,
    fontFamily: "QuicksandMedium",
  },
  learnMore: {
    fontSize: 14,
    color: "#8453E3",
    fontWeight: "400",
    marginBottom: 18,
    marginTop: -5,
  },
  divider: {
    height: 1,
    backgroundColor: "#E3E1E5",
    marginVertical: 12,
    width: "100%",
  },
  disclaimer: {
    fontSize: 11,
    color: "#A3A3A3",
    marginTop: 2,
    lineHeight: 16,
    marginBottom: 8,
  },
  link: {
    color: "#8453E3",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  fixedButtonRow: {
    // backgroundColor: '#F6F8FC',
    // paddingHorizontal: 20,
    paddingBottom: 0,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  historyBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#898D9E66",
    paddingVertical: 13,
    marginRight: 10,
    alignItems: "center",
    shadowColor: "#8453E3",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  historyBtnText: {
    color: "#262626",
    fontWeight: "400",
    fontFamily: "QuicksandMedium",
    fontSize: 16,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#8453E3",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: "#8453E3",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "400",
    fontFamily: "QuicksandMedium",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
    paddingTop: 0,
    paddingBottom: 8,
    marginBottom: 8,
  },
  popupTitle: { fontSize: 16, fontFamily: "QuicksandMedium", color: "#262626" },
  progressText: { fontSize: 14, color: "#262626", marginTop: 10 },

  questionText: {
    fontSize: 16,
    fontFamily: "QuicksandRegular",
    marginTop: 16,
    marginBottom: 12,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 6,
    alignItems: "flex-start",
  },
  optionSelected: {
    borderColor: "#8453E3",
    backgroundColor: "#EEE4FF",
  },
  optionText: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  optionTextSelected: { color: "#262626" },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  navBtnPrimary: {
    flex: 0.45,
    backgroundColor: "#8453E3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnSecondary: {
    flex: 0.45,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: { color: "#fff", fontWeight: "600" },
  resultTitle: {
    fontSize: 16,

    fontFamily: "QuicksandMedium",
    marginBottom: 0,
  },
  resultScore: { fontSize: 24, fontWeight: "700", color: "#8453E3" },

  resultDivider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 12,
  },
  circleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#8453E3",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  circleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  resultBadge: {
    backgroundColor: "#f4eeff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    // alignItems: 'center',
    marginVertical: 8,
  },
  resultBadgeText: {
    fontSize: 14,
    color: "#262626",
    marginBottom: 4,
    fontFamily: "QuicksandMedium",
  },
  resultLabel: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
  },
  resultDesc: {
    fontSize: 12,
    color: "#555",
    fontFamily: "QuicksandMedium",
    marginVertical: 8,
  },
  resultButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  resultBtnSecondary: {
    flex: 0.45,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resultBtnPrimary: {
    flex: 0.45,
    backgroundColor: "#8453E3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#ccc",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8453E3",
  },
  progressBarContainer: {
    backgroundColor: "#f4eeff",
    borderRadius: 8,
    padding: 14,
    paddingVertical: 18,
    marginVertical: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#DDD",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#8453E3",
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  progressCount: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  resultDescScrollWrap: {
    maxHeight: 180,
    minHeight: 80,
    marginBottom: 12,
  },
});
export default AssessmentDetailScreen;
