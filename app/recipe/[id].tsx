import React, { useMemo, useState, useEffect } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Platform, ActivityIndicator } from "react-native";

import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import * as WebBrowser from "expo-web-browser";

import { api } from "@/convex/_generated/api";
import { IngredientsList } from "@/components/IngredientsList";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NutritionLabel } from "@/components/NutritionLabel";
import { RecipeHeader } from "@/components/RecipeHeader";
import { RecipeRunner } from "@/components/RecipeRunner";
import { TabSwitcher } from "@/components/TabSwitcher";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import { decodeEncodedSteps } from "@/utils/decodeEncodedSteps";

// Conditionally import WebView - it requires native code
let WebView: typeof import("react-native-webview").WebView | null = null;
try {
  if (Platform.OS !== "web") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebViewModule = require("react-native-webview");
    WebView = WebViewModule.WebView;
  }
} catch (error) {
  console.warn("react-native-webview not available:", error);
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    scrollContent: {
      padding: tokens.padding.screen,
      gap: tokens.spacing.lg,
      paddingBottom: tokens.spacing.xxl,
    },
    section: {
      gap: tokens.spacing.xs,
    },
    sectionTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    description: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    step: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: tokens.spacing.sm,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    stepNumber: {
      width: tokens.spacing.lg,
      height: tokens.spacing.lg,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
      color: tokens.colors.accentOnPrimary,
    },
    stepText: {
      flex: 1,
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
      lineHeight: tokens.typography.body * tokens.lineHeights.normal,
    },
    attribution: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    attributionText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    startButton: {
      borderRadius: tokens.radii.md,
      backgroundColor: tokens.colors.accent,
      paddingVertical: tokens.spacing.sm,
      alignItems: "center",
    },
    startButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.accentOnPrimary,
    },
    headerActionText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.accent,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: tokens.padding.screen,
      backgroundColor: tokens.colors.background,
    },
    emptyStateText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      textAlign: "center",
    },
    webView: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    webViewContainer: {
      flex: 1,
      minHeight: 600,
    },
    webViewLoadingContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: tokens.colors.background,
    },
    webViewErrorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: tokens.colors.background,
      padding: tokens.spacing.lg,
      minHeight: 600,
    },
    webViewErrorText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      textAlign: "center",
      marginBottom: tokens.spacing.md,
    },
    openInBrowserButton: {
      backgroundColor: tokens.colors.accent,
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.radii.md,
    },
    openInBrowserButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.accentOnPrimary,
    },
  });

type Styles = ReturnType<typeof createStyles>;

const getHostFromUrl = (url?: string) => {
  if (!url) return undefined;

  try {
    return new URL(url).host;
  } catch (error) {
    console.warn("Unable to parse host from url", url, error);
    return undefined;
  }
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const { t, i18n } = useTranslation();
  const language = (i18n.language || "en") as keyof Recipe["recipeName"];
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const [isRunnerMode, setIsRunnerMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"recipe" | "source">("recipe");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);

  const recipe = useQuery(api.recipes.getById, recipeId ? { id: recipeId } : "skip");
  const translationGuides = useQuery(api.translationGuides.listAll, {});
  const userInventory = useQuery(api.users.getCurrentInventory, {});
  const currentUser = useQuery(api.users.getCurrentUser);

  if (recipe === undefined) {
    return <LoadingScreen />;
  }

  if (recipe === null) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{t("recipe.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const inventoryCodes = Array.isArray(userInventory) ? userInventory : [];
  const decodedSteps = useMemo(
    () =>
      decodeEncodedSteps(
        recipe.encodedSteps,
        language,
        "cards",
        recipe.sourceSteps,
        translationGuides ?? undefined,
      ),
    [language, recipe.encodedSteps, recipe.sourceSteps, translationGuides],
  );

  const attributionDetails = useMemo(() => {
    const authorName =
      recipe.attribution.authorName ||
      recipe.attribution.author ||
      recipe.authorName;
    const authorWebsite = recipe.attribution.authorWebsite || recipe.authorWebsite;
    const authorSocial = recipe.attribution.authorSocial || recipe.authorSocial;
    const sourceHost =
      recipe.attribution.sourceHost ||
      recipe.sourceHost ||
      getHostFromUrl(recipe.sourceUrl || recipe.attribution.sourceUrl);

    const socialParts: string[] = [];
    if (authorSocial?.instagram) {
      socialParts.push(`IG @${authorSocial.instagram}`);
    }
    if (authorSocial?.pinterest) {
      socialParts.push(`Pinterest @${authorSocial.pinterest}`);
    }
    if (authorSocial?.youtube) {
      socialParts.push(`YouTube ${authorSocial.youtube}`);
    }
    if (authorSocial?.facebook) {
      socialParts.push(`Facebook ${authorSocial.facebook}`);
    }

    return {
      sourceHost,
      authorLine: authorName,
      websiteLine: authorWebsite,
      socialLine: socialParts.length > 0 ? socialParts.join(" · ") : undefined,
      fallbackSource: recipe.attribution.source,
    };
  }, [recipe]);

  const headerOptions = {
    title: "",
    headerRight: isRunnerMode
      ? undefined
      : () => (
        <Pressable onPress={() => setIsRunnerMode(true)} accessibilityRole="button">
          <Text style={styles.headerActionText}>👨‍🍳 {t("recipe.startCooking")}</Text>
        </Pressable>
      ),
  };

  if (isRunnerMode) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <RecipeRunner
          recipe={recipe}
          language={language}
          translationGuides={translationGuides ?? undefined}
          onExit={() => setIsRunnerMode(false)}
        />
      </>
    );
  }

  const nutritionFacts = useMemo(() => {
    const profile = recipe.nutritionProfile;

    // Default values if nutrition profile is not available
    if (!profile) {
      return {
        servingPerContainer: "1",
        servingSize: `${recipe.servings} ${recipe.servings === 1 ? "serving" : "servings"}`,
        calories: 0,
        nutrients: [],
        notes: [
          "* Nutrition information is not available for this recipe.",
          "* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 Calories a day is used for general nutrition advice.",
        ],
        caloriesPerGram: {
          fat: 9,
          carbohydrate: 4,
          protein: 4,
        },
      };
    }

    const nutrients: Array<{
      key: string;
      label: string;
      amount: string;
      percentDailyValue?: number;
      isHeader?: boolean;
      isSubItem?: boolean;
    }> = [];

    // Total Fat
    if (profile.fatPerServing > 0) {
      nutrients.push({
        key: "totalFat",
        label: "Total Fat",
        amount: `${profile.fatPerServing} g`,
        percentDailyValue: Math.round((profile.fatPerServing / 78) * 100),
        isHeader: true,
      });
    }

    // Carbohydrates
    if (profile.carbsPerServing > 0) {
      nutrients.push({
        key: "totalCarbohydrate",
        label: "Total Carbohydrate",
        amount: `${profile.carbsPerServing} g`,
        percentDailyValue: Math.round((profile.carbsPerServing / 275) * 100),
        isHeader: true,
      });

      if (profile.fiberPerServing !== undefined && profile.fiberPerServing > 0) {
        nutrients.push({
          key: "dietaryFiber",
          label: "Dietary Fiber",
          amount: `${profile.fiberPerServing} g`,
          percentDailyValue: Math.round((profile.fiberPerServing / 28) * 100),
          isSubItem: true,
        });
      }

      if (profile.sugarsPerServing !== undefined && profile.sugarsPerServing > 0) {
        nutrients.push({
          key: "totalSugars",
          label: "Total Sugars",
          amount: `${profile.sugarsPerServing} g`,
          isSubItem: true,
        });
      }
    }

    // Protein
    if (profile.proteinPerServing > 0) {
      nutrients.push({
        key: "protein",
        label: "Protein",
        amount: `${profile.proteinPerServing} g`,
        percentDailyValue: Math.round((profile.proteinPerServing / 50) * 100),
        isHeader: true,
      });
    }

    // Sodium (if available)
    if (profile.sodiumPerServing !== undefined && profile.sodiumPerServing > 0) {
      nutrients.push({
        key: "sodium",
        label: "Sodium",
        amount: `${profile.sodiumPerServing} mg`,
        percentDailyValue: Math.round((profile.sodiumPerServing / 2300) * 100),
        isHeader: true,
      });
    }

    return {
      servingPerContainer: "1",
      servingSize: `${recipe.servings} ${recipe.servings === 1 ? "serving" : "servings"}`,
      calories: profile.caloriesPerServing,
      nutrients,
      notes: [
        "* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 Calories a day is used for general nutrition advice.",
      ],
      caloriesPerGram: {
        fat: 9,
        carbohydrate: 4,
        protein: 4,
      },
    };
  }, [recipe.nutritionProfile, recipe.servings]);

  const dailyValues = useMemo(() => {
    const userGoals = (currentUser as { nutritionGoals?: { targets?: {
      calories?: number | null;
      protein?: number | null;
      fat?: number | null;
      carbohydrates?: number | null;
      fiber?: number | null;
      sodium?: number | null;
      saturatedFat?: number | null;
    } } } | null)?.nutritionGoals?.targets;

    const defaults = {
      totalFat: 78,
      saturatedFat: 20,
      cholesterol: 300,
      sodium: 2300,
      totalCarbohydrate: 275,
      dietaryFiber: 28,
      protein: 50,
      vitaminD: 20,
      calcium: 1300,
      iron: 18,
      potassium: 4700,
    };

    return {
      default: defaults,
      user: userGoals ? {
        totalFat: userGoals.fat ?? defaults.totalFat,
        saturatedFat: userGoals.saturatedFat ?? defaults.saturatedFat,
        sodium: userGoals.sodium ?? defaults.sodium,
        totalCarbohydrate: userGoals.carbohydrates ?? defaults.totalCarbohydrate,
        dietaryFiber: userGoals.fiber ?? defaults.dietaryFiber,
        protein: userGoals.protein ?? defaults.protein,
      } : defaults,
      family: defaults, // TODO: Calculate from household members' goals
    };
  }, [currentUser]);

  const handleOpenInBrowser = async () => {
    if (recipe.sourceUrl) {
      await WebBrowser.openBrowserAsync(recipe.sourceUrl);
    }
  };

  // Reset WebView loading state when switching tabs
  useEffect(() => {
    if (activeTab === "source") {
      setWebViewLoading(true);
      setWebViewError(false);
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={headerOptions} />

      {/* Tab Switcher - only show if recipe has sourceUrl */}
      {recipe.sourceUrl && (
        <View style={{ padding: tokens.padding.screen, paddingBottom: 0 }}>
          <TabSwitcher
            tabs={[
              { id: "recipe", label: t("recipe.tabRecipe", { defaultValue: "Recipe" }) },
              { id: "source", label: t("recipe.tabSource", { defaultValue: "Source" }) },
            ]}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as "recipe" | "source")}
          />
        </View>
      )}

      {activeTab === "recipe" ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecipeHeader
            recipe={recipe}
            language={language}
            onStartCooking={() => setIsRunnerMode(true)}
            userInventory={inventoryCodes}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("recipe.description")}</Text>
            <Text style={styles.description}>
              {recipe.description[language] || recipe.description.en}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("recipe.ingredients")} ({recipe.ingredients.length})
            </Text>
            <IngredientsList
              ingredients={recipe.ingredients}
              userInventory={inventoryCodes}
              language={language}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("recipe.instructions")}</Text>
            {decodedSteps.map((step) => (
              <View key={step.stepNumber} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                </View>
                <Text style={styles.stepText}>{step.detail || step.title}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("recipe.nutrition", { defaultValue: "Nutrition" })}</Text>
            <NutritionLabel
              facts={nutritionFacts}
              goalContext="user"
              dailyValues={dailyValues}
              showGoalContextLabel
            />
          </View>

          <View style={styles.attribution}>
            <Text style={styles.attributionText}>
              {t("recipe.adaptedFrom")}:
              {" "}
              {attributionDetails.sourceHost || attributionDetails.fallbackSource}
            </Text>
            {attributionDetails.authorLine ? (
              <Text style={styles.attributionText}>{attributionDetails.authorLine}</Text>
            ) : null}
            {attributionDetails.websiteLine ? (
              <Text style={styles.attributionText}>{attributionDetails.websiteLine}</Text>
            ) : null}
            {attributionDetails.socialLine ? (
              <Text style={styles.attributionText}>{attributionDetails.socialLine}</Text>
            ) : null}
          </View>

          <Pressable
            style={styles.startButton}
            onPress={() => setIsRunnerMode(true)}
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>👨‍🍳 {t("recipe.startCooking")}</Text>
          </Pressable>
      </ScrollView>
      ) : recipe.sourceUrl ? (
        <View style={styles.webViewContainer}>
          {WebView ? (
            <>
              <WebView
                source={{ uri: recipe.sourceUrl }}
                style={styles.webView}
                startInLoadingState
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsFullscreenVideo
                mixedContentMode="always"
                onLoadEnd={() => setWebViewLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("WebView error: ", nativeEvent);
                  setWebViewError(true);
                  setWebViewLoading(false);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("WebView HTTP error: ", nativeEvent);
                  // Don't treat HTTP errors as fatal - some sites return 403/404 but still render
                }}
              />
              {webViewLoading && (
                <View style={styles.webViewLoadingContainer}>
                  <ActivityIndicator size="large" color={tokens.colors.accent} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.webViewErrorContainer}>
              <Text style={styles.webViewErrorText}>
                {t("recipe.webViewUnavailable", { defaultValue: "WebView is not available on this platform." })}
              </Text>
              <Pressable
                style={styles.openInBrowserButton}
                onPress={handleOpenInBrowser}
                accessibilityRole="button"
              >
                <Text style={styles.openInBrowserButtonText}>
                  {t("recipe.openInBrowser", { defaultValue: "Open in Browser" })}
                </Text>
              </Pressable>
            </View>
          )}
          {webViewError && (
            <View style={styles.webViewErrorContainer}>
              <Text style={styles.webViewErrorText}>
                {t("recipe.webViewError", { defaultValue: "Failed to load the source page." })}
              </Text>
              <Pressable
                style={styles.openInBrowserButton}
                onPress={handleOpenInBrowser}
                accessibilityRole="button"
              >
                <Text style={styles.openInBrowserButtonText}>
                  {t("recipe.openInBrowser", { defaultValue: "Open in Browser" })}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
