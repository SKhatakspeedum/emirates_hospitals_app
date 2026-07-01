import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { OrderIcon, PinIcon, ChatIcon, RxIcon } from "./TabIcons";
import { Colors } from "@/app/config/colors";

const { width } = Dimensions.get("window");

// Extend props to accept toggleSheet
interface FooterProps extends BottomTabBarProps {
  toggleSheet?: () => void;
}

export default function Footer({
  state,
  descriptors,
  navigation,
  toggleSheet,
}: FooterProps) {
  const rootNavigation = useNavigation();

  // Function to handle opening the drawer (if needed elsewhere)
  const openDrawer = () => {
    rootNavigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        style={state.index === 0 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate("HomeTab", { screen: "Dashboard" })}
      >
        <Image
          source={require("@/assets/images/home.png")}
          style={{
            width: 24,
            height: 24,
            tintColor: state.index === 0 ? Colors.primary : Colors.inactive,
          }}
          resizeMode="contain"
        />
        <Text
          style={state.index === 0 ? styles.tabLabelActive : styles.tabLabel}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Sleep Tab */}
      <TouchableOpacity
        style={state.index === 1 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate("OrderScreen")}
      >
        <OrderIcon color={state.index === 1 ? Colors.primary : Colors.inactive} />
        <Text
          style={state.index === 1 ? styles.tabLabelActive : styles.tabLabel}
        >
          Orders
        </Text>
      </TouchableOpacity>

      {/* Center Logo Button - Opens Bottom Sheet */}
      <View style={styles.centerLogoContainer}>
        <TouchableOpacity
          style={styles.centerLogoButton}
          onPress={toggleSheet}
        >
          <PinIcon />
        </TouchableOpacity>
      </View>

      {/* Explore Tab */}
      <TouchableOpacity
        style={state.index === 3 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate("ChatScreen")}
      >
        <ChatIcon color={state.index === 3 ? Colors.primary : Colors.inactive} />
        <Text
          style={state.index === 3 ? styles.tabLabelActive : styles.tabLabel}
        >
          Chat
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={state.index === 4 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate("MedicinesScreen")}
      >
        <RxIcon color={state.index === 4 ? Colors.primary : Colors.inactive} />
        <Text
          style={state.index === 4 ? styles.tabLabelActive : styles.tabLabel}
        >
          Rx
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: Colors.background,
    zIndex: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
    overflow: "visible",
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
  },
  tabItemActive: {
    alignItems: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: Colors.inactive,
    marginTop: 2,
  },
  tabLabelActive: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: "700",
  },
  centerLogoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  centerLogoButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  centerLogoImage: {
    width: 35,
    height: 35,
  },
});
