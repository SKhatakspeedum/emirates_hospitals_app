// components/ThemeSwitcher.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../config/themeContext";
import { ThemeType } from "../config/themes";
import { Spacing } from "../config/spacing";
import { Typography } from "../config/typography";

interface ThemeSwitcherProps {
  onThemeChange?: (theme: ThemeType) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onThemeChange }) => {
  const { themeType, setTheme, availableThemes, theme } = useTheme();

  const handleThemeChange = async (newTheme: ThemeType) => {
    await setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  const getThemeLabel = (type: ThemeType): string => {
    const labels: Record<ThemeType, string> = {
      light: "Light",
      dark: "Dark",
      hospital: "Hospital Blue",
      wellness: "Wellness Green",
    };
    return labels[type];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Choose Theme
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themesContainer}
      >
        {availableThemes.map((themeName) => (
          <TouchableOpacity
            key={themeName}
            style={[
              styles.themeButton,
              {
                backgroundColor:
                  themeType === themeName
                    ? theme.colors.primary
                    : theme.colors.backgroundLight,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => handleThemeChange(themeName)}
          >
            <Text
              style={[
                styles.themeButtonText,
                {
                  color:
                    themeType === themeName
                      ? theme.colors.background
                      : theme.colors.text,
                },
              ]}
            >
              {getThemeLabel(themeName)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  title: {
    ...Typography.body_large,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  themesContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  themeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 2,
  },
  themeButtonText: {
    ...Typography.body_medium,
    fontWeight: "600",
  },
});

export default ThemeSwitcher;
