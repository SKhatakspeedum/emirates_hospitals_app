import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Platform,
} from "react-native";
import RenderHTML from "react-native-render-html";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
``;
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute } from "@react-navigation/native";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const CarePlanDetail = () => {
  const [descExpanded, setDescExpanded] = useState(false);
  // Get navigation and route
  const route = useRoute();
  const data = route.params?.carePlan;
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

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <ImageBackground
        source={require("@/assets/images/music_bg.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <CustomTopHeader title="Back" />
        <ScrollView style={[{ flex: 1 }, Platform.OS === "web" ? { marginLeft: 150, marginRight: 150 } : {}]} contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            <Text style={styles.title}>{data.name}</Text>
            <View style={styles.rowWrap}>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <MaterialCommunityIcons
                    name="account"
                    size={16}
                    color="#bfae6d"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.metaLabelAssigned}>Assigned by</Text>
                </View>
                <Text style={styles.metaValue}>{data.assignedBy}</Text>
              </View>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={16}
                    color="#52c18e"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.metaLabelAssignedOn}>Assigned on</Text>
                </View>
                <Text style={styles.metaValue}>
                  {formatDate(data.assignedOn)}
                </Text>
              </View>
            </View>
            <View style={styles.rowWrap}>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="#7abaff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.metaLabelStart}>Start date</Text>
                </View>
                <Text style={styles.metaValue}>
                  {formatDate(data.startDate)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="#e49c6b"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.metaLabelEnd}>End date</Text>
                </View>
                <Text style={styles.metaValue}>{formatDate(data.endDate)}</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
          <View style={styles.cardDesc}>
            <Text style={styles.descHeader}>Description</Text>
            <View>
              <RenderHTML
                // contentWidth={350}
                source={{ html: data.description || "" }}
                baseStyle={styles.descText}
              />
            </View>
            {/* <Text
          style={styles.readMore}
          onPress={() => setDescExpanded((prev) => !prev)}
        >
          {descExpanded ? '- Read less' : '+ Read more...'}
        </Text> */}
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
  containerNew: { flex: 1 },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 12,
    marginBottom: 10,
    width: "100%",
  },
  header: {
    fontSize: 17,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    marginBottom: 12,
    marginTop: 6,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    backgroundColor: "#e3ecf8",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: "#3a4a6b",
    fontFamily: "QuicksandSemiBold",
    marginBottom: 10,
    textAlign: "left",
  },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    marginTop: 2,
  },
  metaItem: {
    flex: 1,
    marginRight: 10,
    marginBottom: 2,
  },
  metaIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  metaLabelAssigned: {
    color: "#bfae6d",
    fontSize: 12,
    fontFamily: "QuicksandRegular",
    marginBottom: 2,
  },
  metaLabelAssignedOn: {
    color: "#52c18e",
    fontSize: 12,
    fontFamily: "QuicksandRegular",
    marginBottom: 2,
  },
  metaLabelStart: {
    color: "#7abaff",
    fontSize: 12,
    fontFamily: "QuicksandRegular",
    marginBottom: 2,
  },
  metaLabelEnd: {
    color: "#e49c6b",
    fontSize: 12,
    fontFamily: "QuicksandRegular",
    marginBottom: 2,
  },
  metaValue: {
    color: "#222",
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    marginBottom: 2,
    marginLeft: 20,
  },
  summary: {
    marginTop: 10,
    color: "#222",
    fontSize: 13,
    fontFamily: "QuicksandRegular",
    marginBottom: 0,
  },
  cardDesc: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  descHeader: {
    color: "#888",
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    marginBottom: 6,
  },
  descText: {
    color: "#222",
    fontSize: 13,
    fontFamily: "QuicksandRegular",
    marginBottom: 0,
  },
  readMore: {
    color: "#5b7cff",
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    marginTop: 4,
    marginBottom: 0,
  },
});

export default CarePlanDetail;
