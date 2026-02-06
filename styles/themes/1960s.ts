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
  background: "#F5F1E8",
  surface: "#dbcb9a",
  overlay: "#C9BB9A",
  surfaceVariant: "#d1c199",
  surfaceSubdued: "#c3b68f",
  surfaceMuted: "#b8ab83",
  primary: "#e79950",
  onPrimary: "#403a21",
  muted: "#cbbd9d",
  textPrimary: "#403a21",
  textSecondary: "#6B6142",
  textMuted: "#8B7D5A",
  border: "#a55652",
  accent: "#e79950",
  accentOnPrimary: "#403a21",
  success: "#7DAA5A",
  danger: "#a55652",
  info: "#D4A574",
  logoFill: "#403a21",
  logoPrimaryColor: "#e79950", // Warm orange - distinct from surface, matches accent
  logoSecondaryColor: "#a55652", // Rust - complements orange, distinct from border
  logoTertiaryColor: "#D4A574", // Golden amber - complements orange and rust, adds warmth
  imageBackgroundColor: "#dbcb9a",
} as const;

export const sixtiesTheme: ThemeDefinition = {
  label: "1960s",
  description: "Summer of love vibes with earthy oranges, sandy beiges, and warm rust.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 16,   // Relaxed, groovy padding
      section: 20,  // Spacious section flow
      card: 14,     // Comfortable card padding
      compact: 8,   // Easy-going compact padding
    },
    radii: {
      sm: 10,  // Soft, organic curves
      md: 14,  // Flowing rounded corners
      lg: 20,  // Peace and love roundness
      round: baseRadii.round,
      radiusControl: 10,
      radiusCard: 14,
      radiusSurface: 20,
      radiusPill: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      ...baseFontFamilies,
      display: "East Market NF",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#a55652",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
      },
      floating: {
        shadowColor: "#a55652",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
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
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.sm,
          marginHorizontal: baseSpacing.lg,
          marginBottom: baseSpacing.lg,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: baseBorderWidths.regular,
          borderColor: colors.border,
          shadow: "card",
        },
        trigger: {
          paddingHorizontal: baseSpacing.lg,
          paddingVertical: baseSpacing.sm,
          borderRadius: 18,
          minHeight: baseSpacing.xl,
          shape: "pill",
          inactiveBackgroundColor: "transparent",
          activeBackgroundColor: colors.accent,
        },
        label: {
          show: true,
          color: colors.textSecondary,
          activeColor: colors.accentOnPrimary,
          uppercase: false,
          letterSpacing: baseLetterSpacing.tight,
          marginLeftWithIcon: baseSpacing.xs,
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/1960s.svg"),
  },
};
