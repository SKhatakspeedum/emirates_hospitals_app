import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SvgIonicons } from "../components/icons/SvgIcons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { getSpecialtyIconMeta, SpecialtyIconMeta } from "../config/specialtyIcons";

interface Specialty extends SpecialtyIconMeta {
  label: string;
}

export default function AllSpecialtiesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preloadedSpecialties: Specialty[] | undefined =
    route.params?.preloadedSpecialties;
  // Dashboard forwards the specialties widget's own backend-supplied
  // processId/defaultParams so "See all" hits the same API/params as that
  // specific widget instance instead of this screen's hardcoded default.
  const widgetProcessId: string | undefined = route.params?.widgetProcessId;
  const widgetDefaultParams: Record<string, any> | undefined =
    route.params?.widgetDefaultParams;
  const [specialties, setSpecialties] = useState<Specialty[]>(
    preloadedSpecialties ?? [],
  );
  const [isLoading, setIsLoading] = useState(!preloadedSpecialties?.length);

  useEffect(() => {
    // Always refetch on landing — same as OrdersScreen's useFocusEffect —
    // so "See all" shows current data instead of the Dashboard's stale
    // preloaded snapshot. preloadedSpecialties still seeds initial state
    // above so the list isn't empty while this call is in flight.
    const fetchAllSpecialties = async () => {
      if (!preloadedSpecialties?.length) setIsLoading(true);
      try {
        // Widget defaultParams first so a widget-supplied dynamic value
        // could still be overridden by a hardcoded one below if ever added —
        // same merge order as useSectionInstanceData.
        const response = await callSuggestusAPI(
          widgetProcessId || spd_processId_config.hosapp_get_ct_department_pntapp,
          {
            p_additional_attributes: "",
            p_process_type: "",
            p_internal_flag: "",
            ...widgetDefaultParams,
          },
        );
        if (response?.returnCode === true && response.returnData?.length > 0) {
          const fetched = response.returnData.map((d: any) => {
            const label =
              d.dpt_description ?? d.dpt_name ?? d.ct_description ?? "";
            return { label, ...getSpecialtyIconMeta(label) };
          });
          setSpecialties(fetched);
        }
      } catch (e) {
        console.error("Error fetching all specialties:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllSpecialties();
  }, []);

  return (
    <View style={styles.container}>
      <CustomHeader title="Specialties" />

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 60 }}
          />
        ) : specialties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SvgIonicons name="medkit-outline" size={64} color="#B3B7C6" />
            <Text style={styles.emptyText}>No specialties found</Text>
          </View>
        ) : (
          specialties.map((item, index) => {
            const Icon = item.Icon;
            return (
              <Pressable
                key={`${item.label}-${index}`}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: pressed
                      ? Colors.pressed
                      : Colors.background,
                    borderColor: pressed ? Colors.activeBorder : Colors.border,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                onPress={() =>
                  navigation.navigate("NearbyProviders", {
                    initialCategory: item.label,
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View
                    style={[styles.iconCircle, { backgroundColor: item.bgColor }]}
                  >
                    <Icon
                      name={item.iconName as any}
                      size={item.iconSize}
                      color={item.iconColor}
                    />
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                  <SvgIonicons 
                    name="chevron-forward"
                    size={18}
                    color={Colors.label}
                  />
                </View>
              </Pressable>
            );
          })
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
    fontFamily: FontFamilies.medium,
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 17,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },
});
