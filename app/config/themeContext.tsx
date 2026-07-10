// config/themeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeType, THEMES, DEFAULT_THEME, Theme } from "./themes";

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (themeType: ThemeType) => Promise<void>;
  availableThemes: ThemeType[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "app_theme";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from storage on app start
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in THEMES) {
        setThemeType(savedTheme as ThemeType);
      }
    } catch (error) {
      console.warn("Failed to load theme from storage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newThemeType: ThemeType) => {
    try {
      setThemeType(newThemeType);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeType);
    } catch (error) {
      console.warn("Failed to save theme to storage:", error);
    }
  };

  if (isLoading) {
    return null; // Or return a splash screen
  }

  const value: ThemeContextType = {
    theme: THEMES[themeType],
    themeType,
    setTheme,
    availableThemes: Object.keys(THEMES) as ThemeType[],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook to use theme in components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Helper to get current colors
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};
