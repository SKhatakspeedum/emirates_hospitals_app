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
import { Ionicons, FontAwesome5, MaterialCommunityIcons, FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPD_USER_NAME } from "@/app/config/config";
import { Colors } from "../config/colors";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [userProfileName, setUserProfileName] = useState<string>("John Doe");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const handleBannerScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width || (width - 40);
    const index = Math.round(contentOffset / viewSize);
    setActiveBannerIndex(index);
  };

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

  const Providers = [
    {
      uri: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Dr. Wael Berro",
      specialty: "Family Medicine Consul...",
    },
    {
      uri: "https://randomuser.me/api/portraits/women/68.jpg",
      name: "Dr. Sheena Cherry",
      specialty: "Specialist Internal Med...",
    },
    {
      uri: "https://randomuser.me/api/portraits/men/46.jpg",
      name: "Dr. Yanal Salam",
      specialty: "Consultant Interna...",
    },
  ];

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
      iconName: "ear-outline",
      iconSize: 26,
      iconColor: "#E87722",
      bgColor: "#FDF1EB",
    },
    {
      label: "Gen. Medicine",
      Icon: FontAwesome5,
      iconName: "briefcase-medical",
      iconSize: 22,
      iconColor: "#2ECC71",
      bgColor: "#EAF6F0",
    },
    {
      label: "Pediatrics",
      Icon: MaterialCommunityIcons,
      iconName: "baby-face-outline",
      iconSize: 28,
      iconColor: "#F1C40F",
      bgColor: "#FEF9E7",
    },
  ];

  const quickActions = [
    {
      label: "Appointments",
      iconName: "calendar",
      iconColor: "#00A3E0",
      bgColor: "#E6F5FC",
      screen: "Appointment",
    },
    {
      label: "Health pkgs",
      iconName: "briefcase",
      iconColor: "#E87722",
      bgColor: "#FDF1EB",
      screen: "HealthPackages",
    },
    {
      label: "Orders",
      iconName: "document-text",
      iconColor: "#2ECC71",
      bgColor: "#EAF6F0",
      screen: "Orders",
    },
    {
      label: "Rx refill",
      iconName: "receipt",
      iconColor: "#9B59B6",
      bgColor: "#F5EEF8",
      screen: "RxRefill",
    },
  ];

  const banners = [
    {
      saveText: "SAVE 20%",
      title: "20% off on Health Checkups",
      subtitle: "Book before July 20th • All branches",
      icon: "hospital-building",
      bgColor: Colors.primary,
    },
    {
      saveText: "SAVE 15%",
      title: "15% off on Dental Services",
      subtitle: "Valid until July 31st • All clinics",
      icon: "heart-pulse",
      bgColor: Colors.secondary,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Fixed Sticky Header Top Bar */}
      <View style={styles.stickyHeader}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTopRow}>
            {/* Hamburger menu trigger */}
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <FontAwesome6 name="align-left" size={22} color={Colors.background} />
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
        {/* Blue Header & Greeting Section */}
        <View style={styles.headerGreetingSection}>
          {/* Plus background elements for visual excellence */}
          <View style={styles.bgGraphicContainer}>
            <View style={styles.bgGraphicCircle} />
            <Ionicons
              name="add"
              size={64}
              color="rgba(255, 255, 255, 0.04)"
              style={styles.bgGraphicPlus}
            />
          </View>

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Welcome!</Text>
            <Text style={styles.subGreetingText}>
              Start exploring healthcare services & specialist - all in one place.
            </Text>
          </View>
        </View>

        {/* White Curved Content Container */}
        <View style={styles.mainContentContainer}>
          {/* Promo Banner Card Slider */}
          <View style={styles.bannerContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleBannerScroll}
              scrollEventThrottle={16}
            >
              {banners.map((banner, index) => (
                <View key={index} style={{ width: width - 40, paddingRight: index < banners.length - 1 ? 12 : 0 }}>
                  <View style={[styles.bannerCard, { backgroundColor: banner.bgColor }]}>
                    <View style={styles.bannerLeft}>
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>{banner.saveText}</Text>
                      </View>
                      <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle} numberOfLines={1}>{banner.subtitle}</Text>
                    </View>
                    <View style={styles.bannerRight}>
                      <MaterialCommunityIcons
                        name={banner.icon as any}
                        size={75}
                        color="rgba(255, 255, 255, 0.15)"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.dotsContainer}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeBannerIndex === index && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick Actions Row */}
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.quickActionItem,
                  {
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  }
                ]}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.iconName as any} size={24} color={action.iconColor} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Health Awareness Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.headerIconContainer}>
                  <MaterialIcons name="play-arrow" size={20} color={Colors.secondary} />
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Health awareness</Text>
              </View>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                <Text style={styles.seeAllText}>
                  See all <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                </Text>
              </Pressable>
            </View>

            <Pressable style={styles.videoCard}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80" }}
                style={styles.videoThumbnail}
              />
              <View style={styles.playButtonContainer}>
                <Ionicons name="play" size={24} color={Colors.secondary} style={styles.playIcon} />
              </View>
            </Pressable>
          </View>

          {/* Providers Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.headerIconContainer}>
                  <FontAwesome6 name="user-doctor" size={18} color={Colors.secondary} />
                </View>
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
              {Providers.map((provider, index) => (
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
                  <Text style={styles.providerSpecialty} numberOfLines={1}>{provider.specialty}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Specialties Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleRow}>
                <View style={styles.headerIconContainer}>
                  <FontAwesome name="heartbeat" size={18} color={Colors.secondary} />
                </View>
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

            <View style={styles.specialtiesGrid}>
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
            </View>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 30,
    paddingBottom: 12,
    zIndex: 10,
  },

  headerSafeArea: {
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 72 : 85,
    paddingBottom: 48,
    position: "relative",
    overflow: "hidden",
  },
  greetingContainer: {
    marginTop: 10,
  },
  greetingText: {
    fontSize: 26,
    fontFamily: "QuicksandBold",
    color: Colors.background,
    marginBottom: 8,
  },
  subGreetingText: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
    paddingRight: 40,
  },
  bgGraphicContainer: {
    position: "absolute",
    right: -40,
    bottom: -10,
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  bgGraphicCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 20,
    borderColor: "rgba(255, 255, 255, 0.04)",
    position: "absolute",
  },
  bgGraphicPlus: {
    position: "absolute",
  },
  mainContentContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  bannerContainer: {
    marginBottom: 24,
  },
  bannerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 130,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    opacity: 0.94
  },
  bannerLeft: {
    flex: 1.3,
    justifyContent: "center",
  },
  bannerRight: {
    flex: 0.7,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  saveBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  saveBadgeText: {
    color: Colors.background,
    fontSize: 10,
    fontFamily: "QuicksandBold",
  },
  bannerTitle: {
    color: Colors.background,
    fontSize: 18,
    fontFamily: "QuicksandBold",
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontFamily: "QuicksandMedium",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D0D4DF",
    marginHorizontal: 4,
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.secondary,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionItem: {
    flex: 1,
    alignItems: "center",
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontFamily: "QuicksandBold",
    color: Colors.text,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "QuicksandBold",
    color: Colors.text,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.pressed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
  },
  videoCard: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  playIcon: {
    marginLeft: 4,
  },
  providersScrollList: {
    paddingRight: 10,
  },
  providerCard: {
    width: 140,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
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
  specialtiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  specialtyItem: {
    alignItems: "center",
    width: 72,
  },
  specialtyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  specialtyLabel: {
    fontSize: 11,
    fontFamily: "QuicksandBold",
    color: Colors.text,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 40,
  },
});
