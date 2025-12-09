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
  background: "#130909",
  surface: "#1D1010",
  overlay: "#251415",
  surfaceVariant: "#2d1a1b",
  surfaceSubdued: "#211314",
  surfaceMuted: "#180c0d",
  primary: "#f9d79f",
  onPrimary: "#1D1010",
  muted: "#2f1a1b",
  textPrimary: "#FBEFEF",
  textSecondary: "#D7C3C2",
  textMuted: "#AC8E8C",
  border: "#3C1E1F",
  accent: "#f9d79f",
  accentOnPrimary: "#1D1010",
  success: "#63D471",
  danger: "#FF6B6B",
  info: "#4D9FFF",
  logoFill: "#FBEFEF",
  imageBackgroundColor: "#1D1010",
} as const;

export const midnightTheme: ThemeDefinition = {
  label: "Midnight",
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
    },
    typography: baseTypography,
    fontFamilies: baseFontFamilies,
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
          marginHorizontal: baseSpacing.lg,
          marginBottom: baseSpacing.lg,
          borderRadius: baseRadii.lg,
          backgroundColor: colors.surface,
          borderWidth: baseBorderWidths.thin,
          borderColor: colors.border,
          shadow: "card",
        },
        trigger: {
          paddingHorizontal: baseSpacing.md,
          paddingVertical: baseSpacing.sm,
          borderRadius: baseRadii.lg,
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
