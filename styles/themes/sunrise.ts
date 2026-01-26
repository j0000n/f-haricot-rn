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
  background: "#f5f5f5",
  surface: "#FFF7F7",
  overlay: "#f8f8f8",
  surfaceVariant: "#fff0f0",
  surfaceSubdued: "#f9f1f1",
  surfaceMuted: "#f2eaea",
  primary: "#450404",
  onPrimary: "#ffffff",
  muted: "#e8dede",
  textPrimary: "#270101",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#FFD5D5",
  accent: "#450404",
  accentOnPrimary: "#ffffff",
  success: "#4CAF50",
  danger: "#ff3b30",
  info: "#007AFF",
  logoFill: "#844660",
  logoPrimaryColor: "#450404", // Deep cranberry - distinct from surface, matches primary
  logoSecondaryColor: "#844660", // Cranberry rose - complements primary, distinct from border
  imageBackgroundColor: "#FFF7F7",
} as const;

export const sunriseTheme: ThemeDefinition = {
  label: "Sunrise",
  description: "Bright neutrals with cranberry accents for daytime focus.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 12,   // Clean screen padding for open, airy feel
      section: 16,  // Balanced breathing room between sections
      card: 10,     // Spacious card padding
      compact: 6,   // Comfortable compact padding
    },
    radii: baseRadii,
    typography: baseTypography,
    fontFamilies: {
      ...baseFontFamilies,
      display: "East Market NF",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#950B0B",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      floating: {
        shadowColor: "#950B0B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
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
    logo: require("@/assets/images/logo-jan-23.svg"),
  },
};
