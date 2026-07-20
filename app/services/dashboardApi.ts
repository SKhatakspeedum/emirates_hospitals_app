import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import suggestusClientConfig from "../config/suggestus_client_config";

/**
 * Backend menu item from the details JSON array
 */
export interface BackendMenuItem {
  menu_id: number;
  menu_name: string; // The per-instance section title — maps to widget_title
  menu_title?: string; // Generic fallback title, only used if menu_name is blank
  menu_action_screen_identifier: string; // Maps to widget_code
  menu_display_order: number; // Maps to sequence
  menu_action_screen_identifier_detail?: string;
  // JSON string (or object) of extra per-widget config, e.g.
  // { "banner_urls": "url1~url2~url3" } for the promo banner carousel.
  menu_additional_attributes?: string | Record<string, any>;
  [key: string]: any;
}

/**
 * Parses menu_additional_attributes (a JSON string, a JS-object-literal
 * string with unquoted keys e.g. `{code: "x"}`, or an already-parsed
 * object/array) into a plain object/array. Returns {} on any
 * malformed/missing input.
 */
const parseAdditionalAttributes = (
  raw: string | Record<string, any> | undefined,
): Record<string, any> => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      // Backend sometimes sends JS-object-literal syntax instead of
      // strict JSON (bare identifier keys, e.g. `code: "x"` instead of
      // `"code": "x"`) — quote any bare key immediately after `{` or `,`
      // and retry. Already-quoted keys are left untouched.
      const repaired = raw.replace(
        /([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g,
        '$1"$2":',
      );
      return JSON.parse(repaired);
    } catch {
      return {};
    }
  }
};

/**
 * Splits a "~"-delimited banner_urls value into a clean array of URLs.
 * Defensive against common backend quirks: already-an-array values,
 * stray/encoded quote characters (e.g. a trailing "%22" or '"'), and
 * URI-encoded separators.
 */
export const parseBannerUrls = (bannerUrls: unknown): string[] => {
  if (Array.isArray(bannerUrls)) {
    return bannerUrls.map((url) => String(url).trim()).filter(Boolean);
  }
  if (typeof bannerUrls !== "string" || !bannerUrls.trim()) return [];

  let cleaned = bannerUrls.trim();
  // Strip a literal or URL-encoded trailing/leading double-quote artifact.
  cleaned = cleaned.replace(/^%22|%22$/g, "").replace(/^"|"$/g, "");
  try {
    // Only decode if it actually looks URI-encoded, to avoid corrupting
    // plain URLs that legitimately contain "%" (rare, but be safe).
    if (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
      cleaned = decodeURIComponent(cleaned);
    }
  } catch {
    // Malformed encoding — fall back to the un-decoded string
  }

  return cleaned
    .split("~")
    .map((url) => url.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
};

/**
 * Backend response wrapper for menu app widgets
 */
export interface BackendMenuResponse {
  menu_ai_code: string;
  menu_type: string;
  details: string; // JSON string containing menu items array
  [key: string]: any;
}

/**
 * Normalized widget interface for internal use
 */
export interface BackendMenuWidget {
  widget_code: string;
  widget_name: string;
  widget_title: string; // menu_title — displayed as the section header on screen
  is_active: string; // "Y" or "N" (defaults to "Y")
  sequence: number;
  additionalAttributes?: Record<string, any>;
  bannerUrls?: string[]; // Parsed from additionalAttributes.banner_urls
  // Parsed from additionalAttributes.process_id / default_params_json — lets the
  // backend override which API a widget calls and its static request params,
  // per widget occurrence.
  processId?: string;
  defaultParams?: Record<string, any>;
  // Unique per backend array entry (not per widget_code) so the same widget_code
  // can appear more than once and still render/fetch as independent instances.
  instanceId: string;
  menu_image?: string; // Icon data for rendering
  menu_image_type?: string; // Icon type: "icon", "img", "svg", "other"
  menu_default_params?: Record<string, any>; // Default params to pass to route
  [key: string]: any;
}

export interface MenuWidgetsResponse {
  returnCode: boolean;
  returnData: BackendMenuResponse[];
  [key: string]: any;
}

/**
 * Parameters for fetching menu app widgets
 */
export interface GetMenuAppWidgetsParams {
  p_ai_code: string;
  sgOrgId?: string;
  p_menu_type: string;
  p_process_flag?: string;
}

/**
 * Fetch menu app widgets configuration from backend
 *
 * API: hospapp_get_mst_menu_app_widgets_json_data_common
 *
 * @param params - Configuration parameters
 * @returns Promise with menu widgets data or null on error
 *
 * @example
 * const widgets = await getMenuAppWidgets({
 *   p_ai_code: "PATIENT_PORTAL",
 *   sgOrgId: "3",
 *   p_menu_type: "DASHBOARD"
 * });
 */
export const getMenuAppWidgets = async (
  params: GetMenuAppWidgetsParams,
): Promise<BackendMenuWidget[] | null> => {
  try {
    // Use provided orgId or fetch from localStorage
    let orgId = params.sgOrgId;
    if (!orgId) {
      orgId = (await fetchDataFromLocalStorage("sg_org_id")) ?? "3";
    }

    console.log("[getMenuAppWidgets] API Call params:", {
      p_ai_code: params.p_ai_code,
      sgOrgId: orgId,
      p_menu_type: params.p_menu_type,
    });

    const response = await callSuggestusAPI(
      spd_processId_config.hospapp_get_mst_menu_app_widgets_json_data_common,
      {
        p_ai_code: params.p_ai_code,
        // sgOrgId: orgId,
        p_menu_type: params.p_menu_type,
        p_process_flag: params.p_process_flag || "Y",
      },
    );

    console.log("[getMenuAppWidgets] API Response:", response);

    // Parse the actual response format
    if (response?.returnCode === true && Array.isArray(response.returnData)) {
      const menuResponse = response.returnData.find(
        (item: BackendMenuResponse) => item.menu_type === params.p_menu_type,
      ) as BackendMenuResponse | undefined;

      if (!menuResponse?.details) {
        console.warn("[getMenuAppWidgets] No details in response");
        return null;
      }

      try {
        // Parse the JSON details string
        const detailsArray: BackendMenuItem[] = JSON.parse(
          menuResponse.details,
        );

        console.log("[getMenuAppWidgets] Parsed details array:", detailsArray);

        if (!Array.isArray(detailsArray) || detailsArray.length === 0) {
          console.warn("[getMenuAppWidgets] Empty details array");
          return null;
        }

        // Use menu_display_order directly as the sequence — this is the
        // single source of truth for section order from the backend.
        // Sorting happens downstream (parseSectionsFromBackend / getVisibleSections)
        // using this value, so changing menu_display_order in the backend
        // directly reorders the Home Screen sections.
        const normalized: BackendMenuWidget[] = detailsArray.map(
          (item, index) => {
            // Tolerate a couple of likely field-name variants from the backend.
            const rawAttributes =
              item.menu_additional_attributes ??
              item.menu_additional_attribute ??
              item.additional_attributes;
            const additionalAttributes =
              parseAdditionalAttributes(rawAttributes);
            const bannerUrls = parseBannerUrls(
              additionalAttributes?.banner_urls ??
                additionalAttributes?.bannerUrls,
            );
            const processId =
              additionalAttributes?.process_id ??
              additionalAttributes?.processId;
            const rawDefaultParams =
              additionalAttributes?.default_params_json ??
              additionalAttributes?.defaultParams;
            const defaultParams =
              rawDefaultParams && typeof rawDefaultParams === "object"
                ? rawDefaultParams
                : undefined;

            if (item.menu_action_screen_identifier === "promoBanner") {
              console.log("[getMenuAppWidgets] promoBanner raw attributes:", {
                rawAttributes,
                additionalAttributes,
                bannerUrls,
              });
            }

            // Parse menu_default_params if present (JSON string or object)
            const menuDefaultParams = item.menu_default_params
              ? typeof item.menu_default_params === "string"
                ? JSON.parse(item.menu_default_params)
                : item.menu_default_params
              : undefined;

            return {
              id: String(item.menu_id),
              widget_code: item.menu_action_screen_identifier,
              widget_name: item.menu_name,
              widget_title: item.menu_name || item.menu_title || "",
              is_active: "Y", // Default to active since backend doesn't provide this
              sequence: item.menu_display_order,
              additionalAttributes,
              bannerUrls,
              processId,
              defaultParams,
              instanceId: `${item.menu_action_screen_identifier}__${item.menu_id ?? index}`,
              // Preserve image/icon fields for menu rendering
              menu_image: item.menu_image,
              menu_image_type: item.menu_image_type,
              // Preserve default params for navigation
              menu_default_params: menuDefaultParams,
            };
          },
        );

        console.log("[getMenuAppWidgets] Normalized widgets:", normalized);
        return normalized;
      } catch (parseError) {
        console.error(
          "[getMenuAppWidgets] Error parsing details JSON:",
          parseError,
        );
        return null;
      }
    }

    console.warn("[getMenuAppWidgets] Invalid response format:", response);
    // Return null if no valid data (will trigger fallback to defaults)
    return null;
  } catch (error) {
    console.error("Error fetching menu app widgets:", error);
    // Return null on error (will trigger fallback to defaults)
    return null;
  }
};

/**
 * Get home screen widgets configuration
 * Convenience function for common home screen widget fetch
 *
 * @returns Promise with widgets data or null on error
 */
export const getHomeScreenWidgets = async (): Promise<
  BackendMenuWidget[] | null
> => {
  return getMenuAppWidgets({
    p_ai_code:
      (await fetchDataFromLocalStorage("sg_AICODE")) ||
      suggestusClientConfig?.SUGGESTUS_AI_CODE,
    p_menu_type: "HomeScreen",
  });
};

/**
 * Get menu widgets for a specific page/screen
 *
 * @param menuType - Type of menu (e.g., "DASHBOARD", "PROFILE", "APPOINTMENTS")
 * @returns Promise with widgets data or null on error
 */
export const getMenuWidgetsByType = async (
  menuType: string,
): Promise<BackendMenuWidget[] | null> => {
  return getMenuAppWidgets({
    p_ai_code:
      (await fetchDataFromLocalStorage("sg_AICODE")) ||
      suggestusClientConfig?.SUGGESTUS_AI_CODE,
    p_menu_type: menuType,
  });
};
