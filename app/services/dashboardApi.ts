import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import suggestusClientConfig from "../config/suggestus_client_config";

/**
 * Backend menu item from the details JSON array
 */
export interface BackendMenuItem {
  menu_id: number;
  menu_name: string;
  menu_action_screen_identifier: string; // Maps to widget_code
  menu_display_order: number; // Maps to sequence
  menu_action_screen_identifier_detail?: string;
  [key: string]: any;
}

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
  is_active: string; // "Y" or "N" (defaults to "Y")
  sequence: number;
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
        sgOrgId: orgId,
        p_menu_type: params.p_menu_type,
        p_process_flag: params.p_process_flag || "Y",
      },
    );

    console.log("[getMenuAppWidgets] API Response:", response);

    // Parse the actual response format
    if (response?.returnCode === true && Array.isArray(response.returnData)) {
      const menuResponse = response.returnData[0] as BackendMenuResponse;

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
        const normalized: BackendMenuWidget[] = detailsArray.map((item) => ({
          widget_code: item.menu_action_screen_identifier,
          widget_name: item.menu_name,
          is_active: "Y", // Default to active since backend doesn't provide this
          sequence: item.menu_display_order,
        }));

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
    p_ai_code: suggestusClientConfig?.SUGGESTUS_AI_CODE,
    p_menu_type: "",
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
    p_ai_code: suggestusClientConfig?.SUGGESTUS_AI_CODE,
    p_menu_type: menuType,
  });
};
