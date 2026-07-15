import { useState, useEffect } from "react";
import {
  SectionConfig,
  SectionKey,
  DEFAULT_SECTIONS,
  fetchSectionsFromBackend,
  getVisibleSections,
} from "../config/sectionConfig";
import suggestusClientConfig from "../config/suggestus_client_config";

interface UseDashboardSectionsReturn {
  sections: SectionConfig[];
  visibleSections: SectionKey[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook to manage dashboard sections with backend fallback
 *
 * Features:
 * - Fetches section config from backend on mount
 * - Automatically filters patient-required sections
 * - Maintains backward compatibility (uses defaults if backend fails)
 * - Provides refetch capability
 *
 * @param noPatient - Whether patient is selected (hides patient-required sections)
 * @param p_ai_code - Application code (default: "PATIENT_PORTAL")
 * @param p_menu_type - Menu type (default: "")
 * @returns Object with sections, visible sections, loading state, and refetch function
 *
 * @example
 * const { sections, visibleSections, isLoading } = useDashboardSections(noPatient);
 *
 * // Later: refetch sections
 * await refetch();
 */
export const useDashboardSections = (
  noPatient: boolean = false,
  p_ai_code?: string,
  p_menu_type: string = "",
): UseDashboardSectionsReturn => {
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedSections = await fetchSectionsFromBackend(
        p_ai_code,
        p_menu_type,
      );
      console.log("[useDashboardSections] Fetched sections:", fetchedSections);
      setSections(fetchedSections);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error(
        "[useDashboardSections] Error fetching dashboard sections:",
        error,
      );
      // Fallback to defaults on error
      setSections(DEFAULT_SECTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [p_ai_code, p_menu_type]);

  const visibleSections = getVisibleSections(sections, noPatient);

  return {
    sections,
    visibleSections,
    isLoading,
    refetch: fetchSections,
    error,
  };
};
