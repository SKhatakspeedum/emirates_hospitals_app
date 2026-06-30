import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MedicinesScreen from "./MedicinesScreen";
import ProductDetailsScreen from "./ProductDetailsScreen";
import CartScreen from "./CartScreen";

const Stack = createNativeStackNavigator();

export default function MedicinesStackScreen() {
    return (
        <Stack.Navigator id="MedicinesStack" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MedicinesList" component={MedicinesScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
        </Stack.Navigator>
    );
}
