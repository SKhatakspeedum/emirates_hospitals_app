import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";

const SERVICES = [
  {
    id: "counselling",
    title: "Counselling",
    icon: "chatbubbles-outline",
    bgColor: "#E0F2FE", // Soft sky blue
    iconColor: "#0076D6",
  },
  {
    id: "clinical",
    title: "Clinical assessments",
    icon: "document-text-outline",
    bgColor: "#FEE2E2", // Soft red
    iconColor: "#EF4444",
  },
  {
    id: "family",
    title: "Family therapy",
    icon: "people-outline",
    bgColor: "#F3F4F6", // Soft grey
    iconColor: "#4B5563",
  },
  {
    id: "cognitive",
    title: "Cognitive behavioral\ntherapy",
    icon: "git-network-outline",
    bgColor: "#F3E8FF", // Soft purple
    iconColor: "#A855F7",
  },
  {
    id: "psychotherapy",
    title: "Psychotherapy",
    icon: "happy-outline",
    bgColor: "#FEF9C3", // Soft yellow
    iconColor: "#EAB308",
  },
  {
    id: "diagnostic",
    title: "Diagnostic\nappointment",
    icon: "flask-outline",
    bgColor: "#CCFBF1", // Soft teal
    iconColor: "#0D9488",
  },
];

export default function AppointmentTypeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    doctorId,
    doctorName,
    specialty,
    avatar,
    patientName,
    patientAge,
    patientGender,
    relationship,
    symptoms,
  } = route.params || {
    doctorId: "1",
    doctorName: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    patientName: "John Doe",
    patientAge: "28",
    patientGender: "Male",
    relationship: "Self",
    symptoms: "",
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSelectServiceAndContinue = (serviceTitle: string) => {
    navigation.navigate("ScheduleBook", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      patientName,
      patientAge,
      patientGender,
      relationship,
      symptoms,
      type: serviceTitle.replace("\n", " "), // Remove clean linebreaks for navigation payload
    });
  };

  const filteredServices = SERVICES.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
          <Text style={styles.headerTitle}>Appointment type</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>What are you looking for?</Text>

        {/* Search Input Bar */}
        <View style={[styles.searchBarContainer, isFocused && styles.searchBarContainerFocused]}>
          <Ionicons
            name="search-outline"
            size={20}
            color={isFocused ? Colors.secondary : Colors.label}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by keyword..."
            placeholderTextColor={Colors.label}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        {/* Services Grid */}
        <View style={styles.gridContainer}>
          {filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No services found matching keyword</Text>
            </View>
          ) : (
            filteredServices.map((service) => (
              <Pressable
                key={service.id}
                style={({ pressed }) => [
                  styles.gridItem,
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.7 : 1,
                  }
                ]}
                onPress={() => handleSelectServiceAndContinue(service.title)}
              >
                <View style={[styles.iconCircle, { backgroundColor: service.bgColor }]}>
                  <Ionicons name={service.icon as any} size={32} color={service.iconColor} />
                </View>
                <Text style={styles.serviceLabel}>{service.title}</Text>
              </Pressable>
            ))
          )}
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
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginVertical: 24,
    fontFamily: "Quicksand",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  searchBarContainerFocused: {
    borderColor: Colors.secondary,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  gridItem: {
    width: "46%",
    alignItems: "center",
    marginBottom: 36,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.label,
  },
});
