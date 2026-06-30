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
  Pressable,
} from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_NAME } from "@/app/config/config";
import { Colors } from "../config/colors";

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

  const Providers = [{
    uri: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Dr. Wael Berro",
    specialty: "Family Medicine Consul..",
  },
  {
    uri: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Dr. Sheena Cherry",
    specialty: "Family Medicine Consul..",
  },
  {
    uri: "https://randomuser.me/api/portraits/women/34.jpg",
    name: "Dr. Alice Johnson",
    specialty: "Family Medicine Consul..",
  },
  {
    uri: "https://randomuser.me/api/portraits/men/46.jpg",
    name: "Dr. Yanal Salam",
    specialty: "Consultation Internal",
  },


  ]

  const specialties = [
    {
      label: "Neurology",
      Icon: MaterialCommunityIcons,
      iconName: "brain",
      iconSize: 28,
      iconColor: "#00A3E0",
      bgColor: "#E6F5FC",
    },
    {
      label: "ENT",
      Icon: Ionicons,
      iconName: "body-outline",
      iconSize: 26,
      iconColor: "#E87722",
      bgColor: "#FDF1EB",
    },
    {
      label: "Cardiology",
      Icon: FontAwesome5,
      iconName: "heartbeat",
      iconSize: 24,
      iconColor: "#E74C3C",
      bgColor: "#FDEDEC",
    },
    {
      label: "Pediatrics",
      Icon: MaterialCommunityIcons,
      iconName: "baby-face-outline",
      iconSize: 28,
      iconColor: "#F1C40F",
      bgColor: "#FEF9E7",
    },
    {
      label: "Gen. Medicine",
      Icon: FontAwesome5,
      iconName: "briefcase-medical",
      iconSize: 22,
      iconColor: "#2ECC71",
      bgColor: "#EAF6F0",
    },

  ];

  return (
    <View style={styles.container}>


      {/* Fixed Sticky Header Top Bar (positioned absolutely to avoid Android ScrollView sticky bugs) */}
      <View style={styles.stickyHeader}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTopRow}>
            {/* Profile image */}
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/men/43.jpg" }}
                style={styles.profileImage}
              />
            </Pressable>
            {/* Search & Notification Icons */}
            <View style={styles.headerIconsRight}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    opacity: pressed ? 0.6 : 1,
                    backgroundColor: pressed ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    borderRadius: 20,
                  }
                ]}
              >
                <Ionicons name="search-outline" size={24} color={Colors.background} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    opacity: pressed ? 0.6 : 1,
                    backgroundColor: pressed ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    borderRadius: 20,
                  }
                ]}
              >
                <View>
                  <Ionicons name="notifications-outline" size={24} color={Colors.background} />
                  <View style={styles.badgeDot} />
                </View>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Spacer to push scroll content below the absolute header bar */}
        <View style={styles.stickyHeaderSpacer} />

        {/* Greeting & Background Section */}
        <View style={styles.headerGreetingSection}>
          {/* Plus background elements for visual excellence */}
          <View style={styles.bgCircleLarge} />
          <View style={styles.bgPlusVertical} />
          <View style={styles.bgPlusHorizontal} />

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Morning, {userProfileName}</Text>
            <Text style={styles.subGreetingText}>You have 4 upcoming appointments.</Text>
          </View>
        </View>

        {/* Quick Action Cards (Overlapping) */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: pressed ? Colors.pressed : Colors.background,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
              }
            ]}
            onPress={() => navigation.navigate("Appointment")}
          >
            <Ionicons name="calendar-outline" size={32} color={Colors.secondary} />
            <Text style={styles.actionCardText}>Appointments</Text>
          </Pressable>

          <View style={styles.verticalDivider} />

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: pressed ? Colors.pressed : Colors.background,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
              }
            ]}
            onPress={() => navigation.navigate("HealthPackages")}
          >
            <Ionicons name="medkit-outline" size={32} color={Colors.secondary} />
            <Text style={styles.actionCardText}>Health Packages</Text>
          </Pressable>
        </View>

        {/* Content Area */}
        <View style={styles.bodyContent}>
          {/* Upcoming Appointment Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Upcoming</Text>

            <Pressable
              style={({ pressed }) => [
                styles.upcomingCard,
                {
                  backgroundColor: pressed ? Colors.pressed : "#E8F4FD",
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                }
              ]}
            >
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
                style={styles.doctorAvatarLarge}
              />

              <View style={styles.upcomingDetails}>
                <Text style={styles.upcomingDocName}>Dr. Harry Dewson</Text>
                <Text style={styles.upcomingDocSpecialty}>Dermatologists</Text>

                <View style={styles.upcomingTimeRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.primary} style={styles.timeIcon} />
                  <Text style={styles.upcomingTimeText}>09:30 AM - 10:00 AM</Text>
                </View>
              </View>

              {/* Date Badge */}
              <View style={styles.dateBadgeContainer}>
                <Text style={styles.dateBadgeDay}>02</Text>
                <Text style={styles.dateBadgeMonth}>Mar</Text>
              </View>
            </Pressable>
          </View>

          {/* Providers Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons name="people-outline" size={20} color={Colors.secondary} style={styles.sectionHeaderIcon} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Providers</Text>
              </View>
              <Pressable
                onPress={handleSeeAllProviders}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providersScrollList}
            >
              {/* Dr Consultant Internal Medicine */}


              {
                Providers.map((provider, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.providerCard,
                      {
                        backgroundColor: pressed ? Colors.pressed : Colors.background,
                        borderColor: pressed ? Colors.activeBorder : Colors.border,
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      }
                    ]}
                  >
                    <Image
                      source={{ uri: provider.uri }}
                      style={styles.providerAvatar}
                    />
                    <Text style={styles.providerName} numberOfLines={1}>{provider.name}</Text>
                    <Text style={styles.providerSpecialty} numberOfLines={2}>{provider.specialty}</Text>
                  </Pressable>
                ))
              }
            </ScrollView>
          </View>

          {/* Specialties Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons name="heart-half-outline" size={20} color={Colors.secondary} style={styles.sectionHeaderIcon} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Specialties</Text>
              </View>
              <Pressable
                onPress={handleSeeAllSpecialties}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={styles.seeAllText}>
                  See all <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtiesScrollList}
            >
              {specialties.map((item, index) => {
                const Icon = item.Icon;

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.specialtyItem,
                      {
                        opacity: pressed ? 0.7 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      }
                    ]}
                  >
                    <View
                      style={[
                        styles.specialtyIconCircle,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      <Icon
                        name={item.iconName}
                        size={item.iconSize}
                        color={item.iconColor}
                      />
                    </View>

                    <Text style={styles.specialtyLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 50,
    paddingBottom: 12,
    zIndex: 10,
  },
  stickyHeaderSpacer: {
    height: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 72 : 110,
    backgroundColor: Colors.primary,
  },
  headerSafeArea: {
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerGreetingSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 50,
    position: "relative",
    overflow: "hidden",
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,

  },
  greetingContainer: {
    marginTop: 1,
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
    right: -30,
    top: -50,
    width: 170,
    height: 170,
    borderRadius: 110,
    borderWidth: 25,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  bgPlusVertical: {
    position: "absolute",
    right: 50,
    top: 20,
    width: 14,
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 7,
  },
  bgPlusHorizontal: {
    position: "absolute",
    right: 30,
    top: 40,
    width: 50,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 7,
  },
  actionsRow: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: -35,
    alignItems: "center",
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 10 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 12,
    //   },
    //   android: {
    //     elevation: 4,
    //   },
    // }),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 2,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  actionCardText: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: Colors.text,
    marginTop: 8,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
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
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 3,
  },
  upcomingDocSpecialty: {
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
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
    color: Colors.primary,
  },
  dateBadgeContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D4E8FC",
  },
  dateBadgeDay: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
    lineHeight: 18,
  },
  dateBadgeMonth: {
    fontSize: 11,
    fontFamily: "QuicksandSemiBold",
    color: Colors.secondary,
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
    color: Colors.secondary,
  },
  providersScrollList: {
    paddingRight: 10,
  },
  providerCard: {
    width: 135,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  providerSpecialty: {
    fontSize: 11,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
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
    color: Colors.text,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 35,
  },
});
