import React from "react";
import { Dimensions } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import { Colors } from "../../config/colors";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  screen?: string;
  params?: any;
  count: number;
}

interface BottomSheetContentProps {
  closeSheet: (menuItem?: MenuItem) => void;
}

// Custom Svg Sun Icon matching the layout image, using design system colors
const SunIcon = () => (
  <Svg width={120} height={60} viewBox="0 0 120 60" fill="none">
    {/* Baseline */}
    <Path
      d="M10 50H110"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Sun Arch */}
    <Path
      d="M45 50C45 41.7157 51.7157 35 60 35C68.2843 35 75 41.7157 75 50"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 1 */}
    <Path
      d="M25 40L38 45"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 2 */}
    <Path
      d="M35 25L45 35"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 3 */}
    <Path
      d="M50 15L54 28"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 4 */}
    <Path
      d="M60 10V25"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 5 */}
    <Path
      d="M70 15L66 28"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 6 */}
    <Path
      d="M85 25L75 35"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Ray 7 */}
    <Path
      d="M95 40L82 45"
      stroke={Colors.primary}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const menuItems: MenuItem[] = [
  {
    icon: <MaterialCommunityIcons name="hand-heart-outline" size={24} color={Colors.secondary} />,
    label: "Self Help",
    screen: "HomeTab",
    params: { screen: "DistressMeditate", params: { category_code: "DE_STRESS" } },
    count: 0,
  },
  {
    icon: <MaterialCommunityIcons name="pill" size={24} color={Colors.secondary} />,
    label: "Prescriptions",
    screen: "MedicinesScreen",
    params: undefined,
    count: 0,
  },
  {
    icon: <Feather name="box" size={22} color={Colors.secondary} />,
    label: "Learning",
    screen: "HomeTab",
    params: { screen: "Learn" },
    count: 0,
  },
  {
    icon: <MaterialCommunityIcons name="playlist-play" size={24} color={Colors.secondary} />,
    label: "Playlist",
    screen: "HomeTab",
    params: { screen: "Music" },
    count: 0,
  },
];

const BottomSheetContent: React.FC<BottomSheetContentProps> = ({
  closeSheet,
}) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.sheetContainer}>
      {/* Drag indicator */}
      <View style={styles.dragIndicator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.myHealthTitle}>My Health</Text>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              onPress={() => {
                closeSheet(item);
              }}
              key={item.label}
              style={[
                styles.menuItem,
                idx !== menuItems.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconWrap}>{item.icon}</View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuCount}>{item.count}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.inactive} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Doctor search section */}
        <View style={styles.doctorBanner}>
          <Text style={styles.doctorBannerText}>Let's find your doctor</Text>
          <TouchableOpacity
            onPress={() => {
              closeSheet({
                label: "Doctor",
                screen: "HomeTab",
                params: { screen: "Appointment" },
                count: 0,
                icon: null,
              });
            }}
          >
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Rising sun and nice day message */}
        <View style={styles.sunContainer}>
          <SunIcon />
          <Text style={styles.niceDayText}>Have a nice day</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    maxHeight: Dimensions.get("window").height * 0.7,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 10,
  },
  dragIndicator: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.inactive,
    alignSelf: "center",
    marginVertical: 10,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  myHealthTitle: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: Colors.primary,
    marginTop: 10,
    marginBottom: 20,
  },
  menuContainer: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    backgroundColor: Colors.background,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: "QuicksandSemiBold",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuCount: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    marginRight: 10,
  },
  doctorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 30,
  },
  doctorBannerText: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: Colors.text,
  },
  seeAllLink: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
  },
  sunContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  niceDayText: {
    marginTop: 8,
    color: Colors.label,
    fontSize: 16,
    fontFamily: "QuicksandMedium",
  },
});

export default BottomSheetContent;
