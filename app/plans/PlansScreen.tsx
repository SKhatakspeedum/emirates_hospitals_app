import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ImageBackground,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

const plans = [
  {
    name: "Basic",
    type: "",
    price: "₹0",
    duration: "Forever",
    features: [
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
    ],
    enrolled: true,
  },
  {
    name: "Standard",
    type: "Only app",
    price: "₹999",
    duration: "Per month",
    features: [
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
    ],
    enrolled: false,
  },
  {
    name: "Premium",
    type: "With coach",
    price: "₹1999",
    duration: "Per month",
    features: [
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
      "Lorem Ipsum is simply dummy text",
    ],
    enrolled: false,
  },
];

const PlansScreen = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState("3 months");

  return (
    <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
    >
       {/* Top Header for screen */}
       <CustomTopHeader title="Back" />
      <View style={styles.container}>
        {/* Active Plan Card */}
        <View style={styles.activeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeTitle}>Active plan</Text>
            <Text style={styles.activePlanName}>Basic</Text>
            <View style={styles.divider} />
            <Text style={styles.activeSince}>Since Jan, 2025</Text>
          </View>
          <Image
            source={require("@/assets/images/plans.png")}
            style={styles.activeImage}
          />
        </View>

        {/* Toggle Tabs */}
        <View style={styles.tabsContainer}>
          {["3 months", "6 months"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabSelected]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextSelected,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plan Cards */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {plans.map((plan) => (
            <View key={plan.name} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planBadge}>{plan.name}</Text>
              </View>
              <Text style={styles.planPrice}>
                {plan.price}{" "}
                <Text style={styles.planDuration}>{plan.duration}</Text>
              </Text>

              <View style={styles.dividerLine} />

              <Text style={styles.featuresTitle}>What’s Included in plan?</Text>
              <View style={styles.featuresList}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {plan.enrolled ? (
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledText}>
                    <Svg width={19} height={19} viewBox="0 0 19 19" fill="none">
                      <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M9.1876 0C14.2609 0 18.3752 4.11432 18.3752 9.1876C18.3752 14.2609 14.2609 18.3752 9.1876 18.3752C4.11432 18.3752 0 14.2609 0 9.1876C0 4.11432 4.11432 0 9.1876 0ZM7.27968 12.1718L5.03033 9.92059C4.64712 9.53715 4.64704 8.91187 5.03033 8.52851C5.4137 8.14522 6.04176 8.14762 6.42234 8.52851L8.00812 10.1155L11.953 6.17065C12.3364 5.78728 12.9617 5.78728 13.345 6.17065C13.7284 6.55394 13.7278 7.17983 13.345 7.56266L8.703 12.2047C8.32018 12.5875 7.69428 12.588 7.31099 12.2047C7.30022 12.1939 7.28983 12.183 7.27968 12.1718Z"
                        fill="#00BA00"
                      />
                    </Svg>{" "}
                    Enrolled
                  </Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>
                    Upgrade{" "}
                    <Svg width={14} height={11} viewBox="0 0 14 11" fill="none">
                      <Path
                        d="M8.71529 1.65076L13 5.65341L8.71529 9.65606M1 5.65341L12.88 5.65341"
                        stroke="white"
                        strokeWidth={1.5}
                        strokeMiterlimit={10}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    zIndex: 2,
    width: "100%",
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
  headerTitle: {
    fontSize: 18,
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandSemiBold",
    width: "100%",
    textAlign: "center",
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CDF0FB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activeTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: "#262626",
  },
  activePlanName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#262626",
    fontFamily: "QuicksandRegular",
  },
  divider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.5,
    marginTop: 15,
    marginBottom: 8,
    width: "60%",
  },
  activeSince: {
    fontSize: 12,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  activeImage: {
    width: 98,
    height: 75,
    borderRadius: 12,
    backgroundColor: "transparent",
    marginLeft: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    padding: 4,
    alignSelf: "center",
    marginBottom: 16,
    width: "100%",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  tabSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#262626",
    opacity: 0.5,
    fontFamily: "QuicksandBold",
  },
  tabTextSelected: {
    color: "#262626",
    fontFamily: "QuicksandBold",
    opacity: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: "#DEE0E2",
    borderWidth: 1,
  },
  planHeader: {
    marginBottom: 8,
    alignItems: "center",
  },
  planBadge: {
    backgroundColor: "#f4eeff",
    color: "#7C3AED",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    letterSpacing: 0.5,
    width: "100%",
    textAlign: "center",
  },
  planPrice: {
    fontSize: 28,
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    textAlign: "left",
    marginTop: 8,
  },
  planDuration: {
    fontSize: 16,
    color: "#262626",
    fontFamily: "QuicksandRegular",
    marginBottom: 10,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#262626",
    marginVertical: 10,
    opacity: 0.3,
  },
  featuresTitle: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 6,
  },
  featuresList: {
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B4CFC",
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#262626",
    fontFamily: "QuicksandRegular",
    flexShrink: 1,
  },
  enrolledBadge: {
    backgroundColor: "#00BA001A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  enrolledText: {
    color: "#262626",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
  upgradeButton: {
    backgroundColor: "#8B4CFC",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontFamily: "QuicksandSemiBold",
    fontSize: 14,
  },
});

export default PlansScreen;
