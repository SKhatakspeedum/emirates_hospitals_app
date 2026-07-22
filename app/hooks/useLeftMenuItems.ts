import { useState, useEffect } from "react";
import { getMenuAppWidgets, BackendMenuWidget } from "../services/dashboardApi";
import suggestusClientConfig from "../config/suggestus_client_config";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";

export interface DrawerMenuItem extends BackendMenuWidget {
  screen: string; // Route path/screen name
  menu_image?: string;
  menu_image_type?: string;
  icon_name?: string;
  icon_type?: string;
  routeParams?: Record<string, any>; // Navigation params (default + process_id)
}

interface UseLeftMenuItemsReturn {
  items: DrawerMenuItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const ICON_SCREEN_MAP: Record<string, string> = {
  providers: "NearbyProviders",
  orders: "OrderScreen",
  medicines: "MedicinesScreen",
  healthPackages: "HealthPackages",
  speciality: "Speciality",
  AllSpecialtiesScreen: "Speciality",
  settings: "Settings",
};

/**
 * Hook to fetch and manage left menu/drawer items from backend
 *
 * @param p_ai_code - Application identifier code
 * @returns Object with menu items, loading state, error, and refetch function
 *
 * @example
 * const { items, isLoading, error, refetch } = useLeftMenuItems();
 * items.forEach(item => console.log(item.widget_name, item.screen));
 */
export const useLeftMenuItems = (
  p_ai_code?: string,
): UseLeftMenuItemsReturn => {
  const [items, setItems] = useState<DrawerMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedAiCode =
        p_ai_code ||
        (await fetchDataFromLocalStorage("sg_AICODE")) ||
        suggestusClientConfig.SUGGESTUS_AI_CODE;

      console.log(
        "[useLeftMenuItems] Fetching LeftMenu with p_ai_code:",
        resolvedAiCode,
      );

      const backendWidgets = await getMenuAppWidgets({
        p_ai_code: resolvedAiCode,
        p_menu_type: "LeftMenu",
      });

      console.log("[useLeftMenuItems] Received widgets:", backendWidgets);

      if (!backendWidgets || backendWidgets.length === 0) {
        console.warn("[useLeftMenuItems] No left menu items from backend");
        setItems([]);
        return;
      }

      const menuItems: DrawerMenuItem[] = backendWidgets
        .map((widget: any) => {
          // Build route params: start with default params, add process_id if present
          const routeParams: Record<string, any> = {
            ...(widget.menu_default_params || {}),
          };

          // Extract process_id from menu_additional_attributes if present
          if (widget.additionalAttributes?.process_id) {
            routeParams.process_id = widget.additionalAttributes.process_id;
          }

          console.log("[useLeftMenuItems] Menu item:", {
            name: widget.widget_name,
            imageType: widget.menu_image_type,
            image: widget.menu_image,
            code: widget.widget_code,
          });

          return {
            ...widget,
            screen: ICON_SCREEN_MAP[widget.widget_code] || widget.widget_code,
            menu_image: widget.menu_image,
            menu_image_type: widget.menu_image_type,
            routeParams:
              Object.keys(routeParams).length > 0 ? routeParams : undefined,
          };
        })
        .sort((a, b) => {
          const seqA = parseInt(String(a.sequence || "999"), 10);
          const seqB = parseInt(String(b.sequence || "999"), 10);
          return seqA - seqB;
        });

      setItems(menuItems);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[useLeftMenuItems] Error fetching menu items:", error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [p_ai_code]);

  return {
    items,
    isLoading,
    error,
    refetch: fetchMenuItems,
  };
};
