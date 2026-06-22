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
  FontAwesome5,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { G, Path } from "react-native-svg";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  screen?: string;
  params?: any;
}

interface BottomSheetContentProps {
  closeSheet: (menuItem?: MenuItem) => void;
}

const menuItems: MenuItem[] = [
  // {
  //   icon: <Feather name="music" size={22} color="#FFD600" />,
  //   label: "Music",
  //   screen: "distress_meditate/DistressMeditate",
  //   params: { category_code: "MUSIC" },
  // },
  {
    icon: <MaterialCommunityIcons name="leaf" size={22} color="#4CAF50" />,
    label: "De-Stress",
    screen: "distress_meditate/DistressMeditate",
    params: { category_code: "DE_STRESS" },
  },
  {
    icon: (
      <MaterialCommunityIcons name="meditation" size={22} color="#8E24AA" />
    ),
    label: "Meditate",
    screen: "distress_meditate/DistressMeditate",
    params: { category_code: "MINDFULNESS" },
  },
  {
    icon: <Feather name="book-open" size={22} color="#FFA726" />,
    label: "Learn",
    screen: "learn/LearnScreen",
  },
  {
    icon: <Feather name="heart" size={22} color="#F06292" />,
    label: "Favorites",
    screen: "favorite/FavoriteList",
    params: {},
  },
  {
    icon: <FontAwesome5 name="bed" size={20} color="#29B6F6" />,
    label: "Sleep Hygiene",
    screen: "sleep_check_in_out/SleepHygiene",
    params: {},
  },
  {
    icon: <FontAwesome5 name="bed" size={20} color="#29B6F6" />,
    label: "Sleep Quality",
    screen: "sleep_check_in_out/SleepCheckoutCharts",
    params: {},
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="clipboard-list-outline"
        size={22}
        color="#7B61FF"
      />
    ),
    label: "Take your assessment",
    screen: "assessments/AssessmentHomeScreen",
    params: {},
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

      {/* Scrollable Menu */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={true}
      >
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            onPress={() => {
              // Pass the menu item back to the parent component
              // If item has a screen property, it will be used for navigation
              navigation.navigate(item.screen, item.params);
              // Otherwise, it will just close the sheet
              closeSheet(item);
            }}
            key={item.label}
            style={[
              styles.menuItem,
              idx !== menuItems.length - 1 && styles.menuItemBorder,
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>{item.icon}</View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {/* <Feather name="chevron-right" size={22} color="#B3B7C6" style={styles.arrowIcon} /> */}
            <Svg width={17} height={15} viewBox="0 0 17 15" fill="none">
              <G opacity={0.6}>
                <Path
                  d="M11.6667 12.8L15.5858 8.88088C16.3669 8.09983 16.3669 6.8335 15.5858 6.05245L11.6667 2.13333"
                  stroke="#898D9E"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <Path
                  d="M15.9333 7.46667H1.00002"
                  stroke="#898D9E"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    maxHeight: Dimensions.get("window").height * 0.7,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 10,
  },
  dragIndicator: {
    width: 130,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#898D9E",
    alignSelf: "center",
    marginVertical: 10,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 0,
    backgroundColor: "#fff",
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e4",
  },
  iconWrap: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#262626",
    marginLeft: 10,
    fontFamily: "QuicksandSemiBold",
  },
  arrowIcon: {
    marginLeft: 8,
  },
  bottomMessage: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  niceDay: {
    color: "#898D9E",
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    marginTop: 4,
  },
});

export default BottomSheetContent;
