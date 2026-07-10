# Theme Integration Setup

## Quick Start

### Step 1: Update Your Root Layout

Update `app/_layout.tsx` or your root layout file:

```tsx
import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "./config/themeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Your routes here */}
      </Stack>
    </ThemeProvider>
  );
}
```

### Step 2: Update Components to Use Theme

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../config/themeContext";

export default function MyScreen() {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
}
```

### Step 3: Add Theme Switcher (Optional)

Add this to your settings screen:

```tsx
import React from "react";
import { View, ScrollView } from "react-native";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useColors } from "../config/themeContext";

export default function SettingsScreen() {
  const colors = useColors();

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <ThemeSwitcher />
    </ScrollView>
  );
}
```

---

## Available Themes

| Theme | Type | Best For |
|-------|------|----------|
| **Light** (Default) | Light mode | Daytime, professional |
| **Dark** | Dark mode | Low-light environments |
| **Hospital** | Medical blue | Healthcare settings |
| **Wellness** | Green | Health & wellness features |

---

## All New Files Created

```
app/
├── config/
│   ├── themes.ts                    ✨ New: Theme definitions
│   ├── themeContext.tsx             ✨ New: Theme provider & hooks
│   ├── THEME_GUIDE.md               ✨ New: Comprehensive guide
│   ├── STYLING_GUIDE.md             ✅ Updated: Style standards
│   ├── QUICK_REFERENCE.md           ✅ Updated: Quick lookup
│   ├── colors.ts                    ✅ Enhanced: 30+ colors
│   ├── typography.ts                ✅ New: Typography styles
│   ├── spacing.ts                   ✅ New: Spacing scale
│   ├── fonts.ts                     ✅ Existing: Font families
│   └── labels.ts                    ✅ Enhanced: 40+ messages
│
├── components/
│   └── ThemeSwitcher.tsx            ✨ New: Theme switcher UI
│
└── _layout.tsx                       ⚠️  Need to update: Add ThemeProvider
```

---

## Key Advantages

✅ **Dynamic Theming** - Change entire app appearance instantly
✅ **Persistent** - Theme choice saved across app sessions  
✅ **Easy** - Just use `useColors()` in any component
✅ **Scalable** - Add new themes anytime
✅ **Accessible** - Support for dark mode reduces eye strain
✅ **Professional** - Multiple themes for different branding needs

---

## Usage Pattern

```tsx
// 1. Import the hook
import { useColors } from "../config/themeContext";

// 2. Use in component
const MyComponent = () => {
  const colors = useColors();
  
  // 3. Apply to styles
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Content</Text>
    </View>
  );
};
```

---

## That's It! 🎉

Now your app supports:
- ✅ Light theme (default)
- ✅ Dark theme
- ✅ Hospital blue theme
- ✅ Wellness green theme
- ✅ Easy theme switching
- ✅ Persistent theme preference
- ✅ Completely centralized colors

See [app/config/THEME_GUIDE.md](app/config/THEME_GUIDE.md) for detailed examples and advanced usage.
