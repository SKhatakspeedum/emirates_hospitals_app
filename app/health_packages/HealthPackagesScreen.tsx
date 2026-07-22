import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";

const PACKAGES = [
  {
    id: "pkg1",
    title: "Men's Silver Health Check Up",
    subtitle: "(Below 40 Yrs.)",
    price: "AED 1,800",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200",
    duration: "2-3 hours",
    inclusions: [
      "45 Vital Lab Tests",
      "Electrocardiogram (ECG)",
      "Basic Vision & Hearing Test",
      "General Practitioner Consultation",
    ],
  },
  {
    id: "pkg2",
    title: "Men's Silver Health Check Up",
    subtitle: "(Above 40 Yrs.)",
    price: "AED 2,000",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200",
    duration: "3 hours",
    inclusions: [
      "Expanded Lipid Profile",
      "Electrocardiogram (ECG)",
      "Treadmill Test (TMT)",
      "Doctor Consultation",
    ],
  },
  {
    id: "pkg3",
    title: "Men's Platinum Health Check",
    subtitle: "Emirates Hospital Jumeirah",
    price: "AED 10,000",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200",
    duration: "4-5 hours",
    inclusions: [
      "Comprehensive Blood Profile (60+ Tests)",
      "Cardiac Assessment (Echo, TMT, ECG)",
      "Ultrasound Abdomen & Pelvis",
      "Specialist Consultations (Cardio, Gastro, GP)",
    ],
  },
  {
    id: "pkg4",
    title: "Women's Silver Health Check Up",
    subtitle: "(Below 40 Yrs.)",
    price: "AED 2,500",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200",
    duration: "3 hours",
    inclusions: [
      "Thyroid Profile (T3, T4, TSH)",
      "Vitamin D & B12 Levels",
      "Pap Smear Test",
      "Gynecologist Consultation",
    ],
  },
  {
    id: "pkg5",
    title: "Women's Gold Health Check Up",
    subtitle: "(Above 40 Yrs.)",
    price: "AED 4,800",
    image: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=200",
    duration: "4 hours",
    inclusions: [
      "Hormonal Profile",
      "Bone Density Scan",
      "Mammogram/Breast Ultrasound",
      "Gynecologist & Physician Consults",
    ],
  },
];

export default function HealthPackagesScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Title Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
            <Text style={styles.headerTitle}>Health packages</Text>
          </TouchableOpacity>
        </View>

        {/* List of Packages */}
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {PACKAGES.map((pkg) => (
            <Pressable
              key={pkg.id}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: pressed ? Colors.pressed : Colors.background,
                  borderColor: pressed ? Colors.activeBorder : Colors.border,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => navigation.navigate("HealthPackageDetails", { pkg })}
            >
              {({ pressed }) => (
                <>
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <Image source={{ uri: pkg.image }} style={styles.cardImage} />
                    <View style={styles.cardInfoCol}>
                      <Text style={styles.cardTitle}>{pkg.title}</Text>
                      <Text style={styles.cardSubtitle}>{pkg.subtitle}</Text>
                    </View>
                  </View>

                  {/* Price / Action Strip */}
                  <View style={[
                    styles.priceStrip,
                    { backgroundColor: pressed ? Colors.background : Colors.lightgray }
                  ]}>
                    <View style={styles.priceStripLeft}>
                      <Text style={styles.priceLabel}>Package Price</Text>
                      <Text style={styles.priceValue}>{pkg.price}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.secondary} />
                  </View>
                </>
              )}
            </Pressable>
          ))}
        </ScrollView>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  cardInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "QuicksandBold",
    color: Colors.primary,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    marginTop: 4,
  },
  priceStrip: {
    flexDirection: "row",
    backgroundColor: Colors.lightgray,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceStripLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    color: "#707585",
  },
  priceValue: {
    fontSize: 14,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
    marginLeft: 8,
  },
});
