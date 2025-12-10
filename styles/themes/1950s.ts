import {
  AppTabKey,
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
  baseTypography,
} from "./types";

const colors = {
  background: "#FFF9F5",
  surface: "#FFE8E8",
  overlay: "#FFD5D5",
  surfaceVariant: "#ffd0d0",
  surfaceSubdued: "#ffe2de",
  surfaceMuted: "#f6cccc",
  primary: "#FF6F61",
  onPrimary: "#FFFFFF",
  muted: "#f2d8d8",
  textPrimary: "#2D2D2D",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#FFB2C1",
  accent: "#FF6F61",
  accentOnPrimary: "#FFFFFF",
  success: "#A8E6CF",
  danger: "#FF6F61",
  info: "#FFE156",
  logoFill: "#2D2D2D",
  imageBackgroundColor: "#FFE8E8",
} as const;

export const fifitiesTheme: ThemeDefinition = {
  label: "1950s",
  description: "Boxy retro charm with pastel pinks, mint greens, and coral accents.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 14,   // Structured, neat padding
      section: 18,  // Organized section spacing
      card: 12,     // Boxy card padding
      compact: 8,   // Compact padding
    },
    radii: {
      sm: 4,   // Minimal rounding for boxy feel
      md: 6,   // Subtle curves
      lg: 8,   // Just a hint of roundness
      round: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      ...baseFontFamilies,
      display: "East Market NF",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#FF6F61",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
      floating: {
        shadowColor: "#FF6F61",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
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
          paddingHorizontal: baseSpacing.xs,
          paddingVertical: baseSpacing.xs,
          marginHorizontal: baseSpacing.md,
          marginBottom: baseSpacing.md,
          borderRadius: 8,
          backgroundColor: colors.surface,
          borderWidth: baseBorderWidths.regular,
          borderColor: colors.border,
          shadow: "card",
        },
        trigger: {
          paddingHorizontal: baseSpacing.md,
          paddingVertical: baseSpacing.xs,
          borderRadius: 6,
          minHeight: baseSpacing.xl,
          shape: "pill",
          inactiveBackgroundColor: "transparent",
          activeBackgroundColor: colors.accent,
        },
        label: {
          show: false,
          color: colors.textSecondary,
          activeColor: colors.accentOnPrimary,
          uppercase: true,
          letterSpacing: baseLetterSpacing.normal,
          marginLeftWithIcon: baseSpacing.xs,
        },
        icon: {
          show: true,
          family: "Feather",
          size: baseIconSizes.md,
          inactiveColor: colors.textSecondary,
          activeColor: colors.accentOnPrimary,
          names: {
            home: "home",
            kitchen: "shopping-cart",
            lists: "list",
            creator: "edit-3",
            vendor: "briefcase",
          } satisfies Record<AppTabKey, string>,
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/1950s.svg"),
  },
};
