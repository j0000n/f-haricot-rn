import {
    AppTabKey,
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
    FULL_WIDTH,
    ThemeDefinition
} from "./types";

const colors = {
  background: "#050404",
  surface: "#0F0D0D",
  overlay: "#181515",
  surfaceVariant: "#1f1a1a",
  surfaceSubdued: "#141010",
  surfaceMuted: "#0a0808",
  primary: "#cc0202",
  onPrimary: "#050404",
  muted: "#221d1d",
  textPrimary: "#F8F6FF",
  textSecondary: "#C9C2D9",
  textMuted: "#8A8498",
  border: "#2F2838",
  accent: "#cc0202",
  accentOnPrimary: "#050404",
  success: "#6BFBA5",
  danger: "#FF5C7A",
  info: "#6C9BFF",
  logoFill: "#F8F6FF",
  imageBackgroundColor: "#0F0D0D",
} as const;

export const blackMetalTheme: ThemeDefinition = {
  label: "Black Metal",
  description: "High-contrast graphite with ultraviolet sparks for late nights.",
  tokens: {
    colors,
    spacing: baseSpacing,
    padding: {
      screen: 10,    // Tight screen padding for edgy, intense feel
      section: 14,   // Minimal section spacing
      card: 8,       // Compact card padding
      compact: 4,    // Ultra-compact padding
    },
    radii: {
      sm: 0,
      md: 0,
      lg: 0,
      round: baseRadii.round,
    },
    typography: baseTypography,
    fontFamilies: {
      ...baseFontFamilies,
      display: "Metaloxcide",
      bold: "Metaloxcide",
    },
    layout: baseLayout,
    shadows: {
      card: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
      },
      floating: {
        shadowColor: "#150A24",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
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
      // Override for sharp aesthetic
      card: {
        ...baseComponentTokens.card,
        borderRadius: 0,
      },
      button: {
        ...baseComponentTokens.button,
        primary: { ...baseComponentTokens.button.primary, borderRadius: 0 },
        secondary: { ...baseComponentTokens.button.secondary, borderRadius: 0 },
        pill: { ...baseComponentTokens.button.pill, borderRadius: 0 },
        text: baseComponentTokens.button.text,
      },
      list: {
        ...baseComponentTokens.list,
        borderRadius: 0,
      },
      input: {
        ...baseComponentTokens.input,
        borderRadius: 0,
      },
      textArea: {
        ...baseComponentTokens.textArea,
        borderRadius: 0,
      },
      tabBar: {
        containerBackground: colors.background,
        slotBackground: colors.background,
        list: {
          paddingHorizontal: baseSpacing.sm,
          paddingVertical: baseSpacing.sm,
          marginHorizontal: 0,
          marginBottom: baseSpacing.lg,
          borderRadius: 0,
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderColor: colors.surface,
          shadow: null,
        },
        trigger: {
          paddingHorizontal: baseSpacing.xs,
          paddingVertical: baseSpacing.xs,
          borderRadius: 0,
          minHeight: baseSpacing.xxl,
          squareSize: baseLayout.fabSize,
          shape: "pill",
          inactiveBackgroundColor: colors.surface,
          activeBackgroundColor: colors.accent,
        },
        label: {
          show: true,
          color: colors.textSecondary,
          activeColor: colors.accentOnPrimary,
          uppercase: false,
          letterSpacing: baseLetterSpacing.normal,
          marginLeftWithIcon: baseSpacing.xs,
        },
        icon: {
          show: false,
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
    logo: require("@/assets/images/black-metal-logo.png"),
  },
};
