import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import { SPD_ORG_LOGO } from "../config/config";

const DEFAULT_LOGO: ImageSourcePropType = require("@/assets/images/logo.png");

/**
 * Returns the org logo to render in an <Image source={...} />.
 *
 * Starts with the static bundled logo (identical to current behavior) and
 * swaps to the backend-provided org_profile_image URL — cached under
 * SPD_ORG_LOGO by the org config fetch in app/_layout.tsx — once it's
 * available. Falls back to the static logo if that value is missing,
 * "null", or empty, so screens never break when the backend doesn't
 * return a logo.
 */
export function useOrgLogo(): ImageSourcePropType {
  const [logoSource, setLogoSource] = useState<ImageSourcePropType>(DEFAULT_LOGO);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const raw = await fetchDataFromLocalStorage(SPD_ORG_LOGO);
        if (isMounted && raw && raw !== "null" && raw.trim().length > 0) {
          setLogoSource({ uri: raw });
        }
      } catch (_) {
        // Keep the default static logo on any error
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return logoSource;
}
