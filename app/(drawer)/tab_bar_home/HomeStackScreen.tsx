import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "@/app/dashboard/DashboardScreen";
import AppointmentScreen from "@/app/appointments/AppointmentScreen";
import NearbyProvidersScreen from "@/app/appointments/NearbyProvidersScreen";
import PatientDetailsScreen from "@/app/appointments/PatientDetailsScreen";
import AppointmentTypeScreen from "@/app/appointments/AppointmentTypeScreen";
import ScheduleBookScreen from "@/app/appointments/ScheduleBookScreen";
import ConfirmScreen from "@/app/appointments/ConfirmScreen";

const HomeStack = createNativeStackNavigator();

export default function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="Appointment" component={AppointmentScreen} />
      <HomeStack.Screen name="NearbyProviders" component={NearbyProvidersScreen} />
      <HomeStack.Screen name="PatientDetails" component={PatientDetailsScreen} />
      <HomeStack.Screen name="AppointmentType" component={AppointmentTypeScreen} />
      <HomeStack.Screen name="ScheduleBook" component={ScheduleBookScreen} />
      <HomeStack.Screen name="ConfirmScreen" component={ConfirmScreen} />
    </HomeStack.Navigator>
  );
}
