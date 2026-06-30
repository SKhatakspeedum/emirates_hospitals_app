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
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";

export default function ConfirmScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    doctorId,
    doctorName,
    specialty,
    avatar,
    patientName,
    type,
    date,
    time,
  } = route.params || {
    doctorId: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    patientName: "John Doe",
    type: "Video Consult",
    date: "02 Mar 2026",
    time: "09:30 AM",
  };

  const handleDone = () => {
    Alert.alert(
      "Success",
      "Your appointment has been successfully scheduled.",
      [
        {
          text: "OK",
          onPress: () => navigation.navigate("AppointmentDetails", {
            doctorId,
            doctorName,
            specialty,
            avatar,
            patientName,
            type,
            date,
            time,
          }),
        },
      ]
    );
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Title Header */}
        <CustomHeader title="Confirm" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner Image */}
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800" }}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* List of Confirmation Details */}
          <View style={styles.listContainer}>
            {/* Finalize Appointment Title */}
            <View style={styles.listItem}>
              <Ionicons name="calendar-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemTitle}>Finalize your appointment</Text>
            </View>

            <View style={styles.divider} />

            {/* Patient Name */}
            <View style={styles.listItem}>
              <Ionicons name="person-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemValue}>{patientName}</Text>
            </View>

            <View style={styles.divider} />

            {/* Date and Time Slot with Change Button */}
            <View style={[styles.listItem, styles.listItemSpaceBetween]}>
              <View style={styles.listItemLeft}>
                <Ionicons name="time-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
                <View style={styles.textColumn}>
                  <Text style={styles.itemValue}>{getFormattedDateDisplay(date)}</Text>
                  <Text style={[styles.itemValue, { marginTop: 2 }]}>{time}</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.changeButton,
                  {
                    backgroundColor: pressed ? Colors.primary : "transparent",
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  }
                ]}
                onPress={() => navigation.goBack()}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.changeButtonText,
                      { color: pressed ? Colors.background : Colors.primary }
                    ]}
                  >
                    Change
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Location / Address */}
            <View style={styles.listItem}>
              <Ionicons name="location-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemValue}>
                P.O Box 28973, Dubai,{"\n"}Emirates - 28973
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Payment / Self Pay with Add Button */}
            <View style={[styles.listItem, styles.listItemSpaceBetween]}>
              <View style={styles.listItemLeft}>
                <Ionicons name="card-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
                <Text style={styles.itemValue}>Self Pay</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Continue Button */}
        <View style={styles.footerContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              {
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: pressed ? 0.85 : 1,
              }
            ]}
            onPress={handleDone}
          >
            <Text style={styles.confirmButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </Pressable>
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
    fontFamily: "Quicksand",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bannerImage: {
    width: "100%",
    height: Dimensions.get("window").height * 0.28,
  },
  listContainer: {
    width: "100%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  listItemSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: "600",
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
  changeButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.label,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "flex-end",
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: "700",
  },
});
