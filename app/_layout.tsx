import SignIn from "@/app/SignIn";
import { api } from "@/convex/_generated/api";
import "@/i18n/config";
import { TranslationProvider, changeLanguage, useTranslation } from "@/i18n/useTranslation";
import { RecipeListsProvider } from "@/hooks/useRecipeLists";
import createLayoutStyles from "@/styles/layoutStyles";
import type {
  AccessibilityPreferences,
  ThemeName,
} from "@/styles/tokens";
import {
  ThemeProvider,
  defaultThemeName,
  getThemeDefinition,
  isThemeName,
  useThemedStyles,
} from "@/styles/tokens";
import { clearPendingUserType, getPendingUserType } from "@/utils/pendingUserType";
import { FONT_SOURCES } from "@/utils/fonts";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import CrashReporter from "@/components/CrashReporter";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

const defaultTokens = getThemeDefinition(defaultThemeName).tokens;

const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  baseTextSize: "base",
  dyslexiaEnabled: false,
  highContrastMode: "off",
  motionPreference: "system",
};

const isBaseTextSize = (value: unknown): value is AccessibilityPreferences["baseTextSize"] =>
  value === "extraSmall" || value === "base" || value === "large" || value === "extraLarge";

const isMotionPreference = (
  value: unknown
): value is AccessibilityPreferences["motionPreference"] =>
  value === "system" || value === "reduce" || value === "standard";

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [preferredTheme, setPreferredTheme] = useState<string | null>(defaultThemeName);
  const [customThemeShareCode, setCustomThemeShareCode] = useState<string | null>(null);
  const [accessibilityPreferences, setAccessibilityPreferences] =
    useState<AccessibilityPreferences>(DEFAULT_ACCESSIBILITY);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    const userData = user as {
      preferredTheme?: string | null;
      customThemeShareCode?: string | null;
    } | null;

    // Check preferredTheme first - if it's a built-in theme, use that (even if customThemeShareCode exists)
    const candidate = userData?.preferredTheme;
    if (candidate && isThemeName(candidate)) {
      // User has selected a built-in theme, so clear custom theme
      setPreferredTheme(candidate);
      setCustomThemeShareCode(null);
      return;
    }

    // If customThemeShareCode exists, prioritize it (user wants custom theme)
    if (userData?.customThemeShareCode) {
      setCustomThemeShareCode(userData.customThemeShareCode);
      setPreferredTheme(null); // Don't set a built-in theme - ThemeProvider will load custom theme
      return;
    }

    // Default fallback - only if neither is set
    setPreferredTheme(defaultThemeName);
    setCustomThemeShareCode(null);
  }, [user]);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    const profile =
      (user as {
        preferredTextSize?: string | null;
        dyslexiaMode?: boolean | null;
        highContrastMode?: string | boolean | null;
        motionPreference?: string | null;
      } | null) ?? null;

    const baseTextSize = profile?.preferredTextSize;
    const dyslexiaMode = profile?.dyslexiaMode ?? false;
    const highContrastModeValue = profile?.highContrastMode;
    const resolvedHighContrastMode: AccessibilityPreferences["highContrastMode"] =
      highContrastModeValue === "light" || highContrastModeValue === "dark"
        ? highContrastModeValue
        : highContrastModeValue === "off"
        ? "off"
        : highContrastModeValue === true
        ? "dark"
        : DEFAULT_ACCESSIBILITY.highContrastMode;
    const motionPreference = profile?.motionPreference;

    setAccessibilityPreferences({
      baseTextSize: isBaseTextSize(baseTextSize)
        ? baseTextSize
        : DEFAULT_ACCESSIBILITY.baseTextSize,
      dyslexiaEnabled: Boolean(dyslexiaMode),
      highContrastMode: resolvedHighContrastMode,
      motionPreference: isMotionPreference(motionPreference)
        ? motionPreference
        : DEFAULT_ACCESSIBILITY.motionPreference,
    });
  }, [user]);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    const profile = (user as { preferredLanguage?: string | null } | null) ?? null;
    const preferredLanguage = profile?.preferredLanguage;

    if (preferredLanguage) {
      void changeLanguage(preferredLanguage);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || user === undefined) {
      return;
    }

    const syncPendingUserType = async () => {
      const pendingType = await getPendingUserType();

      if (!pendingType) {
        return;
      }

      const existingType = (user as { userType?: string } | null)?.userType ?? "";

      try {
        if (existingType !== pendingType) {
          await updateProfile({ userType: pendingType, onboardingCompleted: false });
        }
      } catch (error) {
        console.error("Failed to persist pending user type", error);
      } finally {
        await clearPendingUserType();
      }
    };

    void syncPendingUserType();
  }, [isAuthenticated, updateProfile, user]);

  const persistThemePreference = useCallback(
    async (nextTheme: ThemeName) => {
      setPreferredTheme(nextTheme);

      if (!isAuthenticated) {
        return;
      }

      try {
        // When switching to a built-in theme, clear custom theme share code
        // (custom themes are handled separately via ThemeSwitcher)
        await updateProfile({
          preferredTheme: nextTheme,
          customThemeShareCode: null, // Explicitly clear custom theme
        });
        // Clear local state if switching away from custom theme
        if (customThemeShareCode) {
          setCustomThemeShareCode(null);
        }
      } catch (error) {
        console.error("Failed to persist theme preference", error);
      }
    },
    [isAuthenticated, updateProfile, customThemeShareCode]
  );

  const persistAccessibilityPreferences = useCallback(
    async (nextPreferences: AccessibilityPreferences) => {
      setAccessibilityPreferences(nextPreferences);

      if (!isAuthenticated) {
        return;
      }

      try {
        await updateProfile({
          preferredTextSize: nextPreferences.baseTextSize,
          dyslexiaMode: nextPreferences.dyslexiaEnabled,
          highContrastMode: nextPreferences.highContrastMode,
          motionPreference: nextPreferences.motionPreference,
        });
      } catch (error) {
        console.error("Failed to persist accessibility preferences", error);
      }
    },
    [isAuthenticated, updateProfile]
  );

  return (
    <TranslationProvider>
      <RecipeListsProvider>
        <ThemeProvider
          initialThemeName={preferredTheme}
          initialCustomThemeShareCode={customThemeShareCode}
          onPersistTheme={persistThemePreference}
          initialAccessibilityPreferences={accessibilityPreferences}
          onPersistAccessibility={persistAccessibilityPreferences}
        >
          <AuthenticatedAppShell
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            user={user}
          />
        </ThemeProvider>
      </RecipeListsProvider>
    </TranslationProvider>
  );
}

type AuthenticatedAppShellProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: unknown;
};

function AuthenticatedAppShell({ isAuthenticated, isLoading, user }: AuthenticatedAppShellProps) {
  const router = useRouter();
  const segments = useSegments();
  const styles = useThemedStyles(createLayoutStyles) as ReturnType<typeof createLayoutStyles>;
  const { tokens } = useThemedStyles((t) => ({ tokens: t })) as { tokens: typeof defaultTokens };
  const { t } = useTranslation();
  const userType = (user as { userType?: string } | null)?.userType ?? "";

  useEffect(() => {
    if (!isAuthenticated || user === undefined) {
      return;
    }

    const segmentsList = segments as string[];
    const inOnboarding = segmentsList[0] === "onboarding";
    const flowSegment = segmentsList.length > 1 ? segmentsList[1] : undefined;
    const onboardingComplete = Boolean((user as { onboardingCompleted?: boolean } | null)?.onboardingCompleted);
    const onboardingEntry =
      userType === "creator"
        ? "/onboarding/creator"
        : userType === "vendor"
        ? "/onboarding/vendor"
        : "/onboarding/accessibility";
    const inCreatorFlow = flowSegment === "creator";
    const inVendorFlow = flowSegment === "vendor";
    const inCorrectFlow =
      (userType === "creator" && inCreatorFlow) ||
      (userType === "vendor" && inVendorFlow) ||
      (!userType && !inCreatorFlow && !inVendorFlow);


    if (!onboardingComplete && !inOnboarding) {
      router.replace(onboardingEntry);
    }

    if (!onboardingComplete && inOnboarding && !inCorrectFlow) {
      router.replace(onboardingEntry);
    }

    if (onboardingComplete && inOnboarding) {
      router.replace("/");
    }
  }, [isAuthenticated, router, segments, user, userType]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  if (user === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar backgroundColor={tokens.colors.background} style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: tokens.colors.surface,
          },
          headerTintColor: tokens.colors.textPrimary,
          headerTitleStyle: {
            fontFamily: tokens.fontFamilies.display,
            fontSize: tokens.typography.title,
          },
          headerBackTitleStyle: {
            fontFamily: tokens.fontFamilies.regular,
            fontSize: tokens.typography.body,
          },
          headerBackTitle: t("navigation.back"),
          headerShadowVisible: true,
          contentStyle: {
            backgroundColor: tokens.colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-task" options={{ presentation: "modal" }} />
        <Stack.Screen name="tasks/[id]" />
        <Stack.Screen name="profile" options={{ title: t("profile.title").toUpperCase() }} />
        <Stack.Screen name="webview/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="legal/[doc]" />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);

  useEffect(() => {
    if (fontError) {
      console.error("Failed to load fonts", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: defaultTokens.colors.surface,
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ConvexAuthProvider
      client={convex}
      storage={
        Platform.OS === "android" || Platform.OS === "ios"
          ? secureStorage
          : undefined
      }
    >
      <AnalyticsProvider>
        <CrashReporter />
        <AuthenticatedApp />
      </AnalyticsProvider>
    </ConvexAuthProvider>
  );
}
