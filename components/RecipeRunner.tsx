import React, { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import type { TranslationGuideRow } from "@/data/translationGuideSeed";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import { decodeEncodedSteps } from "@/utils/decodeEncodedSteps";
import { TabSwitcher } from "@/components/TabSwitcher";

interface RecipeRunnerProps {
  recipe: Recipe;
  language: keyof Recipe["recipeName"];
  translationGuides?: TranslationGuideRow[];
  onExit: () => void;
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
      padding: tokens.padding.screen,
      gap: tokens.spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    exitButton: {
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.surface,
    },
    exitButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
      color: tokens.colors.accent,
    },
    progress: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    progressBar: {
      height: tokens.spacing.xxs,
      backgroundColor: tokens.colors.overlay,
      borderRadius: tokens.radii.sm,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: tokens.colors.accent,
    },
    stepContainer: {
      flex: 1,
      gap: tokens.spacing.sm,
    },
    stepNumber: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    instruction: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    temperature: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.sm,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    temperatureText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textPrimary,
    },
    navigation: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: tokens.spacing.sm,
    },
    navButton: {
      flex: 1,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.sm,
      backgroundColor: tokens.colors.surface,
      alignItems: "center",
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    navButtonDisabled: {
      opacity: tokens.opacity.disabled,
    },
    navButtonText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    primaryButton: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    primaryButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.accentOnPrimary,
    },
    completeButton: {
      backgroundColor: tokens.colors.success,
      borderColor: tokens.colors.success,
    },
    timer: {
      gap: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    timerLabel: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    timerValue: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: tokens.typography.heading,
      color: tokens.colors.textPrimary,
    },
    timerControls: {
      flexDirection: "row",
      gap: tokens.spacing.xs,
    },
    timerButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.overlay,
    },
    timerButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textPrimary,
    },
  });

export const RecipeRunner: React.FC<RecipeRunnerProps> = ({
  recipe,
  language,
  translationGuides,
  onExit,
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<string | null>(null);

  // Determine if recipe has multiple cooking methods
  const hasMultipleMethods = recipe.cookingMethods && recipe.cookingMethods.length >= 2;

  // Set default selected method on mount
  useEffect(() => {
    if (hasMultipleMethods && !selectedCookingMethod && recipe.cookingMethods) {
      setSelectedCookingMethod(recipe.cookingMethods[0].methodName);
    }
  }, [hasMultipleMethods, selectedCookingMethod, recipe.cookingMethods]);

  // Determine which steps to use
  const steps = useMemo(() => {
    if (hasMultipleMethods && selectedCookingMethod) {
      // Find selected method's steps
      const method = recipe.cookingMethods!.find((m) => m.methodName === selectedCookingMethod);
      if (method) {
        return decodeEncodedSteps(
          method.encodedSteps,
          language,
          "runner",
          method.steps,
          translationGuides,
        );
      }
    }

    // Fallback to regular steps
    return decodeEncodedSteps(
      recipe.encodedSteps,
      language,
      "runner",
      recipe.sourceSteps,
      translationGuides,
    );
  }, [
    hasMultipleMethods,
    selectedCookingMethod,
    recipe.cookingMethods,
    recipe.encodedSteps,
    recipe.sourceSteps,
    language,
    translationGuides,
  ]);
  const totalSteps = steps.length || 1;
  const step = steps[currentStep] ?? {
    stepNumber: currentStep + 1,
    title: t("recipe.step"),
    detail: t("recipe.step"),
    mode: "runner" as const,
  };
  const isLastStep = currentStep === totalSteps - 1;

  const progress = useMemo(
    () => `${Math.round(((currentStep + 1) / Math.max(totalSteps, 1)) * 100)}%`,
    [currentStep, totalSteps],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.exitButton} onPress={onExit} accessibilityRole="button">
          <Text style={styles.exitButtonText}>{t("common.exit")}</Text>
        </Pressable>
        <Text style={styles.progress}>
          {currentStep + 1} / {totalSteps} ({progress})
        </Text>
      </View>

      {/* Method tabs - only show if multiple methods exist */}
      {hasMultipleMethods && recipe.cookingMethods && (
        <View style={{ marginBottom: tokens.spacing.md }}>
          <TabSwitcher
            tabs={recipe.cookingMethods.map((method) => ({
              id: method.methodName,
              label: method.methodName,
            }))}
            activeTab={selectedCookingMethod || recipe.cookingMethods[0].methodName}
            onTabChange={(id) => {
              setSelectedCookingMethod(id);
              setCurrentStep(0); // Reset to first step when switching methods
            }}
          />
        </View>
      )}

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / Math.max(totalSteps, 1)) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.stepContainer}>
        <Text style={styles.stepNumber}>
          {t("recipe.step")} {step.stepNumber}
        </Text>
        <Text style={styles.instruction}>{step.detail || step.title}</Text>
      </View>

      <View style={styles.navigation}>
        <Pressable
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          <Text style={styles.navButtonText}>⬅️ {t("recipe.previous")}</Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, styles.primaryButton, isLastStep && styles.completeButton]}
          onPress={() => {
            if (isLastStep) {
              onExit();
            } else {
              setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
            }
          }}
        >
          <Text style={styles.primaryButtonText}>
            {isLastStep ? `✅ ${t("recipe.complete")}` : `${t("recipe.next")} ➡️`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
