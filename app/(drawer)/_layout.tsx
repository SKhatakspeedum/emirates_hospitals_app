import { Drawer } from "expo-router/drawer";
import CustomDrawer from "./tab_bar_home/CustomDrawer"; // Update path if needed

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawer {...props} />}
    />
  );
}
