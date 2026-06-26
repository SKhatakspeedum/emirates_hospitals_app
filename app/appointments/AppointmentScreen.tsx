import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Original Mock Data structure
const UPCOMING_APPOINTMENTS = [
  {
    id: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    date: "02 Mar 2026",
    time: "09:30 AM - 10:00 AM",
    status: "Confirmed",
    type: "Video Consult",
  },
  {
    id: "2",
    doctorName: "Dr. Wael Berro",
    specialty: "Family Medicine",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    date: "05 Mar 2026",
    time: "11:00 AM - 11:30 AM",
    status: "Confirmed",
    type: "In-Clinic",
  },
];

const HISTORY_APPOINTMENTS = [
  {
    id: "3",
    doctorName: "Dr. Sheena Cherry",
    specialty: "Specialist Medicine",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    date: "20 Feb 2026",
    time: "02:00 PM - 02:30 PM",
    status: "Completed",
    type: "Video Consult",
  },
  {
    id: "4",
    doctorName: "Dr. Yanal Salam",
    specialty: "Consultant Medicine",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    date: "15 Feb 2026",
    time: "10:30 AM - 11:00 AM",
    status: "Cancelled",
    type: "In-Clinic",
  },
];

export default function AppointmentScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [upcomingList, setUpcomingList] = useState(UPCOMING_APPOINTMENTS);
  const [historyList, setHistoryList] = useState(HISTORY_APPOINTMENTS);

  const appointments = activeTab === "upcoming" ? upcomingList : historyList;

  const handleCancelAppointment = (id: string, name: string) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${name}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            if (activeTab === "upcoming") {
              setUpcomingList((prev) => prev.filter((item) => item.id !== id));
            } else {
              setHistoryList((prev) => prev.filter((item) => item.id !== id));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      <SafeAreaView style={styles.safeArea}>

        {/* Title Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Appointments</Text>
        </View>

        {/* Tab Segment Controls */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabSegmentContainer}>
            <TouchableOpacity
              style={[
                styles.tabSegmentButton,
                activeTab === "upcoming" && styles.tabSegmentButtonActive,
              ]}
              onPress={() => setActiveTab("upcoming")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSegmentText,
                  activeTab === "upcoming" && styles.tabSegmentTextActive,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabSegmentButton,
                activeTab === "history" && styles.tabSegmentButtonActive,
              ]}
              onPress={() => setActiveTab("history")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSegmentText,
                  activeTab === "history" && styles.tabSegmentTextActive,
                ]}
              >
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {appointments.length === 0 ? (
            // Empty State UI (Screen 1 & Screen 2)
            <View style={styles.emptyContainer}>
              <Image
                source={require("@/assets/images/doctors_illustrations.png")}
                style={styles.illustration}
              />

              <Text style={styles.emptyText}>
                {activeTab === "upcoming"
                  ? "You don't have any appointments.\nLet's change that"
                  : "You don't have any history\nin appointments."}
              </Text>

              {activeTab === "upcoming" && (
                <TouchableOpacity
                  style={styles.outlineBookButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("NearbyProviders")}
                >
                  <Text style={styles.outlineBookButtonText}>Book an appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Populated State UI (Screen 3)
            appointments.map((item) => {
              const dateParts = item.date.split(" ");
              const dateNum = dateParts[0] || "02";
              const dateMonth = dateParts[1] || "Mar";
              const startTime = item.time.split(" - ")[0] || item.time;
              const specialty = item.specialty;


              return (
                <View key={item.id} style={styles.appointmentRow}>
                  <TouchableOpacity
                    style={styles.rowClickArea}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("AppointmentDetails", {
                      doctorId: item.id,
                      doctorName: item.doctorName,
                      specialty: item.specialty,
                      avatar: item.avatar,
                      patientName: "John Doe",
                      type: item.type || "Primary care visit",
                      date: item.date,
                      time: startTime,
                      isHistory: activeTab === "history",
                    })}
                  >
                    {/* Date Badge */}
                    <View style={styles.dateBadge}>
                      <View style={styles.dateBadgeHeader}>
                        <Text style={styles.dateMonthText}>{dateMonth}</Text>
                      </View>
                      <View style={styles.dateBadgeBody}>
                        <Text style={styles.dateNumText}>{dateNum}</Text>
                      </View>
                    </View>

                    {/* Details Column */}
                    <View style={styles.detailsCol}>
                      <Text style={styles.appointmentTitle}>{specialty}</Text>

                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={14} color={styles.iconColor.color} />
                        <Text style={styles.metaText}>{startTime}</Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={14} color={styles.iconColor.color} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          P.O Box 28973, Dubai, Emirates - 28973
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Options Ellipsis */}
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => handleCancelAppointment(item.id, item.doctorName)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#757575" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Floating Action Button (Only visible when list is not empty) */}
        {appointments.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("NearbyProviders")}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    color: "#262626",
  },
  tabWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tabSegmentContainer: {
    flexDirection: "row",
    height: 42,
    backgroundColor: "#EBEBEF",
    borderRadius: 10,
    padding: 3,
  },
  tabSegmentButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  tabSegmentButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "600",
  },
  tabSegmentTextActive: {
    color: "#232323",
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  illustration: {
    width: 230,
    height: 230,
    resizeMode: "contain",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  outlineBookButton: {
    marginTop: 36,
    width: "100%",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#002075",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  outlineBookButtonText: {
    fontSize: 15,
    color: "#002075",
    fontWeight: "700",
  },
  appointmentRow: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EAEAEA",
    alignItems: "center",
  },
  dateBadge: {
    width: 46,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateBadgeHeader: {
    backgroundColor: "#001871",
    width: "100%",
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  dateBadgeBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  dateMonthText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  dateNumText: {
    color: "#232323",
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsCol: {
    flex: 1,
    justifyContent: "center",
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232323",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#555",
  },
  menuButton: {
    padding: 8,
  },
  rowClickArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#001871",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 100,
  },
  iconColor: {
    color: '#001871',
  }
});
