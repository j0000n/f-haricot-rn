import {
  FULL_WIDTH,
  ThemeDefinition,
  baseBorderWidths,
  baseComponentSizes,
  baseComponentTokens,
  baseFontFamilies,
  baseRadii,
  baseIconSizes,
  baseLayout,
  baseLetterSpacing,
  baseLineHeights,
  baseOpacity,
  baseSpacing,
  baseTypography
} from "./types";

const colors = {
  background: "#056366",
  surface: "#6B2C58",
  overlay: "#A8A8A8",
  surfaceVariant: "#8a5a78",
  surfaceSubdued: "#7a4868",
  surfaceMuted: "#5d2f4f",
  primary: "#6B2C58",
  onPrimary: "#FFFFFF",
  muted: "#7b7b7b",
  textPrimary: "#fff",
  textSecondary: "#d8d8d8",
  textMuted: "#808080",
  border: "#056366",
  accent: "#6B2C58",
  accentOnPrimary: "#FFFFFF",
  success: "#00AA00",
  danger: "#FF0000",
  info: "#0000FF",
  logoFill: "#fff",
  imageBackgroundColor: "#6B2C58",
} as const;

export const ninetiesTheme: ThemeDefinition = {
  label: "1990s",
  description: "Windows 95 meets dot-com boom with digital teals, deep purples, and tech energy.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 8,    // Compact digital spacing
      section: 12,  // Efficient section spacing
      card: 8,      // Tight card padding
      compact: 4,   // Minimal compact padding
    },
    radii: {
      sm: 4,   // Sharp, digital corners
      md: 8,   // Slight pixel softening
      lg: 12,   // Minimal rounding
      round: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      ...baseFontFamilies,
      display: "W95FA",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#000000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 0,
        elevation: 3,
      },
      floating: {
        shadowColor: "#000000",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 6,
      },
    },
    borderWidths: baseBorderWidths,
    lineHeights: baseLineHeights,
    letterSpacing: baseLetterSpacing,
    opacity: baseOpacity,
    iconSizes: baseIconSizes,
    widths: { full: FULL_WIDTH },
    componentSizes: baseComponentSizes,
    components: {
      ...baseComponentTokens,
      tabBar: {
        containerBackground: colors.background,
        slotBackground: colors.background,
        list: {
          paddingHorizontal: baseSpacing.xxs,
          paddingVertical: baseSpacing.xxs,
          marginHorizontal: baseSpacing.xs,
          marginBottom: baseSpacing.md,
          borderRadius: 2,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.border,
          shadow: null,
        },
        trigger: {
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.xs,
          borderRadius: 2,
          minHeight: 32,
          shape: "pill",
          inactiveBackgroundColor: colors.overlay,
          activeBackgroundColor: colors.accent,
        },
        label: {
          show: true,
          color: colors.textPrimary,
          activeColor: colors.accentOnPrimary,
          uppercase: true,
          letterSpacing: baseLetterSpacing.tight,
          marginLeftWithIcon: baseSpacing.xxs,
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/1990s.svg"),
  },
};
