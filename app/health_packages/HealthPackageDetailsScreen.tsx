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
  Dimensions,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";

const { width } = Dimensions.get("window");

export default function HealthPackageDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pkg } = route.params || {
    pkg: {
      id: "pkg1",
      title: "Men's Silver Health Check Up",
      subtitle: "(Below 40 Yrs.)",
      price: "AED 1,800",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500",
      duration: "2-3 hours",
      inclusionsTitle: "Basic Male Health Check",
      inclusions: [
        "CBC",
        "Blood Sugar (Fasting)",
        "Lipid Profile",
        "Liver Function Test (LFT)",
        "Kidney Function Test (KFT)",
        "Urine Routine",
        "BMI & BP",
      ],
    }
  };

  const handleBook = () => {
    navigation.navigate("HealthPackageSchedule", { pkg });
  };

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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner Image Card */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: pkg.image }} style={styles.bannerImage} resizeMode="cover" />
          </View>

          {/* Details Content */}
          <View style={styles.infoWrapper}>
            <Text style={styles.mainTitle}>{pkg.title}</Text>
            <Text style={styles.subtitle}>{pkg.subtitle}</Text>

            <View style={styles.divider} />

            {/* Inclusions section */}
            <Text style={styles.sectionTitle}>{pkg.inclusionsTitle || "Basic Health Check"}</Text>
            {pkg.inclusions.map((inclusion: string, idx: number) => (
              <View key={idx} style={styles.inclusionItem}>
                <Text style={styles.inclusionText}>• {inclusion}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer Pricing & Booking */}
        <View style={styles.footerWrapper}>
          <View style={styles.footerCard}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Package Price</Text>
              <Text style={styles.priceVal}>{pkg.price}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.buyBtn,
                {
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                }
              ]}
              onPress={handleBook}
            >
              <Text style={styles.buyBtnText}>Buy now</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.background} style={styles.btnIcon} />
            </Pressable>
          </View>
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
  imageContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  bannerImage: {
    width: "100%",
    height: Dimensions.get("window").height * 0.28,
    borderRadius: 12,
  },
  infoWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: "QuicksandBold",
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "QuicksandBold",
    color: Colors.primary,
    marginBottom: 12,
  },
  inclusionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  inclusionText: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    lineHeight: 22,
  },
  footerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.background,
  },
  footerCard: {
    flexDirection: "row",
    backgroundColor: "#E8F2FC",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceCol: {
    flexDirection: "column",
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: "QuicksandMedium",
    color: "#707585",
  },
  priceVal: {
    fontSize: 17,
    fontFamily: "QuicksandBold",
    color: Colors.secondary,
    marginTop: 2,
  },
  buyBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buyBtnText: {
    fontSize: 15,
    fontFamily: "QuicksandBold",
    color: Colors.background,
  },
  btnIcon: {
    marginLeft: 8,
  },
});
