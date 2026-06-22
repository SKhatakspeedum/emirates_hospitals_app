import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const screenWidth = Dimensions.get("window").width;

const defaultBarData = {
  labels: [],
  datasets: [
    { data: [], colors: [] },
    { data: [], colors: [] },
  ],
};

const filterTabs = [
  { key: "7d", label: "7 Days" },
  { key: "15d", label: "15 Days" },
  { key: "12w", label: "12 Weeks" },
  { key: "12m", label: "12 Months" },
];
const PURPLE = "#8B4CFC";
const barChartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: () => "#A259FF",
  labelColor: () => "#2C2C2C",
  fillShadowGradient: "#A259FF",
  fillShadowGradientOpacity: 1,
  barPercentage: 0.4,
  propsForBackgroundLines: {
    stroke: "#ECECEC",
  },
  propsForLabels: {
    fontSize: 12,
    fontWeight: "500",
  },
  formatYLabel: (value) => `${parseInt(value)}`,
};

const SleepHygiene = () => {
  const [selectedTab, setSelectedTab] = useState("7d");
  const [barData, setBarData] = useState(defaultBarData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const fetchChartData = async (tabKey: string) => {
    setLoading(true);
    setError("");
    let processId = "";
    let payload = {};
    let parseFunc = (data) => defaultBarData;

    if (tabKey === "7d" || tabKey === "15d") {
      processId =
        spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_in_sleep_hygeine_days_chart;
      payload = { p_days: tabKey === "7d" ? "7" : "15" };
      parseFunc = (data) => {
        const labels = data.map((item) => item.sleep_checkin_date.slice(5));
        const scores = data.map((item) => Number(item.score));
        return {
          labels,
          datasets: [
            { data: scores, colors: scores.map(() => () => "#8B4CFC") },
            {
              data: Array(scores.length).fill(8),
              colors: scores.map(() => () => "#ECECEC"),
            },
          ],
        };
      };
    } else if (tabKey === "12w") {
      processId =
        spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_in_sleep_hygeine_12weeks_chart;
      parseFunc = (data) => {
        const labels = data.map((item) => {
          const [from, to] = item.sleep_checkin_date.split("-");
          return from && to
            ? `${from.slice(0, 5)}-${to.slice(0, 5)}`
            : item.sleep_checkin_date;
        });
        const scores = data.map((item) => Number(item.score));
        return {
          labels,
          datasets: [
            { data: scores, colors: scores.map(() => () => "#8B4CFC") },
            {
              data: Array(scores.length).fill(1),
              colors: scores.map(() => () => "#ECECEC"),
            },
          ],
        };
      };
    } else if (tabKey === "12m") {
      processId =
        spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_in_sleep_hygeine_12months_chart;
      parseFunc = (data) => {
        const labels = data.map((item) => {
          if (item.date_from && item.date_from.length >= 7) {
            const [day, month, year] = item.date_from.split("/");
            return `${month}/${year}`;
          }
          return item.date_from || "";
        });
        const scores = data.map((item) => Number(item.avg_score));
        return {
          labels,
          datasets: [
            { data: scores, colors: scores.map(() => () => "#8B4CFC") },
            {
              data: Array(scores.length).fill(1),
              colors: scores.map(() => () => "#ECECEC"),
            },
          ],
        };
      };
    }

    try {
      const res = await callSuggestusAPI(processId, payload);
      if (res?.returnCode === true && res.returnData) {
        const userData = res.returnData;
        if (!!userData) {
          setBarData(parseFunc(userData));
        } else {
          setBarData(defaultBarData);
          setError("No data found");
        }
      }
    } catch (e) {
      setError("Failed to load chart data");
      setBarData(defaultBarData);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchChartData(selectedTab);
  }, [selectedTab]);

  const handleBarClick = ({ index, value }) => {
    Alert.alert(
      "Data Point",
      `Date: ${barData.labels[index]}\nScore: ${value}`
    );
  };

  const mainContent = (
    <View
          style={[
            styles.containerNew,
            { marginLeft: horizontalMargin, marginRight: horizontalMargin },
          ]}>
    <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
    >
      <CustomTopHeader title="Back" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.tabRow, Platform.OS === "web" && screenWidth >= 1024 ? { width: 480, alignSelf: "center" } : {}]}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                selectedTab === tab.key
                  ? styles.tabBtnActive
                  : styles.tabBtnInactive,
              ]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text
                style={
                  selectedTab === tab.key
                    ? styles.tabBtnTextActive
                    : styles.tabBtnTextInactive
                }
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>Sleep Hygiene</Text>

        <View>
          <View style={[styles.sectionContainer, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
            {loading ? (
              <ActivityIndicator
                color={PURPLE}
                size="large"
                style={{ marginTop: 50 }}
              />
            ) : error ? (
              <Text style={{ color: "red" }}>{error}</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{
                  width: 550,
                }}
              >
                <View style={{ width: barData.labels.length * 60 }}>
                  <BarChart
                    data={barData}
                    width={Math.max(
                      barData.labels.length * 80,
                      screenWidth + 20
                    )}
                    height={Platform.OS === "web" && screenWidth >= 1024 ? 420 : 220}
                    fromZero={true}
                    yAxisInterval={1}
                    showValuesOnTopOfBars
                    withInnerLines
                    chartConfig={barChartConfig}
                    withCustomBarColorFromData
                    flatColor
                    segments={4}
                    xLabelsOffset={10}
                    onDataPointClick={handleBarClick}
                  />
                </View>
              </ScrollView>
            )}

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendSquare, { backgroundColor: "#8B4CFC" }]}
                />
                <Text style={styles.legendLabel}>Sleep Hygiene Score</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSquare,
                    {
                      backgroundColor: "#ECECEC",
                      borderWidth: 1,
                      borderColor: "#ccc",
                    },
                  ]}
                />
                <Text style={styles.legendLabel}>Max Score (7)</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  containerNew: { flex: 1 },

  container: {
    paddingBottom: 40,
    paddingHorizontal: 16,
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
    whiteSpace: "pre",
    fontFamily: "QuicksandSemiBold",
  },
  tabBtnTextInactive: {
    color: "#16214C",
    fontSize: 14,
    whiteSpace: "pre",
    fontFamily: "QuicksandMedium",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    marginBottom: 5,
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
    // Removed alignItems to allow scroll width
    overflow: "hidden", // Optional, to clip content neatly
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  legendSquare: {
    width: 12,
    height: 12,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: "#666",
  },
});

export default SleepHygiene;
