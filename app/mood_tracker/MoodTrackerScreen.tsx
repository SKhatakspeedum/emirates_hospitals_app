import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  ImageBackground,
  Platform,
} from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import * as Progress from "react-native-progress";

const screenWidth = Dimensions.get("window").width;

import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_ID } from "../config/config";
import Svg, {
  G,
  Path,
  Defs,
  ClipPath,
  Rect,
  Ellipse,
  Circle,
} from "react-native-svg";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const PURPLE = "#8B4CFC";

const MoodTrackerScreen: React.FC = () => {
  const navigation = useNavigation();
  type PieChartItem = {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  };

  const [pieData, setPieData] = useState<PieChartItem[]>([]);
  // Mapping from mood name to its thought breakdown (for drilldown)
  const [moodToThoughtData, setMoodToThoughtData] = useState<
    Record<string, PieChartItem[]>
  >({});
  // Mapping from thought label to its mood breakdown (for drilldown)
  const [thoughtToMoodData, setThoughtToMoodData] = useState<
    Record<string, PieChartItem[]>
  >({});
  // Modal state for drilldown
  const [drilldownModalVisible, setDrilldownModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  // REMOVE DUPLICATE BELOW
  // const [selectedMood, setSelectedMood] = useState<
  //   "pleasant" | "unpleasant" | null
  // >(null);
  const [barData, setBarData] = useState<{
    labels: string[];
    datasets: { data: number[]; colors: (() => string)[] }[];
  }>({ labels: [], datasets: [{ data: [], colors: [] }] });
  const [progressData, setProgressData] = useState<{
    pleasant: number;
    unpleasant: number;
  }>({ pleasant: 0, unpleasant: 0 });

  const [selectedThoughtDrilldown, setSelectedThoughtDrilldown] = useState<
    string | null
  >(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  // Mood Tracker modal and tab states
  const [selectedTab, setSelectedTab] = useState("15 Days");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedThought, setSelectedThought] = useState<string | null>(null);
  const filterTabs = ["15 Days", "1 Month", "1 Year", "Till date"];

  const horizontalMargin = useResponsiveHorizontalMargin();

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0,
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  // Helper: get date range based on selectedTab
  const getDateRange = (tab: string) => {
    const today = new Date();
    let fromDate, toDate;
    toDate = today.toISOString().slice(0, 10);
    if (tab === "15 Days") {
      const past = new Date(today);
      past.setDate(today.getDate() - 14);
      fromDate = past.toISOString().slice(0, 10);
    } else if (tab === "1 Month") {
      const past = new Date(today);
      past.setMonth(today.getMonth() - 1);
      fromDate = past.toISOString().slice(0, 10);
    } else if (tab === "1 Year") {
      const past = new Date(today);
      past.setFullYear(today.getFullYear() - 1);
      fromDate = past.toISOString().slice(0, 10);
    } else {
      fromDate = "2000-01-01"; // Arbitrary early date for 'Till date'
    }
    return { fromDate, toDate };
  };

  // Fetch mood tracker data
  const fetchMoodTrackerData = async () => {
    setApiLoading(true);
    setNoData(false);
    try {
      const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
      const { fromDate, toDate } = getDateRange(selectedTab);
      const payload = {
        p_user_id: USER_ID,
        from_date: fromDate,
        to_date: toDate,
      };
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_get_md_user_mood_tracker_map_data,
        payload,
      );
      if (
        response &&
        response.returnCode === true &&
        Array.isArray(response.returnData) &&
        response.returnData.length > 0
      ) {
        // --- Mapping dictionaries ---
        const FEEL_MAP: Record<string, string> = {
          F1: "Pleasant",
          F2: "Unpleasant",
        };
        const MOOD_MAP: Record<string, string> = {
          M1: "Happiness",
          M2: "Love",
          M3: "Resilience",
          M4: "Wonder",
          M8: "Angry",
          M7: "Anxiety & Fear",
          M5: "Disgust",
          M6: "Depression & Sad",
        };
        const THOUGHT_MAP: Record<string, string> = {
          T1: "I, Me & Myself",
          T2: "Family/Friends/Colleagues",
          T3: "Community/Society/Public",
        };

        // --- Aggregate for PieChart (Mood Type Distribution) ---
        const moodCounts: Record<string, number> = {};
        let pleasantCount = 0;
        let unpleasantCount = 0;
        response.returnData.forEach((entry: any) => {
          const moodLabel = MOOD_MAP[entry.mood_type] || entry.mood_type;
          moodCounts[moodLabel] = (moodCounts[moodLabel] || 0) + 1;
          if (entry.feel_type === "F1") pleasantCount++;
          else if (entry.feel_type === "F2") unpleasantCount++;
        });
        const totalMoods = pleasantCount + unpleasantCount;
        // Pie chart expects: [{ name, population, color, legendFontColor, legendFontSize }]
        const MOOD_COLORS: Record<string, string> = {
          Happiness: "#FBBF24",
          Love: "#60A5FA",
          Resilience: "#FB923C",
          Wonder: "#4ADE80",
          Angry: "#F87171",
          Anxiety: "#A855F7",
          Disgust: "#EF4444",
          Depression: "#F97316",
          Sad: "#F97316",
        };
        const pieChartData = Object.keys(moodCounts).map((mood) => ({
          name: mood,
          population: Math.round((moodCounts[mood] / totalMoods) * 100),
          color: MOOD_COLORS[mood] || "#ccc",
          legendFontColor: "#262626",
          legendFontSize: 12,
        }));

        // --- Aggregate for BarChart (Thoughts by Type, as Percentages) ---
        const THOUGHT_LABELS = ["Myself", "Family", "Community"];
        const THOUGHT_KEYS = ["T1", "T2", "T3"];
        const totalThoughtEntries = response.returnData.length;
        const thoughtCounts = { T1: 0, T2: 0, T3: 0 };
        response.returnData.forEach((entry: any) => {
          if (THOUGHT_KEYS.includes(entry.thought_type)) {
            thoughtCounts[entry.thought_type] += 1;
          }
        });
        const thoughtPercentages = THOUGHT_KEYS.map((key) =>
          totalThoughtEntries
            ? Math.round((thoughtCounts[key] / totalThoughtEntries) * 100)
            : 0,
        );
        // Soft pastel/gradient colors for each bar
        const THOUGHT_BAR_COLORS = [
          () => "#A259FF",
          () => "#FFD700",
          () => "#34C759",
        ];
        const barChartData = {
          labels: THOUGHT_LABELS,
          datasets: [
            {
              data: thoughtPercentages,
              colors: THOUGHT_BAR_COLORS,
            },
          ],
        };

        // --- Progress Data ---
        setPieData(pieChartData);
        setBarData(barChartData);
        setProgressData({
          pleasant: totalMoods
            ? Math.round((pleasantCount / totalMoods) * 100)
            : 0,
          unpleasant: totalMoods
            ? Math.round((unpleasantCount / totalMoods) * 100)
            : 0,
        });
        // --- Per-mood drilldown: aggregate thought breakdown for each mood ---
        // Map: moodName -> [{ name, population, color, ... } for each thought]
        const moodToThought: Record<string, any[]> = {};
        // Get all unique moods (already mapped to label)
        Object.keys(moodCounts).forEach((moodLabel) => {
          // Filter entries for this mood
          const entriesForMood = response.returnData.filter((entry: any) => {
            return (MOOD_MAP[entry.mood_type] || entry.mood_type) === moodLabel;
          });
          // Count thoughts for this mood
          const thoughtCountsForMood: { [key in "T1" | "T2" | "T3"]: number } =
            { T1: 0, T2: 0, T3: 0 };
          entriesForMood.forEach((entry: any) => {
            if ((THOUGHT_KEYS as string[]).includes(entry.thought_type)) {
              const key = entry.thought_type as "T1" | "T2" | "T3";
              thoughtCountsForMood[key] += 1;
            }
          });
          const totalForMood = entriesForMood.length;
          // Compose pie chart data for thoughts under this mood
          const THOUGHT_COLORS = ["#A259FF", "#FFD700", "#34C759"];
          const drilldownPieData: PieChartItem[] = THOUGHT_KEYS.map(
            (key, idx) => ({
              name: THOUGHT_LABELS[idx],
              population: totalForMood
                ? Math.round(
                    (thoughtCountsForMood[key as "T1" | "T2" | "T3"] /
                      totalForMood) *
                      100,
                  )
                : 0,
              color: THOUGHT_COLORS[idx],
              legendFontColor: "#262626",
              legendFontSize: 12,
            }),
          );
          moodToThought[moodLabel] = drilldownPieData;
        });
        setMoodToThoughtData(moodToThought);

        // --- Per-thought drilldown: aggregate mood breakdown for each thought ---
        // Map: thoughtLabel -> [{ name, population, color, ... } for each mood]
        const thoughtToMood: Record<string, PieChartItem[]> = {};
        THOUGHT_KEYS.forEach((thoughtKey, idx) => {
          const thoughtLabel = THOUGHT_LABELS[idx];
          // Filter entries for this thought
          const entriesForThought = response.returnData.filter((entry: any) => {
            return entry.thought_type === thoughtKey;
          });
          // Count moods for this thought
          const moodCountsForThought: Record<string, number> = {};
          entriesForThought.forEach((entry: any) => {
            const moodLabel = MOOD_MAP[entry.mood_type] || entry.mood_type;
            moodCountsForThought[moodLabel] =
              (moodCountsForThought[moodLabel] || 0) + 1;
          });
          const totalForThought = entriesForThought.length;
          // Compose pie chart data for moods under this thought
          const drilldownPieData: PieChartItem[] = Object.keys(MOOD_MAP).map(
            (moodKey) => {
              const moodLabel = MOOD_MAP[moodKey];
              return {
                name: moodLabel,
                population: totalForThought
                  ? Math.round(
                      ((moodCountsForThought[moodLabel] || 0) /
                        totalForThought) *
                        100,
                    )
                  : 0,
                color: MOOD_COLORS[moodLabel] || "#ccc",
                legendFontColor: "#262626",
                legendFontSize: 12,
              };
            },
          );
          thoughtToMood[thoughtLabel] = drilldownPieData;
        });
        setThoughtToMoodData(thoughtToMood);
        setNoData(false);
      } else {
        setNoData(true);
        setPieData([]);
        setBarData({ labels: [], datasets: [{ data: [], colors: [] }] });
        setProgressData({ pleasant: 0, unpleasant: 0 });
      }
    } catch (e: any) {
      setNoData(true);
      setPieData([]);
      setBarData({ labels: [], datasets: [{ data: [], colors: [] }] });
      setProgressData({ pleasant: 0, unpleasant: 0 });
      setError(e?.message || "Failed to fetch mood data.");
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch on mount and when selectedTab changes
  useEffect(() => {
    fetchMoodTrackerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  // Emotion groups for Step 2
  const emotionGroups = [
    {
      key: "angry",
      code: "M8",
      title: "Angry",
      sub: ["Frustrated", "Annoyed", "Irritated", "Hostile"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip_angry)">
            {/* Background */}
            <Rect width={60} height={60} rx={8} fill="#EF4444" />

            {/* Eyes */}
            <Ellipse
              cx={20}
              cy={25}
              rx={6}
              ry={8}
              fill="#fff"
              stroke="#000"
              strokeWidth={1.5}
            />
            <Circle
              cx={20}
              cy={25}
              r={3}
              fill="#FACC15"
              stroke="#000"
              strokeWidth={1}
            />

            <Ellipse
              cx={40}
              cy={25}
              rx={6}
              ry={8}
              fill="#fff"
              stroke="#000"
              strokeWidth={1.5}
            />
            <Circle
              cx={40}
              cy={25}
              r={3}
              fill="#FACC15"
              stroke="#000"
              strokeWidth={1}
            />

            {/* Angry Eyebrows */}
            <Path
              d="M12 18L26 14"
              stroke="#000"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <Path
              d="M48 18L34 14"
              stroke="#000"
              strokeWidth={4}
              strokeLinecap="round"
            />

            {/* Mouth with fangs */}
            <Path
              d="M20 40C25 44 35 44 40 40L42 44L38 44L36 42H24L22 44H18L20 40Z"
              fill="#fff"
              stroke="#000"
              strokeWidth={1.5}
            />
            <Path d="M26 42L27 46" stroke="#991B1B" strokeWidth={1.5} />
            <Path d="M34 42L33 46" stroke="#991B1B" strokeWidth={1.5} />
          </G>
          <Defs>
            <ClipPath id="clip_angry">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#fde7e7",
      border: "#fde7e7",
    },
    {
      key: "anxiety_fear",
      code: "M7",
      title: "Anxiety & Fear",
      sub: ["Worried", "Nervous", "Scared", "Panicked"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip_panic)">
            {/* Background */}
            <Rect width={60} height={60} rx={12} fill="#A855F7" />

            {/* Eyes: large white with small pupils */}
            <Circle cx={22} cy={25} r={6} fill="#fff" />
            <Circle cx={38} cy={25} r={6} fill="#fff" />
            <Circle cx={22} cy={25} r={2} fill="#000" />
            <Circle cx={38} cy={25} r={2} fill="#000" />

            {/* Eyebrows: high arch */}
            <Path
              d="M16 17C20 13 26 14 28 18"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M44 17C40 13 34 14 32 18"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Nose (optional for emotion depth) */}
            <Path
              d="M30 28C30 30 30 32 30 34"
              stroke="#000"
              strokeWidth={1}
              strokeLinecap="round"
            />

            {/* Mouth: downturned */}
            <Path
              d="M22 44C28 41 32 41 38 44"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Sweat drops */}
            <Path d="M18 12C18 10 19 8 20 12C21 16 18 16 18 12Z" fill="#fff" />
            <Path d="M42 12C42 10 43 8 44 12C45 16 42 16 42 12Z" fill="#fff" />
          </G>
          <Defs>
            <ClipPath id="clip_panic">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#e7f2fe",
      border: "#e7f2fe",
    },
    {
      key: "disgust",
      code: "M5",
      title: "Disgust",
      sub: ["Aversion", "Contempt", "Distaste", "Dislike"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip_disgust)">
            <Path
              d="M44.0767 0H15.9233C7.12911 0 0 7.12911 0 15.9233V44.0767C0 52.8709 7.12911 60 15.9233 60H44.0767C52.8709 60 60 52.8709 60 44.0767V15.9233C60 7.12911 52.8709 0 44.0767 0Z"
              fill="#34D399"
            />
            <Path
              d="M20 38C23 35 37 35 40 38"
              stroke="#333"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Path
              d="M18 26C19 28 22 28 23 26"
              stroke="#333"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M42 26C41 28 38 28 37 26"
              stroke="#333"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M30 44C32 44 35 43 35 41"
              stroke="#059669"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </G>
          <Defs>
            <ClipPath id="clip_disgust">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#e4faec",
      border: "#e4faec",
    },
    {
      key: "depression_sad",
      code: "M6",
      title: "Depression & Sad",
      sub: ["Hopeless", "Down", "Lonely", "Tearful"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip_sad)">
            <Path
              d="M44.0767 0H15.9233C7.12911 0 0 7.12911 0 15.9233V44.0767C0 52.8709 7.12911 60 15.9233 60H44.0767C52.8709 60 60 52.8709 60 44.0767V15.9233C60 7.12911 52.8709 0 44.0767 0Z"
              fill="#818CF8"
            />
            <Path
              d="M20 40C23 37 37 37 40 40"
              stroke="#333"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Path
              d="M18 28C19 30 22 30 23 28"
              stroke="#333"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M42 28C41 30 38 30 37 28"
              stroke="#333"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Ellipse
              cx={22}
              cy={44}
              rx={2}
              ry={4}
              fill="#818CF8"
              opacity={0.7}
            />
            <Ellipse
              cx={38}
              cy={44}
              rx={2}
              ry={4}
              fill="#818CF8"
              opacity={0.7}
            />
          </G>
          <Defs>
            <ClipPath id="clip_sad">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#e7eafd",
      border: "#e7eafd",
    },
    {
      key: "happiness",
      code: "M1",
      title: "Happiness",
      sub: ["Euphoria", "Joyful", "Elated", "Glad"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip0)">
            <Path
              d="M44.2576 0H15.7424C7.04813 0 0 7.04813 0 15.7424V44.2576C0 52.9519 7.04813 60 15.7424 60H44.2576C52.9519 60 60 52.9519 60 44.2576V15.7424C60 7.04813 52.9519 0 44.2576 0Z"
              fill="#FBBF24"
            />
            <Path
              d="M40.5281 32.751C40.8274 32.7512 41.1226 32.8198 41.3914 32.9513C41.6601 33.0828 41.8954 33.2739 42.0792 33.51C42.263 33.7461 42.3905 34.0211 42.4521 34.3139C42.5136 34.6067 42.5076 34.9097 42.4345 35.1999C41.1793 40.2858 36.0897 44.0948 30.0018 44.0948C23.9139 44.0948 18.8208 40.2858 17.5656 35.1999C17.4924 34.9097 17.4864 34.6067 17.548 34.3139C17.6095 34.0211 17.7371 33.7461 17.9209 33.51C18.1047 33.2739 18.3399 33.0828 18.6087 32.9513C18.8774 32.8198 19.1727 32.7512 19.4719 32.751H40.5281Z"
              fill="#333333"
            />
            <Path
              d="M12.3802 21.7508C12.7102 22.483 11.3296 24.4674 9.29651 25.3138C7.26341 26.0084 5.34773 27.2879 5.01772 29.321C4.6877 31.354 6.06831 33.2697 8.10141 33.5997C10.1345 33.9298 12.0502 32.5491 12.3802 30.5161Z"
              fill="#333333"
            />
            <Path
              d="M53.9452 36.5438C55.4017 35.0874 55.4017 32.7261 53.9452 31.2696C52.4888 29.8132 50.1275 29.8132 48.671 31.2696C47.2146 32.7261 47.2146 35.0874 48.671 36.5438C50.1275 38.0003 52.4888 38.0003 53.9452 36.5438Z"
              fill="#333333"
            />
            <Path
              d="M37.4788 34.9104C37.9375 34.9106 38.3886 35.0281 38.7892 35.2516C39.1898 35.4752 39.5266 35.7974 39.7676 36.1877C40.0086 36.5781 40.1458 37.0235 40.1662 37.4818C40.1867 37.9401 40.0896 38.396 39.8843 38.8062C38.2059 42.1848 34.4113 44.5396 29.9982 44.5396C25.5851 44.5396 21.7906 42.1848 20.1086 38.8062C19.9041 38.3956 19.8079 37.9396 19.829 37.4814C19.8501 37.0233 19.9878 36.578 20.229 36.1879C20.4702 35.7978 20.8071 35.4757 21.2076 35.2522C21.6081 35.0286 22.059 34.911 22.5177 34.9104H37.4788Z"
              fill="#333333"
            />
            <Path
              d="M14.6318 26.8981C14.3099 26.634 14.006 26.3555 13.713 26.0625C12.4651 24.7928 10.9639 22.7056 11.5752 20.821C12.0455 19.3741 13.7456 18.9364 15.1238 19.0124C15.8724 19.0713 16.6029 19.2727 17.2761 19.6056C17.5547 19.731 17.8253 19.8736 18.0863 20.0324C18.1446 20.0692 18.2115 20.09 18.2804 20.0928C18.3492 20.0957 18.4176 20.0804 18.4788 20.0486C18.5399 20.0167 18.5916 19.9694 18.6287 19.9114C18.6659 19.8533 18.6871 19.7866 18.6904 19.7177C18.7519 18.4662 19.1969 17.1531 20.3254 16.5454C21.5517 15.8798 22.901 16.3211 23.8089 17.305C25.2558 18.8821 25.1111 21.0598 24.5107 22.9769C24.0937 24.3273 23.5612 25.6392 22.919 26.8981C22.6113 27.6169 22.2178 28.2958 21.747 28.9201C20.8463 29.9438 19.526 29.687 18.4191 29.1878C17.0598 28.5977 15.786 27.8276 14.6318 26.8981Z"
              fill="#333333"
            />
            <Path
              d="M45.3646 26.8982C45.6829 26.6341 45.9904 26.3556 46.2797 26.0626C47.5313 24.7929 49.0289 22.7057 48.4212 20.8211C47.9509 19.3742 46.2508 18.9365 44.8726 19.0125C44.1178 19.0692 43.3809 19.2706 42.7022 19.6057C42.429 19.7412 42.1645 19.8934 41.91 20.0615C41.8517 20.0983 41.7848 20.1191 41.716 20.1219C41.6471 20.1247 41.5787 20.1095 41.5176 20.0776C41.4565 20.0458 41.4048 19.9985 41.3677 19.9404C41.3305 19.8824 41.3093 19.8156 41.306 19.7468C41.2445 18.4952 40.7995 17.1821 39.6709 16.5744C38.4447 15.9088 37.0918 16.3502 36.1875 17.3341C34.7406 18.9112 34.8816 21.0888 35.4857 23.006C35.9067 24.3512 36.4441 25.6571 37.0918 26.909C37.3995 27.6279 37.793 28.3068 38.2638 28.9311C39.1645 29.9548 40.4812 29.698 41.5917 29.1988C42.9466 28.6042 44.2155 27.8304 45.3646 26.8982Z"
              fill="#333333"
            />
          </G>
          <Defs>
            <ClipPath id="clip0">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#e7f2fe",
      border: "#e7f2fe",
    },
    {
      key: "love",
      code: "M2",
      title: "Love",
      sub: ["Passionate", "Affection", "Attached", "Compassion"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip0)">
            <Path
              d="M44.2576 0H15.7424C7.04813 0 0 7.04813 0 15.7424V44.2576C0 52.9519 7.04813 60 15.7424 60H44.2576C52.9519 60 60 52.9519 60 44.2576V15.7424C60 7.04813 52.9519 0 44.2576 0Z"
              fill="#60A5FA"
            />
            <Path
              d="M12.3802 34.5161C25.256 39.5949 33.8724 39.4394 41.2697 36.8855C43.9685 35.9746 46.5011 34.6308 48.7684 32.9065C49.4701 32.3639 50.7543 31.2281 51.579 32.2843C52.0493 32.892 51.655 33.9013 51.3294 34.4837C50.5445 35.8908 49.159 36.8855 47.8821 37.826C46.2043 39.0478 44.3818 40.0574 42.4562 40.832C39.1783 42.1397 35.7102 42.9081 32.1867 43.1073C30.8664 43.1941 29.5389 43.2194 28.2077 43.1796H28.0956C26.2093 43.1177 24.3296 42.9231 22.4707 42.5972C18.9149 41.9803 15.49 40.7632 12.3423 38.998C12.0022 38.8063 11.6622 38.6074 11.3294 38.4048C10.2044 37.7175 9.12286 37.0302 8.47898 35.8329C8.22223 35.4049 8.14182 34.8939 8.25471 34.4077C8.48984 33.6047 9.35799 33.3225 10.114 33.4708C11.3041 33.724 12.2844 34.4113 13.3081 34.9937C14.4097 35.609 15.5503 36.1516 16.7228 36.6179C17.0942 36.7722 17.468 36.9133 17.8442 37.0411Z"
              fill="#333333"
            />
            <Path
              d="M26.8403 24.565C27.4951 25.6791 27.8098 27.2816 26.8403 28.128C26.0409 28.8225 24.8364 28.6163 23.7837 28.4897C21.1112 28.1905 18.4116 28.7276 16.0572 30.0271C15.9106 30.121 15.7492 30.1895 15.5797 30.2296C15.4067 30.2548 15.2301 30.228 15.0723 30.1527C14.9145 30.0773 14.7827 29.9568 14.6935 29.8064C14.3715 29.2457 14.6645 28.4934 15.1746 28.0918C15.7176 27.7338 16.3371 27.5083 16.9832 27.4335C19.66 26.9162 22.4417 26.4026 25.0896 27.0718C25.2141 27.1137 25.3472 27.1236 25.4766 27.1007C25.8998 26.9849 25.7877 26.3447 25.5381 25.983C24.6555 24.7241 23.2267 23.95 21.7653 23.4725C20.568 23.0819 17.2039 23.0096 16.4623 21.9497C15.4857 20.5606 18.3289 19.801 19.3128 19.8553C22.08 19.9855 25.4622 22.2282 26.8403 24.565Z"
              fill="#333333"
            />
            <Path
              d="M32.1867 24.565C31.532 25.6791 31.2173 27.2815 32.1867 28.128C32.9861 28.8225 34.1907 28.6163 35.2433 28.4897C37.9158 28.1905 40.6154 28.7276 42.9698 30.0271C43.1155 30.1203 43.2756 30.1888 43.4437 30.2296C43.619 30.2528 43.7972 30.2227 43.9552 30.1434C44.1132 30.0641 44.2438 29.9391 44.3299 29.7847C44.6519 29.224 44.3553 28.4716 43.8488 28.0701C43.3059 27.7119 42.6863 27.4864 42.0402 27.4118C39.3634 26.8945 36.5853 26.3808 33.9375 27.05C33.8129 27.0919 33.6798 27.1019 33.5504 27.079C33.1272 26.9632 33.2393 26.323 33.4889 25.9612C34.3715 24.7024 35.8004 23.9283 37.2618 23.4508C38.4591 23.0602 41.8195 22.9878 42.5647 21.9279C43.5414 20.5389 40.6982 19.7793 39.7107 19.8335C36.9434 19.9855 33.5649 22.2282 32.1867 24.565Z"
              fill="#333333"
            />
          </G>
          <Defs>
            <ClipPath id="clip0">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#e7f2fe",
      border: "#e7f2fe",
    },
    {
      key: "resilience",
      code: "M3",
      title: "Resilience",
      sub: ["Fearless", "Brave", "Arrogant", "Pride"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip0)">
            <Path
              d="M44.2576 0H15.7424C7.04813 0 0 7.04813 0 15.7424V44.2576C0 52.9519 7.04813 60 15.7424 60H44.2576C52.9519 60 60 52.9519 60 44.2576V15.7424C60 7.04813 52.9519 0 44.2576 0Z"
              fill="#FB923C"
            />
            <Path
              d="M43.7946 19.7288H37.3414C36.0518 19.7292 34.8131 20.2323 33.8884 21.1313C32.9638 22.0303 32.426 23.2543 32.3893 24.5434H27.5747C27.538 23.2543 27.0002 22.0303 26.0756 21.1313C25.1509 20.2323 23.9123 19.7292 22.6226 19.7288H16.1585C14.8432 19.7288 13.5818 20.2513 12.6518 21.1813C11.7217 22.1114 11.1992 23.3728 11.1992 24.6881V28.2511C11.1992 29.5664 11.7217 30.8278 12.6518 31.7579C13.5818 32.6879 14.8432 33.2104 16.1585 33.2104H22.6082C23.26 33.2114 23.9057 33.0838 24.5082 32.835C25.1107 32.5862 25.6583 32.221 26.1196 31.7604C26.5809 31.2998 26.9468 30.7528 27.1965 30.1506C27.4462 29.5485 27.5747 28.903 27.5747 28.2511V26.9525H32.3857V28.2511C32.3857 29.5658 32.9077 30.8266 33.837 31.7566C34.7662 32.6865 36.0267 33.2095 37.3414 33.2104H43.791C45.1063 33.2104 46.3677 32.6879 47.2978 31.7579C48.2278 30.8278 48.7503 29.5664 48.7503 28.2511V24.6881C48.7503 23.3734 48.2283 22.1125 47.299 21.1826C46.3698 20.2526 45.1093 19.7297 43.7946 19.7288Z"
              fill="#333333"
            />
            <Path
              d="M12.4145 21.1105L11.8249 20.9261C11.6244 20.8615 11.407 20.8744 11.2155 20.9621C11.0241 21.0498 10.8724 21.206 10.7903 21.3999L10.2115 22.7781C10.1669 22.8824 10.1437 22.9946 10.1433 23.108C10.1429 23.2214 10.1653 23.3338 10.2092 23.4384C10.253 23.543 10.3175 23.6377 10.3987 23.7169C10.4799 23.7961 10.5761 23.8582 10.6818 23.8995L11.2823 24.131C11.4887 24.2107 11.7182 24.2061 11.9212 24.1182C12.1242 24.0302 12.2845 23.8659 12.3675 23.6607L12.9426 22.2355C12.9865 22.1274 13.0075 22.0113 13.0044 21.8947C13.0013 21.778 12.9741 21.6632 12.9245 21.5576C12.8749 21.4519 12.804 21.3577 12.7162 21.2808C12.6284 21.2038 12.5257 21.1459 12.4145 21.1105Z"
              fill="#333333"
            />
            <Path
              d="M47.7484 21.1104L48.3344 20.9259C48.5354 20.862 48.7529 20.8752 48.9448 20.9627C49.1366 21.0503 49.2891 21.2061 49.3725 21.3998L49.9585 22.778C50.003 22.8825 50.0261 22.9949 50.0262 23.1085C50.0264 23.2221 50.0037 23.3345 49.9595 23.4392C49.9153 23.5438 49.8504 23.6385 49.7689 23.7175C49.6873 23.7966 49.5906 23.8584 49.4847 23.8993L48.8878 24.1308C48.6813 24.2096 48.4522 24.2045 48.2495 24.1167C48.0467 24.0288 47.8863 23.8651 47.8026 23.6606L47.2311 22.2354C47.187 22.1279 47.1655 22.0126 47.1679 21.8964C47.1703 21.7803 47.1966 21.6659 47.2451 21.5604C47.2936 21.4549 47.3634 21.3605 47.4499 21.2831C47.5365 21.2056 47.6381 21.1469 47.7484 21.1104Z"
              fill="#333333"
            />
            <Path
              d="M10.7868 21.3999L0 16.0391V18.4482L10.2008 22.7781L10.7868 21.3999Z"
              fill="#333333"
            />
            <Path
              d="M49.1265 21.4L60 16.0862V18.4989L49.7125 22.7782L49.1265 21.4Z"
              fill="#333333"
            />
            <Path
              d="M23.7223 42.1233C24.6483 42.1233 25.5743 42.1812 26.4823 42.1957C29.7096 42.2979 32.9396 42.1225 36.1368 41.6712C37.8659 41.3999 39.935 41.1322 41.4651 40.2242C42.4382 39.6527 43.2738 38.9003 44.1889 38.2456C44.6954 37.8839 45.8203 36.9506 46.4895 37.4172C46.7102 37.5692 46.6993 37.8947 46.6487 38.1588C46.2146 40.4449 44.6809 42.4019 43.0314 43.9826C41.5375 45.4295 39.8373 46.6377 37.8333 47.2382C35.44 47.9305 32.96 48.2776 30.4685 48.2691C27.8026 48.2944 24.8292 48.2691 22.4092 47.003C21.8198 46.6989 21.2756 46.3142 20.7923 45.86C20.3554 45.434 20.0471 44.8937 19.9024 44.3009C19.833 44.0498 19.8214 43.7863 19.8684 43.5301C19.9154 43.2739 20.0198 43.0316 20.1737 42.8215C20.3639 42.6203 20.5925 42.4593 20.846 42.3481C21.0995 42.2369 21.3728 42.1777 21.6496 42.174C22.3369 42.1197 23.0422 42.1161 23.7223 42.1233Z"
              fill="#333333"
            />
          </G>
          <Defs>
            <ClipPath id="clip0">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#ffefe2",
      border: "#ffefe2",
    },
    {
      key: "wonder",
      code: "M4",
      title: "Wonder",
      sub: ["Amazed", "Curious", "Surprised", "Excited"],
      emoji: (
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <G clipPath="url(#clip0)">
            <Path
              d="M44.0767 0H15.9233C7.12911 0 0 7.12911 0 15.9233V44.0767C0 52.8709 7.12911 60 15.9233 60H44.0767C52.8709 60 60 52.8709 60 44.0767V15.9233C60 7.12911 52.8709 0 44.0767 0Z"
              fill="#4ADE80"
            />
            <Path
              d="M17.8442 37.0411C25.256 39.5949 33.8724 39.4394 41.2697 36.8855C43.9685 35.9746 46.5011 34.6308 48.7684 32.9065C49.4701 32.3639 50.7543 31.2281 51.579 32.2843C52.0493 32.892 51.655 33.9013 51.3294 34.4837C50.5445 35.8908 49.159 36.8855 47.8821 37.826C46.2043 39.0478 44.3818 40.0574 42.4562 40.832C39.1783 42.1397 35.7102 42.9081 32.1867 43.1073C30.8664 43.1941 29.5389 43.2194 28.2077 43.1796H28.0956C26.2093 43.1177 24.3296 42.9231 22.4707 42.5972C18.9149 41.9803 15.49 40.7632 12.3423 38.998C12.0022 38.8063 11.6622 38.6074 11.3294 38.4048C10.2044 37.7175 9.12286 37.0302 8.47898 35.8329C8.22223 35.4049 8.14182 34.8939 8.25471 34.4077C8.48984 33.6047 9.35799 33.3225 10.114 33.4708C11.3041 33.724 12.2844 34.4113 13.3081 34.9937C14.4097 35.609 15.5503 36.1516 16.7228 36.6179C17.0942 36.7722 17.468 36.9133 17.8442 37.0411Z"
              fill="#333333"
            />
            <Path
              d="M26.8403 24.565C27.4951 25.6791 27.8098 27.2816 26.8403 28.128C26.0409 28.8225 24.8364 28.6163 23.7837 28.4897C21.1112 28.1905 18.4116 28.7276 16.0572 30.0271C15.9106 30.121 15.7492 30.1895 15.5797 30.2296C15.4067 30.2548 15.2301 30.228 15.0723 30.1527C14.9145 30.0773 14.7827 29.9568 14.6935 29.8064C14.3715 29.2457 14.6645 28.4934 15.1746 28.0918C15.7176 27.7338 16.3371 27.5083 16.9832 27.4335C19.66 26.9162 22.4417 26.4026 25.0896 27.0718C25.2141 27.1137 25.3472 27.1236 25.4766 27.1007C25.8998 26.9849 25.7877 26.3447 25.5381 25.983C24.6555 24.7241 23.2267 23.95 21.7653 23.4725C20.568 23.0819 17.2039 23.0096 16.4623 21.9497C15.4857 20.5606 18.3289 19.801 19.3128 19.8553C22.08 19.9855 25.4622 22.2282 26.8403 24.565Z"
              fill="#333333"
            />
            <Path
              d="M32.1867 24.565C31.532 25.6791 31.2173 27.2815 32.1867 28.128C32.9861 28.8225 34.1907 28.6163 35.2433 28.4897C37.9158 28.1905 40.6154 28.7276 42.9698 30.0271C43.1155 30.1203 43.2756 30.1888 43.4437 30.2296C43.619 30.2528 43.7972 30.2227 43.9552 30.1434C44.1132 30.0641 44.2438 29.9391 44.3299 29.7847C44.6519 29.224 44.3553 28.4716 43.8488 28.0701C43.3059 27.7119 42.6863 27.4864 42.0402 27.4118C39.3634 26.8945 36.5853 26.3808 33.9375 27.05C33.8129 27.0919 33.6798 27.1019 33.5504 27.079C33.1272 26.9632 33.2393 26.323 33.4889 25.9612C34.3715 24.7024 35.8004 23.9283 37.2618 23.4508C38.4591 23.0602 41.8195 22.9878 42.5647 21.9279C43.5414 20.5389 40.6982 19.7793 39.7107 19.8335C36.9434 19.9855 33.5649 22.2282 32.1867 24.565Z"
              fill="#333333"
            />
          </G>
          <Defs>
            <ClipPath id="clip0">
              <Rect width={60} height={60} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      ),
      bg: "#e4faec",
      border: "#e4faec",
    },
  ];

  // Thought groups for Step 3
  const thoughtGroups = [
    {
      key: "self",
      code: "T1",
      title: "Thought is related to - I, Me & Myself",
      color: "#A259FF",
      bg: "#E7ECFF",
      border: "#A259FF",
      bullet: "#5B74FF",
      items: [
        "My Ego",
        "My Belongings",
        "My Career",
        "My Health",
        "My Achievements",
        "My Feelings",
      ],
    },
    {
      key: "family",
      code: "T2",
      title: "Thought is related to Family, Friends & Colleagues",
      color: "#FFD700",
      bg: "#FFF8E7",
      border: "#FFD700",
      bullet: "#FFC542",
      items: [
        "Partner",
        "Colleagues",
        "Kids",
        "Relationships",
        "Parents",
        "Friends",
      ],
    },
    {
      key: "community",
      code: "T3",
      title: "Thought is related to Community, Society & Public",
      color: "#34C759",
      bg: "#E8F8F5",
      border: "#34C759",
      bullet: "#34C759",
      items: [
        "Neighbors",
        "Society",
        "People",
        "Environment",
        "Community",
        "Global",
      ],
    },
  ];

  // Modal navigation logic
  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setModalStep(1);
      setSelectedMood(null);
      setSelectedEmotion(null);
      setSelectedThought(null);
      setError(null);
    }, 350);
  };

  // Submit handler for Step 3
  const handleSubmit = async () => {
    if (!selectedMood || !selectedEmotion || !selectedThought) return;
    setLoading(true);
    setError(null);
    // Map mood
    const moodCode =
      selectedMood === "pleasant"
        ? "F1"
        : selectedMood === "unpleasant"
          ? "F2"
          : "";
    // Map emotion
    const selectedEmotionObj = emotionGroups.find(
      (e) => e.key === selectedEmotion,
    );
    const emotionCode = selectedEmotionObj ? selectedEmotionObj.code : "";
    // Map thought
    const selectedThoughtObj = thoughtGroups.find(
      (t) => t.key === selectedThought,
    );
    const thoughtCode = selectedThoughtObj ? selectedThoughtObj.code : "";

    if (!selectedMood || !selectedEmotion || !selectedThought) return;
    setLoading(true);
    setError(null);
    const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
    try {
      // Construct request JSON
      const today = new Date();

      // 2. Extract and zero-pad date components
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");

      // 3. Extract and zero-pad time components
      const hh = String(today.getHours()).padStart(2, "0");
      const min = String(today.getMinutes()).padStart(2, "0");
      const ss = String(today.getSeconds()).padStart(2, "0");

      // 4. Build full timestamp
      const dateTimeStr = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
      const payload = {
        p_user_id: USER_ID,
        p_feel_type: moodCode,
        p_mood_type: emotionCode,
        p_thought_type: thoughtCode,
        p_added_on: dateTimeStr,
      };
      const response = await callSuggestusAPI(
        spd_processId_config.spdonmood9_save_md_user_mood_tracker,
        payload,
      );
      if (response?.returnCode === true) {
        closeModal();
        fetchMoodTrackerData();
      } else {
        setError(response?.msg || "Failed to submit mood.");
      }
    } catch (err: any) {
      setError(err?.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Modal step renderers
  const renderStep1 = () => (
    <View>
      {/* Header Row */}
      <View style={styles.modalHeaderRow}>
        <Text style={styles.modalTitle}>Add feeling</Text>
        <TouchableOpacity
          onPress={closeModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={require("@/assets/images/vector_11.png")}
            style={styles.modalCloseIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.modalDivider} />
      <Text style={styles.modalQuestion}>How is your mood today?</Text>
      {/* Mood Selection Cards */}
      <View style={styles.modalCardsRow}>
        <TouchableOpacity
          style={[
            styles.moodCard,
            selectedMood === "pleasant"
              ? styles.moodCardSelected
              : styles.moodCardUnselected,
          ]}
          onPress={() => {
            setSelectedMood("pleasant");
            setTimeout(() => setModalStep(2), 250);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={require("@/assets/images/pleasant_mood.png")}
            style={styles.moodCardImg}
          />
          <Text style={styles.moodCardText}>Pleasant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.moodCard,
            selectedMood === "unpleasant"
              ? styles.moodCardSelected
              : styles.moodCardUnselected,
          ]}
          onPress={() => {
            setSelectedMood("unpleasant");
            setTimeout(() => setModalStep(2), 250);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={require("@/assets/images/unpleasant_mood.png")}
            style={[{ marginTop: 10 }, styles.moodCardImg]}
          />
          <Text style={styles.moodCardText}>Unpleasant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View
      style={[
        {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100%",
        },
      ]}
    >
      <View style={styles.modalHeaderRow}>
        <Text style={styles.modalTitle}>Add emotion</Text>
        <TouchableOpacity
          onPress={closeModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={require("@/assets/images/vector_11.png")}
            style={styles.modalCloseIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.modalDivider} />
      <Text style={styles.modalStep2Header1}>
        Try to identify the dominant {"\n"}
        emotion in your feelings
      </Text>
      <Text style={styles.modalStep2Header2}>
        Make the emotion in the group below
      </Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {emotionGroups
          .filter((group) => {
            if (selectedMood === "pleasant") {
              // Pleasant moods: show only pleasant groups
              return (
                group.key === "happiness" ||
                group.key === "love" ||
                group.key === "resilience" ||
                group.key === "wonder"
              );
            } else if (selectedMood === "unpleasant") {
              // Unpleasant moods: show only unpleasant groups
              return (
                group.key === "angry" ||
                group.key === "anxiety_fear" ||
                group.key === "disgust" ||
                group.key === "depression_sad"
              );
            }
            return false;
          })
          .map((group) => (
            <TouchableOpacity
              key={group.key}
              style={[
                styles.emotionGroupCard,
                styles.emotionGroupItem,
                {
                  backgroundColor: group.bg,
                  borderColor:
                    selectedEmotion === group.key
                      ? group.border
                      : "transparent",
                },
                selectedEmotion === group.key &&
                  styles.emotionGroupCardSelected,
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedEmotion(group.key)}
            >
              {/* Radio Button */}
              <View style={styles.emotionGroupTextWrap}>
                <Text style={styles.emotionGroupTitle}>
                  <View style={styles.radioOuter}>
                    {selectedEmotion === group.key ? (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: "#8B4CFC" },
                        ]}
                      />
                    ) : null}
                  </View>
                  {group.title}
                </Text>
                <View style={styles.subEmotionWrap}>
                  {chunkArray(group.sub, 2).map(
                    (pair: string[], rowIndex: number) => (
                      <View key={rowIndex} style={styles.subEmotionRow}>
                        {pair.map((sub: string, colIndex: number) => (
                          <Text
                            key={colIndex}
                            style={[
                              styles.subEmotionText,
                              styles.subEmotionItem,
                            ]}
                          >
                            {sub}
                          </Text>
                        ))}
                      </View>
                    ),
                  )}
                </View>
              </View>
              <Text
                style={[styles.emotionGroupEmoji, { textAlignVertical: "top" }]}
              >
                {group.emoji}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <View style={styles.emotionGroupList}>
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.modalButtonOutline, styles.modalButtonItem]}
            onPress={() => setModalStep(1)}
          >
            <Text style={styles.modalButtonOutlineText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              !selectedEmotion && styles.modalButtonDisabled,
            ]}
            disabled={!selectedEmotion}
            onPress={() => setModalStep(3)}
          >
            <Text style={styles.modalButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View
      style={[
        {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100%",
        },
      ]}
    >
      <View style={styles.modalHeaderRow}>
        <Text style={styles.modalTitle}>Type of thought</Text>
        <TouchableOpacity
          onPress={closeModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={require("@/assets/images/vector_11.png")}
            style={styles.modalCloseIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.modalDivider} />
      <Text style={styles.modalStep3Header1}>
        Try to identify the dominant {"\n"}thought in your mind which is {"\n"}
        leading to this feeling of
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.thoughtGroupList}>
          {thoughtGroups.map((group) => (
            <TouchableOpacity
              key={group.key}
              style={[
                styles.thoughtGroupCard,
                styles.thoughtGroupListItem,
                {
                  backgroundColor: group.bg,
                  borderColor:
                    selectedThought === group.key ? "#8B4CFC" : "transparent",
                },
                selectedThought === group.key &&
                  styles.thoughtGroupCardSelected,
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedThought(group.key)}
            >
              {/* Radio Button */}
              <View style={styles.radioOuter}>
                {selectedThought === group.key ? (
                  <View
                    style={[styles.radioInner, { backgroundColor: "#8B4CFC" }]}
                  />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.thoughtGroupTitle]}>{group.title}</Text>
                <View style={styles.thoughtGroupItemsGrid}>
                  {group.items.map((item) => (
                    <View
                      style={[
                        styles.thoughtGroupItemRow,
                        styles.thoughtGroupItem,
                      ]}
                      key={item}
                    >
                      <View
                        style={[
                          styles.thoughtGroupBullet,
                          { backgroundColor: group.bullet },
                        ]}
                      />
                      <Text style={styles.thoughtGroupItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={styles.emotionGroupList}>
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.modalButtonOutline, styles.modalButtonItem]}
            onPress={() => setModalStep(2)}
          >
            <Text style={styles.modalButtonOutlineText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              (!selectedThought || loading) && styles.modalButtonDisabled,
            ]}
            disabled={!selectedThought || loading}
            onPress={handleSubmit}
          >
            {loading ? (
              <Text style={styles.modalButtonText}>Submitting...</Text>
            ) : (
              <Text style={styles.modalButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {error && (
        <Text style={{ color: "red", marginTop: 8, textAlign: "center" }}>
          {error}
        </Text>
      )}
    </View>
  );

  const chunkArray = (arr: any[], size: number): any[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size),
    );
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
      >
        {/* Top Header for screen */}
        <CustomTopHeader title="Back" />
        <ScrollView
          style={[
            styles.container,
            Platform.OS === "web" && screenWidth >= 1024
              ? { paddingLeft: 100, paddingRight: 100 }
              : null,
          ]}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <ImageBackground
            source={require("../../assets/images/card_bg.png")}
            style={[
              styles.headerContainer,
              {
                flex: 1,
                width: "100%",
                height: "100%",
                backgroundPosition: "center right 34%",
              },
            ]}
            resizeMode="cover"
          >
            <View style={styles.headerLeft}>
              <Text style={styles.headerPrompt}>
                How are you feeling today?
              </Text>
              <TouchableOpacity
                style={styles.addEmotionBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.addEmotionBtnText}>Add your emotion</Text>
              </TouchableOpacity>

              {/* Multi-step Modal */}
              <Modal
                animationType="fade"
                transparent
                visible={modalVisible}
                onRequestClose={closeModal}
              >
                <Pressable style={styles.modalBackdrop} onPress={closeModal}>
                  <Pressable
                    style={[
                      styles.modalContainer,
                      Platform.OS === "web" && screenWidth >= 1024
                        ? { width: 600 }
                        : null,
                    ]}
                    onPress={(e) => e.stopPropagation()}
                  >
                    {modalStep === 1 && renderStep1()}
                    {modalStep === 2 && renderStep2()}
                    {modalStep === 3 && renderStep3()}
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
            <Image
              source={require("@/assets/images/meditation_img.png")}
              style={styles.headerImg}
              resizeMode="contain"
            />
          </ImageBackground>
          {/* <-- Close headerContainer View before Time Filter Tabs */}
          {/* Time Filter Tabs */}
          <View style={styles.tabRow}>
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  selectedTab === tab
                    ? styles.tabBtnActive
                    : styles.tabBtnInactive,
                ]}
                onPress={() => setSelectedTab(tab)}
                disabled={apiLoading}
              >
                <Text
                  style={
                    selectedTab === tab
                      ? styles.tabBtnTextActive
                      : styles.tabBtnTextInactive
                  }
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Feelings Progress Bar */}
          <Text style={styles.sectionTitle}>Feelings</Text>
          <View style={styles.sectionContainer}>
            {apiLoading ? (
              <View style={{ alignItems: "center", padding: 24 }}>
                <Progress.Circle size={36} indeterminate color="#8B4CFC" />
              </View>
            ) : noData ? (
              <Text
                style={{
                  color: "#888",
                  textAlign: "center",
                  marginVertical: 16,
                }}
              >
                No data available for selected range.
              </Text>
            ) : (
              <>
                <View style={styles.progressBarRow}>
                  <Text style={styles.progressLabel}>Pleasant</Text>
                  <Text style={styles.progressLabel}>Unpleasant</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <Progress.Bar
                    progress={progressData.pleasant / 100}
                    width={screenWidth - 70}
                    color="#008000"
                    unfilledColor="#FF0000"
                    borderWidth={0}
                    height={10}
                  />
                </View>
                <View style={styles.progressPercentRow}>
                  <Text style={styles.progressPercent}>
                    {progressData.pleasant}%
                  </Text>
                  <Text style={styles.progressPercent}>
                    {progressData.unpleasant}%
                  </Text>
                </View>
              </>
            )}
          </View>
          {/* Moods Pie Chart */}
          <Text style={styles.sectionTitle}>Moods</Text>
          <View style={styles.sectionContainer}>
            {apiLoading ? (
              <View style={{ alignItems: "center", padding: 24 }}>
                <Progress.Circle size={36} indeterminate color="#8B4CFC" />
              </View>
            ) : noData || !pieData.length ? (
              <Text
                style={{
                  color: "#888",
                  textAlign: "center",
                  marginVertical: 16,
                }}
              >
                No mood data available.
              </Text>
            ) : (
              <View style={styles.sectionContainerChart}>
                <PieChart
                  data={pieData}
                  width={150}
                  height={180}
                  chartConfig={chartConfig}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"40"}
                  hasLegend={false}
                  center={[0, 0]}
                />

                <View style={styles.pieLegendRow}>
                  {pieData.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={styles.pieLegendItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedMood(item.name);
                        setDrilldownModalVisible(true);
                      }}
                    >
                      <View style={styles.pieLegendItemText}>
                        <View
                          style={[
                            styles.pieLegendDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.pieLegendText,
                            { marginRight: 0, paddingRight: 10 },
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>
                      <Text style={styles.pieLegendPercent}>
                        {item.population}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Text
              style={{
                marginTop: 8,
                color: "#555",
                textAlign: "left",
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              Tap legends above to see Mood breakdown for that Thought.
            </Text>
          </View>
          <View style={styles.thoughtContainer}>
            <Text style={[styles.sectionTitle, { margin: "0" }]}>Thoughts</Text>
            {/* BarChart legend as touchable labels */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 0,
              }}
            >
              {barData.labels.map((label, idx) => (
                <TouchableOpacity
                  key={label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                  onPress={() => {
                    setSelectedThoughtDrilldown(label);
                    setSelectedMood(null); // Clear mood selection for thought drilldown
                    setDrilldownModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 8,
                      backgroundColor: barData.datasets[0].colors[idx](),
                      marginRight: 6,
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  />
                  <Text
                    style={{ fontSize: 13, color: "#222", textAlign: "left" }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.sectionContainer}>
            {apiLoading ? (
              <View style={{ alignItems: "center", padding: 24 }}>
                <Progress.Circle size={36} indeterminate color="#8B4CFC" />
              </View>
            ) : noData || !barData.labels.length ? (
              <Text
                style={{
                  color: "#888",
                  textAlign: "center",
                  marginVertical: 16,
                }}
              >
                No thought data available.
              </Text>
            ) : (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                {/* Drilldown instruction */}
                {/* <Text
                style={{
                  marginBottom: 8,
                  color: "#555",
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                Tap legends above to see mood breakdown for that thought.
              </Text> */}

                <BarChart
                  data={barData}
                  width={screenWidth - 72}
                  height={200}
                  fromZero
                  chartConfig={barChartConfig}
                  withCustomBarColorFromData={true}
                  flatColor={true}
                  showValuesOnTopOfBars={true}
                  // style={{ borderRadius: 18, overflow: "hidden" }}
                  yAxisLabel={""}
                  // yAxisSuffix={"%"}
                  withInnerLines={true}
                  withHorizontalLabels={true}
                  segments={5}
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: "#555",
                    textAlign: "left",
                    fontSize: 14,
                    fontStyle: "italic",
                  }}
                >
                  Tap legends above to see Thoughts breakdown for that Mood.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        {/* Drilldown Modal */}
        <Modal
          visible={drilldownModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDrilldownModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                width: "90%",
                maxWidth: 400,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 300,
                  alignItems: "center",
                  alignSelf: "center",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#666",
                    fontSize: 16,
                    marginBottom: 16,
                  }}
                >
                  {selectedMood && !selectedThoughtDrilldown ? (
                    <>
                      Your Mood of{" "}
                      <Text style={{ fontWeight: "bold", color: "#222" }}>
                        {selectedMood}
                      </Text>{" "}
                      in{" "}
                      <Text style={{ fontWeight: "bold", color: "#222" }}>
                        15 Days
                      </Text>{" "}
                      is triggered by following thoughts
                    </>
                  ) : selectedThoughtDrilldown ? (
                    <>
                      Your Thoughts related to{" "}
                      <Text style={{ fontWeight: "bold", color: "#222" }}>
                        {selectedThoughtDrilldown}
                      </Text>{" "}
                      in{" "}
                      <Text style={{ fontWeight: "bold", color: "#222" }}>
                        15 Days
                      </Text>{" "}
                      have generated following Moods
                    </>
                  ) : null}
                </Text>
                <PieChart
                  data={
                    selectedMood &&
                    !selectedThoughtDrilldown &&
                    moodToThoughtData[selectedMood]
                      ? moodToThoughtData[selectedMood]
                      : selectedThoughtDrilldown &&
                          thoughtToMoodData[selectedThoughtDrilldown]
                        ? thoughtToMoodData[selectedThoughtDrilldown]
                        : []
                  }
                  width={200}
                  height={200}
                  chartConfig={{
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="40"
                  absolute
                  hasLegend={false}
                />
              </View>
              <View style={{ width: "100%", marginTop: 16 }}>
                {(() => {
                  // Label maps for legend
                  const thoughtLabelMap: Record<string, string> = {
                    Myself: "Me & MySelf",
                    Family: "Family & Friends",
                    Community: "Community & Others",
                  };
                  const moodLabelMap: Record<string, string> = {
                    Happiness: "Happiness",
                    Love: "Love",
                    Resilience: "Resilience",
                    Wonder: "Wonder",
                    Angry: "Angry",
                    "Anxiety & Fear": "Anxiety & Fear",
                    Disgust: "Disgust",
                    "Depression & Sad": "Depression & Sad",
                  };
                  const dataArr =
                    selectedMood &&
                    !selectedThoughtDrilldown &&
                    moodToThoughtData[selectedMood]
                      ? moodToThoughtData[selectedMood]
                      : selectedThoughtDrilldown &&
                          thoughtToMoodData[selectedThoughtDrilldown]
                        ? thoughtToMoodData[selectedThoughtDrilldown]
                        : [];
                  const labelMap =
                    selectedMood && !selectedThoughtDrilldown
                      ? thoughtLabelMap
                      : moodLabelMap;
                  return dataArr
                    .filter((item) => item.population > 0)
                    .map((item) => (
                      <View
                        key={item.name}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: item.color,
                              marginRight: 8,
                            }}
                          />
                          <Text style={{ fontSize: 15 }}>
                            {labelMap[item.name] || item.name}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 15 }}>{item.population}%</Text>
                      </View>
                    ));
                })()}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setDrilldownModalVisible(false);
                  setSelectedMood(null);
                  setSelectedThoughtDrilldown(null);
                }}
                style={{
                  marginTop: 16,
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  backgroundColor: "#8B4CFC",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "500", fontSize: 16 }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
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
const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(162, 89, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForBackgroundLines: {
    stroke: "#ECECEC",
    strokeDasharray: "",
  },
};

const barChartConfig = {
  ...chartConfig,
  fillShadowGradient: "#A259FF",
  fillShadowGradientOpacity: 1,
  barPercentage: 0.5,
  propsForLabels: {
    fontSize: 14,
    fontWeight: "bold",
  },
  formatYLabel: (value: string) => `${parseInt(value)}%`,
};

const styles = StyleSheet.create({
  containerNew: { flex: 1 },
  thoughtContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
  },
  thoughtGroupItemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  thoughtGroupItem: {
    marginRight: 8,
    marginBottom: 5,
  },
  thoughtGroupListItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  emotionGroupItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  subEmotionItem: {
    marginRight: 8,
  },
  modalButtonItem: {
    marginRight: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseIcon: {
    width: 12,
    height: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginBottom: 16,
  },
  modalQuestion: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
  },
  modalCardsRow: {
    flexDirection: "row",
    // flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  subEmotionWrap: {
    marginTop: 0,
  },
  subEmotionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 4,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 0,
  },
  subEmotionText: {
    fontSize: 14,
    color: "#333",
    width: "47%",
    marginRight: 6,
    marginBottom: 0,
  },
  // Selected style for thought card
  thoughtGroupCardSelected: {
    elevation: 4,
    // backgroundColor: "#F5F7FB",
  },
  // Radio Button Styles
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dadada",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
    backgroundColor: "#fff",
    verticalAlign: "bottom",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#8B4CFC",
    // borderWidth: 1,
  },
  // Modal Step 2: Add Emotion
  modalStep2Header1: {
    fontSize: 16,
    color: "#262626",
    textAlign: "center",
    fontFamily: "QuicksandSemiBold",
    marginBottom: 8,
  },
  modalStep2Header2: {
    fontSize: 14,
    color: "#898D9E",
    fontFamily: "QuicksandRegular",
    textAlign: "center",
    marginBottom: 22,
  },
  emotionGroupList: {
    marginBottom: 0,
  },
  emotionGroupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    elevation: 2,
  },
  emotionGroupCardSelected: {
    borderColor: "#8B4CFC",
  },
  emotionGroupTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  emotionGroupTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 8,
  },
  emotionGroupSub: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandRegular",
  },
  emotionGroupEmoji: {
    fontSize: 28,
    marginLeft: 10,
  },

  // Modal Step 3: Type of Thought
  modalStep3Header1: {
    fontSize: 15,
    color: "#16214C",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 18,
  },
  thoughtGroupList: {
    marginBottom: 0,
  },
  thoughtGroupCard: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 0,
    position: "relative",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thoughtGroupTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "QuicksandMedium",
    color: "#262626",
  },
  thoughtGroupItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    width: "46%",
  },
  thoughtGroupBullet: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 2,
  },
  thoughtGroupItemText: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  thoughtGroupCheckmark: {
    position: "absolute",
    top: 18,
    right: 18,
    backgroundColor: "transparent",
  },
  // Modal Buttons
  modalButtonOutline: {
    borderWidth: 1,
    borderColor: "#8B4CFC",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonOutlineText: {
    color: "#8B4CFC",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: "#8B4CFC",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonDisabled: {
    backgroundColor: "#D1D1D1",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },

  moodCard: {
    // width: 150,
    flexGrow: 1,
    flexBasis: 0,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderColor: "#898D9E",
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 0,
    elevation: 4,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  moodCardSelected: {
    borderColor: "#A259FF",
    backgroundColor: "#f4eeff",
  },
  moodCardUnselected: {
    borderColor: "#ECECEC",
  },
  moodCardImg: {
    marginBottom: 14,
    borderRadius: 16,
    height: 85,
    width: 75,
    resizeMode: "contain",
  },
  moodCardText: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#262626",
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 15,
    paddingTop: 0,
    // backgroundColor: '#F5F7FB',
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 18,
    marginBottom: 14,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
  },
  headerContainer: {
    flexDirection: "row",
    backgroundColor: "#cdeefb",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d6f7ff",
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerPrompt: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandMedium",
    marginBottom: 12,
  },
  addEmotionBtn: {
    backgroundColor: "#8B4CFC",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  addEmotionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
  },
  headerImg: {
    width: 100,
    height: 76,
    borderRadius: 16,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 0,
    marginTop: 12,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    borderColor: "#8B4CFC",
    color: "#262626",
  },
  tabBtnInactive: {
    backgroundColor: "#fff",
    borderColor: "#ECECEC",
  },
  tabBtnTextActive: {
    color: "#262626",
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
  },
  tabBtnTextInactive: {
    color: "#16214C",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#898D9E66",
    marginTop: 2,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    marginBottom: 5,
  },
  progressBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  progressBarBg: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    height: 10,
    borderRadius: 8,
    backgroundColor: "#ECECEC",
    overflow: "hidden",
  },
  progressBarGreen: {
    width: "66%",
    backgroundColor: "#008000",
    height: 10,
  },
  progressBarRed: {
    width: "34%",
    backgroundColor: "#FF0000",
    height: 10,
  },
  progressPercentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  progressPercent: {
    fontSize: 14,
    color: "#16214C",
    fontFamily: "QuicksandSemiBold",
  },

  sectionContainerChart: {
    display: "flex",
    flexDirection: "row",
  },
  pieLegendRow: {
    flexDirection: "column",
    justifyContent: "center",
    marginTop: 0,
    paddingLeft: 10,
    marginHorizontal: 8,
    flexGrow: 1,
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  pieLegendItemText: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 7,
    marginRight: 6,
  },
  pieLegendText: {
    fontSize: 12,
    color: "#262626",
    fontFamily: "QuicksandMedium",
    marginRight: 4,
  },
  pieLegendPercent: {
    fontSize: 12,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
});

export default MoodTrackerScreen;
