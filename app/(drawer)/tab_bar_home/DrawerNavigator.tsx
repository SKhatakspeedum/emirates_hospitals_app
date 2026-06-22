import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomDrawer from "./CustomDrawer";
import HomeScreen from "./HomeScreen";
import { View, Text } from "react-native";
import MyJourneyScreen from "../../journey/MyJourneyScreen";

const Drawer = createDrawerNavigator();

// Remove old MoodTracker placeholder
// Use MoodTrackerNavigator as the component for the MoodTracker route

function Therapists() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Therapists</Text>
    </View>
  );
}
function Plans() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Plans</Text>
    </View>
  );
}
function Help() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Help & Support</Text>
    </View>
  );
}
function Login() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login Screen</Text>
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: "78%",
        },
        overlayColor: "rgba(0,0,0,0.18)",
      }}
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      <Drawer.Screen
        name="MainTabs"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Drawer.Screen name="MyJourney" component={MyJourneyScreen} />
      <Drawer.Screen name="Therapists" component={Therapists} />
      <Drawer.Screen name="Plans" component={Plans} />
      <Drawer.Screen name="Help" component={Help} />
      <Drawer.Screen name="Login" component={Login} />
    </Drawer.Navigator>
  );
}
