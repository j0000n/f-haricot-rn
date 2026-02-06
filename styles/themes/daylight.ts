import {
  FULL_WIDTH,
  ThemeDefinition,
  baseBorderWidths,
  baseComponentSizes,
  baseComponentTokens,
  baseFontFamilies,
  baseIconSizes,
  baseLayout,
  baseLetterSpacing,
  baseLineHeights,
  baseOpacity,
  baseRadii,
  baseSpacing,
  baseTypography
} from "./types";

const colors = {
  background: "#FBEFEF",
  surface: "#F5E5E5",
  overlay: "#E8D5D5",
  surfaceVariant: "#E0CECE",
  surfaceSubdued: "#D9C4C4",
  surfaceMuted: "#CFB8B8",
  primary: "#D4A574",
  onPrimary: "#FBEFEF",
  muted: "#D0BDBD",
  textPrimary: "#1D1010",
  textSecondary: "#2D1A1B",
  textMuted: "#4A3A3B",
  border: "#D4A574",
  accent: "#D4A574",
  accentOnPrimary: "#FBEFEF",
  success: "#63D471",
  danger: "#FF6B6B",
  info: "#4D9FFF",
  logoFill: "#1D1010",
  logoPrimaryColor: "#D4A574", // Amber - matches accent
  logoSecondaryColor: "#4A3A3B", // Muted plum - matches textMuted
  logoTertiaryColor: "#2D1A1B", // Dark gray - matches textSecondary
  imageBackgroundColor: "#FBEFEF",
} as const;

export const daylightTheme: ThemeDefinition = {
  label: "Daylight",
  description: "Moody plum surfaces with amber highlights for evening focus.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 12,    // Moderate screen padding for cozy feel
      section: 16,   // Balanced section spacing
      card: 10,      // Comfortable card padding
      compact: 6,    // Snug compact padding
    },
    radii: {
      sm: 2,
      md: 4,
      lg: 6,
      round: baseRadii.round,
      radiusControl: 2,
      radiusCard: 4,
      radiusSurface: 6,
      radiusPill: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      ...baseFontFamilies,
      display: "Garabosse-Perle",
      regular: "Garabosse-Parangon",

      semiBold: "Garabosse-Parangon",
      bold: "Garabosse-Perle",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
      floating: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
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
          paddingHorizontal: baseSpacing.xs,
          paddingVertical: baseSpacing.xs,
          marginHorizontal: baseSpacing.xxs,
          marginBottom: baseSpacing.xxl,
          borderRadius: baseRadii.sm,
          backgroundColor: colors.surface,
          borderWidth: baseBorderWidths.hairline,
          borderColor: colors.primary,
          shadow: "card",
        },
        trigger: {
          paddingHorizontal: baseSpacing.md,
          paddingVertical: baseSpacing.sm,
          borderRadius: baseRadii.sm,
          minHeight: baseSpacing.xl,
          shape: "pill",
          inactiveBackgroundColor: "transparent",
          activeBackgroundColor: colors.accent,
        },
        label: {
          show: true,
          color: colors.textSecondary,
          activeColor: colors.accentOnPrimary,
          uppercase: true,
          letterSpacing: baseLetterSpacing.normal,
          marginLeftWithIcon: baseSpacing.xs,
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/midnight-logo.svg"),
  },
};
