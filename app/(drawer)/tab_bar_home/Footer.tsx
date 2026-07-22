import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
// import { SvgIonicons } from "../../components/icons/SvgIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  DrawerActions,
  StackActions,
  useNavigation,
} from "@react-navigation/native";
import { HomeIcon, OrderIcon, RxIcon, PersonIcon } from "./TabIcons";
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

  const isHomeActive =
    state.index === 0 &&
    navigation.getState().routes[0].state?.routes?.[
      navigation.getState().routes[0].state?.index ?? 0
    ]?.name === "Dashboard";
  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        style={isHomeActive ? styles.tabItemActive : styles.tabItem}
        onPress={() => {
          navigation.navigate("HomeTab", { screen: "Dashboard" });
        }}
      >
        <HomeIcon color={isHomeActive ? Colors.primary : Colors.grayDark} />
        <Text style={isHomeActive ? styles.tabLabelActive : styles.tabLabel}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Order Tab */}
      <TouchableOpacity
        style={state.index === 1 ? styles.tabItemActive : styles.tabItem}
        onPress={() =>
          navigation.navigate("OrderScreen", { screen: "OrdersMain" })
        }
      >
        <OrderIcon
          color={state.index === 1 ? Colors.primary : Colors.grayDark}
        />
        <Text
          style={state.index === 1 ? styles.tabLabelActive : styles.tabLabel}
        >
          Orders
        </Text>
      </TouchableOpacity>

      {/* Center Logo Button - Opens Bottom Sheet */}
      <View style={styles.centerLogoContainer}>
        <TouchableOpacity style={styles.centerLogoButton} onPress={toggleSheet}>
          {/* <PinIcon /> */}
          <Image
            source={require("@/assets/images/menu_logo.png")}
            style={{
              width: 35,
              height: 35,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Rx Tab */}
      <TouchableOpacity
        style={state.index === 3 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate("MedicinesScreen")}
      >
        <RxIcon color={state.index === 3 ? Colors.primary : Colors.grayDark} />
        <Text
          style={state.index === 3 ? styles.tabLabelActive : styles.tabLabel}
        >
          Rx
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={state.index === 4 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate("ProfileScreen")}
      >
        <PersonIcon
          color={state.index === 4 ? Colors.primary : Colors.grayDark}
        />
        <Text
          style={state.index === 4 ? styles.tabLabelActive : styles.tabLabel}
        >
          Profile
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
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
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
    color: Colors.label,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
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
