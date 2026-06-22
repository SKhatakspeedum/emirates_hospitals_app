import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_EMAIL, SPD_USER_ID } from "../config/config";
import { TouchableOpacity } from "react-native";
import { SiteConfig } from "../config/site_config";
import { COURSES_SUB_URL } from "../config/config";
import { useNavigation } from "expo-router";
import Svg, { Path } from "react-native-svg";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

const { width } = Dimensions.get("window");
const defaultStatsData = [
  {
    key: "15days",
    title: "15 Days",
    time: "-",
    headerBg: "#FFF6DE",
    icon: (
      <Svg viewBox="0 0 448 512" width={24} height={24}>
        <Path
          fill="#fbbf24"
          d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"
        />
      </Svg>
      // <MaterialCommunityIcons name="calendar" size={20} color="#FFC36A" />, // Orange
    ),
    borderColor: "#3D7EFF", // Blue border for selected
    iconColor: "#FFC36A",
    selected: true,
  },
  {
    key: "1month",
    title: "1 Month",
    time: "-",
    headerBg: "#E7F2FE",
    icon: (
      <Svg viewBox="0 0 448 512" width={24} height={24}>
        <Path
          fill="#60A5FA"
          d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"
        />
      </Svg>
      // <MaterialCommunityIcons name="calendar-month" size={20} color="#6CA7FF" />
    ), // Blue
    borderColor: "#6CA7FF",
    iconColor: "#6CA7FF",
    selected: false,
  },
  {
    key: "1year",
    title: "1 Year",
    time: "-",
    headerBg: "#E4FAEC",
    icon: (
      <Svg viewBox="0 0 448 512" width={24} height={24}>
        <Path
          fill="#4ADE80"
          d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"
        />
      </Svg>
      // <MaterialCommunityIcons name="calendar-range" size={20} color="#5CD97B" />
    ), // Green
    borderColor: "#5CD97B",
    iconColor: "#5CD97B",
    selected: false,
  },
  {
    key: "tilldate",
    title: "Till Date",
    time: "-",
    headerBg: "#FFEFE2",
    icon: (
      <Svg viewBox="0 0 448 512" width={24} height={24}>
        <Path
          fill="#FB923C"
          d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"
        />
      </Svg>
      // <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFA5A5" />
    ), // Light Red
    borderColor: "#FFA5A5",
    iconColor: "#FFA5A5",
    selected: false,
  },
];

// StatBox component for stat cards
const StatBox = ({
  icon,
  title,
  time,
  borderColor,
  headerBg,
  selected,
}: any) => (
  <View
    style={[
      styles.statBox,
      {
        // borderColor: selected ? "#3D7EFF" : borderColor,
        // borderWidth: 2,
        backgroundColor: "#fff",
        // shadowColor: selected ? "#3D7EFF" : "#000",
      },
      selected && styles.statBoxSelected,
    ]}
  >
    <View style={styles.statBoxRow}>
      <View
        style={[
          styles.statBoxRowHeader,
          {
            backgroundColor: headerBg,
          },
        ]}
      >
        <View style={styles.statIconWrap}>{icon}</View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={{ width: "100%", marginLeft: 10 }}>
        <Text style={styles.statTime}>
          {time} <Text style={styles.statHrs}>Hrs</Text>
        </Text>
        <Text style={styles.statLabel}>Time spent</Text>
      </View>
    </View>
  </View>
);

const SessionCard = ({
  item,
  index,
  side,
  navigation,
}: {
  item: any;
  index: number;
  side?: "left" | "right";
  navigation?: any;
}) => {
  // For right side care plan cards
  if (side === "right") {
    if (item.widget_type === "plan") {
      // Modern UI: image left, title/sessions right, divider, assigned by below
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            navigation?.navigate("journey/CarePlanDetail", {
              // Pass static data for now
              carePlan: {
                name: item.plan_care_plan_name,
                assignedBy: item.plan_care_coach,
                assignedOn: item.date_val,
                startDate: item.plan_start_date,
                endDate: item.plan_end_date,
                summary: item.plan_care_plan_description,
                description: item.plan_care_plan_long_description,
              },
            });
          }}
          style={[
            styles.sessionCard,
            styles.cardRight,
            // styles.shadow,
            {
              flexDirection: "column",
              alignItems: "stretch",
              overflow: "hidden",
              width: "95%", // Adjust width to fit in row
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingBottom: 0,
              width: "100%",
            }}
          >
            <Image
              source={require("@/assets/images/undraw_meditation.png")}
              style={{
                width: 50,
                height: 50,
                borderRadius: 5,
                marginRight: 6,
                backgroundColor: "#eee",
              }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "QuicksandMedium",
                  color: "#262626",
                  marginBottom: 2,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.plan_care_plan_name}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#898D9E",
                  fontFamily: "QuicksandRegular",
                }}
              >
                {item.plan_sessions_count
                  ? `${item.plan_sessions_count} Session${
                      item.plan_sessions_count > 1 ? "s" : ""
                    }`
                  : ""}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: "#e0e0e0",
              marginVertical: 6,
            }}
          />
          <View>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "QuicksandMedium",
                color: "#262626",
                marginBottom: 2,
              }}
            >
              Assigned by
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#898D9E",
                fontFamily: "QuicksandRegular",
              }}
            >
              {item.plan_care_coach}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.widget_type === "module") {
      // Clickable, play music on press
      let module_data = item.module_data;
      if (!!module_data) {
        try {
          module_data = JSON.parse(module_data);
        } catch (error) {
          console.log("Error", error);
        }
      }
      // If module_data is an array, render multiple cards
      if (Array.isArray(module_data) && module_data.length > 0) {
        return (
          <View style={{ width: "100%" }}>
            {module_data.map((mod: any, idx: number) => {
              const group = mod.data_category_group_module || {};
              const status = mod.planitem_item_status;
              const statusDisplay =
                status.charAt(0).toUpperCase() + status.slice(1);
              const statusColors = {
                Pending: {
                  bg: "#FF9F0D26",
                  color: "#B89A00",
                  icon: (
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path
                        d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14Z"
                        fill="#FF9F0D"
                      />
                      <Path
                        d="M6.4751 1.85938H7.5251V5.14062H6.4751V1.85938Z"
                        fill="white"
                      />
                      <Path
                        d="M6.4751 8.85938H7.5251V12.1406H6.4751V8.85938Z"
                        fill="white"
                      />
                      <Path
                        d="M8.85938 6.47498H12.1406V7.52498H8.85938V6.47498Z"
                        fill="white"
                      />
                      <Path
                        d="M1.85938 6.47498H5.14062V7.52498H1.85938V6.47498Z"
                        fill="white"
                      />
                      <Path
                        d="M7.96143 5.3053L10.2813 2.98545L11.0236 3.7278L8.70378 6.04765L7.96143 5.3053Z"
                        fill="white"
                      />
                      <Path
                        d="M2.98877 10.2582L5.30861 7.93833L6.05096 8.68068L3.73112 11.0005L2.98877 10.2582Z"
                        fill="white"
                      />
                      <Path
                        d="M7.95166 8.70532L8.69401 7.96297L11.0139 10.2828L10.2715 11.0252L7.95166 8.70532Z"
                        fill="white"
                      />
                    </Svg>
                  ),
                },
                Completed: {
                  bg: "#00BA001F",
                  color: "#2D8A4D",
                  icon: (
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7 0C10.8653 0 14 3.13469 14 7C14 10.8653 10.8653 14 7 14C3.13469 14 0 10.8653 0 7C0 3.13469 3.13469 0 7 0ZM5.54636 9.27365L3.83259 7.55846C3.54062 7.26632 3.54056 6.78992 3.83259 6.49784C4.12468 6.20582 4.6032 6.20764 4.89316 6.49784L6.10136 7.70699L9.10695 4.7014C9.39904 4.40931 9.87549 4.40931 10.1675 4.7014C10.4596 4.99342 10.4592 5.47029 10.1675 5.76196L6.63078 9.2987C6.33912 9.59037 5.86224 9.59078 5.57022 9.2987C5.56201 9.29049 5.55409 9.28216 5.54636 9.27365Z"
                        fill="#00BA00"
                      />
                    </Svg>
                  ),
                },
                Assigned: {
                  bg: "#E8F0FF",
                  color: "#4A90E2",
                  icon: "account-arrow-right",
                },
                CONTINUE: {
                  bg: "#E6FDF3",
                  color: "#22C55E",
                  icon: (
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path d="M2 2L12 7L2 12V2Z" fill="#22C55E" />
                    </Svg>
                  ),
                },
                PAUSED: {
                  bg: "#FFF7E6",
                  color: "#FFB020",
                  icon: (
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path d="M4 3H6V11H4V3ZM8 3H10V11H8V3Z" fill="#FFB020" />
                    </Svg>
                  ),
                },
                REMOVED: {
                  bg: "#FFE6E6",
                  color: "#FF4D4F",
                  icon: (
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path
                        d="M2 2L12 12M12 2L2 12"
                        stroke="#FF4D4F"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  ),
                },
              };
              const badge = statusColors[statusDisplay] || statusColors.Pending;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.sessionCard,
                    styles.cardRight,
                    // styles.shadow,
                    {
                      flexDirection: "column",
                      alignItems: "stretch",
                      overflow: "hidden",
                      width: "95%", // Adjust width to fit in row
                    },
                  ]}
                  onPress={() => {
                    // TODO: Play music or open media player for this module
                    // console.log("Play music for module:", group.group_name);
                    navigation.navigate("music_player/MusicPlayerScreen", {
                      itemData: group,
                      sessionData: group.session_json_data?.[0] || null,
                    });
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingBottom: 0,
                      width: "100%",
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          SiteConfig.on_mood9_ASSETS_URL +
                          COURSES_SUB_URL +
                          group.module_image,
                      }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 5,
                        marginRight: 6,
                        backgroundColor: "#eee",
                      }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "QuicksandMedium",
                          color: "#262626",
                          marginBottom: 2,
                        }}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {group.group_name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#898D9E",
                            fontFamily: "QuicksandRegular",
                          }}
                        >
                          {group.session_count
                            ? `${group.session_count} Session${
                                group.session_count > 1 ? "s" : ""
                              }`
                            : ""}
                        </Text>
                      </View>
                      {mod.plantitemtime_time_of_day ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 2,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="headphones"
                            size={14}
                            color="#8B4CFC"
                            style={{ marginRight: 3 }}
                          />

                          <Text
                            style={{
                              fontSize: 12,
                              color: "#8B4CFC",
                              fontFamily: "QuicksandMedium",
                            }}
                          >
                            {mod.plantitemtime_time_of_day}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#e0e0e0",
                      marginVertical: 6,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      alignSelf: "flex-start",
                      gap: 6,
                      backgroundColor: badge.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                    }}
                  >
                    {badge.icon}
                    {/* <MaterialCommunityIcons
                        name={badge.icon}
                        size={18}
                        color={badge.color}
                        style={{ marginRight: 8 }}
                      /> */}
                    <Text
                      style={{
                        color: "#262626",
                        fontSize: 12,
                        fontFamily: "QuicksandRegular",
                      }}
                    >
                      {statusDisplay}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }
      // fallback: single card
      return (
        <TouchableOpacity
          style={[styles.sessionCard, styles.cardRight, styles.shadow]}
          onPress={() => {
            // TODO: Play music or open media player for this module
            // console.log("Play music for module:", item.module_name);
          }}
        >
          <Text style={styles.cardTitle}>{item.module_name}</Text>
          <Text style={styles.cardDesc}>{item.module_desc}</Text>
          {/* Add more details as needed */}
        </TouchableOpacity>
      );
    }
    // fallback for unknown widget_type
    return null;
  }
  // For left side (recent modules)
  // ...existing left card rendering...
  // Modern left card UI matching right-side module card
  let status = item.status;
  if (side === "left") {
    if (item.is_fully_listened === "Y") {
      status = "Completed";
    } else {
      status = "Pending";
    }
  }

  if (!status || typeof status !== "string" || !status.trim()) {
    status = "Pending";
  }
  let data_category_group_module = item.data_category_group_module;
  if (!!data_category_group_module) {
    data_category_group_module = JSON.parse(data_category_group_module);
  }
  const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
  const statusColors = {
    Pending: {
      bg: "#FF9F0D26",
      color: "#B89A00",
      icon: (
        <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
          <Path
            d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14Z"
            fill="#FF9F0D"
          />
          <Path
            d="M6.4751 1.85938H7.5251V5.14062H6.4751V1.85938Z"
            fill="white"
          />
          <Path
            d="M6.4751 8.85938H7.5251V12.1406H6.4751V8.85938Z"
            fill="white"
          />
          <Path
            d="M8.85938 6.47498H12.1406V7.52498H8.85938V6.47498Z"
            fill="white"
          />
          <Path
            d="M1.85938 6.47498H5.14062V7.52498H1.85938V6.47498Z"
            fill="white"
          />
          <Path
            d="M7.96143 5.3053L10.2813 2.98545L11.0236 3.7278L8.70378 6.04765L7.96143 5.3053Z"
            fill="white"
          />
          <Path
            d="M2.98877 10.2582L5.30861 7.93833L6.05096 8.68068L3.73112 11.0005L2.98877 10.2582Z"
            fill="white"
          />
          <Path
            d="M7.95166 8.70532L8.69401 7.96297L11.0139 10.2828L10.2715 11.0252L7.95166 8.70532Z"
            fill="white"
          />
        </Svg>
      ), // Orange
    },
    Completed: {
      bg: "#00BA001F",
      color: "#2D8A4D",
      icon: (
        <Svg
          width={14}
          height={14}
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7 0C10.8653 0 14 3.13469 14 7C14 10.8653 10.8653 14 7 14C3.13469 14 0 10.8653 0 7C0 3.13469 3.13469 0 7 0ZM5.54636 9.27365L3.83259 7.55846C3.54062 7.26632 3.54056 6.78992 3.83259 6.49784C4.12468 6.20582 4.6032 6.20764 4.89316 6.49784L6.10136 7.70699L9.10695 4.7014C9.39904 4.40931 9.87549 4.40931 10.1675 4.7014C10.4596 4.99342 10.4592 5.47029 10.1675 5.76196L6.63078 9.2987C6.33912 9.59037 5.86224 9.59078 5.57022 9.2987C5.56201 9.29049 5.55409 9.28216 5.54636 9.27365Z"
            fill="#00BA00"
          />
        </Svg>
      ),
    },

    Assigned: { bg: "#E8F0FF", color: "#4A90E2", icon: "account-arrow-right" },
    CONTINUE: {
      bg: "#E6FDF3",
      color: "#22C55E",
      icon: (
        <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
          <Path d="M2 2L12 7L2 12V2Z" fill="#22C55E" />
        </Svg>
      ),
    },
    PAUSED: {
      bg: "#FFF7E6",
      color: "#FFB020",
      icon: (
        <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
          <Path d="M4 3H6V11H4V3ZM8 3H10V11H8V3Z" fill="#FFB020" />
        </Svg>
      ),
    },
    REMOVED: {
      bg: "#FFE6E6",
      color: "#FF4D4F",
      icon: (
        <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
          <Path
            d="M2 2L12 12M12 2L2 12"
            stroke="#FF4D4F"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
  };
  const badge = statusColors[statusDisplay] || statusColors.Pending;

  return (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        styles.cardLeft,
        // styles.shadow,
        {
          flexDirection: "column",
          alignItems: "stretch",
          overflow: "hidden",
          width: "95%", // Adjust width to fit in row
        },
      ]}
      onPress={() => {
        let itemData = item.data_category_group_module;
        if (!!itemData) {
          itemData = JSON.parse(itemData);
        }
        let sessionData = itemData.session_json_data?.[0] || null;
        // Open music player for this module (left side)
        navigation?.navigate("music_player/MusicPlayerScreen", {
          itemData: itemData,
          sessionData: sessionData,
        });
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 0,
          width: "100%",
        }}
      >
        <Image
          source={{
            uri:
              SiteConfig.on_mood9_ASSETS_URL +
              COURSES_SUB_URL +
              data_category_group_module.module_image,
          }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 5,
            marginRight: 6,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "QuicksandMedium",
              color: "#262626",
              marginBottom: 2,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {data_category_group_module.module_name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#898D9E",
              fontFamily: "QuicksandRegular",
            }}
          >
            {data_category_group_module.session_count
              ? `${data_category_group_module.session_count} Session${
                  data_category_group_module.session_count > 1 ? "s" : ""
                }`
              : ""}
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: "#e0e0e0",
          marginVertical: 6,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 6,
          backgroundColor: badge.bg,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      >
        {badge.icon}
        {/* <MaterialCommunityIcons
            name={badge.icon}
            size={18}
            color={badge.color}
            style={{ marginRight: 8 }}
          /> */}
        <Text
          style={{
            color: "#262626",
            fontSize: 12,
            fontFamily: "QuicksandRegular",
          }}
        >
          {statusDisplay}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// TimelineRow: Custom row for left/right card layout, dot and date only
const TimelineRow = ({
  itemLeft,
  itemRight,
  index,
  navigation_obj,
}: {
  itemLeft?: any;
  itemRight?: any;
  index: number;
  navigation_obj: any;
}) => {
  if (!itemLeft && !itemRight) return null;
  const dateVal =
    itemLeft?.date_val ||
    itemRight?.date_val ||
    itemLeft?.time ||
    itemRight?.time;
  return (
    <View style={styles.timelineRow}>
      {/* Left side: dot, date, card */}
      <View style={styles.timelineCardCol}>
        {itemLeft && itemLeft.active_module_id ? (
          <View style={{ alignItems: "flex-end" }}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                marginRight: -6,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  textAlign: "right",
                  fontSize: 14,
                  fontFamily: "QuicksandMedium",
                  color: "#262626",
                  fontWeight: "bold",
                  marginRight: 8,
                }}
                numberOfLines={1}
              >
                {formatTimelineDate(itemLeft.modified_at)}
              </Text>
              <View style={styles.timelineDotLeft} />
            </View>

            <SessionCard
              item={itemLeft}
              index={index}
              side="left"
              navigation={navigation_obj}
            />
          </View>
        ) : null}
      </View>
      {/* Center: only empty space for alignment */}
      {/* <View style={[styles.timelineCenterCol, { minWidth: 0 }]} /> */}
      {/* Right side: dot, date, card */}
      <View style={styles.timelineCardCol}>
        {itemRight && (itemRight.date_val || itemRight.time) ? (
          <View style={{ alignItems: "flex-start" }}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                marginLeft: -6,
                marginBottom: 8,
              }}
            >
              <View style={styles.timelineDot} />
              <Text
                style={{
                  textAlign: "right",
                  fontSize: 14,
                  fontFamily: "QuicksandMedium",
                  color: "#262626",
                  fontWeight: "bold",
                  marginLeft: 8,
                }}
                numberOfLines={1}
              >
                {formatTimelineDate(itemRight.date_val || itemRight.time)}
              </Text>
            </View>
            <SessionCard
              item={itemRight}
              index={index}
              side="right"
              navigation={navigation_obj}
            />
          </View>
        ) : itemRight ? (
          <View style={{ alignItems: "flex-start" }}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                marginLeft: -6,
                marginBottom: 8,
              }}
            >
              <View style={styles.timelineDot} />
            </View>
            <SessionCard
              item={itemRight}
              index={index}
              side="right"
              navigation={navigation_obj}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

// Helper to format date
function formatTimelineDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date(); // Current local time from system
  // Compare year, month, and day
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return "Today";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MyJourneyScreen = () => {
  const navigation = useNavigation<any>();
  const [leftTimeline, setLeftTimeline] = useState<any[]>([]);
  const [rightTimeline, setRightTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Stats Data State ---
  const [statsData, setStatsData] = useState(defaultStatsData);
  // Timeline rows for unified sorted view
  const [timelineRows, setTimelineRows] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
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

  // --- Fetch stats data on mount ---
  useEffect(() => {
    let isMounted = true;
    setStatsLoading(true);
    setStatsError(null);
    (async () => {
      try {
        const userId = await AsyncStorage.getItem(SPD_USER_ID);
        if (!userId) throw new Error("User not found");
        const res = await callSuggestusAPI(
          spd_processId_config.spdonmood9_md_user_played_sessions_timeline_summary,
          { p_user_id: userId },
        );
        if (res?.returnCode && res.returnData) {
          // Map API fields to stat cards
          const api = res.returnData;
          const newStats = [
            {
              ...defaultStatsData[0],
              time: formatTimeHrs(api[0].total_listened_last_15_days),
            },
            {
              ...defaultStatsData[1],
              time: formatTimeHrs(api[0].total_listened_last_1_month),
            },
            {
              ...defaultStatsData[2],
              time: formatTimeHrs(api[0].total_listened_last_1_year),
            },
            {
              ...defaultStatsData[3],
              time: formatTimeHrs(api[0].total_listened_all_time),
            },
          ];
          if (isMounted) setStatsData(newStats);
        } else {
          throw new Error(res?.msg || "No stats data");
        }
      } catch (err: any) {
        if (isMounted) setStatsError(err?.message || "Failed to load stats");
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Format time as Hrs:MM ---
  function formatTimeHrs(value: number | string | undefined): string {
    if (!value || isNaN(Number(value))) return "-";
    // If value is in minutes, convert to hours:minutes
    const totalMins = Number(value);
    const hrs = Math.floor(totalMins / 60);
    const mins = Math.round(totalMins % 60);
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      const userEmail = await AsyncStorage.getItem(SPD_USER_EMAIL);
      Promise.all([
        callSuggestusAPI(
          spd_processId_config.spdonmood9_get_md_category_group_module_recent_played_all,
          {},
        ),
        callSuggestusAPI(
          spd_processId_config.spdonmood9_md_user_care_plan_timeline,
          { p_email: userEmail },
        ),
      ])
        .then(([leftRes, rightRes]) => {
          // Merge and sort all timeline items by date
          const left =
            leftRes?.returnCode && Array.isArray(leftRes.returnData)
              ? leftRes.returnData.map((item) => ({
                  ...item,
                  _timelineSource: "left",
                }))
              : [];
          const right =
            rightRes?.returnCode && Array.isArray(rightRes.returnData)
              ? rightRes.returnData.map((item) => ({
                  ...item,
                  _timelineSource: "right",
                }))
              : [];
          // Merge and sort by correct date field
          const merged = [...left, ...right].sort((a, b) => {
            const getSortDate = (item: any) => {
              if (item._timelineSource === "left") {
                return new Date(item.modified_at).getTime();
              }
              return new Date(
                item.date_val || item.time || item.created_at || item.createdAt,
              ).getTime();
            };
            const dateA = getSortDate(a);
            const dateB = getSortDate(b);
            return dateB - dateA;
          });
          setTimelineRows(merged);
          if (merged.length === 0) {
            setError("No timeline found");
          }
        })
        .catch(() => setError("Failed to load timeline"))
        .finally(() => setLoading(false));
    })();
    return () => {
      isMounted = false;
    };
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
        {/* <CustomTopHeader title="Back" /> */}

        <View style={styles.topBarBack}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => navigation.goBack()}
          >
            <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
              <Path
                d="M7 1L2.41421 5.58579C1.63317 6.36683 1.63316 7.63316 2.41421 8.41421L7 13"
                stroke="#8B4CFC"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "QuicksandSemiBold",
                marginLeft: 8,
                marginBottom: 3,
                color: "#8B4CFC",
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={[
            styles.container,
            Platform.OS === "web" && screenWidth >= 1024
              ? { paddingLeft: 100, paddingRight: 100 }
              : null,
          ]}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header Statistics */}
          <View style={styles.statsGrid}>
            {statsLoading ? (
              <View style={{ alignItems: "center", marginTop: 8 }}>
                <ActivityIndicator size="small" color="#8B4CFC" />
              </View>
            ) : statsError ? (
              <View style={{ alignItems: "center", marginTop: 8 }}>
                <Text style={{ color: "#f00" }}>{statsError}</Text>
              </View>
            ) : (
              Array.from({ length: Math.ceil(statsData.length / 2) }).map(
                (_, rowIdx) => (
                  <View style={styles.statsRow} key={rowIdx}>
                    {statsData
                      .slice(rowIdx * 2, rowIdx * 2 + 2)
                      .map((stat, idx) => (
                        <StatBox
                          key={stat.key}
                          icon={stat.icon}
                          title={stat.title}
                          headerBg={stat.headerBg}
                          time={stat.time}
                          borderColor={stat.borderColor}
                          selected={stat.selected}
                          style={
                            idx === 0 ? { marginRight: 8 } : { marginLeft: 8 }
                          }
                        />
                      ))}
                  </View>
                ),
              )
            )}
          </View>

          {/* Timeline */}
          {loading ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <ActivityIndicator size="large" color="#8B4CFC" />
            </View>
          ) : error ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text>{error}</Text>
            </View>
          ) : (
            <View style={styles.timelineGradientBg}>
              <View style={{ position: "relative" }}>
                {/* Single continuous vertical line */}
                <View
                  style={styles.timelineVerticalLine}
                  pointerEvents="none"
                />
                <View style={styles.timelineWrap}>
                  {timelineRows &&
                    timelineRows.length > 0 &&
                    timelineRows.map((item: any, idx: number) => (
                      <TimelineRow
                        key={idx}
                        itemLeft={
                          item._timelineSource === "left" ? item : undefined
                        }
                        itemRight={
                          item._timelineSource === "right" ? item : undefined
                        }
                        index={idx}
                        navigation_obj={navigation}
                      />
                    ))}
                </View>
              </View>
            </View>
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
  topBarBack: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
    marginLeft: 0,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    height: Platform.OS === "ios" ? 75 : 80,
    paddingVertical: 0,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: "column",
    marginTop: 16,
    marginBottom: 14,
    gap: 0,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statBox: {
    width: "48%",
    borderRadius: 8,
    padding: 5,
    backgroundColor: "#fff",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.06,
    // shadowRadius: 4,
    // borderWidth: 2,
    // borderColor: "#E0E0E0",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  statBoxSelected: {
    // borderColor: "#3D7EFF",
    // shadowColor: "#3D7EFF",
    // shadowOpacity: 0.12,
    // shadowRadius: 6,
  },
  statBoxRow: {
    // flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    gap: 0,
  },
  statBoxRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    borderRadius: 5,
    padding: 8,
    width: "100%",
    paddingRight: 8,
  },
  statIconWrap: {
    marginRight: 8,
    marginTop: 0,
    width: 12,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#262626",
    marginLeft: 10,
    textAlign: "left",
  },
  statTime: {
    fontSize: 20,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 0,
    textAlign: "left",
  },
  statHrs: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#262626",
    marginTop: 1,
    textAlign: "left",
  },
  timelineWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  timelineGradientBg: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    minHeight: 120,
    position: "relative",
  },
  timelineCardCol: {
    flex: 4,
    minHeight: 100,
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
  },
  timelineCenterCol: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    height: "100%",
    position: "relative",
  },
  timelineVerticalLine: {
    position: "absolute",
    left: "50%",
    top: 12,
    bottom: 0,
    width: 3,
    backgroundColor: "#B99AFF",
    marginLeft: -1.5,
    zIndex: 0,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 8,
    backgroundColor: "#8B4CFC",
    zIndex: 2,
    marginVertical: 2,
  },
  timelineDotLeft: {
    width: 12,
    height: 12,
    borderRadius: 8,
    backgroundColor: "#8B4CFC",
    zIndex: 2,
    marginVertical: 2,
  },
  timelineDate: {
    display: "none", // Hide the old date below the dot
  },
  timelineDateTop: {
    display: "none",
  },
  timelineDotRow: {
    display: "none",
  },
  timelineDateSide: {
    display: "none",
  },
  timelineDateAbsoluteRight: {
    position: "absolute",
    left: "110%",
    top: "50%",
    transform: [{ translateY: -12 }],
    color: "#222",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "left",
    minWidth: 90,
    marginLeft: 8,
    zIndex: 3,
  },
  timelineDateAbsoluteLeft: {
    position: "absolute",
    right: "110%",
    top: "50%",
    transform: [{ translateY: -12 }],
    color: "#222",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    minWidth: 90,
    marginRight: 8,
    zIndex: 3,
  },
  timelineTime: {
    minWidth: 70,
    marginTop: 20,
    color: "#A0A0A0",
    fontWeight: "bold",
    fontSize: 13,
    backgroundColor: "transparent",
    textAlign: "right",
  },
  sessionCard: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
    alignItems: "center",
    minHeight: 80,
    backgroundColor: "#fff",
    width: "100%",
    // marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#898D9E66",
  },
  cardLeft: {
    alignSelf: "flex-start",
  },
  cardRight: {
    alignSelf: "flex-end",
  },
  cardImageWrap: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 14,
    backgroundColor: "#F0F0F0",
  },
  cardImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#888",
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  assignedBadge: {
    backgroundColor: "#E8F0FF",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  assignedBadgeText: {
    color: "#4A90E2",
    fontSize: 12,
    fontWeight: "600",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default MyJourneyScreen;
