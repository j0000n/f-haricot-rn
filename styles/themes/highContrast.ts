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
  baseTypography,
} from "./types";

const baseTokens = {
  spacing: baseSpacing,
  padding: {
    screen: 12,
    section: 16,
    card: 12,
    compact: 8,
  },
  radii: baseRadii,
  typography: baseTypography,
  fontFamilies: {
    ...baseFontFamilies,
    display: "Source Sans Pro Bold",
  },
  layout: baseLayout,
  shadows: {
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    floating: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
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
} as const;

const buildHighContrastTheme = ({
  colors,
  label,
  description,
}: {
  colors: ThemeDefinition["tokens"]["colors"];
  label: string;
  description: string;
}): ThemeDefinition => ({
  label,
  description,
  tokens: {
    colors,
    ...baseTokens,
    components: {
      ...baseComponentTokens,
      tabBar: {
        containerBackground: colors.background,
        slotBackground: colors.surface,
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
          borderRadius: baseRadii.md,
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
        icon: {
          show: true,
          family: "Feather",
          size: baseIconSizes.md,
          inactiveColor: colors.textSecondary,
          activeColor: colors.accentOnPrimary,
          names: {
            home: "home",
            kitchen: "grid",
            lists: "list",
          },
        },
      },
    },
  },
  assets: {
    logo: require("@/assets/images/logo.svg"),
  },
});

const darkColors = {
  background: "#000000",
  surface: "#0d0d0d",
  overlay: "#1a1a1a",
  textPrimary: "#ffffff",
  textSecondary: "#f2f2f2",
  textMuted: "#c2c2c2",
  border: "#f7f7f7",
  accent: "#ffd400",
  accentOnPrimary: "#000000",
  success: "#00ff8c",
  danger: "#ff453a",
  info: "#0a84ff",
  logoFill: "#ffffff",
  imageBackgroundColor: "#0d0d0d",
} as const;

const lightColors = {
  background: "#ffffff",
  surface: "#f5f5f5",
  overlay: "#ebebeb",
  textPrimary: "#000000",
  textSecondary: "#1a1a1a",
  textMuted: "#4d4d4d",
  border: "#000000",
  accent: "#0057ff",
  accentOnPrimary: "#ffffff",
  success: "#007a1f",
  danger: "#c10015",
  info: "#002cbb",
  logoFill: "#000000",
  imageBackgroundColor: "#f5f5f5",
} as const;

export const highContrastDarkTheme = buildHighContrastTheme({
  colors: darkColors,
  label: "High contrast dark",
  description: "Ultra-high contrast palette optimised for night-time legibility.",
});

export const highContrastLightTheme = buildHighContrastTheme({
  colors: lightColors,
  label: "High contrast light",
  description: "High contrast palette with bright backgrounds for daylight clarity.",
});
