import React from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { Skeleton } from "./Skeleton";
import { Colors } from "../config/colors";

export const DashboardSkeleton = () => {
  const { width } = useWindowDimensions();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Greeting Header */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24, marginTop: 16 }}>
        <Skeleton style={{ width: 150, height: 28, marginBottom: 8 }} />
        <Skeleton style={{ width: 220, height: 16 }} />
      </View>

      {/* Banner */}
      <Skeleton
        style={{
          width: width - 40,
          height: 160,
          borderRadius: 16,
          marginBottom: 24,
          alignSelf: "center",
        }}
      />

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.actionItem}>
            <Skeleton
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                marginBottom: 8,
              }}
            />
            <Skeleton style={{ width: 60, height: 12, borderRadius: 4 }} />
          </View>
        ))}
      </View>

      {/* Upcoming appointments header */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Skeleton style={{ width: 20, height: 20, borderRadius: 4, marginRight: 8 }} />
          <Skeleton style={{ width: 180, height: 18 }} />
        </View>
        <Skeleton style={{ width: 50, height: 14 }} />
      </View>
      <View style={styles.section}>
        <Skeleton style={{ width: "100%", height: 120, borderRadius: 16 }} />
      </View>

      {/* Horizontal List 1 (Providers) */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Skeleton style={{ width: 20, height: 20, borderRadius: 4, marginRight: 8 }} />
          <Skeleton style={{ width: 120, height: 18 }} />
        </View>
        <Skeleton style={{ width: 50, height: 14 }} />
      </View>
      <View style={styles.horizontalRow}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            style={{
              width: 140,
              height: 160,
              borderRadius: 16,
              marginRight: 16,
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionItem: {
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  horizontalRow: {
    flexDirection: "row",
    paddingLeft: 20,
    marginBottom: 32,
  },
});
