import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { IngredientsList } from "@/components/IngredientsList";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NutritionLabel } from "@/components/NutritionLabel";
import { RecipeHeader } from "@/components/RecipeHeader";
import { RecipeRunner } from "@/components/RecipeRunner";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles } from "@/styles/tokens";
import { decodeEncodedSteps } from "@/utils/decodeEncodedSteps";

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
  const [isRunnerMode, setIsRunnerMode] = useState(false);

  const recipe = useQuery(api.recipes.getById, recipeId ? { id: recipeId } : "skip");
  const translationGuides = useQuery(api.translationGuides.listAll, {});
  const userInventory = useQuery(api.users.getCurrentInventory, {});

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

  const nutritionFacts = useMemo(
    () => ({
      servingPerContainer: "1",
      servingSize: "1 Package",
      calories: 150,
      nutrients: [
        { key: "totalFat", label: "Total Fat", amount: "7 g", percentDailyValue: 10, isHeader: true },
        { key: "saturatedFat", label: "Saturated Fat", amount: "1 g", percentDailyValue: 5, isSubItem: true },
        { key: "transFat", label: "Trans Fat", amount: "0 g", isSubItem: true },
        { key: "cholesterol", label: "Cholesterol", amount: "0 mg", percentDailyValue: 0, isHeader: true },
        { key: "sodium", label: "Sodium", amount: "160 mg", percentDailyValue: 7, isHeader: true },
        { key: "totalCarbohydrate", label: "Total Carbohydrate", amount: "18 g", percentDailyValue: 6, isHeader: true },
        { key: "dietaryFiber", label: "Dietary Fiber", amount: "1 g", percentDailyValue: 5, isSubItem: true },
        { key: "totalSugars", label: "Total Sugars", amount: "< 1 g", isSubItem: true },
        { key: "protein", label: "Protein", amount: "2 g", isHeader: true },
        { key: "vitaminD", label: "Vitamin D", amount: "0 mcg", percentDailyValue: 0, isHeader: true },
        { key: "calcium", label: "Calcium", amount: "40 mg", percentDailyValue: 2, isHeader: true },
        { key: "iron", label: "Iron", amount: "0.3 mg", percentDailyValue: 0, isHeader: true },
        { key: "potassium", label: "Potassium", amount: "100 mg", percentDailyValue: 2, isHeader: true },
      ],
      notes: [
        "Not a significant source of added sugars.",
        "* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 Calories a day is used for general nutrition advice.",
      ],
      caloriesPerGram: {
        fat: 9,
        carbohydrate: 4,
        protein: 4,
      },
    }),
    [],
  );

  const dailyValues = useMemo(
    () => ({
      default: {
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
      },
      user: {
        totalFat: 70,
        saturatedFat: 15,
        sodium: 2000,
      },
      family: {
        totalFat: 90,
        saturatedFat: 22,
        sodium: 2400,
      },
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={headerOptions} />

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
    </SafeAreaView>
  );
}
