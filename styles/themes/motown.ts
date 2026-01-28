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
  background: "#1a1a2e", // Deep midnight blue - main app background
  surface: "#16213e", // Rich navy - card/surface background
  overlay: "#0f3460", // Bright blue - modal/overlay background
  surfaceVariant: "#533483", // Purple-blue variant
  surfaceSubdued: "#1f2d4a", // Medium navy
  surfaceMuted: "#0d1b2a", // Darker navy
  primary: "#e94560", // Vibrant coral red - primary buttons/actions (Motown energy)
  onPrimary: "#ffffff", // White text on primary
  muted: "#6b7a9a", // Medium blue-gray
  textPrimary: "#f1f3f5", // Soft white - primary text
  textSecondary: "#dee2e6", // Light gray - secondary text
  textMuted: "#adb5bd", // Medium gray - muted text
  border: "#533483", // Purple-blue - borders
  accent: "#ff6b9d", // Bright pink - accent elements (1960s optimism)
  accentOnPrimary: "#ffffff", // White text on accent
  success: "#4caf50",
  danger: "#e94560",
  info: "#2196f3",
  logoFill: "#f1f3f5",
  logoPrimaryColor: "#ff6b9d", // Bright pink
  logoSecondaryColor: "#e94560", // Vibrant coral red
  imageBackgroundColor: "#16213e", // Rich navy - image placeholders
} as const;

export const motownTheme: ThemeDefinition = {
  label: "Motown",
  description: "1960s optimism and Motown sound with vibrant corals, deep blues, and soulful energy.",
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
      sm: 6,
      md: 10,
      lg: 16,
      round: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      display: "LTSoul-Bold",
      regular: "UncutSans-Regular",
      light: "UncutSans-Light",
      lightItalic: "UncutSans-LightItalic",
      medium: "UncutSans-Medium",
      semiBold: "UncutSans-Semibold",
      bold: "UncutSans-Bold",
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
        shadowColor: "#e94560",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
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
          paddingHorizontal: baseSpacing.xxs,
          paddingVertical: baseSpacing.xxs,
          marginHorizontal: baseSpacing.xs,
          marginBottom: baseSpacing.xxl,
          borderRadius: 10,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.border,
          shadow: null,
        },
        trigger: {
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.xs,
          borderRadius: 10,
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
