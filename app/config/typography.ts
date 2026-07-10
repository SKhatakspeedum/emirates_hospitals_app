// config/typography.ts
import { FontFamilies } from "./fonts";

export const Typography = {
  // Heading styles
  h1: {
    fontSize: 28,
    fontWeight: "bold" as const,
    fontFamily: FontFamilies.bold,
    lineHeight: 32,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold" as const,
    fontFamily: FontFamilies.bold,
    lineHeight: 28,
  },
  h3: {
    fontSize: 20,
    fontWeight: "bold" as const,
    fontFamily: FontFamilies.semiBold,
    lineHeight: 24,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    fontFamily: FontFamilies.semiBold,
    lineHeight: 22,
  },

  // Body text styles
  body_large: {
    fontSize: 16,
    fontWeight: "500" as const,
    fontFamily: FontFamilies.medium,
    lineHeight: 20,
  },
  body_medium: {
    fontSize: 14,
    fontWeight: "500" as const,
    fontFamily: FontFamilies.medium,
    lineHeight: 18,
  },
  body_small: {
    fontSize: 12,
    fontWeight: "400" as const,
    fontFamily: FontFamilies.regular,
    lineHeight: 16,
  },

  // Regular text
  regular_large: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: FontFamilies.regular,
    lineHeight: 20,
  },
  regular_medium: {
    fontSize: 14,
    fontWeight: "400" as const,
    fontFamily: FontFamilies.regular,
    lineHeight: 18,
  },
  regular_small: {
    fontSize: 12,
    fontWeight: "400" as const,
    fontFamily: FontFamilies.regular,
    lineHeight: 16,
  },

  // Label styles
  label_large: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontFamily: FontFamilies.medium,
    lineHeight: 16,
  },
  label_medium: {
    fontSize: 11,
    fontWeight: "500" as const,
    fontFamily: FontFamilies.medium,
    lineHeight: 14,
  },

  // Caption
  caption: {
    fontSize: 10,
    fontWeight: "400" as const,
    fontFamily: FontFamilies.regular,
    lineHeight: 12,
  },
};

// Font size constants for direct use
export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 28,
};

// Font weight constants
export const FontWeights = {
  light: "300" as const,
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

// Line height constants
export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
