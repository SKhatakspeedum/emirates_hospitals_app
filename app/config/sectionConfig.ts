import { BackendMenuWidget, getMenuAppWidgets } from "../services/dashboardApi";
import suggestusClientConfig from "./suggestus_client_config";

export type SectionKey =
  | "greeting"
  | "promoBanner"
  | "quickActions"
  | "upcomingAppointments"
  | "healthAwareness"
  | "healthSummary"
  | "providers"
  | "specialties";

export interface SectionConfig {
  key: SectionKey;
  label: string;
  visible: boolean;
  order: number;
  description: string;
  requiresPatient?: boolean;
  bannerUrls?: string[]; // promoBanner only — backend-driven carousel images
}

// Mapping of backend widget codes to frontend SectionKeys
// Backend returns camelCase identifiers in menu_action_screen_identifier field
const WIDGET_CODE_MAP: { [key: string]: SectionKey } = {
  greeting: "greeting",
  promoBanner: "promoBanner",
  quickActions: "quickActions",
  upcomingAppointments: "upcomingAppointments",
  healthAwareness: "healthAwareness",
  healthSummary: "healthSummary",
  providers: "providers",
  specialties: "specialties",
};

export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    key: "greeting",
    label: "Greeting",
    visible: true,
    order: 1,
    description: "Welcome message and user greeting",
  },
  {
    key: "promoBanner",
    label: "Promo Banner",
    visible: true,
    order: 2,
    description: "Promotional offers and discounts",
  },
  {
    key: "quickActions",
    label: "Quick Actions",
    visible: true,
    order: 3,
    description: "4 quick action buttons (Appointments, Health, Orders, Rx)",
  },
  {
    key: "upcomingAppointments",
    label: "Upcoming Appointments",
    visible: true,
    order: 4,
    description: "List of upcoming appointments",
    requiresPatient: true,
  },
  {
    key: "healthAwareness",
    label: "Health Awareness",
    visible: true,
    order: 5,
    description: "Educational videos and health content",
  },
  {
    key: "healthSummary",
    label: "My Health Summary",
    visible: true,
    order: 6,
    description: "Health metrics and vitals summary",
    requiresPatient: true,
  },
  {
    key: "providers",
    label: "Providers",
    visible: true,
    order: 7,
    description: "Featured doctors and specialists",
  },
  {
    key: "specialties",
    label: "Specialties",
    visible: true,
    order: 8,
    description: "Medical specialties and departments",
  },
];

/**
 * Convert backend response to SectionConfig[]
 * @param backendSections - Sections from backend API
 * @returns Converted section configurations
 */
export const parseSectionsFromBackend = (
  backendSections: BackendMenuWidget[],
): SectionConfig[] => {
  return backendSections
    .map((item): SectionConfig | null => {
      const sectionKey = WIDGET_CODE_MAP[item.widget_code];
      if (!sectionKey) return null;

      const defaultSection = DEFAULT_SECTIONS.find((s) => s.key === sectionKey);
      if (!defaultSection) return null;

      return {
        ...defaultSection,
        visible: item.is_active === "Y",
        order: item.sequence || defaultSection.order,
        bannerUrls:
          sectionKey === "promoBanner" && item.bannerUrls?.length
            ? item.bannerUrls
            : undefined,
      };
    })
    .filter((s): s is SectionConfig => s !== null)
    .sort((a, b) => a.order - b.order);
};

/**
 * Fetch section configuration from backend
 * Falls back to DEFAULT_SECTIONS if backend fails or returns no data
 *
 * @param p_ai_code - Application code
 * @param p_menu_type - Menu type
 * @returns Sections configuration (always returns at least defaults)
 */
export const fetchSectionsFromBackend = async (
  p_ai_code: string = suggestusClientConfig.SUGGESTUS_AI_CODE,
  p_menu_type: string = "",
): Promise<SectionConfig[]> => {
  try {
    console.log("[fetchSectionsFromBackend] Fetching with params:", {
      p_ai_code,
      p_menu_type,
    });

    const backendSections = await getMenuAppWidgets({
      p_ai_code,
      p_menu_type,
    });

    console.log("[fetchSectionsFromBackend] Raw backend sections:", backendSections);

    // If backend returns valid data, use it
    if (backendSections && backendSections.length > 0) {
      const parsed = parseSectionsFromBackend(backendSections);
      console.log("[fetchSectionsFromBackend] Parsed sections:", parsed);
      return parsed;
    }

    console.log("[fetchSectionsFromBackend] No backend data, using defaults");
    // Fallback to defaults if no backend data
    return DEFAULT_SECTIONS;
  } catch (error) {
    console.error("[fetchSectionsFromBackend] Error:", error);
    // Always fallback to defaults on error
    return DEFAULT_SECTIONS;
  }
};

/**
 * Get visible sections sorted by order
 * Filters based on visibility and patient requirement
 *
 * @param sections - Section configurations
 * @param noPatient - Whether patient is selected
 * @returns Array of visible section keys
 */
export const getVisibleSections = (
  sections: SectionConfig[] = DEFAULT_SECTIONS,
  noPatient: boolean = false,
): SectionKey[] => {
  return sections
    .filter((section) => {
      if (!section.visible) return false;
      if (section.requiresPatient && noPatient) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order)
    .map((section) => section.key);
};

/**
 * Update section visibility
 * @param sections - Current sections
 * @param key - Section key to update
 * @param visible - New visibility state
 * @returns Updated sections
 */
export const updateSectionVisibility = (
  sections: SectionConfig[],
  key: SectionKey,
  visible: boolean,
): SectionConfig[] => {
  return sections.map((section) =>
    section.key === key ? { ...section, visible } : section,
  );
};

/**
 * Reorder sections
 * @param sections - Current sections
 * @param fromIndex - Source position
 * @param toIndex - Destination position
 * @returns Reordered sections with updated order numbers
 */
export const reorderSections = (
  sections: SectionConfig[],
  fromIndex: number,
  toIndex: number,
): SectionConfig[] => {
  const newSections = [...sections];
  const [movedSection] = newSections.splice(fromIndex, 1);
  newSections.splice(toIndex, 0, movedSection);

  return newSections.map((section, index) => ({
    ...section,
    order: index + 1,
  }));
};
