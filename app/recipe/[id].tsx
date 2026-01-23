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
import { getRecipeLanguage } from "@/utils/translation";

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

/**
 * Estimates serving size based on meal type tags and recipe name
 * Returns a physical quantity like "1 cup", "1 piece", etc.
 */
function estimateServingSize(
  mealTypeTags?: string[],
  recipeName?: { en?: string },
): string {
  const tags = mealTypeTags || [];
  const name = recipeName?.en?.toLowerCase() || "";

  // Soups and stews
  if (
    tags.some((tag) => tag.toLowerCase().includes("soup")) ||
    tags.some((tag) => tag.toLowerCase().includes("stew")) ||
    name.includes("soup") ||
    name.includes("stew") ||
    name.includes("broth")
  ) {
    return "1 cup";
  }

  // Salads
  if (
    tags.some((tag) => tag.toLowerCase().includes("salad")) ||
    name.includes("salad")
  ) {
    return "1 cup";
  }

  // Desserts and baked goods
  if (
    tags.some((tag) => tag.toLowerCase().includes("dessert")) ||
    tags.some((tag) => tag.toLowerCase().includes("baking")) ||
    name.includes("cake") ||
    name.includes("cookie") ||
    name.includes("pie") ||
    name.includes("brownie") ||
    name.includes("muffin") ||
    name.includes("cupcake")
  ) {
    // Check if it's sliceable (cake, pie) vs individual (cookie, muffin)
    if (
      name.includes("cake") ||
      name.includes("pie") ||
      name.includes("bread") ||
      name.includes("loaf")
    ) {
      return "1 slice";
    }
    return "1 piece";
  }

  // Main dishes - default to "1 serving"
  return "1 serving";
}

/**
 * Formats serving size as a fraction of container when the serving size is generic.
 * For example, "1 serving" with 4 servings per container becomes "1/4 of container".
 * Specific sizes like "2 cups" are kept as-is.
 */
function formatServingSizeAsFraction(
  servingSize: string,
  servingsPerContainer: number,
  t: (key: string) => string,
): string {
  // If only 1 serving, always return original
  if (servingsPerContainer === 1) {
    return servingSize;
  }

  // Check if serving size is generic (e.g., "1 serving", "1 piece", "1 slice", "1 cup")
  // Pattern matches: "1 " followed by a unit word (serving, piece, slice, cup)
  const genericPattern = /^1\s+(serving|piece|slice|cup)$/i;
  const isGeneric = genericPattern.test(servingSize.trim());

  if (!isGeneric) {
    // Keep specific sizes as-is (e.g., "2 cups", "1.5 cups", "250g", "1/2 cup")
    return servingSize;
  }

  // Format as fraction
  const fraction = `1/${servingsPerContainer}`;
  return `${fraction} ${t("recipe.nutrition.ofContainer")}`;
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
  // Map i18n language code (e.g., "fr-FR") to recipe language code (e.g., "fr")
  const recipeLanguage = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const [isRunnerMode, setIsRunnerMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"recipe" | "source">("recipe");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<string | null>(null);

  const recipe = useQuery(api.recipes.getById, recipeId ? { id: recipeId } : "skip");
  const translationGuides = useQuery(api.translationGuides.listAll, {});
  const userInventory = useQuery(api.users.getCurrentInventory, {});
  const currentUser = useQuery(api.users.getCurrentUser);

  const inventoryCodes = Array.isArray(userInventory) ? userInventory : [];

  // Determine if recipe has multiple cooking methods (safe when recipe is null/undefined)
  const hasMultipleMethods = recipe?.cookingMethods && recipe.cookingMethods.length >= 2;

  // Determine which steps to display (must be called before conditional returns)
  const stepsToDisplay = useMemo(() => {
    if (!recipe) return [];
    
    if (hasMultipleMethods && selectedCookingMethod && recipe.cookingMethods) {
      // Find selected method's steps
      const method = recipe.cookingMethods.find((m) => m.methodName === selectedCookingMethod);
      if (method) {
        // Decode steps for this method (if encodedSteps exists) or use sourceSteps
        // Prioritize method-specific localized steps, fallback to recipe-level localized steps
        return decodeEncodedSteps(
          method.encodedSteps,
          recipeLanguage,
          "cards",
          method.steps,
          translationGuides ?? undefined,
          method.stepsLocalized || recipe.sourceStepsLocalized,
        );
      }
    }

    // Fallback to regular decodedSteps (for single-method or when no method selected)
    return decodeEncodedSteps(
      recipe.encodedSteps,
      recipeLanguage,
      "cards",
      recipe.sourceSteps,
      translationGuides ?? undefined,
      recipe.sourceStepsLocalized,
    );
  }, [
    recipe,
    hasMultipleMethods,
    selectedCookingMethod,
    recipe?.cookingMethods,
    recipe?.encodedSteps,
    recipe?.sourceSteps,
    recipe?.sourceStepsLocalized,
    recipeLanguage,
    translationGuides,
  ]);

  // Set default selected method on mount (must be called before conditional returns)
  useEffect(() => {
    if (recipe && hasMultipleMethods && !selectedCookingMethod && recipe.cookingMethods) {
      setSelectedCookingMethod(recipe.cookingMethods[0].methodName);
    }
  }, [recipe, hasMultipleMethods, selectedCookingMethod, recipe?.cookingMethods]);

  // Keep decodedSteps for backward compatibility (must be called before conditional returns)
  const decodedSteps = useMemo(
    () => {
      if (!recipe) return [];
      return decodeEncodedSteps(
        recipe.encodedSteps,
        recipeLanguage,
        "cards",
        recipe.sourceSteps,
        translationGuides ?? undefined,
        recipe.sourceStepsLocalized,
      );
    },
    [recipe, recipeLanguage, recipe?.encodedSteps, recipe?.sourceSteps, translationGuides, recipe?.sourceStepsLocalized],
  );

  const attributionDetails = useMemo(() => {
    if (!recipe) {
      return {
        sourceHost: undefined,
        authorLine: undefined,
        websiteLine: undefined,
        socialLine: undefined,
        fallbackSource: undefined,
      };
    }
    
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

  const nutritionFacts = useMemo(() => {
    if (!recipe) {
      return {
        servingPerContainer: "1",
        servingSize: "1 serving",
        calories: 0,
        nutrients: [],
        notes: [
          t("recipe.nutrition.nutritionNotAvailable"),
          t("recipe.nutrition.dailyValueNote"),
        ],
        caloriesPerGram: {
          fat: 9,
          carbohydrate: 4,
          protein: 4,
        },
      };
    }
    
    const profile = recipe.nutritionProfile;

    // Determine serving size: use stored value if available, otherwise estimate
    const rawServingSize =
      profile?.servingSize ||
      estimateServingSize(recipe.mealTypeTags, recipe.recipeName);

    // Format serving size as fraction of container if generic
    const servingSize = formatServingSizeAsFraction(rawServingSize, recipe.servings, t);

    // Default values if nutrition profile is not available
    if (!profile) {
      return {
        servingPerContainer: recipe.servings.toString(),
        servingSize,
        calories: 0,
        nutrients: [],
        notes: [
          t("recipe.nutrition.nutritionNotAvailable"),
          t("recipe.nutrition.dailyValueNote"),
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
        label: t("recipe.nutrition.totalFat"),
        amount: `${profile.fatPerServing} g`,
        percentDailyValue: Math.round((profile.fatPerServing / 78) * 100),
        isHeader: true,
      });
    }

    // Carbohydrates
    if (profile.carbsPerServing > 0) {
      nutrients.push({
        key: "totalCarbohydrate",
        label: t("recipe.nutrition.totalCarbohydrate"),
        amount: `${profile.carbsPerServing} g`,
        percentDailyValue: Math.round((profile.carbsPerServing / 275) * 100),
        isHeader: true,
      });

      if (profile.fiberPerServing !== undefined && profile.fiberPerServing > 0) {
        nutrients.push({
          key: "dietaryFiber",
          label: t("recipe.nutrition.dietaryFiber"),
          amount: `${profile.fiberPerServing} g`,
          percentDailyValue: Math.round((profile.fiberPerServing / 28) * 100),
          isSubItem: true,
        });
      }

      if (profile.sugarsPerServing !== undefined && profile.sugarsPerServing > 0) {
        nutrients.push({
          key: "totalSugars",
          label: t("recipe.nutrition.totalSugars"),
          amount: `${profile.sugarsPerServing} g`,
          isSubItem: true,
        });
      }
    }

    // Protein
    if (profile.proteinPerServing > 0) {
      nutrients.push({
        key: "protein",
        label: t("recipe.nutrition.protein"),
        amount: `${profile.proteinPerServing} g`,
        percentDailyValue: Math.round((profile.proteinPerServing / 50) * 100),
        isHeader: true,
      });
    }

    // Sodium (if available)
    if (profile.sodiumPerServing !== undefined && profile.sodiumPerServing > 0) {
      nutrients.push({
        key: "sodium",
        label: t("recipe.nutrition.sodium"),
        amount: `${profile.sodiumPerServing} mg`,
        percentDailyValue: Math.round((profile.sodiumPerServing / 2300) * 100),
        isHeader: true,
      });
    }

    return {
      servingPerContainer: recipe.servings.toString(),
      servingSize,
      calories: profile.caloriesPerServing,
      nutrients,
      notes: [
        t("recipe.nutrition.dailyValueNote"),
      ],
      caloriesPerGram: {
        fat: 9,
        carbohydrate: 4,
        protein: 4,
      },
    };
  }, [recipe, recipe?.nutritionProfile, recipe?.servings, recipe?.mealTypeTags, recipe?.recipeName, t]);

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
    if (recipe?.sourceUrl) {
      await WebBrowser.openBrowserAsync(recipe.sourceUrl!);
    }
  };

  // Reset WebView loading state when switching tabs (must be called before conditional returns)
  useEffect(() => {
    if (activeTab === "source") {
      setWebViewLoading(true);
      setWebViewError(false);
    }
  }, [activeTab]);

  // Early returns must come AFTER all hooks
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

  if (isRunnerMode) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <RecipeRunner
          recipe={recipe}
          language={recipeLanguage}
          translationGuides={translationGuides ?? undefined}
          onExit={() => setIsRunnerMode(false)}
        />
      </>
    );
  }

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
            language={recipeLanguage}
            onStartCooking={() => setIsRunnerMode(true)}
            userInventory={inventoryCodes}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("recipe.description")}</Text>
            <Text style={styles.description}>
              {recipe.description[recipeLanguage] || recipe.description.en}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("recipe.ingredients")} ({recipe.ingredients.length})
            </Text>
            <IngredientsList
              ingredients={recipe.ingredients}
              userInventory={inventoryCodes}
              language={recipeLanguage}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("recipe.instructions")}</Text>

            {/* Method tabs - only show if multiple methods exist */}
            {hasMultipleMethods && recipe.cookingMethods && (
              <View style={{ marginBottom: tokens.spacing.md }}>
                <TabSwitcher
                  tabs={recipe.cookingMethods.map((method) => ({
                    id: method.methodName,
                    label: method.methodName,
                  }))}
                  activeTab={selectedCookingMethod || recipe.cookingMethods[0].methodName}
                  onTabChange={(id) => setSelectedCookingMethod(id)}
                />
              </View>
            )}

            {/* Display steps */}
            {stepsToDisplay.map((step) => (
              <View key={step.stepNumber} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                </View>
                <Text style={styles.stepText}>{step.detail || step.title}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("recipe.nutrition.nutritionFacts")}</Text>
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
