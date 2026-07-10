# Theme System Guide

## Overview

The app now supports multiple themes that can be switched dynamically. Users can change the theme, and it will persist across app sessions.

## Available Themes

### 1. **Light Theme** (Default)
- Clean, professional appearance
- White background with dark text
- Best for daytime use
- Original emirates hospital branding

### 2. **Dark Theme**
- Eye-friendly dark interface
- Dark backgrounds with light text
- Best for low-light environments
- Reduced eye strain

### 3. **Hospital Blue Theme**
- Medical/Healthcare focused
- Professional medical blue colors
- Trust and security focused
- Ideal for healthcare settings

### 4. **Wellness Green Theme**
- Health and wellness focused
- Green accent colors (health symbol)
- Calming and positive
- Great for wellness features

## Setup

### Step 1: Wrap Your App with ThemeProvider

In your main app file (e.g., `app/_layout.tsx` or `app/index.tsx`):

```tsx
import { ThemeProvider } from "./config/themeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Your app content here */}
      <Stack />
    </ThemeProvider>
  );
}
```

### Step 2: Use Theme in Components

#### Option A: Using `useTheme` Hook (Recommended)

```tsx
import { useTheme } from "../config/themeContext";

export default function MyComponent() {
  const { theme, themeType, setTheme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Current theme: {themeType}
      </Text>
    </View>
  );
}
```

#### Option B: Using `useColors` Hook (Shorthand)

```tsx
import { useColors } from "../config/themeContext";

export default function MyComponent() {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Themed content</Text>
    </View>
  );
}
```

## Usage Examples

### Example 1: Dynamic Styled Component

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../config/themeContext";
import { Typography } from "../config/typography";
import { Spacing } from "../config/spacing";

const Card = () => {
  const colors = useColors();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      padding: Spacing.lg,
      borderRadius: 8,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    description: {
      ...Typography.body_medium,
      color: colors.textLabel,
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Card Title</Text>
      <Text style={styles.description}>Card description text</Text>
    </View>
  );
};

export default Card;
```

### Example 2: Theme Switcher Component

```tsx
import React from "react";
import { View, ScrollView } from "react-native";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../config/themeContext";

export default function SettingsScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      <ThemeSwitcher
        onThemeChange={(newTheme) => {
          console.log("Theme changed to:", newTheme);
        }}
      />
    </ScrollView>
  );
}
```

### Example 3: Conditional Colors

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../config/themeContext";

const ThemedButton = ({ status }: { status: "success" | "error" | "warning" }) => {
  const { theme } = useTheme();

  const getColor = () => {
    switch (status) {
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.error;
      case "warning":
        return theme.colors.warning;
    }
  };

  return (
    <View style={[styles.button, { backgroundColor: getColor() }]}>
      <Text style={{ color: theme.colors.background }}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default ThemedButton;
```

## Changing Theme Programmatically

### From Components

```tsx
import { useTheme } from "../config/themeContext";

const SettingsScreen = () => {
  const { setTheme, themeType } = useTheme();

  return (
    <Button
      title="Switch to Dark Mode"
      onPress={() => setTheme("dark")}
    />
  );
};
```

### From Settings/Preferences

```tsx
const handleThemeSelection = async (selectedTheme: ThemeType) => {
  const { setTheme } = useTheme();
  await setTheme(selectedTheme);
  // Theme will persist and be loaded on next app launch
};
```

## Adding New Theme

### Step 1: Create Theme in `themes.ts`

```tsx
export const CustomTheme: Theme = {
  name: "custom",
  colors: {
    primary: "#YOUR_COLOR",
    secondary: "#YOUR_COLOR",
    background: "#FFFFFF",
    // ... all other colors
  },
};
```

### Step 2: Add to THEMES Object

```tsx
export const THEMES = {
  light: LightTheme,
  dark: DarkTheme,
  hospital: HospitalTheme,
  wellness: WellnessTheme,
  custom: CustomTheme,  // Add here
};
```

### Step 3: Update ThemeType

```tsx
export type ThemeType = "light" | "dark" | "hospital" | "wellness" | "custom";
```

## Color Reference by Theme

### Light Theme (Default)
```
Primary: #001871 (Dark Blue)
Text: #262626 (Dark Gray)
Background: #FFFFFF (White)
```

### Dark Theme
```
Primary: #4F8EF7 (Light Blue)
Text: #FFFFFF (White)
Background: #121212 (Dark)
```

### Hospital Theme
```
Primary: #0052CC (Hospital Blue)
Text: #1A1A2E (Dark)
Background: #FFFFFF (White)
```

### Wellness Theme
```
Primary: #059669 (Health Green)
Text: #1F2937 (Dark)
Background: #FFFFFF (White)
```

## Best Practices

1. **Always use `useTheme()` or `useColors()` in dynamic components**
   ```tsx
   // ✅ Good
   const colors = useColors();
   backgroundColor: colors.primary
   
   // ❌ Bad
   backgroundColor: "#001871"  // Hardcoded
   ```

2. **Use theme colors for interactive states**
   ```tsx
   {
     backgroundColor: isPressed ? colors.pressed : colors.primary,
     borderColor: isFocused ? colors.activeBorder : colors.border,
   }
   ```

3. **Consider contrast in all themes**
   - Test that text is readable on all background colors
   - Use `textLabel` or `textLight` for secondary text
   - Use `text` for primary content

4. **Persist user preference**
   - Theme is automatically saved to AsyncStorage
   - It loads on app startup
   - No extra configuration needed

5. **Update only colors, not layouts**
   - Theme changes should only affect colors
   - Keep spacing and sizing consistent across themes

## Troubleshooting

### Theme not persisting
- Make sure ThemeProvider wraps your entire app
- Check that AsyncStorage is properly configured

### Colors not updating
- Ensure you're using `useTheme()` or `useColors()` hook
- StyleSheet.create() runs once, use inline styles for dynamic colors

### Can't find useTheme
- Import from: `import { useTheme } from "../config/themeContext";`
- Make sure app is wrapped with `<ThemeProvider>`

## File Structure

```
app/
├── config/
│   ├── colors.ts              (Original - keep for reference)
│   ├── themes.ts              (New - all theme definitions)
│   ├── themeContext.tsx       (New - theme provider)
│   └── THEME_GUIDE.md         (This file)
├── components/
│   └── ThemeSwitcher.tsx      (New - theme switcher UI)
└── _layout.tsx                (Update with ThemeProvider)
```

## Migration from Static Colors

### Before (Static)
```tsx
import { Colors } from "../config/colors";

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
  },
});
```

### After (Dynamic)
```tsx
import { useColors } from "../config/themeContext";

const MyComponent = () => {
  const colors = useColors();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.primary,
    },
  });

  return <View style={styles.container} />;
};
```

---

**For detailed styling info, see [STYLING_GUIDE.md](STYLING_GUIDE.md)**
