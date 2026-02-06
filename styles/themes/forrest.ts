import {
  FULL_WIDTH,
  ThemeDefinition,
  baseBorderWidths,
  baseComponentSizes,
  baseComponentTokens,
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
  background: "#1a3d2e", // Deep forest green - main app background
  surface: "#2d5a47", // Rich moss green - card/surface background
  overlay: "#3d6b58", // Lush green - modal/overlay background
  surfaceVariant: "#4a7a65", // Lighter forest green variant
  surfaceSubdued: "#2d5a47", // Medium moss green
  surfaceMuted: "#1f4535", // Darker forest green
  primary: "#4a9d7a", // Vibrant emerald - primary buttons/actions
  onPrimary: "#ffffff", // White text on primary
  muted: "#5a7a6a", // Medium green-gray
  textPrimary: "#e8f5e9", // Soft green-white - primary text
  textSecondary: "#c8e6c9", // Light mint - secondary text
  textMuted: "#81c784", // Medium green - muted text
  border: "#3d6b58", // Lush green - borders
  accent: "#66bb6a", // Bright lime green - accent elements
  accentOnPrimary: "#ffffff", // White text on accent
  success: "#4caf50",
  danger: "#f44336",
  info: "#2196f3",
  logoFill: "#e8f5e9",
  logoPrimaryColor: "#66bb6a", // Bright lime green
  logoSecondaryColor: "#4a9d7a", // Vibrant emerald
  logoTertiaryColor: "#2d5a47", // Rich moss green - complements lime and emerald, adds depth
  imageBackgroundColor: "#2d5a47", // Rich moss green - image placeholders
} as const;

export const forrestTheme: ThemeDefinition = {
  label: "Forrest",
  description: "Earthy lush greens inspired by deep forests and natural growth.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 12,
      section: 16,
      card: 12,
      compact: 6,
    },
    radii: {
      sm: 8,
      md: 12,
      lg: 20,
      round: baseRadii.round,
      radiusControl: 8,
      radiusCard: 12,
      radiusSurface: 20,
      radiusPill: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      display: "Isenheim-Regulier",
      regular: "SpaceGrotesk-Regular",
      light: "SpaceGrotesk-Light",
      lightItalic: "SpaceGrotesk-Regular",
      medium: "SpaceGrotesk-Medium",
      semiBold: "SpaceGrotesk-Medium",
      bold: "SpaceGrotesk-Bold",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
      floating: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
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
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadow: null,
        },
        trigger: {
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.xs,
          borderRadius: 12,
          minHeight: 32,
          shape: "pill",
          inactiveBackgroundColor: colors.overlay,
          activeBackgroundColor: colors.accent,
        },
        label: {
          show: true,
          color: colors.textPrimary,
          activeColor: colors.accentOnPrimary,
          uppercase: false,
          letterSpacing: baseLetterSpacing.normal,
          marginLeftWithIcon: baseSpacing.xxs,
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/logo.svg"),
  },
};
