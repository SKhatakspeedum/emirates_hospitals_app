import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";

type Service = {
  id: string;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  icon: string;
  faIcon?: string | null;
};

const FA_VARIANTS = ["solid", "regular", "light", "brands", "thin", "duotone"];

const parseFaIconName = (iconClass: string): string | null => {
  if (!iconClass) return null;
  const matches = iconClass.match(/fa-[\w-]+/g) ?? [];
  const icon = matches.find((m) => !FA_VARIANTS.includes(m.replace("fa-", "")));
  return icon ? icon.replace("fa-", "") : null;
};

const DEFAULT_SERVICE_STYLES = [
  { bgColor: "#E0F2FE", iconColor: "#0076D6", icon: "chatbubbles-outline" },
  { bgColor: "#FEE2E2", iconColor: "#EF4444", icon: "document-text-outline" },
  { bgColor: "#F3F4F6", iconColor: "#4B5563", icon: "people-outline" },
  { bgColor: "#F3E8FF", iconColor: "#A855F7", icon: "git-network-outline" },
  { bgColor: "#FEF9C3", iconColor: "#EAB308", icon: "happy-outline" },
  { bgColor: "#CCFBF1", iconColor: "#0D9488", icon: "flask-outline" },
];

const FALLBACK_SERVICES: Service[] = [
  { id: "counselling", title: "Counselling", description: "Counselling", ...DEFAULT_SERVICE_STYLES[0] },
  { id: "clinical", title: "Clinical assessments", description: "Clinical assessments", ...DEFAULT_SERVICE_STYLES[1] },
  { id: "family", title: "Family therapy", description: "Family therapy", ...DEFAULT_SERVICE_STYLES[2] },
  { id: "cognitive", title: "Cognitive behavioral\ntherapy", description: "Cognitive behavioral therapy", ...DEFAULT_SERVICE_STYLES[3] },
  { id: "psychotherapy", title: "Psychotherapy", description: "Psychotherapy", ...DEFAULT_SERVICE_STYLES[4] },
  { id: "diagnostic", title: "Diagnostic\nappointment", description: "Diagnostic appointment", ...DEFAULT_SERVICE_STYLES[5] },
];

export default function AppointmentTypeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    doctorId,
    doctorName,
    specialty,
    avatar,
    hospital,
    patientId,
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
    hospital: "",
    patientName: "John Doe",
    patientAge: "28",
    patientGender: "Male",
    relationship: "Self",
    symptoms: "",
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("services :>>", services);
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const orgId = (await fetchDataFromLocalStorage("sg_org_id")) ?? "3";
      const response = await callSuggestusAPI(
        spd_processId_config.hospapp_get_patient_appointment_category,
        { p_org_id: orgId },
        "",
        "",
        "",
        JSON.stringify({ sgPatientId: patientId ?? "", sgVisitId: "" }),
        undefined,
        false,
      );
      if (response?.returnCode === true && response.returnData?.length > 0) {
        const mapped: Service[] = response.returnData.map((item: any, index: number) => {
          const style = DEFAULT_SERVICE_STYLES[index % DEFAULT_SERVICE_STYLES.length];
          const name = item.appsubtyp_name ?? item.description ?? item.apptcatg_desc ?? "";
          return {
            id: String(item.appsubtyp_id ?? item.id ?? index),
            title: name,
            description: item.description ?? name,
            faIcon: parseFaIconName(item.appsubtyp_icon_class ?? ""),
            ...style,
          };
        });
        setServices(mapped);
      }
    } catch (_) {
      // keep fallback services
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectServiceAndContinue = (service: Service) => {
    navigation.navigate("ScheduleBook", {
      doctorId,
      doctorName,
      specialty,
      avatar,
      hospital,
      patientId,
      patientName,
      patientAge,
      patientGender,
      relationship,
      symptoms,
      appSubtypeId: service.id,
      type: (service.description || service.title).replace("\n", " "),
    });
  };

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <CustomHeader title="Appointment type" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>What are you looking for?</Text>

        {/* Search Input Bar */}
        <View
          style={[
            styles.searchBarContainer,
            isFocused && styles.searchBarContainerFocused,
          ]}
        >
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
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: 20, width: "100%" }}
            />
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No services found matching keyword
              </Text>
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
                  },
                ]}
                onPress={() => handleSelectServiceAndContinue(service)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: service.bgColor },
                  ]}
                >
                  {service.faIcon ? (
                    <FontAwesome5
                      name={service.faIcon}
                      size={28}
                      color={service.iconColor}
                    />
                  ) : (
                    <Ionicons
                      name={service.icon as any}
                      size={32}
                      color={service.iconColor}
                    />
                  )}
                </View>
                <Text style={styles.serviceLabel}>{service.description || service.title}</Text>
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
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
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
