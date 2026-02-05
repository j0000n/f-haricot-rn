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
  background: "#f5f5e6", // Cream/yellowish white - main app background
  surface: "#f5f5e6", // Cream/yellowish white - card/surface background
  overlay: "#d4d4c5", // Darker grayish cream - selected items/overlay background (distinct from surface)
  surfaceVariant: "#e0e0d1", // Medium grayish cream - variant for selected states
  surfaceSubdued: "#f5f5e6", // Cream/yellowish white
  surfaceMuted: "#e8e8d9", // Slightly muted cream
  primary: "#1a1a1a", // Slightly lighter black - primary buttons/actions
  onPrimary: "#f5f5e6", // Cream/yellowish white text on primary
  muted: "#1a1a1a", // Slightly lighter black
  textPrimary: "#1a1a1a", // Slightly lighter black - primary text
  textSecondary: "#1a1a1a", // Slightly lighter black - secondary text
  textMuted: "#1a1a1a", // Slightly lighter black - muted text
  border: "#1a1a1a", // Slightly lighter black - borders
  accent: "#1a1a1a", // Slightly lighter black - accent elements
  accentOnPrimary: "#f5f5e6", // Cream/yellowish white text on accent
  success: "#1a1a1a",
  danger: "#1a1a1a",
  info: "#1a1a1a",
  logoFill: "#1a1a1a",
  logoPrimaryColor: "#1a1a1a", // Slightly lighter black
  logoSecondaryColor: "#1a1a1a", // Slightly lighter black
  logoTertiaryColor: "#4a4a4a", // Medium gray - adds subtle variation to monochrome scheme
  imageBackgroundColor: "#f5f5e6", // Cream/yellowish white - image placeholders
} as const;

export const simpleComputerTheme: ThemeDefinition = {
  label: "typewriter",
  description: "Minimal monospace aesthetic with inverted cream and dark gray tones.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 8,    // Compact spacing
      section: 12,  // Efficient section spacing
      card: 8,      // Tight card padding
      compact: 4,   // Minimal compact padding
    },
    radii: {
      sm: 0,   // Sharp corners
      md: 0,   // Sharp corners
      lg: 0,   // Sharp corners
      round: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      display: "LTSuperiorMono-Medium",
      regular: "LTSuperiorMono-Regular",
      light: "LTSuperiorMono-Regular",
      lightItalic: "LTSuperiorMono-Regular",
      medium: "LTSuperiorMono-Medium",
      semiBold: "LTSuperiorMono-Semibold",
      bold: "LTSuperiorMono-Bold",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#1a1a1a",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      floating: {
        shadowColor: "#1a1a1a",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
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
          borderRadius: 0,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.border,
          shadow: null,
        },
        trigger: {
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.xs,
          borderRadius: 0,
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
          letterSpacing: baseLetterSpacing.tight,
          marginLeftWithIcon: baseSpacing.xxs,
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/logo.svg"),
  },
};
