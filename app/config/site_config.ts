import { NativeModules, Platform } from "react-native";

const getDynamicActionUrl = () => {
  if (__DEV__ && Platform.OS !== "web") {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/.*?(?=\/)/);
      if (match) return match[0];
    }
  }
  return "https://dev-mysql-sgi.speedum.tech";
};

export const SiteConfig = {
  google: {
    webClientId: "694511996917-k9kknhtms041h9ocu65c7gorup6olnhe.apps.googleusercontent.com",
  },
  on_mood9_API_URL: "https://dev-mysql.speedum.tech/onmood9server/server/index.php",
  on_mood9_ASSETS_URL: "https://dev-mysql.speedum.tech/onmood9server/server",
  ACTION_URL: getDynamicActionUrl(),
  AI_CODE: "EHG_REHAB_EHG_REHAB_JUMEIRAH",
  DEV_URL: "https://ibtxr-assets.speedum.tech",
} as const;
