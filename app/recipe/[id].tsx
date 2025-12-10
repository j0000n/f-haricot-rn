import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { IngredientsList } from "@/components/IngredientsList";
import { LoadingScreen } from "@/components/LoadingScreen";
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

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const { t, i18n } = useTranslation();
  const language = (i18n.language || "en") as keyof Recipe["recipeName"];
  const styles = useThemedStyles<Styles>(createStyles);
  const [isRunnerMode, setIsRunnerMode] = useState(false);

  const recipe = useQuery(api.recipes.getById, recipeId ? { id: recipeId } : "skip");
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
    () => decodeEncodedSteps(recipe.encodedSteps, language, "cards", recipe.sourceSteps),
    [language, recipe.encodedSteps, recipe.sourceSteps],
  );

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
          onExit={() => setIsRunnerMode(false)}
        />
      </>
    );
  }

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

        <View style={styles.attribution}>
          <Text style={styles.attributionText}>
            {t("recipe.adaptedFrom")}: {recipe.attribution.source}
          </Text>
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
