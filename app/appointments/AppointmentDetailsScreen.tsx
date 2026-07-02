import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";

export default function AppointmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params || {};
  const isPackage = params.isPackage === true || params.isPackage === "true";
  const doctorId = params.doctorId || "1";
  const doctorName = params.doctorName || "Dr. Harry Dewson";
  const specialty = params.specialty || "Dermatologist";
  const avatar = params.avatar || "https://randomuser.me/api/portraits/men/1.jpg";
  const patientName = params.patientName || "John Doe";
  const type = params.type || "Primary care visit";
  const date = params.date || "02 Mar 2026";
  const time = params.time || "09:30 AM";
  const isHistory = params.isHistory === true || params.isHistory === "true";

  const getFormattedDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split(" ");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1];
        const year = parseInt(parts[2], 10);

        const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(monthStr);
        if (monthIndex !== -1) {
          const d = new Date(year, monthIndex, day);
          const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayName = daysShort[d.getDay()];
          return `${dayName} - ${monthStr} ${String(day).padStart(2, "0")}, ${year}`;
        }
      }
    } catch (e) {
      // Fallback
    }
    return dateStr;
  };

  const handleReschedule = () => {
    if (isPackage) {
      navigation.navigate("HealthPackageSchedule", { pkg: params.pkg });
    } else {
      navigation.navigate("ScheduleBook", {
        doctorId,
        doctorName,
        specialty,
        avatar,
        patientName,
        type,
      });
    }
  };

  const handleBookAgain = () => {
    if (isPackage) {
      navigation.navigate("HealthPackages");
    } else {
      navigation.navigate("PatientDetails", {
        doctorId,
        doctorName,
        specialty,
        avatar,
      });
    }
  };

  const handleGoToAppointments = () => {
    if (isPackage) {
      navigation.navigate("Dashboard");
    } else {
      navigation.navigate("Appointment");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Title Header matching NearbyProviders styling */}
        <CustomHeader title="Appointment details" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner Image */}
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800" }}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* Details Content */}
          <View style={styles.detailsContainer}>
            {/* Title / Appointment Type */}
            <Text style={styles.mainTitle}>{type || "Primary care visit"}</Text>

            {/* Patient Name */}
            <View style={styles.listItem}>
              <Ionicons name="person-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemValue}>{patientName || "John Doe"}</Text>
            </View>

            <View style={styles.divider} />

            {/* Date and Time */}
            <View style={styles.listItem}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <View style={styles.textColumn}>
                <Text style={styles.itemValue}>{getFormattedDateDisplay(date)}</Text>
                <Text style={[styles.itemValue, { marginTop: 2 }]}>{time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Location / Address */}
            <View style={styles.listItem}>
              <Ionicons name="location-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemValue}>
                P.O Box 28973, Dubai,{"\n"}Emirates - 28973
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Reschedule & Appointments buttons or Book Again if past history */}
        <View style={styles.footerContainer}>
          {isHistory ? (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: pressed ? Colors.primary : Colors.background,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  }
                ]}
                onPress={() => navigation.goBack()}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: pressed ? Colors.background : Colors.primary }
                    ]}
                  >
                    Back
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  }
                ]}
                onPress={handleBookAgain}
              >
                <Text style={styles.primaryButtonText}>Book Again</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.background} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: pressed ? Colors.primary : Colors.background,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  }
                ]}
                onPress={handleReschedule}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: pressed ? Colors.background : Colors.primary }
                    ]}
                  >
                    Reschedule
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  }
                ]}
                onPress={handleGoToAppointments}
              >
                <Text style={styles.primaryButtonText}>{isPackage ? "Home" : "Appointments"}</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.background} />
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    marginLeft: 5,
    fontFamily: FontFamilies.bold,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerImage: {
    width: "100%",
    height: Dimensions.get("window").height * 0.28,
  },
  detailsContainer: {
    width: "100%",
  },
  mainTitle: {
    fontSize: 22,
    color: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    fontFamily: FontFamilies.bold,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  itemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: "center",
  },
  itemValue: {
    fontSize: 15,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
    lineHeight: 20,
  },
  textColumn: {
    flexDirection: "column",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  footerContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.background,
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontFamily: FontFamilies.bold,
  },
});
