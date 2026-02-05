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
  background: "#056366", // Dark teal - main app background
  surface: "#6B2C58", // Dark magenta - card/surface background
  overlay: "#A8A8A8", // Gray - modal/overlay background
  surfaceVariant: "#8a5a78", // Lighter magenta variant
  surfaceSubdued: "#7a4868", // Medium magenta
  surfaceMuted: "#5d2f4f", // Darker magenta
  primary: "#8B4C78", // Brighter magenta - primary buttons/actions (lighter than surface for contrast)
  onPrimary: "#FFFFFF", // White text on primary
  muted: "#7b7b7b", // Medium gray
  textPrimary: "#fff", // White - primary text
  textSecondary: "#d8d8d8", // Light gray - secondary text
  textMuted: "#5A5A5A", // Darker gray - muted text (improved contrast on overlay)
  border: "#0A7A7D", // Lighter teal - borders (lighter than background for visibility)
  accent: "#0D8B8F", // Bright teal - accent elements (complements magenta, distinct from primary)
  accentOnPrimary: "#FFFFFF", // White text on accent
  success: "#00AA00",
  danger: "#FF0000",
  info: "#0000FF",
  logoFill: "#fff",
  logoPrimaryColor: "#0D8B8F", // Bright teal - matches accent
  logoSecondaryColor: "#8B4C78", // Brighter magenta - matches primary
  logoTertiaryColor: "#0A7A7D", // Lighter teal - matches border
  imageBackgroundColor: "#5d2f4f", // Darker magenta - image placeholders (distinct from surface)
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
          marginBottom: baseSpacing.xxl,
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
