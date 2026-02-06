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
  background: "#fff8e1", // Warm cream - main app background (pancake batter)
  surface: "#ffe0b2", // Soft peach - card/surface background
  overlay: "#fff3e0", // Light orange - modal/overlay background
  surfaceVariant: "#ffcc80", // Warm orange variant
  surfaceSubdued: "#ffe0b2", // Medium peach
  surfaceMuted: "#ffcc80", // Lighter orange
  primary: "#ff8f00", // Yolk yellow-orange - primary buttons/actions
  onPrimary: "#ffffff", // White text on primary
  muted: "#d4a574", // Coffee brown-gray
  textPrimary: "#5d4037", // Rich coffee brown - primary text
  textSecondary: "#8d6e63", // Medium brown - secondary text
  textMuted: "#a1887f", // Light brown - muted text
  border: "#ffb74d", // Warm orange - borders
  accent: "#ffa726", // Bright orange juice - accent elements
  accentOnPrimary: "#ffffff", // White text on accent
  success: "#66bb6a",
  danger: "#ef5350",
  info: "#42a5f5",
  logoFill: "#5d4037",
  logoPrimaryColor: "#ffa726", // Bright orange juice
  logoSecondaryColor: "#ff8f00", // Yolk yellow-orange
  logoTertiaryColor: "#ffe0b2", // Soft peach - complements orange and yellow, adds warmth
  imageBackgroundColor: "#ffe0b2", // Soft peach - image placeholders
} as const;

export const lazySundayMorningTheme: ThemeDefinition = {
  label: "Lazy Sunday Morning",
  description: "Yolk yellow, orange juice, pancakes, and coffee - the feeling of a relaxed Sunday morning.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 16,
      section: 20,
      card: 16,
      compact: 8,
    },
    radii: {
      sm: 12,
      md: 16,
      lg: 24,
      round: baseRadii.round,
      radiusControl: 12,
      radiusCard: 16,
      radiusSurface: 24,
      radiusPill: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      display: "Career",
      regular: "HostGrotesk-Regular",
      light: "HostGrotesk-Light",
      lightItalic: "HostGrotesk-LightItalic",
      medium: "HostGrotesk-Medium",
      semiBold: "HostGrotesk-SemiBold",
      bold: "HostGrotesk-Bold",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#ff8f00",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
      },
      floating: {
        shadowColor: "#ff8f00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
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
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadow: null,
        },
        trigger: {
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.xs,
          borderRadius: 16,
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
