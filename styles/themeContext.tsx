import {
  type ReactElement,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AccessibilityInfo } from "react-native";
import type {
  TabBarIconTokens,
  TabBarTokens,
  ThemeAssets,
  ThemeName,
  ThemeTokens,
} from "./themes";
import {
  defaultThemeName,
  generateComponentTokensFromGlobal,
  getThemeDefinition,
  isThemeName,
  themeOptions,
} from "./themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AVAILABLE_LOGOS } from "@/components/logoAssets";

export type ThemeOption = (typeof themeOptions)[number];

export type BaseTextSize = "extraSmall" | "base" | "large" | "extraLarge";

export type MotionPreference = "system" | "reduce" | "standard";

export type HighContrastPreference = "off" | "light" | "dark";

export type AccessibilityPreferences = {
  baseTextSize: BaseTextSize;
  dyslexiaEnabled: boolean;
  highContrastMode: HighContrastPreference;
  motionPreference: MotionPreference;
};

type AccessibilityPreferenceUpdate = Partial<AccessibilityPreferences>;

type CustomTabBarTokens = Omit<TabBarTokens, "icon"> & {
  icon?: (Omit<TabBarIconTokens, "family"> & { family: string }) | null;
};

type CustomThemeData = {
  name: string;
  shareCode: string;
  colors: Omit<ThemeTokens["colors"], "logoFill"> & {
    logoFill?: string;
  };
  spacing: Omit<ThemeTokens["spacing"], "none">;
  padding: ThemeTokens["padding"];
  radii: ThemeTokens["radii"];
  typography: ThemeTokens["typography"];
  fontFamilies: ThemeTokens["fontFamilies"];
  logoAsset: string;
  tabBar?: CustomTabBarTokens | null;
};

type ThemeContextValue = {
  themeName: ThemeName | "custom";
  tokens: ThemeTokens;
  assets: ThemeAssets;
  setTheme: (nextTheme: ThemeName) => Promise<void> | void;
  isUpdatingTheme: boolean;
  availableThemes: ThemeOption[];
  accessibilityPreferences: AccessibilityPreferences;
  setAccessibilityPreferences: (
    update: AccessibilityPreferenceUpdate
  ) => Promise<void> | void;
  isUpdatingAccessibility: boolean;
  prefersReducedMotion: boolean;
  customTheme: CustomThemeData | null;
  setCustomTheme: (theme: CustomThemeData | null) => void;
  definition: ReturnType<typeof getThemeDefinition>;
};

type ThemeProviderProps = {
  children: ReactNode;
  initialThemeName?: string | null;
  initialCustomThemeShareCode?: string | null;
  onPersistTheme?: (themeName: ThemeName) => Promise<void> | void;
  initialAccessibilityPreferences?: AccessibilityPreferences | null;
  onPersistAccessibility?: (
    preferences: AccessibilityPreferences
  ) => Promise<void> | void;
};

const defaultDefinition = getThemeDefinition(defaultThemeName);

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  baseTextSize: "base",
  dyslexiaEnabled: false,
  highContrastMode: "off",
  motionPreference: "system",
};

const defaultContextValue: ThemeContextValue = {
  themeName: defaultThemeName,
  tokens: defaultDefinition.tokens,
  assets: defaultDefinition.assets,
  setTheme: () => {
    throw new Error("setTheme must be used within a ThemeProvider");
  },
  isUpdatingTheme: false,
  availableThemes: themeOptions,
  accessibilityPreferences: defaultAccessibilityPreferences,
  setAccessibilityPreferences: () => {
    throw new Error(
      "setAccessibilityPreferences must be used within a ThemeProvider"
    );
  },
  isUpdatingAccessibility: false,
  prefersReducedMotion: false,
  customTheme: null,
  setCustomTheme: () => {
    throw new Error("setCustomTheme must be used within a ThemeProvider");
  },
  definition: defaultDefinition,
};

const ThemeContext = createContext(defaultContextValue);

const resolveThemeName = (maybeTheme?: string | null): ThemeName =>
  maybeTheme && isThemeName(maybeTheme) ? maybeTheme : defaultThemeName;

export function ThemeProvider({
  children,
  initialThemeName,
  initialCustomThemeShareCode,
  onPersistTheme,
  initialAccessibilityPreferences,
  onPersistAccessibility,
}: ThemeProviderProps): ReactElement {
  const [themeName, setThemeName] = useState<ThemeName | "custom">(
    resolveThemeName(initialThemeName)
  );
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [accessibilityPreferences, setAccessibilityPreferences] = useState(
    initialAccessibilityPreferences ?? defaultAccessibilityPreferences
  );
  const [isUpdatingAccessibility, setIsUpdatingAccessibility] = useState(false);
  const [customTheme, setCustomTheme] = useState<CustomThemeData | null>(null);
  const [systemReduceMotionEnabled, setSystemReduceMotionEnabled] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value: boolean) => {
        if (isMounted) {
          setSystemReduceMotionEnabled(value);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load reduce motion preference", error);
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value: boolean) => {
        if (isMounted) {
          setSystemReduceMotionEnabled(value);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  // Load custom theme from share code on startup
  const loadedCustomTheme = useQuery(
    api.customThemes.getThemeByShareCode,
    initialCustomThemeShareCode ? { shareCode: initialCustomThemeShareCode } : "skip"
  );

  // Load custom theme from share code when it becomes available
  useEffect(() => {
    if (loadedCustomTheme && initialCustomThemeShareCode) {
      // If initialThemeName is a valid built-in theme, the user has explicitly selected it
      // and we should respect that choice over the saved custom theme
      const isBuiltInTheme = initialThemeName && isThemeName(initialThemeName);
      
      if (!isBuiltInTheme) {
        // Only set if it's different from what's already loaded to prevent infinite loop
        setCustomTheme((current) => {
          if (current?.shareCode === loadedCustomTheme.shareCode) {
            return current; // Already loaded, don't update
          }

          const {
            colors,
            spacing,
            padding,
            radii,
            typography,
            fontFamilies,
            logoAsset,
            tabBar,
            name,
            shareCode,
          } = loadedCustomTheme;

          return {
            name,
            shareCode,
            colors: {
              ...colors,
              logoFill: colors.logoFill ?? colors.textPrimary,
            },
            spacing,
            padding,
            radii,
            typography,
            fontFamilies,
            logoAsset,
            tabBar,
          } satisfies CustomThemeData;
        });
        setThemeName((current) => (current === "custom" ? current : "custom"));
      }
    }
  }, [loadedCustomTheme, initialCustomThemeShareCode, initialThemeName]);

  // Clear custom theme when share code is cleared (user switched to built-in theme)
  useEffect(() => {
    if (initialCustomThemeShareCode === null) {
      setCustomTheme((current) => {
        // Only clear if we're not currently using a custom theme
        // This prevents clearing custom themes that were applied directly
        if (current === null) {
          return current; // Already cleared
        }
        return null;
      });
      // Reset to default theme if no explicit built-in theme is set
      if (!initialThemeName || !isThemeName(initialThemeName)) {
        setThemeName((current) =>
          current === defaultThemeName ? current : defaultThemeName
        );
      } else {
        // Apply the explicit built-in theme
        const resolved = resolveThemeName(initialThemeName);
        setThemeName((current) => (current === resolved ? current : resolved));
      }
    }
  }, [initialCustomThemeShareCode, initialThemeName]);

  useEffect(() => {
    if (initialThemeName === undefined) {
      return;
    }

    // If initialThemeName is explicitly null, user wants to clear custom theme
    // This is handled by the useEffect that watches initialCustomThemeShareCode
    if (initialThemeName === null) {
      return;
    }

    // Don't override custom theme if one is set - custom themes take priority
    // Also check if we're in the process of setting a custom theme (themeName is "custom")
    if (themeName === "custom" || customTheme) {
      // Custom theme takes priority over initialThemeName
      return;
    }

    // Only apply initialThemeName if we're not currently using a custom theme
    // and if initialThemeName is actually a valid built-in theme
    if (initialThemeName && isThemeName(initialThemeName)) {
      const resolved = resolveThemeName(initialThemeName);
      if (resolved !== themeName && themeName !== "custom") {
        setThemeName(resolved);
      }
    }
  }, [initialThemeName, themeName, customTheme]);

  useEffect(() => {
    if (initialAccessibilityPreferences === undefined) {
      return;
    }

    const resolved =
      initialAccessibilityPreferences ?? defaultAccessibilityPreferences;

    if (
      resolved.baseTextSize !== accessibilityPreferences.baseTextSize ||
      resolved.dyslexiaEnabled !== accessibilityPreferences.dyslexiaEnabled ||
      resolved.highContrastMode !== accessibilityPreferences.highContrastMode ||
      resolved.motionPreference !== accessibilityPreferences.motionPreference
    ) {
      setAccessibilityPreferences(resolved);
    }
  }, [accessibilityPreferences, initialAccessibilityPreferences]);

  const changeTheme = useCallback(
    async (nextTheme: ThemeName) => {
      if (nextTheme === themeName) {
        return;
      }

      // Clear custom theme when switching to a built-in theme
      if (customTheme) {
        setCustomTheme(null);
      }

      setThemeName(nextTheme);

      if (!onPersistTheme) {
        return;
      }

      try {
        setIsUpdatingTheme(true);
        // Persist the theme - this will also clear customThemeShareCode in the profile
        await onPersistTheme(nextTheme);
      } catch (error) {
        console.error("Failed to persist theme preference", error);
      } finally {
        setIsUpdatingTheme(false);
      }
    },
    [themeName, onPersistTheme, customTheme]
  );

  const changeAccessibility = useCallback(
    async (update: AccessibilityPreferenceUpdate) => {
      const nextPreferences = {
        ...accessibilityPreferences,
        ...update,
      } satisfies AccessibilityPreferences;

    const hasChanges =
      nextPreferences.baseTextSize !== accessibilityPreferences.baseTextSize ||
      nextPreferences.dyslexiaEnabled !== accessibilityPreferences.dyslexiaEnabled ||
      nextPreferences.highContrastMode !== accessibilityPreferences.highContrastMode ||
      nextPreferences.motionPreference !== accessibilityPreferences.motionPreference;

      if (!hasChanges) {
        return;
      }

      setAccessibilityPreferences(nextPreferences);

      if (!onPersistAccessibility) {
        return;
      }

      try {
        setIsUpdatingAccessibility(true);
        await onPersistAccessibility(nextPreferences);
      } catch (error) {
        console.error("Failed to persist accessibility preferences", error);
      } finally {
        setIsUpdatingAccessibility(false);
      }
    },
    [accessibilityPreferences, onPersistAccessibility]
  );

  const definition = useMemo(() => {
    console.log("definition useMemo running - themeName:", themeName, "customTheme:", customTheme ? `${customTheme.name} (${customTheme.shareCode})` : "null");
    
    if (accessibilityPreferences.highContrastMode === "light") {
      return getThemeDefinition("highContrastLight");
    }

    if (accessibilityPreferences.highContrastMode === "dark") {
      return getThemeDefinition("highContrastDark");
    }

    if (themeName === "custom" && customTheme) {
      console.log("Using custom theme definition:", customTheme.name, customTheme.shareCode);
      // Return a custom theme definition
      // Ensure logoFill and imageBackgroundColor have default values if missing
      const colorsWithDefaults = {
        ...customTheme.colors,
        logoFill: customTheme.colors.logoFill ?? customTheme.colors.textPrimary ?? "#000000",
        imageBackgroundColor: customTheme.colors.imageBackgroundColor ?? customTheme.colors.surface ?? customTheme.colors.background,
      };
      
      const tabBarTokens: ThemeTokens["components"]["tabBar"] = customTheme.tabBar
        ? {
            ...customTheme.tabBar,
            icon: customTheme.tabBar.icon
              ? {
                  ...customTheme.tabBar.icon,
                  family:
                    customTheme.tabBar.icon.family === "Feather"
                      ? customTheme.tabBar.icon.family
                      : "Feather",
                }
              : undefined,
          }
        : defaultDefinition.tokens.components.tabBar;

      // Generate component tokens from global tokens for custom themes
      const generatedComponentTokens = generateComponentTokensFromGlobal(
        { ...customTheme.spacing, none: 0 },
        customTheme.padding,
        customTheme.radii,
        customTheme.typography,
        defaultDefinition.tokens.layout,
        defaultDefinition.tokens.componentSizes
      );

      return {
        label: customTheme.name,
        description: `Custom theme: ${customTheme.shareCode}`,
        tokens: {
          colors: colorsWithDefaults,
          spacing: { ...customTheme.spacing, none: 0 },
          padding: customTheme.padding,
          radii: customTheme.radii,
          typography: customTheme.typography,
          fontFamilies: customTheme.fontFamilies,
          layout: defaultDefinition.tokens.layout,
          shadows: defaultDefinition.tokens.shadows,
          borderWidths: defaultDefinition.tokens.borderWidths,
          lineHeights: defaultDefinition.tokens.lineHeights,
          letterSpacing: defaultDefinition.tokens.letterSpacing,
          opacity: defaultDefinition.tokens.opacity,
          iconSizes: defaultDefinition.tokens.iconSizes,
          widths: defaultDefinition.tokens.widths,
          componentSizes: defaultDefinition.tokens.componentSizes,
          components: {
            ...generatedComponentTokens,
            tabBar: tabBarTokens,
          },
        } as ThemeTokens,
        assets: {
          logo: (() => {
            // Handle different logo asset path formats
            const assetPath = customTheme.logoAsset;
            
            // First, try to find the logo in AVAILABLE_LOGOS
            const matchedLogo = AVAILABLE_LOGOS.find((logo) => logo.path === assetPath);
            if (matchedLogo) {
              return matchedLogo.source;
            }
            
            // Fallback: handle path-based mapping for any path starting with @/assets/images/
            if (assetPath.startsWith("@/assets/images/")) {
              const imageName = assetPath.replace("@/assets/images/", "");
              // Map logo paths to their require statements
              const logoMap: Record<string, any> = {
                "haricot-logo.svg": require("@/assets/images/haricot-logo.svg"),
                "sunrise-logo.svg": require("@/assets/images/sunrise-logo.svg"),
                "midnight-logo.svg": require("@/assets/images/midnight-logo.svg"),
                "logo.svg": require("@/assets/images/logo.svg"),
                "black-metal.svg": require("@/assets/images/black-metal.svg"),
                "black-metal-logo.png": require("@/assets/images/black-metal-logo.png"),
                "1950s.svg": require("@/assets/images/1950s.svg"),
                "1960s.svg": require("@/assets/images/1960s.svg"),
                "1990s.svg": require("@/assets/images/1990s.svg"),
              };
              return logoMap[imageName] || { uri: assetPath };
            }
            
            // Final fallback: return as URI
            return { uri: assetPath };
          })(),
        } as ThemeAssets,
      };
    }
    // If themeName is "custom" but customTheme is null, this is an invalid state
    // This should only happen during initialization or when switching away from custom
    // In this case, fall back to default theme to prevent errors
    if (themeName === "custom" && !customTheme) {
      return defaultDefinition;
    }
    // For built-in themes, get the theme definition
    const themeDef = getThemeDefinition(themeName as ThemeName);
    // Safety check: ensure we always return a valid definition
    if (!themeDef) {
      console.warn(`Theme definition not found for: ${themeName}, falling back to default`);
      return defaultDefinition;
    }
    return themeDef;
  }, [
    themeName,
    customTheme,
    accessibilityPreferences.highContrastMode,
  ]);

  const tokens = useMemo(() => {
    const baseTokens = definition.tokens;

    const typographyScale: Record<BaseTextSize, number> = {
      extraSmall: 0.9,
      base: 1,
      large: 1.1,
      extraLarge: 1.25,
    };

    const scale = typographyScale[accessibilityPreferences.baseTextSize];

    const typography =
      scale === 1
        ? baseTokens.typography
        : {
            title: Math.round(baseTokens.typography.title * scale),
            heading: Math.round(baseTokens.typography.heading * scale),
            subheading: Math.round(baseTokens.typography.subheading * scale),
            body: Math.round(baseTokens.typography.body * scale),
            small: Math.round(baseTokens.typography.small * scale),
            tiny: Math.round(baseTokens.typography.tiny * scale),
          };

    const fontFamilies = accessibilityPreferences.dyslexiaEnabled
      ? {
          ...baseTokens.fontFamilies,
          regular: "OpenDyslexic-Regular",
          light: "OpenDyslexic-Regular",
          lightItalic: "OpenDyslexic-Italic",
          medium: "OpenDyslexic-Regular",
          semiBold: "OpenDyslexic-Bold",
          bold: "OpenDyslexic-Bold",
        }
      : baseTokens.fontFamilies;

    return {
      ...baseTokens,
      typography,
      fontFamilies,
    } satisfies ThemeTokens;
  }, [accessibilityPreferences, definition]);

  const setCustomThemeHandler = useCallback(
    (theme: CustomThemeData | null) => {
      console.log("setCustomThemeHandler called with theme:", theme ? `${theme.name} (${theme.shareCode})` : "null");
      
      // Use React's automatic batching - both updates will be batched together
      // This ensures the useMemo sees both values updated in the same render
      if (theme) {
        // Set both states together - React will batch these updates
        setCustomTheme(theme);
        setThemeName("custom");
        console.log("Set customTheme and themeName to 'custom'");
      } else {
        // When clearing custom theme, revert to default or user's preferred theme
        const resolved = resolveThemeName(initialThemeName);
        console.log("Clearing custom theme, reverting to:", resolved);
        setCustomTheme(null);
        setThemeName(resolved);
      }
    },
    [initialThemeName]
  );

  const prefersReducedMotion =
    accessibilityPreferences.motionPreference === "system"
      ? systemReduceMotionEnabled
      : accessibilityPreferences.motionPreference === "reduce";

  const value = useMemo(
    () => ({
      themeName,
      tokens,
      assets: definition.assets,
      setTheme: changeTheme,
      isUpdatingTheme,
      availableThemes: themeOptions,
      accessibilityPreferences,
      setAccessibilityPreferences: changeAccessibility,
      isUpdatingAccessibility,
      prefersReducedMotion,
      customTheme,
      setCustomTheme: setCustomThemeHandler,
      definition,
    }),
    [
      accessibilityPreferences,
      changeAccessibility,
      changeTheme,
      definition,
      isUpdatingAccessibility,
      isUpdatingTheme,
      themeName,
      tokens,
      customTheme,
      setCustomThemeHandler,
      prefersReducedMotion,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useTokens() {
  const { tokens } = useTheme();
  return tokens;
}

export function useThemedStyles<T>(createStyles: (tokens: ThemeTokens) => T): T {
  const tokens = useTokens();
  return useMemo(() => createStyles(tokens), [createStyles, tokens]);
}

export { defaultThemeName, getThemeDefinition, isThemeName, themeOptions };
export type { ThemeAssets, ThemeName, ThemeTokens } from "./themes";
