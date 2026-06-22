import React, { useState } from "react";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: () => "#3AB4F2",
  labelColor: () => "#444",
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#3AB4F2",
  },
  propsForBackgroundLines: {
    stroke: "#ECECEC",
  },
};

const filters = [
  { key: "7d", label: "7 Days" },
  { key: "15d", label: "15 Days" },
  { key: "12w", label: "12 Weeks" },
  { key: "12m", label: "12 Months" },
];

const SleepCheckoutCharts = () => {
  const horizontalMargin = useResponsiveHorizontalMargin();
  const [selectedFilter, setSelectedFilter] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Chart states
  const [labels, setLabels] = useState<string[]>([]);
  const [sleepTime, setSleepTime] = useState<number[]>([]);
  const [bedTime, setBedTime] = useState<number[]>([]);
  const [sleepQuality, setSleepQuality] = useState<number[]>([]);
  const [efficiency, setEfficiency] = useState<number[]>([]);
  const [interruptions, setInterruptions] = useState<number[]>([]);
  const [noOfInterruptions, setNoOfInterruptions] = useState<number[]>([]); // New state for number of interruptions
  const [latency, setLatency] = useState<number[]>([]);

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
    if (tabKey === "7d" || tabKey === "15d") {
      try {
        const processId =
          spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_out_sleep_hygeine_days_chart;
        const payload = { p_days: tabKey === "7d" ? "7" : "15" };
        const res = await callSuggestusAPI(processId, payload);
        if (res?.returnCode === true && Array.isArray(res.returnData)) {
          const data = res.returnData;
          setLabels(
            data.map((item: any) => item.sleep_checkout_date?.slice(5))
          );
          setSleepTime(
            data.map((item: any) => Number(item.total_sleep_time_hours))
          );
          setBedTime(
            data.map((item: any) => Number(item.total_bed_time_hours))
          );
          setSleepQuality(data.map((item: any) => Number(item.sleep_rating)));
          setEfficiency(
            data.map((item: any) =>
              Number(item.sleep_efficiency_till_get_out_of_bed)
            )
          );
          setInterruptions(
            data.map((item: any) => Number(item.total_interruptions_minutes))
          );
          setNoOfInterruptions(
            data.map((item: any) => Number(item.sleep_interruptions))
          );
          setLatency(data.map((item: any) => Number(item.sleep_latency)));
        } else {
          setError("No data available");
          setLabels([]);
          setSleepTime([]);
          setBedTime([]);
          setSleepQuality([]);
          setEfficiency([]);
          setInterruptions([]);
          setLatency([]);
        }
      } catch (e) {
        setError("Failed to fetch data");
        setLabels([]);
        setSleepTime([]);
        setBedTime([]);
        setSleepQuality([]);
        setEfficiency([]);
        setInterruptions([]);
        setLatency([]);
      } finally {
        setLoading(false);
      }
    } else if (tabKey === "12w") {
      try {
        const processId =
          spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_out_sleep_hygeine_12weeks_chart;
        const res = await callSuggestusAPI(processId, {});
        if (res?.returnCode === true && Array.isArray(res.returnData)) {
          const data = res.returnData;
          setLabels(
            data.map((item: any) => {
              // For 12w, format week_start and week_end as 'DD MMM–DD MMM'
              if (item.week_start && item.week_end) {
                const start = new Date(item.week_start);
                const end = new Date(item.week_end);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                  const startStr = `${start
                    .getDate()
                    .toString()
                    .padStart(2, "0")} ${start.toLocaleString("default", {
                    month: "short",
                  })}`;
                  const endStr = `${end
                    .getDate()
                    .toString()
                    .padStart(2, "0")} ${end.toLocaleString("default", {
                    month: "short",
                  })}`;
                  return `${startStr}–${endStr}`;
                }
              }
              return "";
            })
          );
          setSleepTime(
            data.map((item: any) => Number(item.total_sleep_time_hours))
          );
          setBedTime(
            data.map((item: any) => Number(item.total_bed_time_hours))
          );
          setSleepQuality(
            data.map((item: any) =>
              Number(item.sleep_efficiency_till_get_out_of_bed)
            )
          );
          setEfficiency(
            data.map((item: any) => Number(item.sleep_efficiency_till_get_up))
          );
          setInterruptions(
            data.map((item: any) => Number(item.total_interruptions_minutes))
          );
          setLatency(data.map((item: any) => Number(item.sleep_latency)));
        } else {
          setError("No data available");
          setLabels([]);
          setSleepTime([]);
          setBedTime([]);
          setSleepQuality([]);
          setEfficiency([]);
          setInterruptions([]);
          setLatency([]);
        }
      } catch (e) {
        setError("Failed to fetch data");
        setLabels([]);
        setSleepTime([]);
        setBedTime([]);
        setSleepQuality([]);
        setEfficiency([]);
        setInterruptions([]);
        setLatency([]);
      } finally {
        setLoading(false);
      }
    } else if (tabKey === "12m") {
      try {
        const processId =
          spd_processId_config.spdonmood9_get_md_user_sleep_hygiene_check_out_sleep_hygeine_12months_chart;
        const res = await callSuggestusAPI(processId, {});
        if (res?.returnCode === true && Array.isArray(res.returnData)) {
          const data = res.returnData;
          setLabels(
            data.map((item: any) => {
              // For 12m, use month_start as 'Month YYYY' (e.g., July 2024)
              if (item.month_start && typeof item.month_start === "string") {
                const date = new Date(item.month_start);
                if (!isNaN(date.getTime())) {
                  const month = date.toLocaleString("default", {
                    month: "short",
                  });
                  const year = date.getFullYear();
                  return `${month} ${year}`;
                }
              }
              return "";
            })
          );
          setSleepTime(
            data.map((item: any) => Number(item.total_sleep_time_hours))
          );
          setBedTime(
            data.map((item: any) => Number(item.total_bed_time_hours))
          );
          setSleepQuality(
            data.map((item: any) =>
              Number(item.sleep_efficiency_till_get_out_of_bed)
            )
          );
          setEfficiency(
            data.map((item: any) => Number(item.sleep_efficiency_till_get_up))
          );
          setInterruptions(
            data.map((item: any) => Number(item.total_interruptions_minutes))
          );
          setLatency(data.map((item: any) => Number(item.sleep_latency)));
        } else {
          setError("No data available");
          setLabels([]);
          setSleepTime([]);
          setBedTime([]);
          setSleepQuality([]);
          setEfficiency([]);
          setInterruptions([]);
          setLatency([]);
        }
      } catch (e) {
        setError("Failed to fetch data");
        setLabels([]);
        setSleepTime([]);
        setBedTime([]);
        setSleepQuality([]);
        setEfficiency([]);
        setInterruptions([]);
        setLatency([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLabels([]);
      setSleepTime([]);
      setBedTime([]);
      setSleepQuality([]);
      setEfficiency([]);
      setInterruptions([]);
      setLatency([]);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchChartData(selectedFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

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
        <CustomTopHeader title="Back" />

        <ScrollView contentContainerStyle={styles.container}>
          {/* Filters */}
          <View style={[styles.filterRow, Platform.OS === "web" && screenWidth >= 1024 ? { width: 480, alignSelf: "center" } : {}]}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterBtn,
                  selectedFilter === f.key && styles.filterBtnActive,
                ]}
                onPress={() => setSelectedFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedFilter === f.key && styles.filterBtnTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              Loading chart...
            </Text>
          ) : error ? (
            <Text style={{ color: "red", textAlign: "center", marginTop: 40 }}>
              {error}
            </Text>
          ) : labels.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No data to display
            </Text>
          ) : (
            <>
              {/* Chart 1: Sleep Time & Time in Bed */}
              <Text style={[styles.chartTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>Sleep Time & Time In Bed</Text>
              <View style={[styles.chartCard, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{ minWidth: screenWidth + 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 15,
                        height: 220,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          position: "absolute",
                          width: 220,
                          transform: [{ rotate: "-90deg" }],
                          fontSize: 12,
                          color: "#262626",
                          fontFamily: "QuicksandSemiBold",
                          textAlign: "center",
                        }}
                      >
                        HOURS
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ minWidth: screenWidth + 20 }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          width: Math.max(labels.length * 80, screenWidth + 20),
                          height: 220,
                        }}
                      >
                        <LineChart
                          data={{
                            labels,
                            datasets: [
                              {
                                data: sleepTime,
                                color: () => "#427472",
                              },
                              {
                                data: bedTime,
                                color: () => "#3AB4F2",
                              },
                            ],
                            legend: ["Sleep Time", "Time in bed"],
                          }}
                          width={Math.max(labels.length * 80, screenWidth + 20)}
                          height={185}
                          xLabelsOffset={5}
                          chartConfig={{
                            ...chartConfig,
                            propsForLabels: {
                              fontSize: 12,
                              fontWeight: "bold",
                            },
                          }}
                          bezier
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>

              {/* Chart 2: Sleep Quality & Efficiency */}
              <Text style={[styles.chartTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>Sleep Quality</Text>
              <View style={[styles.chartCard, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{ minWidth: screenWidth + 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 15,
                        height: 220,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          position: "absolute",
                          width: 220,
                          transform: [{ rotate: "-90deg" }],
                          fontSize: 12,
                          color: "#262626",
                          fontFamily: "QuicksandSemiBold",
                          textAlign: "center",
                        }}
                      >
                        RATING
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ minWidth: screenWidth + 20 }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          width: Math.max(labels.length * 80, screenWidth + 20),
                          height: 220,
                        }}
                      >
                        <LineChart
                          data={{
                            labels,
                            datasets: [
                              { data: sleepQuality, color: () => "#3AB4F2" },
                            ],
                            // legend: ["Sleep Quality"],
                          }}
                          width={Math.max(labels.length * 80, screenWidth + 20)}
                          height={220}
                          fromZero={true}
                          withInnerLines={false}
                          yAxisInterval={1}
                          formatYLabel={(yValue) => Number(yValue).toFixed(0)}
                          chartConfig={{
                            ...chartConfig,
                            propsForLabels: {
                              fontSize: 12,
                              fontWeight: "bold",
                            },
                          }}
                          // segments={3} // Limits number of Y-axis ticks
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>

              <Text style={[styles.chartTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>Sleep Efficiency</Text>
              <View style={[styles.chartCard, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 15,
                      height: 220,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        position: "absolute",
                        width: 220,
                        transform: [{ rotate: "-90deg" }],
                        fontSize: 12,
                        color: "#262626",
                        fontFamily: "QuicksandSemiBold",
                        textAlign: "center",
                      }}
                    >
                      PERCENTAGE(%)
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{ minWidth: screenWidth + 20 }}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        width: Math.max(labels.length * 80, screenWidth + 20),
                        height: 220,
                      }}
                    >
                      <LineChart
                        data={{
                          labels,
                          datasets: [
                            { data: efficiency, color: () => "#427472" },
                          ],
                          // legend: ["Efficiency"],
                        }}
                        width={Math.max(labels.length * 80, screenWidth + 20)}
                        height={220}
                        chartConfig={{
                          ...chartConfig,
                          propsForLabels: {
                            fontSize: 12,
                            fontWeight: "bold",
                          },
                        }}
                        style={styles.chart}
                      />
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Chart 3: Sleep Interruptions */}
              <Text style={[styles.chartTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                Sleep Interruptions In Minutes
              </Text>
              <View style={[styles.chartCard, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{ minWidth: screenWidth + 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 15,
                        height: 220,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          position: "absolute",
                          width: 220,
                          transform: [{ rotate: "-90deg" }],
                          fontSize: 12,
                          color: "#262626",
                          fontFamily: "QuicksandSemiBold",
                          textAlign: "center",
                        }}
                      >
                        MINUTES
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ minWidth: screenWidth + 20 }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          width: Math.max(labels.length * 80, screenWidth + 20),
                          height: 220,
                        }}
                      >
                        <LineChart
                          data={{
                            labels,
                            datasets: [
                              {
                                data: interruptions,
                                color: () => "#3AB4F2",
                              },
                            ],
                            // legend: ["Sleep Interruption Time (min)"],
                          }}
                          width={Math.max(labels.length * 80, screenWidth + 20)}
                          height={220}
                          chartConfig={{
                            ...chartConfig,
                            propsForLabels: {
                              fontSize: 12,
                              fontWeight: "bold",
                            },
                          }}
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>

              {/* Chart 3b: No Of Sleep Interruptions */}
              <Text style={[styles.chartTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>Sleep Interruptions</Text>
              <View style={[styles.chartCard, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{ minWidth: screenWidth + 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 15,
                        height: 220,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          position: "absolute",
                          width: 220,
                          transform: [{ rotate: "-90deg" }],
                          fontSize: 12,
                          color: "#262626",
                          fontFamily: "QuicksandSemiBold",
                          textAlign: "center",
                        }}
                      >
                        NUMBERS
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ minWidth: screenWidth + 20 }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          width: Math.max(labels.length * 80, screenWidth + 20),
                          height: 220,
                        }}
                      >
                        <LineChart
                          data={{
                            labels,
                            datasets: [
                              {
                                data: noOfInterruptions,
                                color: () => "#3AB4F2",
                              },
                            ],
                            // legend: ["No Of Sleep Interruptions"],
                          }}
                          width={Math.max(labels.length * 80, screenWidth + 20)}
                          height={220}
                          fromZero={true}
                          segments={2} // Force fewer Y-axis ticks
                          withInnerLines={false}
                          yAxisInterval={1}
                          formatYLabel={(yValue) => Number(yValue).toString()} // No decimals
                          chartConfig={{
                            ...chartConfig,
                            propsForLabels: {
                              fontSize: 12,
                              fontWeight: "bold",
                            },
                          }}
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>

              {/* Chart 4: Sleep Latency */}
              <Text style={[styles.chartTitle, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>Sleep Latency</Text>
              <View style={[styles.chartCard, Platform.OS === "web" && screenWidth >= 1024 ? { marginLeft: 100, marginRight: 100 } : {}]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{ minWidth: screenWidth + 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 15,
                        height: 220,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          position: "absolute",
                          width: 220,
                          transform: [{ rotate: "-90deg" }],
                          fontSize: 12,
                          color: "#262626",
                          fontFamily: "QuicksandSemiBold",
                          textAlign: "center",
                        }}
                      >
                        MINUTES
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ minWidth: screenWidth + 20 }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          width: Math.max(labels.length * 80, screenWidth + 20),
                          height: 220,
                        }}
                      >
                        <BarChart
                          data={{
                            labels,
                            datasets: [
                              {
                                data: latency,
                              },
                            ],
                          }}
                          width={Math.max(labels.length * 80, screenWidth + 20)}
                          height={220}
                          chartConfig={{
                            ...chartConfig,
                            propsForLabels: {
                              fontSize: 12,
                              fontWeight: "bold",
                            },
                          }}
                          fromZero
                          showValuesOnTopOfBars
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>
            </>
          )}
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
  containerNew: { flex: 1 },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  container: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginBottom: 20,
    paddingBottom: 0,
    // backgroundColor: "#fff",
  },
  filterBtn: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#ECECEC",
  },
  filterBtnActive: {
    backgroundColor: "#fff",
    borderColor: "#8B4CFC",
    color: "#262626",
  },
  filterBtnText: {
    color: "#16214C",
    fontSize: 14,
    whiteSpace: "pre",
    fontFamily: "QuicksandMedium",
  },
  filterBtnTextActive: {
    color: "#262626",
    fontSize: 14,
    whiteSpace: "pre",
    fontFamily: "QuicksandSemiBold",
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#898D9E66",
    marginTop: 2,
    padding: 10,
    paddingLeft: 8,
    marginBottom: 20,
    // marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    marginBottom: 5,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -28,
  },
});

export default SleepCheckoutCharts;
