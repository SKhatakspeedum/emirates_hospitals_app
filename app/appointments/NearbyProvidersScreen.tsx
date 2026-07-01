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
  TextInput,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";

// Static Doctor Mock Data
const PROVIDERS = [
  {
    id: "1",
    name: "Dr. Harry Dewson",
    specialty: "Dermatologist",
    qualification: "MBBS, M.Sc (Psych), MRC Psych...",
    hospital: "Emirates Specialty Hospital",
    distance: "1.2 km away",
    rating: "4.9",
    reviews: "142",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    nextAvailable: "Next today at 9:30 pm",
  },
  {
    id: "2",
    name: "Dr. Chiara Papile",
    specialty: "Family Medicine",
    qualification: "BA, MA, Ph.D",
    hospital: "Kings College Hospital",
    distance: "2.5 km away",
    rating: "4.8",
    reviews: "98",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    nextAvailable: "Next today at 9:30 pm",
  },
  {
    id: "3",
    name: "Dr. Brigita Wilkinson",
    specialty: "Internal Medicine",
    qualification: "B.Sc (Pharmacy)",
    hospital: "Mediclinic Welcare Hospital",
    distance: "3.1 km away",
    rating: "4.7",
    reviews: "210",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    nextAvailable: "Next today at 9:30 pm",
  },
  {
    id: "4",
    name: "Dr. Yanal Salam",
    specialty: "Internal Medicine",
    qualification: "MD, PhD",
    hospital: "Aster Cedar Hospital",
    distance: "4.0 km away",
    rating: "4.6",
    reviews: "85",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    nextAvailable: "Next tomorrow at 10:00 am",
  },
  {
    id: "5",
    name: "Dr. Sarah Jenkins",
    specialty: "Pediatrician",
    qualification: "MD, FAAP",
    hospital: "City Hospital Dubai",
    distance: "5.3 km away",
    rating: "4.9",
    reviews: "167",
    avatar: "https://randomuser.me/api/portraits/women/43.jpg",
    nextAvailable: "Next today at 4:30 pm",
  },
];

const CATEGORIES = ["All", "Dermatologist", "Family Medicine", "Internal Medicine", "Pediatrician"];

export default function NearbyProvidersScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProviders = PROVIDERS.filter((provider) => {
    const matchesCategory = selectedCategory === "All" || provider.specialty === selectedCategory;
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>

      {/* Title Header */}
      <CustomHeader title="Nearby providers" />

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Providers List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredProviders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#B3B7C6" />
            <Text style={styles.emptyText}>No providers found matching search</Text>
          </View>
        ) : (
          filteredProviders.map((provider) => (
            <View key={provider.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: provider.avatar }} style={styles.avatar} />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.name}>{provider.name}</Text>
                  <Text style={styles.qualification}>{provider.qualification}</Text>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                      <Ionicons name="call" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                      <Ionicons name="chatbubble" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                      <Text style={styles.infoText}>i</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.bookButton,
                  {
                    backgroundColor: pressed ? Colors.primary : Colors.background,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                onPress={() =>
                  navigation.navigate("PatientDetails", {
                    doctorId: provider.id,
                    doctorName: provider.name,
                    specialty: provider.specialty,
                    avatar: provider.avatar,
                  })
                }
              >
                {({ pressed }) => (
                  <>
                    <Text
                      style={[
                        styles.bookButtonText,
                        { color: pressed ? Colors.background : Colors.primary },
                      ]}
                    >
                      Book an appointment
                    </Text>
                    <Text
                      style={[
                        styles.bookButtonSubtext,
                        { color: pressed ? "rgba(255, 255, 255, 0.8)" : Colors.label },
                      ]}
                    >
                      {provider.nextAvailable}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 15,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    marginLeft: 5,
    fontFamily: "Quicksand",
  },

  categoriesContainer: {
    paddingVertical: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: Colors.background,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.label,
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,

  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 2,
  },
  qualification: {
    fontSize: 13,
    color: Colors.label,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "bold",
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  bookButton: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  bookButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
  bookButtonSubtext: {
    fontSize: 11,
    color: "#5A73A3",
    marginTop: 2,
    fontWeight: "500",
  },
});
