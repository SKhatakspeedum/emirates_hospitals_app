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

export default function HealthPackageConfirmScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { pkg, date, time } = route.params || {
    pkg: {
      id: "pkg1",
      title: "Executive Health Package",
      price: "AED 850",
    },
    date: "02 Mar 2026",
    time: "09:00 AM",
  };

  const handleDone = () => {
    Alert.alert(
      "Success",
      "Your health package checkup has been successfully scheduled.",
      [
        {
          text: "OK",
          onPress: () => navigation.navigate("AppointmentDetails", {
            isPackage: true,
            type: pkg.title,
            date: date,
            time: time,
            patientName: "John Doe",
            price: pkg.price,
            pkg: pkg,
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
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
            <Text style={styles.headerTitle}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner Image */}
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800" }}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* List of Confirmation Details */}
          <View style={styles.listContainer}>
            {/* Package details title */}
            <View style={styles.listItem}>
              <Ionicons name="medkit-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <View style={styles.textColumn}>
                <Text style={styles.itemTitle}>Selected Package</Text>
                <Text style={styles.itemValue}>{pkg.title}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Date and Time Slot with Change Button */}
            <View style={[styles.listItem, styles.listItemSpaceBetween]}>
              <View style={styles.listItemLeft}>
                <Ionicons name="time-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
                <View style={styles.textColumn}>
                  <Text style={styles.itemTitle}>Scheduled slot</Text>
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
              <View style={styles.textColumn}>
                <Text style={styles.itemTitle}>Location</Text>
                <Text style={styles.itemValue}>
                  P.O Box 28973, Dubai,{"\n"}Emirates - 28973
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Price / Payment */}
            <View style={styles.listItem}>
              <Ionicons name="card-outline" size={22} color={Colors.primary} style={styles.itemIcon} />
              <View style={styles.textColumn}>
                <Text style={styles.itemTitle}>Payment (Self Pay)</Text>
                <Text style={styles.itemValue}>{pkg.price}</Text>
              </View>
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
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
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
    fontFamily: "QuicksandBold",
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
    alignItems: "flex-start",
    paddingVertical: 18,
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
    alignItems: "flex-start",
    flex: 1,
  },
  itemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: "center",
    marginTop: 2,
  },
  textColumn: {
    flexDirection: "column",
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 15,
    fontFamily: "QuicksandBold",
    color: Colors.text,
    lineHeight: 20,
  },
  changeButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeButtonText: {
    fontSize: 13,
    fontFamily: "QuicksandBold",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.background,
  },
});
