import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrdersScreen from "@/app/orders/OrdersScreen";
import OrderResultScreen from "@/app/orders/OrderResultScreen";

const OrdersStack = createNativeStackNavigator();

export default function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationTypeForReplace: "push",
      }}
    >
      <OrdersStack.Screen name="OrdersMain" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderResult" component={OrderResultScreen} />
    </OrdersStack.Navigator>
  );
}
