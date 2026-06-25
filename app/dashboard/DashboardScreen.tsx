import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_NAME } from "@/app/config/config";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [userProfileName, setUserProfileName] = useState<string>("John Doe");

  useEffect(() => {
    AsyncStorage.getItem(SPD_USER_NAME).then((value) => {
      if (value) {
        setUserProfileName(value);
      }
    });
  }, []);

  const handleSeeAllProviders = () => {
    // Navigate to see all providers
  };

  const handleSeeAllSpecialties = () => {
    // Navigate to see all specialties
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002075" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Plus background elements for visual excellence */}
          <View style={styles.bgCircleLarge} />
          <View style={styles.bgPlusVertical} />
          <View style={styles.bgPlusHorizontal} />

          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerTopRow}>
              {/* Profile image */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Image
                  source={{ uri: "https://randomuser.me/api/portraits/men/43.jpg" }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              {/* Search & Notification Icons */}
              <View style={styles.headerIconsRight}>
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons name="search-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                  <View>
                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                    <View style={styles.badgeDot} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Morning, {userProfileName}</Text>
              <Text style={styles.subGreetingText}>You have 4 upcoming appointments.</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Quick Action Cards (Overlapping) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="calendar-outline" size={28} color="#0076D6" />
            </View>
            <Text style={styles.actionCardText}>Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
            <View style={styles.actionIconCircle}>
              <FontAwesome5 name="briefcase-medical" size={24} color="#0076D6" />
            </View>
            <Text style={styles.actionCardText}>Health Packages</Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={styles.bodyContent}>
          {/* Upcoming Appointment Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Upcoming</Text>

            <TouchableOpacity style={styles.upcomingCard} activeOpacity={0.9}>
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
                style={styles.doctorAvatarLarge}
              />

              <View style={styles.upcomingDetails}>
                <Text style={styles.upcomingDocName}>Dr. Harry Dewson</Text>
                <Text style={styles.upcomingDocSpecialty}>Dermatologists</Text>

                <View style={styles.upcomingTimeRow}>
                  <Ionicons name="time-outline" size={16} color="#002075" style={styles.timeIcon} />
                  <Text style={styles.upcomingTimeText}>09:30 AM - 10:00 AM</Text>
                </View>
              </View>

              {/* Date Badge */}
              <View style={styles.dateBadgeContainer}>
                <Text style={styles.dateBadgeDay}>02</Text>
                <Text style={styles.dateBadgeMonth}>Mar</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Providers Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons name="people-outline" size={20} color="#0076D6" style={styles.sectionHeaderIcon} />
                <Text style={styles.sectionTitle}>Providers</Text>
              </View>
              <TouchableOpacity onPress={handleSeeAllProviders} activeOpacity={0.6}>
                <Text style={styles.seeAllText}>
                  See all <Ionicons name="chevron-forward" size={12} color="#0076D6" />
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providersScrollList}
            >
              {/* Dr. Wael Berro */}
              <TouchableOpacity style={styles.providerCard} activeOpacity={0.9}>
                <Image
                  source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
                  style={styles.providerAvatar}
                />
                <Text style={styles.providerName} numberOfLines={1}>Dr. Wael Berro</Text>
                <Text style={styles.providerSpecialty} numberOfLines={2}>Family Medicine Consul...</Text>
              </TouchableOpacity>

              {/* Dr. Sheena Cherry */}
              <TouchableOpacity style={styles.providerCard} activeOpacity={0.9}>
                <Image
                  source={{ uri: "https://randomuser.me/api/portraits/women/68.jpg" }}
                  style={styles.providerAvatar}
                />
                <Text style={styles.providerName} numberOfLines={1}>Dr. Sheena Cherry</Text>
                <Text style={styles.providerSpecialty} numberOfLines={2}>Specialist Internal Medi...</Text>
              </TouchableOpacity>

              {/* Dr. Yanal Salam */}
              <TouchableOpacity style={styles.providerCard} activeOpacity={0.9}>
                <Image
                  source={{ uri: "https://randomuser.me/api/portraits/men/46.jpg" }}
                  style={styles.providerAvatar}
                />
                <Text style={styles.providerName} numberOfLines={1}>Dr. Yanal Salam</Text>
                <Text style={styles.providerSpecialty} numberOfLines={2}>Consultant Intern...</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Specialties Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons name="heart-half-outline" size={20} color="#0076D6" style={styles.sectionHeaderIcon} />
                <Text style={styles.sectionTitle}>Specialties</Text>
              </View>
              <TouchableOpacity onPress={handleSeeAllSpecialties} activeOpacity={0.6}>
                <Text style={styles.seeAllText}>
                  See all <Ionicons name="chevron-forward" size={12} color="#0076D6" />
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtiesScrollList}
            >
              {/* Neurology */}
              <TouchableOpacity style={styles.specialtyItem} activeOpacity={0.8}>
                <View style={[styles.specialtyIconCircle, { backgroundColor: "#E6F5FC" }]}>
                  <MaterialCommunityIcons name="brain" size={28} color="#00A3E0" />
                </View>
                <Text style={styles.specialtyLabel}>Neurology</Text>
              </TouchableOpacity>

              {/* ENT */}
              <TouchableOpacity style={styles.specialtyItem} activeOpacity={0.8}>
                <View style={[styles.specialtyIconCircle, { backgroundColor: "#FDF1EB" }]}>
                  <Ionicons name="body-outline" size={26} color="#E87722" />
                </View>
                <Text style={styles.specialtyLabel}>ENT</Text>
              </TouchableOpacity>

              {/* Gen. Medicine */}
              <TouchableOpacity style={styles.specialtyItem} activeOpacity={0.8}>
                <View style={[styles.specialtyIconCircle, { backgroundColor: "#EAF6F0" }]}>
                  <FontAwesome5 name="briefcase-medical" size={22} color="#2ECC71" />
                </View>
                <Text style={styles.specialtyLabel}>Gen. Medicine</Text>
              </TouchableOpacity>

              {/* Pediatrics */}
              <TouchableOpacity style={styles.specialtyItem} activeOpacity={0.8}>
                <View style={[styles.specialtyIconCircle, { backgroundColor: "#FEF9E7" }]}>
                  <MaterialCommunityIcons name="baby-face-outline" size={28} color="#F1C40F" />
                </View>
                <Text style={styles.specialtyLabel}>Pediatrics</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Bottom spacing to clear tab bar */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#002075",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 20 : 50,
    paddingBottom: 50,
    position: "relative",
    overflow: "hidden",
  },
  headerSafeArea: {
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerIconsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 16,
    padding: 6,
  },
  badgeDot: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  greetingContainer: {
    marginTop: 4,
  },
  greetingText: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: "#fff",
    marginBottom: 6,
  },
  subGreetingText: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "rgba(255, 255, 255, 0.7)",
  },
  bgCircleLarge: {
    position: "absolute",
    right: -50,
    top: 30,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 32,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  bgPlusVertical: {
    position: "absolute",
    right: 50,
    top: 110,
    width: 14,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 7,
  },
  bgPlusHorizontal: {
    position: "absolute",
    right: 27,
    top: 133,
    width: 60,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 7,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -30,
    justifyContent: "space-between",
    width: "100%",
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0F7FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionCardText: {
    fontSize: 14,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
  },
  bodyContent: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
    marginBottom: 14,
  },
  upcomingCard: {
    backgroundColor: "#E8F4FD",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  doctorAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
  },
  upcomingDetails: {
    flex: 1,
    marginLeft: 16,
  },
  upcomingDocName: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
    marginBottom: 3,
  },
  upcomingDocSpecialty: {
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    color: "#6F768E",
    marginBottom: 8,
  },
  upcomingTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginRight: 6,
  },
  upcomingTimeText: {
    fontSize: 13,
    fontFamily: "QuicksandBold",
    color: "#002075",
  },
  dateBadgeContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D4E8FC",
  },
  dateBadgeDay: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: "#0076D6",
    lineHeight: 18,
  },
  dateBadgeMonth: {
    fontSize: 11,
    fontFamily: "QuicksandSemiBold",
    color: "#0076D6",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderIcon: {
    marginRight: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: "QuicksandBold",
    color: "#0076D6",
  },
  providersScrollList: {
    paddingRight: 10,
  },
  providerCard: {
    width: 135,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E5ED",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ccc",
    marginBottom: 10,
  },
  providerName: {
    fontSize: 13,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
    textAlign: "center",
    marginBottom: 4,
  },
  providerSpecialty: {
    fontSize: 11,
    fontFamily: "QuicksandMedium",
    color: "#8E95A9",
    textAlign: "center",
    lineHeight: 14,
  },
  specialtiesScrollList: {
    paddingRight: 10,
  },
  specialtyItem: {
    alignItems: "center",
    marginRight: 20,
    width: 72,
  },
  specialtyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  specialtyLabel: {
    fontSize: 12,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 100,
  },
});
