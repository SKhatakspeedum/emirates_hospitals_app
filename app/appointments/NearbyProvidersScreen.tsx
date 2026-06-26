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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={22} color="#262626" />
          <Text style={styles.headerTitle}>Nearby providers</Text>
        </TouchableOpacity>
      </View>

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
                      <Ionicons name="call" size={14} color="#001871" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                      <Ionicons name="chatbubble" size={14} color="#001871" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                      <Text style={styles.infoText}>i</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate("PatientDetails", {
                    doctorId: provider.id,
                    doctorName: provider.name,
                    specialty: provider.specialty,
                    avatar: provider.avatar,
                  })
                }
              >
                <Text style={styles.bookButtonText}>Book an appointment</Text>
                <Text style={styles.bookButtonSubtext}>{provider.nextAvailable}</Text>
              </TouchableOpacity>
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
    color: "#262626",
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#001871",
    borderColor: "#001871",
  },
  categoryText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#fff",
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
    color: "#B3B7C6",
    marginTop: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3f3f3ff",
    shadowColor: "#262626",
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
    color: "#B3B7C6",
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
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#001871",
    fontWeight: "bold",
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  bookButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#001871",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  bookButtonText: {
    fontSize: 15,
    color: "#001871",
    fontWeight: "700",
  },
  bookButtonSubtext: {
    fontSize: 11,
    color: "#5A73A3",
    marginTop: 2,
    fontWeight: "500",
  },
});
