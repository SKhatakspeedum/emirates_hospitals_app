// config/colors.ts
// Light theme (default) - Use themes.ts for dark theme
export const Colors = {
  // Primary colors
  primary: "#001871",
  secondary: "#0177C8",

  // Background colors
  background: "#FFFFFF",
  backgroundDark: "#2c3a4c",
  backgroundLight: "#FAFAFF",
  backgroundOverlay: "rgba(0, 0, 0, 0.4)",
  backgroundOverlayLight: "rgba(35, 39, 82, 0.8)",
  backgroundOverlayVeryLight: "rgba(243, 238, 255, 0.9)",
  backgroundSheetLight: "#CDF0FB",
  backgroundPurpleLight: "#3E3A6E",

  // Text colors
  text: "#262626",
  textDark: "#d2d2d2",
  textLight: "#898D9E",
  textError: "#d32f2f",
  label: "#262626CC",
  textLabel: "#898D9E",

  // Border colors
  border: "#cbccd1ff",
  borderAccent: "#FFC42E",
  borderDark: "#333333",

  // Status colors
  inactive: "#D0D4DF",
  active: "#0ea5e9",
  pressed: "#e0f2fe",
  activeBorder: "#0ea5e9",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",

  // Special colors
  purple: "#7D5FFF",
  lightgray: "#FAFAFF",
  gray: "#5A5A5A",
  grayDark: "#5A5A5A80",
  shadow: "rgba(0,0,0,0.6)",
  shadowMedium: "rgba(0,0,0,0.5)",
  overlayOnDark: "rgba(255,255,255,0.15)",
};

/**
 * Applies a backend-driven theme (the `spd_theme_setting_config` object
 * returned by sgconf_get_mst_organization_by_org_patient_portal_url) onto
 * the shared Colors object in place, so every screen that already does
 * `import { Colors } from "../config/colors"` picks up the new values.
 *
 * Only known Colors keys with a non-empty string value are overwritten —
 * anything missing, malformed, or not an object is ignored, so the app
 * keeps rendering with these defaults when the backend doesn't return
 * this config (or returns partial/invalid data).
 */
export const applyThemeColors = (themeConfig: unknown): void => {
  if (!themeConfig || typeof themeConfig !== "object") return;

  const target = Colors as Record<string, string>;
  Object.entries(themeConfig as Record<string, unknown>).forEach(
    ([key, value]) => {
      if (
        key in target &&
        typeof value === "string" &&
        value.trim().length > 0
      ) {
        target[key] = value;
      }
    },
  );
};

// localStorage key used to cache the backend theme on web, so it can be
// read synchronously (see below) before other modules import Colors.
export const THEME_CACHE_KEY = "sg_theme_setting_config_cache";

// ── Synchronously prime Colors from a cached backend theme (web only) ──
// Every screen's own `StyleSheet.create({ ...: Colors.primary })` call runs
// once, at module-import time, baking in whatever Colors.primary equals at
// that instant. `_layout.tsx`'s network fetch only resolves after the app
// has mounted — by then those StyleSheet objects have already captured the
// OLD values, so mutating Colors afterward can't retroactively fix them.
//
// `localStorage` (web only) is synchronous, unlike AsyncStorage. Since this
// module is always imported (and this code runs) before any screen module
// that does `import { Colors } from "../config/colors"`, priming Colors here
// guarantees every screen's StyleSheet bakes in the correct backend theme
// from the very first paint — as long as _layout.tsx has cached it here at
// least once before (see the reload-once logic there).
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const cached = window.localStorage.getItem(THEME_CACHE_KEY);
    if (cached) {
      applyThemeColors(JSON.parse(cached));
    }
  } catch (_) {
    // Malformed/missing cache — Colors keeps its hardcoded defaults above.
  }
}
