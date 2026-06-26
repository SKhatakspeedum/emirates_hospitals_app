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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function AppointmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params || {};
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
    navigation.navigate("ScheduleBook", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      patientName,
      type,
    });
  };

  const handleBookAgain = () => {
    navigation.navigate("PatientDetails", {
      doctorId,
      doctorName,
      specialty,
      avatar,
    });
  };

  const handleGoToAppointments = () => {
    navigation.navigate("Appointment");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Title Header matching NearbyProviders styling */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={22} color="#262626" />
            <Text style={styles.headerTitle}>Appointment details</Text>
          </TouchableOpacity>
        </View>

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
              <Ionicons name="person-outline" size={22} color="#001871" style={styles.itemIcon} />
              <Text style={styles.itemValue}>{patientName || "John Doe"}</Text>
            </View>

            <View style={styles.divider} />

            {/* Date and Time */}
            <View style={styles.listItem}>
              <Ionicons name="time-outline" size={22} color="#001871" style={styles.itemIcon} />
              <View style={styles.textColumn}>
                <Text style={styles.itemValue}>{getFormattedDateDisplay(date)}</Text>
                <Text style={[styles.itemValue, { marginTop: 2 }]}>{time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Location / Address */}
            <View style={styles.listItem}>
              <Ionicons name="location-outline" size={22} color="#001871" style={styles.itemIcon} />
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
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleBookAgain}>
                <Text style={styles.primaryButtonText}>Book Again</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={handleReschedule}>
                <Text style={styles.secondaryButtonText}>Reschedule</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleGoToAppointments}>
                <Text style={styles.primaryButtonText}>Appointments</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
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
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    color: "#262626",
    marginLeft: 5,
    fontFamily: "Quicksand",
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
    fontWeight: "700",
    color: "#001871",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    fontFamily: "Quicksand",
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
    fontWeight: "600",
    color: "#2D3748",
    lineHeight: 20,
  },
  textColumn: {
    flexDirection: "column",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  footerContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#001871",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#001871",
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#001871",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
});
