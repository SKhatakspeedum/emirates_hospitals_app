// config/spacing.ts
// Standardized spacing scale for padding, margin, gap, etc.

export const Spacing = {
  // Base unit is 4px
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 12,     // 12px
  lg: 16,     // 16px
  xl: 20,     // 20px
  "2xl": 24,  // 24px
  "3xl": 32,  // 32px
  "4xl": 40,  // 40px
};

// Common spacing combinations for padding and margin
export const PaddingSizes = {
  none: 0,
  tight: Spacing.xs,          // 4px
  small: Spacing.sm,          // 8px
  normal: Spacing.lg,         // 16px
  medium: Spacing.xl,         // 20px
  large: Spacing["2xl"],      // 24px
  extraLarge: Spacing["3xl"], // 32px
};

export const MarginSizes = {
  none: 0,
  tight: Spacing.xs,          // 4px
  small: Spacing.sm,          // 8px
  normal: Spacing.lg,         // 16px
  medium: Spacing.xl,         // 20px
  large: Spacing["2xl"],      // 24px
  extraLarge: Spacing["3xl"], // 32px
};

// Gap sizes for flexbox
export const GapSizes = {
  none: 0,
  xs: Spacing.xs,             // 4px
  sm: Spacing.sm,             // 8px
  md: Spacing.md,             // 12px
  lg: Spacing.lg,             // 16px
  xl: Spacing.xl,             // 20px
  "2xl": Spacing["2xl"],      // 24px
};

// Border radius constants
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
