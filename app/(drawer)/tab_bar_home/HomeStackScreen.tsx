import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "@/app/dashboard/DashboardScreen";
import AppointmentScreen from "@/app/appointments/AppointmentScreen";
import NearbyProvidersScreen from "@/app/appointments/NearbyProvidersScreen";
import PatientDetailsScreen from "@/app/appointments/PatientDetailsScreen";
import AppointmentTypeScreen from "@/app/appointments/AppointmentTypeScreen";
import ScheduleBookScreen from "@/app/appointments/ScheduleBookScreen";
import ConfirmScreen from "@/app/appointments/ConfirmScreen";
import AppointmentDetailsScreen from "@/app/appointments/AppointmentDetailsScreen";
import HealthPackagesScreen from "@/app/health_packages/HealthPackagesScreen";
import HealthPackageDetailsScreen from "@/app/health_packages/HealthPackageDetailsScreen";
import HealthPackageScheduleScreen from "@/app/health_packages/HealthPackageScheduleScreen";
import HealthPackageConfirmScreen from "@/app/health_packages/HealthPackageConfirmScreen";
import OrderResultScreen from "@/app/orders/OrderResultScreen";

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
      <HomeStack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
      <HomeStack.Screen name="HealthPackages" component={HealthPackagesScreen} />
      <HomeStack.Screen name="HealthPackageDetails" component={HealthPackageDetailsScreen} />
      <HomeStack.Screen name="HealthPackageSchedule" component={HealthPackageScheduleScreen} />
      <HomeStack.Screen name="HealthPackageConfirm" component={HealthPackageConfirmScreen} />
      <HomeStack.Screen name="OrderResult" component={OrderResultScreen} />
    </HomeStack.Navigator>
  );
}

