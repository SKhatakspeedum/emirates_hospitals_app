// config/themes.ts
// Theme definitions for easy switching between different color schemes

export type ThemeType = "light" | "dark" | "custom";

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    backgroundDark: string;
    backgroundLight: string;
    backgroundOverlay: string;
    backgroundOverlayLight: string;
    backgroundOverlayVeryLight: string;
    backgroundSheetLight: string;
    backgroundPurpleLight: string;
    text: string;
    textDark: string;
    textLight: string;
    textError: string;
    label: string;
    textLabel: string;
    border: string;
    borderAccent: string;
    borderDark: string;
    inactive: string;
    active: string;
    pressed: string;
    activeBorder: string;
    success: string;
    warning: string;
    error: string;
    purple: string;
    lightgray: string;
    gray: string;
    grayDark: string;
    shadow: string;
    shadowMedium: string;
  };
}

// Light Theme (Default)
export const LightTheme: Theme = {
  name: "light",
  colors: {
    primary: "#001871",
    secondary: "#0177C8",
    background: "#FFFFFF",
    backgroundDark: "#2c3a4c",
    backgroundLight: "#FAFAFF",
    backgroundOverlay: "rgba(0, 0, 0, 0.4)",
    backgroundOverlayLight: "rgba(35, 39, 82, 0.8)",
    backgroundOverlayVeryLight: "rgba(243, 238, 255, 0.9)",
    backgroundSheetLight: "#CDF0FB",
    backgroundPurpleLight: "#3E3A6E",
    text: "#262626",
    textDark: "#d2d2d2",
    textLight: "#898D9E",
    textError: "#d32f2f",
    label: "#262626CC",
    textLabel: "#898D9E",
    border: "#cbccd1ff",
    borderAccent: "#FFC42E",
    borderDark: "#333333",
    inactive: "#D0D4DF",
    active: "#0ea5e9",
    pressed: "#e0f2fe",
    activeBorder: "#0ea5e9",
    success: "#4caf50",
    warning: "#ff9800",
    error: "#f44336",
    purple: "#7D5FFF",
    lightgray: "#FAFAFF",
    gray: "#5A5A5A",
    grayDark: "#5A5A5A80",
    shadow: "rgba(0,0,0,0.6)",
    shadowMedium: "rgba(0,0,0,0.5)",
  },
};

// Dark Theme
export const DarkTheme: Theme = {
  name: "dark",
  colors: {
    primary: "#4F8EF7",      // Lighter blue for dark background
    secondary: "#66B3FF",    // Brighter secondary
    background: "#121212",   // Dark background
    backgroundDark: "#1a1a1a",
    backgroundLight: "#2d2d2d",
    backgroundOverlay: "rgba(255, 255, 255, 0.1)",
    backgroundOverlayLight: "rgba(79, 142, 247, 0.2)",
    backgroundOverlayVeryLight: "rgba(79, 142, 247, 0.1)",
    backgroundSheetLight: "#1F4A5C",
    backgroundPurpleLight: "#2A2440",
    text: "#FFFFFF",         // White text
    textDark: "#E0E0E0",
    textLight: "#A0A0B0",
    textError: "#FF6B6B",
    label: "#FFFFFFCC",
    textLabel: "#A0A0B0",
    border: "#3a3a3f",
    borderAccent: "#FFD700",
    borderDark: "#CCCCCC",
    inactive: "#4A4A5E",
    active: "#66B3FF",
    pressed: "#1a3a52",
    activeBorder: "#66B3FF",
    success: "#66BB6A",
    warning: "#FFA726",
    error: "#EF5350",
    purple: "#9D7FFF",
    lightgray: "#2d2d2d",
    gray: "#A0A0B0",
    grayDark: "#5A5A7080",
    shadow: "rgba(0,0,0,0.8)",
    shadowMedium: "rgba(0,0,0,0.7)",
  },
};

// Hospital (Blue) Theme
export const HospitalTheme: Theme = {
  name: "hospital",
  colors: {
    primary: "#0052CC",      // Hospital blue
    secondary: "#0099FF",    // Medical blue
    background: "#FFFFFF",
    backgroundDark: "#003D99",
    backgroundLight: "#F0F4FF",
    backgroundOverlay: "rgba(0, 82, 204, 0.15)",
    backgroundOverlayLight: "rgba(0, 82, 204, 0.1)",
    backgroundOverlayVeryLight: "rgba(240, 244, 255, 0.95)",
    backgroundSheetLight: "#E6F0FF",
    backgroundPurpleLight: "#1A3A66",
    text: "#1A1A2E",
    textDark: "#FFFFFF",
    textLight: "#667085",
    textError: "#DC2626",
    label: "#1A1A2ECC",
    textLabel: "#667085",
    border: "#D0D5E0",
    borderAccent: "#0099FF",
    borderDark: "#000000",
    inactive: "#B0B5C0",
    active: "#0099FF",
    pressed: "#E6F0FF",
    activeBorder: "#0099FF",
    success: "#059669",
    warning: "#F59E0B",
    error: "#DC2626",
    purple: "#6366F1",
    lightgray: "#F9FAFB",
    gray: "#6B7280",
    grayDark: "#6B728080",
    shadow: "rgba(0, 82, 204, 0.1)",
    shadowMedium: "rgba(0, 82, 204, 0.08)",
  },
};

// Green (Health/Wellness) Theme
export const WellnessTheme: Theme = {
  name: "wellness",
  colors: {
    primary: "#059669",      // Green for wellness
    secondary: "#10B981",    // Brighter green
    background: "#FFFFFF",
    backgroundDark: "#065F46",
    backgroundLight: "#F0FDF4",
    backgroundOverlay: "rgba(5, 150, 105, 0.15)",
    backgroundOverlayLight: "rgba(5, 150, 105, 0.1)",
    backgroundOverlayVeryLight: "rgba(240, 253, 244, 0.95)",
    backgroundSheetLight: "#DBEAFE",
    backgroundPurpleLight: "#164E63",
    text: "#1F2937",
    textDark: "#FFFFFF",
    textLight: "#6B7280",
    textError: "#DC2626",
    label: "#1F2937CC",
    textLabel: "#6B7280",
    border: "#D1FAE5",
    borderAccent: "#10B981",
    borderDark: "#000000",
    inactive: "#D1D5DB",
    active: "#10B981",
    pressed: "#D1FAE5",
    activeBorder: "#10B981",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#DC2626",
    purple: "#8B5CF6",
    lightgray: "#F9FAFB",
    gray: "#6B7280",
    grayDark: "#6B728080",
    shadow: "rgba(5, 150, 105, 0.1)",
    shadowMedium: "rgba(5, 150, 105, 0.08)",
  },
};

// All available themes
export const THEMES = {
  light: LightTheme,
  dark: DarkTheme,
  hospital: HospitalTheme,
  wellness: WellnessTheme,
};

// Default theme
export const DEFAULT_THEME: ThemeType = "dark";
