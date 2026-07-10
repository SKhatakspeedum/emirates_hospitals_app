# Styling and Configuration Guide

This document explains how to use the centralized configuration files for colors, fonts, typography, spacing, and labels throughout the Emirates Hospital app.

## Overview

All styling, typography, spacing, and messages must be defined in the `config` folder and referenced from there. This ensures consistency across the application and makes it easy to update the design system globally.

## Configuration Files

### 1. **colors.ts** - Color Palette

Define all colors used in the application.

**Usage:**
```tsx
import { Colors } from "../config/colors";

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  text: {
    color: Colors.text,
  },
  errorText: {
    color: Colors.error,
  },
  overlay: {
    backgroundColor: Colors.backgroundOverlay,
  },
});
```

**Available Colors:**
- **Primary:** `primary`, `secondary`
- **Backgrounds:** `background`, `backgroundDark`, `backgroundLight`, `backgroundOverlay`, etc.
- **Text:** `text`, `textDark`, `textLight`, `textError`
- **Borders:** `border`, `borderAccent`, `borderDark`
- **Status:** `success`, `warning`, `error`, `active`, `inactive`
- **Special:** `purple`, `gray`, `shadow`, `shadowMedium`

### 2. **typography.ts** - Font Styles

Pre-defined typography styles and font size constants.

**Usage with preset styles:**
```tsx
import { Typography, FontSizes, FontWeights } from "../config/typography";

const styles = StyleSheet.create({
  heading: Typography.h1,
  subheading: Typography.h3,
  bodyText: Typography.body_large,
  caption: Typography.caption,
});
```

**Usage with individual constants:**
```tsx
import { FontSizes, FontWeights } from "../config/typography";

const styles = StyleSheet.create({
  customText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
});
```

**Available Typography Presets:**
- **Headings:** `h1`, `h2`, `h3`, `h4`
- **Body Text:** `body_large`, `body_medium`, `body_small`
- **Regular Text:** `regular_large`, `regular_medium`, `regular_small`
- **Labels:** `label_large`, `label_medium`
- **Caption:** `caption`

**FontSizes:** `xs` (10), `sm` (12), `base` (14), `lg` (16), `xl` (18), `2xl` (20), `3xl` (24), `4xl` (28)

**FontWeights:** `light`, `normal`, `medium`, `semibold`, `bold`

### 3. **spacing.ts** - Layout Spacing

Standardized spacing scale for padding, margin, and gaps.

**Usage:**
```tsx
import { Spacing, PaddingSizes, MarginSizes, BorderRadius } from "../config/spacing";

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,           // 16px
    marginBottom: MarginSizes.normal,
  },
  innerContent: {
    paddingHorizontal: Spacing.md, // 12px
    paddingVertical: Spacing.sm,   // 8px
  },
  roundedBox: {
    borderRadius: BorderRadius.md, // 8px
  },
});
```

**Available Spacing Values:**
- **Base:** `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (20), `2xl` (24), `3xl` (32), `4xl` (40)
- **Padding:** `tight`, `small`, `normal`, `medium`, `large`, `extraLarge`
- **Margin:** `tight`, `small`, `normal`, `medium`, `large`, `extraLarge`
- **Gap:** `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- **BorderRadius:** `none`, `sm` (4), `md` (8), `lg` (12), `xl` (16), `full` (9999)

### 4. **fonts.ts** - Font Families

Manages font assets and font family references.

**Usage:**
```tsx
import { Fonts, FontFamilies } from "../config/fonts";

const styles = StyleSheet.create({
  boldText: {
    fontFamily: FontFamilies.bold,
  },
  regularText: {
    fontFamily: FontFamilies.regular,
  },
});
```

**Available Font Families:** `bold`, `semiBold`, `medium`, `regular`, `light`

### 5. **labels.ts** - Text Messages

All user-facing text strings and messages.

**Usage:**
```tsx
import { Labels } from "../config/labels";

const LoginScreen = () => {
  return (
    <View>
      <Text>{Labels.welcome}</Text>
      <TextInput placeholder={Labels.emailPlaceholder} />
      <TouchableOpacity>
        <Text>{Labels.login}</Text>
      </TouchableOpacity>
      <Text>{Labels.dontHaveAccount}</Text>
      <TouchableOpacity>
        <Text>{Labels.signup}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Categories:**
- **Basic:** `appName`, `loading`, `error`, `success`, `cancel`, `save`, `continue`, etc.
- **Authentication:** `email`, `password`, `forgotPassword`, `login`, `signup`, etc.
- **Validation:** `fieldRequired`, `invalidEmail`, `passwordMismatch`, etc.
- **Error Messages:** `errorOccurred`, `networkError`, `serverError`, etc.
- **Confirmations:** `areYouSure`, `confirmDelete`, `confirmLogout`, etc.

## Best Practices

1. **Never hardcode colors, fonts, sizes, spacing, or messages** in component files
2. **Always import from config** - Makes it easy to update design system globally
3. **Use preset typography styles** when possible - E.g., `Typography.h1` instead of combining individual properties
4. **Maintain consistency** - Check existing config values before adding new ones
5. **Add new values to config** - If you need a new color, size, or message, add it to the appropriate config file first
6. **Update related files** - If a design change affects multiple config files, update all of them

## Example: Complete Styled Component

```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../config/colors";
import { Typography, FontSizes } from "../config/typography";
import { Spacing, BorderRadius } from "../config/spacing";
import { Labels } from "../config/labels";

const LoginButton = () => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      marginVertical: Spacing.md,
    },
    text: {
      ...Typography.body_large,
      color: Colors.background,
      textAlign: "center",
    },
  });

  return (
    <TouchableOpacity style={styles.container}>
      <Text style={styles.text}>{Labels.login}</Text>
    </TouchableOpacity>
  );
};

export default LoginButton;
```

## Adding New Config Values

### Adding a New Color:
1. Open `app/config/colors.ts`
2. Add your color to the appropriate category
3. Use a descriptive name (e.g., `buttonHover`, `statusActive`)

### Adding a New Typography Style:
1. Open `app/config/typography.ts`
2. Add a new property to the `Typography` object
3. Include `fontSize`, `fontWeight`, `fontFamily`, and `lineHeight`

### Adding New Spacing:
1. Open `app/config/spacing.ts`
2. Add to the appropriate spacing object
3. Use the spacing scale (multiples of 4px)

### Adding a New Label:
1. Open `app/config/labels.ts`
2. Add to the appropriate category
3. Use a descriptive camelCase key

## Migration Guide

If you find hardcoded values in existing code:

```tsx
// ❌ Before (hardcoded)
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#001871",
    paddingHorizontal: 16,
    borderColor: "#cbccd1ff",
  },
  text: {
    color: "#262626",
    fontSize: 16,
    fontFamily: "QuicksandMedium",
  },
});

// ✅ After (using config)
import { Colors } from "../config/colors";
import { Typography } from "../config/typography";
import { Spacing } from "../config/spacing";

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    borderColor: Colors.border,
  },
  text: {
    ...Typography.body_large,
    color: Colors.text,
  },
});
```

---

For more information or to add additional config categories, contact the development team.
