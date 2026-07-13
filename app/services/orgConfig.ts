import { Platform } from "react-native";
import {
  SPD_ORG_ID,
  SPD_AI_CODE,
  SPD_ORG_LOGO,
  SPD_ORG_WEBSITE_URL,
  SPD_INITPAGE_STEPS,
  SPD_ORG_LANGUAGE_CODE,
  SPD_THEME_SETTING_CONFIG,
  SPD_COUNTRY_CODES_FOR_PHONE,
} from "../config/config";
import { setEncryptedID } from "../suggestus_plugin/util/util_functions";
import { applyThemeColors, THEME_CACHE_KEY } from "../config/colors";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";

/**
 * Every AsyncStorage key that fetchAndApplyOrgConfig() writes to.
 * This is org/hospital-level branding config — not user session data — so
 * logout flows should preserve these keys (see CustomDrawer.tsx's SignOut
 * handler) instead of wiping them along with the user's session.
 */
export const ORG_CONFIG_STORAGE_KEYS = [
  SPD_ORG_LOGO,
  SPD_ORG_WEBSITE_URL,
  SPD_AI_CODE,
  "sg_org_name",
  SPD_ORG_ID,
  SPD_INITPAGE_STEPS,
  SPD_ORG_LANGUAGE_CODE,
  "color_palette",
  "dark_color_palette",
  SPD_THEME_SETTING_CONFIG,
  SPD_COUNTRY_CODES_FOR_PHONE,
  "TERM_CONDITION",
  "DEFAULT_JSON_DATA",
];

/**
 * Fetches the org config (logo, theme colors, allowed phone country codes,
 * EULA/signup steps, terms & conditions, etc.) via
 * sgconf_get_mst_organization_by_org_patient_portal_url and persists/applies
 * everything — same logic previously inlined in app/_layout.tsx.
 *
 * Call this anywhere the app needs a FULL refresh of org-driven config —
 * currently: the initial app boot (_layout.tsx) and the splash screen
 * (init_screens/splash.tsx), which now also runs this after logout so the
 * logo/theme/country codes are refreshed before the login screen shows,
 * instead of the login screen briefly showing stale/cleared values.
 *
 * @returns true if org config was fetched and applied, false otherwise
 * (including when a one-time web reload was triggered — see below).
 */
export async function fetchAndApplyOrgConfig(): Promise<boolean> {
  try {
    const res = await callSuggestusAPI(
      spd_processId_config.sgconf_get_mst_organization_by_org_patient_portal_url,
      {
        p_org_ai_code: SiteConfig.AI_CODE,
        p_org_patient_portal_url: SiteConfig.ACTION_URL,
      },
    );

    if (!(res?.returnCode === true && res?.returnData?.length > 0)) {
      console.warn(
        "[orgConfig] org config fetch failed or empty:",
        res?.message || res?.msg,
      );
      return false;
    }

    const final_org_data = res.returnData[0];

    // ── Basic org fields ──────────────────────────────────────────
    const org_ai_code = final_org_data?.org_ai_code;
    const org_profile_image = final_org_data?.org_profile_image;
    const org_name = final_org_data?.org_name;
    const org_website_url = final_org_data?.org_website;
    const org_id = final_org_data?.org_id;

    await setEncryptedID(SPD_ORG_LOGO, org_profile_image || null);
    await setEncryptedID(SPD_ORG_WEBSITE_URL, org_website_url || null);
    await setEncryptedID(SPD_AI_CODE, org_ai_code || null);
    await setEncryptedID("sg_org_name", org_name || null);

    // sg_org_id is the key read by createUserdata() in util_functions.js
    if (org_id) {
      await setEncryptedID(SPD_ORG_ID, org_id);
    }

    // ── Parse nested org detail JSON ──────────────────────────────
    let responseData: Record<string, any> = {};
    try {
      responseData =
        typeof final_org_data?.p_org_detail_json === "string"
          ? JSON.parse(final_org_data.p_org_detail_json)
          : final_org_data?.p_org_detail_json || {};
    } catch (parseError) {
      console.error("[orgConfig] Error parsing p_org_detail_json:", parseError);
      responseData = {};
    }

    // ── Signup / EULA config ──────────────────────────────────────
    const eulaConfig = responseData?.spd_signup_eula_config;
    await setEncryptedID(
      SPD_INITPAGE_STEPS,
      eulaConfig && eulaConfig.length !== 0 ? JSON.stringify(eulaConfig) : null,
    );

    // ── Language code ─────────────────────────────────────────────
    await setEncryptedID(
      SPD_ORG_LANGUAGE_CODE,
      responseData?.spd_theme_setting_config?.language || null,
    );

    // ── Color palette (theme-aware) ───────────────────────────────
    const colorPalette = {
      primary: responseData?.spd_theme_setting_config?.primary_color,
      secondary: responseData?.spd_theme_setting_config?.secondary_color,
      ui_border: responseData?.spd_theme_setting_config?.ui_border,
      ui_theme_base: responseData?.spd_theme_setting_config?.ui_theme_base,
    };

    if (responseData?.spd_theme_setting_config?.theme !== "DARK") {
      await setEncryptedID("color_palette", colorPalette);
    } else {
      await setEncryptedID("dark_color_palette", colorPalette);
    }

    // ── Apply backend-driven theme colors (safe no-op if missing) ──
    applyThemeColors(responseData?.spd_theme_setting_config);
    await setEncryptedID(
      SPD_THEME_SETTING_CONFIG,
      responseData?.spd_theme_setting_config || null,
    );

    // ── Web only: cache theme + reload once so already-imported ───
    // screens' StyleSheet.create() calls (baked with the OLD colors
    // before this fetch resolved) get rebuilt with the correct
    // backend theme from the very first paint. Guarded by a
    // sessionStorage flag so this can only reload once per tab
    // session, and only when the fetched theme actually changed.
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.localStorage &&
      responseData?.spd_theme_setting_config
    ) {
      try {
        const newThemeStr = JSON.stringify(responseData.spd_theme_setting_config);
        const prevThemeStr = window.localStorage.getItem(THEME_CACHE_KEY);
        window.localStorage.setItem(THEME_CACHE_KEY, newThemeStr);

        if (
          newThemeStr !== prevThemeStr &&
          !window.sessionStorage.getItem("sg_theme_reload_done")
        ) {
          window.sessionStorage.setItem("sg_theme_reload_done", "true");
          window.location.reload();
          return false; // page is reloading — nothing further to do here
        }
      } catch (themeCacheError) {
        console.error("[orgConfig] Error caching theme:", themeCacheError);
      }
    }

    // ── Allowed country codes for phone number inputs ──────────────
    await setEncryptedID(
      SPD_COUNTRY_CODES_FOR_PHONE,
      responseData?.spd_country_codes_for_phone || null,
    );

    // ── Terms & Conditions ────────────────────────────────────────
    await setEncryptedID(
      "TERM_CONDITION",
      final_org_data?.terms_conditions || null,
    );

    // ── Full org config JSON (used by login page config etc.) ─────
    await setEncryptedID("DEFAULT_JSON_DATA", responseData);

    return true;
  } catch (error) {
    console.error("[orgConfig] Error fetching org config:", error);
    return false;
  }
}
