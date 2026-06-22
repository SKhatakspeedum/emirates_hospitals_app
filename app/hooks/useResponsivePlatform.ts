import { Platform, useWindowDimensions } from "react-native";

export function useResponsivePlatform() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  return {
    isWeb,
    isMobileWeb: isWeb && width <= 768,
    isDesktopWeb: isWeb && width > 768,
    isMobileApp: Platform.OS === "ios" || Platform.OS === "android",
  };
}
