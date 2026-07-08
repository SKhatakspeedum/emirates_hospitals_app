import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";

interface CustomTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function CustomTabs({
  tabs,
  activeTab,
  onTabChange,
}: CustomTabsProps) {
  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                isActive && styles.activeTabButtonText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    padding: 4,
    backgroundColor: Colors.background,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: "#E6F5FC",
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.bold,
    color: Colors.label,
  },
  activeTabButtonText: {
    color: Colors.secondary,
  },
});
