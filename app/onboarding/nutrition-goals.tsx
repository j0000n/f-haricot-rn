import createOnboardingStyles from "@/styles/onboardingStyles";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemedStyles } from "@/styles/tokens";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { useTranslation } from "@/i18n/useTranslation";
import {
  CATEGORY_BUCKETS,
  GOAL_PRESETS,
  SECONDARY_METRICS,
  createEmptyNutritionGoals,
  derivePerMealTargets,
  mergePresetDefaults,
  sanitizeNumber,
  type NutritionGoals,
  type NutritionMetric,
} from "@/utils/nutritionGoals";

const SECONDARY_FIELDS: Record<
  NutritionMetric,
  keyof NutritionGoals["targets"]
> = {
  fiber: "fiber",
  addedSugar: "addedSugar",
  saturatedFat: "saturatedFat",
  sodium: "sodium",
};

const formatNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

export default function NutritionGoalsScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [trackedMetrics, setTrackedMetrics] = useState<NutritionMetric[]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [displayPreferences, setDisplayPreferences] = useState(
    createEmptyNutritionGoals().displayPreferences
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentGoals: NutritionGoals = useMemo(
    () => ({
      preset: selectedPreset,
      categories: selectedCategories,
      targets: {
        calories: sanitizeNumber(targets.calories),
        protein: sanitizeNumber(targets.protein),
        fat: sanitizeNumber(targets.fat),
        carbohydrates: sanitizeNumber(targets.carbohydrates),
        fiber: trackedMetrics.includes("fiber")
          ? sanitizeNumber(targets.fiber)
          : undefined,
        addedSugar: trackedMetrics.includes("addedSugar")
          ? sanitizeNumber(targets.addedSugar)
          : undefined,
        saturatedFat: trackedMetrics.includes("saturatedFat")
          ? sanitizeNumber(targets.saturatedFat)
          : undefined,
        sodium: trackedMetrics.includes("sodium")
          ? sanitizeNumber(targets.sodium)
          : undefined,
      },
      trackedMetrics,
      displayPreferences,
    }),
    [displayPreferences, selectedCategories, selectedPreset, targets, trackedMetrics]
  );

  const perMealPreview = derivePerMealTargets(
    currentGoals.targets,
    currentGoals.displayPreferences.mealCount
  );

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    const storedGoals = (user as { nutritionGoals?: NutritionGoals | null })
      .nutritionGoals;

    if (storedGoals) {
      setSelectedPreset(storedGoals.preset ?? null);
      setSelectedCategories(storedGoals.categories ?? []);
      setTrackedMetrics(storedGoals.trackedMetrics ?? []);
      setTargets({
        calories: formatNumber(storedGoals.targets?.calories),
        protein: formatNumber(storedGoals.targets?.protein),
        fat: formatNumber(storedGoals.targets?.fat),
        carbohydrates: formatNumber(storedGoals.targets?.carbohydrates),
        fiber: formatNumber(storedGoals.targets?.fiber),
        addedSugar: formatNumber(storedGoals.targets?.addedSugar),
        saturatedFat: formatNumber(storedGoals.targets?.saturatedFat),
        sodium: formatNumber(storedGoals.targets?.sodium),
      });
      setDisplayPreferences(
        storedGoals.displayPreferences ?? createEmptyNutritionGoals().displayPreferences
      );
      return;
    }

    const defaultGoals = GOAL_PRESETS[0]?.defaults ?? createEmptyNutritionGoals();
    setSelectedPreset(defaultGoals.preset ?? null);
    setSelectedCategories(defaultGoals.categories ?? []);
    setTrackedMetrics(defaultGoals.trackedMetrics ?? []);
    setTargets({
      calories: formatNumber(defaultGoals.targets?.calories),
      protein: formatNumber(defaultGoals.targets?.protein),
      fat: formatNumber(defaultGoals.targets?.fat),
      carbohydrates: formatNumber(defaultGoals.targets?.carbohydrates),
      fiber: formatNumber(defaultGoals.targets?.fiber),
      addedSugar: formatNumber(defaultGoals.targets?.addedSugar),
      saturatedFat: formatNumber(defaultGoals.targets?.saturatedFat),
      sodium: formatNumber(defaultGoals.targets?.sodium),
    });
    setDisplayPreferences(defaultGoals.displayPreferences);
  }, [user]);

  const toggleCategory = (value: string) => {
    setSelectedCategories((current) => {
      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }
      return [...current, value];
    });
  };

  const toggleMetric = (metric: NutritionMetric) => {
    setTrackedMetrics((current) => {
      if (current.includes(metric)) {
        return current.filter((entry) => entry !== metric);
      }
      return [...current, metric];
    });
  };

  const handlePresetSelect = (presetId: string) => {
    const merged = mergePresetDefaults(presetId, currentGoals);
    setSelectedPreset(presetId);
    setSelectedCategories(merged.categories ?? []);
    setTrackedMetrics(merged.trackedMetrics ?? []);
    setTargets({
      calories: formatNumber(merged.targets?.calories),
      protein: formatNumber(merged.targets?.protein),
      fat: formatNumber(merged.targets?.fat),
      carbohydrates: formatNumber(merged.targets?.carbohydrates),
      fiber: formatNumber(merged.targets?.fiber),
      addedSugar: formatNumber(merged.targets?.addedSugar),
      saturatedFat: formatNumber(merged.targets?.saturatedFat),
      sodium: formatNumber(merged.targets?.sodium),
    });
    setDisplayPreferences(merged.displayPreferences);
  };

  const handleTargetChange = (key: string, value: string) => {
    setTargets((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await updateProfile({ nutritionGoals: currentGoals });
      router.push("/onboarding/meal-preferences");
    } catch (error) {
      console.error("Failed to save nutrition goals", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        "We couldn’t save your nutrition goals. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={onboardingStyles.container}>
      <ScrollView
        contentContainerStyle={[
          onboardingStyles.content,
          onboardingStyles.contentWithNavigation,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={onboardingStyles.card}>
          <View style={onboardingStyles.logoRow}>
            <BrandLogo size={72} />
          </View>
          <View style={onboardingStyles.header}>
            <Text style={onboardingStyles.title}>
              {t("onboarding.nutritionGoals.title", { defaultValue: "Nutrition goals" })}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.nutritionGoals.subtitle", {
                defaultValue:
                  "Tell us how you want to eat so we can surface the right recipes and hints.",
              })}
            </Text>
          </View>

          <View style={onboardingStyles.suggestionGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.nutritionGoals.starter", { defaultValue: "Starter profile" })}
            </Text>
            <View style={onboardingStyles.optionsContainer}>
              {GOAL_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => handlePresetSelect(preset.id)}
                    style={[
                      onboardingStyles.optionButton,
                      isSelected ? onboardingStyles.optionSelected : null,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={onboardingStyles.optionText}>{preset.title}</Text>
                      <Text style={onboardingStyles.helperText}>{preset.description}</Text>
                    </View>
                    {isSelected ? <Text style={onboardingStyles.optionText}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={onboardingStyles.suggestionGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.nutritionGoals.categories", { defaultValue: "Goal categories" })}
            </Text>
            <Text style={onboardingStyles.helperText}>
              {t("onboarding.nutritionGoals.categoriesHelper", {
                defaultValue:
                  "Pick every bucket that sounds relevant—we’ll resolve overlaps for you.",
              })}
            </Text>
            <View style={onboardingStyles.optionsContainer}>
              {CATEGORY_BUCKETS.map((bucket) => (
                <View key={bucket.title} style={{ gap: 8 }}>
                  <Text style={onboardingStyles.helperText}>{bucket.title}</Text>
                  <View style={onboardingStyles.suggestionRow}>
                    {bucket.options.map((option) => {
                      const isActive = selectedCategories.includes(option);
                      return (
                        <Pressable
                          key={option}
                          onPress={() => toggleCategory(option)}
                          style={[
                            onboardingStyles.suggestionChip,
                            isActive ? onboardingStyles.suggestionChipActive : null,
                          ]}
                        >
                          <Text
                            style={[
                              onboardingStyles.suggestionChipText,
                              isActive ? onboardingStyles.suggestionChipTextActive : null,
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={onboardingStyles.suggestionGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.nutritionGoals.daily", { defaultValue: "Daily targets" })}
            </Text>
            <Text style={onboardingStyles.helperText}>
              {t("onboarding.nutritionGoals.dailyHelper", {
                defaultValue:
                  "Set the metrics that matter most. Leave anything blank and we’ll adapt dynamically.",
              })}
            </Text>
            <View style={onboardingStyles.inlineInputRow}>
              <View style={onboardingStyles.inputGroup}>
                <Text style={onboardingStyles.inputLabel}>
                  {t("onboarding.nutritionGoals.calories", { defaultValue: "Calories (kcal)" })}
                </Text>
                <TextInput
                  value={targets.calories ?? ""}
                  onChangeText={(value: string) => handleTargetChange("calories", value)}
                  keyboardType="numeric"
                  style={[onboardingStyles.textField, { flex: 1 }]}
                  placeholder="e.g. 2000"
                />
              </View>
              <View style={onboardingStyles.inputGroup}>
                <Text style={onboardingStyles.inputLabel}>
                  {t("onboarding.nutritionGoals.protein", { defaultValue: "Protein (g)" })}
                </Text>
                <TextInput
                  value={targets.protein ?? ""}
                  onChangeText={(value: string) => handleTargetChange("protein", value)}
                  keyboardType="numeric"
                  style={[onboardingStyles.textField, { flex: 1 }]}
                  placeholder="e.g. 150"
                />
              </View>
            </View>
            <View style={onboardingStyles.inlineInputRow}>
              <View style={onboardingStyles.inputGroup}>
                <Text style={onboardingStyles.inputLabel}>
                  {t("onboarding.nutritionGoals.fat", { defaultValue: "Fat (g)" })}
                </Text>
                <TextInput
                  value={targets.fat ?? ""}
                  onChangeText={(value: string) => handleTargetChange("fat", value)}
                  keyboardType="numeric"
                  style={[onboardingStyles.textField, { flex: 1 }]}
                  placeholder="e.g. 70"
                />
              </View>
              <View style={onboardingStyles.inputGroup}>
                <Text style={onboardingStyles.inputLabel}>
                  {t("onboarding.nutritionGoals.carbs", { defaultValue: "Carbohydrates (g)" })}
                </Text>
                <TextInput
                  value={targets.carbohydrates ?? ""}
                  onChangeText={(value: string) => handleTargetChange("carbohydrates", value)}
                  keyboardType="numeric"
                  style={[onboardingStyles.textField, { flex: 1 }]}
                  placeholder="e.g. 230"
                />
              </View>
            </View>
          </View>

          <View style={onboardingStyles.suggestionGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.nutritionGoals.secondary", { defaultValue: "Secondary metrics" })}
            </Text>
            <Text style={onboardingStyles.helperText}>
              {t("onboarding.nutritionGoals.secondaryHelper", {
                defaultValue: "Track these only if they’re relevant to your plan.",
              })}
            </Text>
            <Pressable
              onPress={() => setShowAdvanced((current) => !current)}
              style={onboardingStyles.optionButton}
            >
              <View style={{ flex: 1 }}>
                <Text style={onboardingStyles.optionText}>
                  {t("onboarding.nutritionGoals.advancedToggle", { defaultValue: "Advanced" })}
                </Text>
                <Text style={onboardingStyles.helperText}>
                  {showAdvanced
                    ? t("onboarding.nutritionGoals.advancedHide", {
                        defaultValue: "Hide advanced metrics",
                      })
                    : t("onboarding.nutritionGoals.advancedShow", {
                        defaultValue: "Show optional numbers",
                      })}
                </Text>
              </View>
              <Text style={onboardingStyles.optionText}>{showAdvanced ? "–" : "+"}</Text>
            </Pressable>
            {showAdvanced
              ? SECONDARY_METRICS.map((metric) => {
                  const isActive = trackedMetrics.includes(metric.key);
                  const fieldKey = SECONDARY_FIELDS[metric.key];
                  return (
                    <View key={metric.key} style={{ gap: 8 }}>
                      <View style={onboardingStyles.inlineInputRow}>
                        <Pressable
                          onPress={() => toggleMetric(metric.key)}
                          style={[
                            onboardingStyles.optionButton,
                            isActive ? onboardingStyles.optionSelected : null,
                            { flex: 1 },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={onboardingStyles.optionText}>{metric.label}</Text>
                            <Text style={onboardingStyles.helperText}>{metric.helper}</Text>
                          </View>
                          {isActive ? (
                            <Text style={onboardingStyles.optionText}>✓</Text>
                          ) : null}
                        </Pressable>
                        {isActive ? (
                          <TextInput
                            value={targets[fieldKey] ?? ""}
                            onChangeText={(value: string) => handleTargetChange(fieldKey, value)}
                            keyboardType="numeric"
                            style={[onboardingStyles.textField, { width: 120 }]}
                            placeholder="Target"
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })
              : null}
          </View>

          <View style={onboardingStyles.suggestionGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.nutritionGoals.display", { defaultValue: "Display preferences" })}
            </Text>
            <Text style={onboardingStyles.helperText}>
              {t("onboarding.nutritionGoals.displayHelper", {
                defaultValue:
                  "Choose what to see in meal views. We’ll still guide you silently.",
              })}
            </Text>
            <View style={onboardingStyles.optionsContainer}>
              <Pressable
                onPress={() =>
                  setDisplayPreferences((current) => ({
                    ...current,
                    showPerMealTargets: !current.showPerMealTargets,
                  }))
                }
                style={[
                  onboardingStyles.optionButton,
                  displayPreferences.showPerMealTargets
                    ? onboardingStyles.optionSelected
                    : null,
                ]}
              >
                <Text style={onboardingStyles.optionText}>
                  {t("onboarding.nutritionGoals.perMeal", {
                    defaultValue: "Show per-meal targets",
                  })}
                </Text>
                <Switch
                  value={displayPreferences.showPerMealTargets}
                  onValueChange={(value: boolean) =>
                    setDisplayPreferences((current) => ({
                      ...current,
                      showPerMealTargets: value,
                    }))
                  }
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  setDisplayPreferences((current) => ({
                    ...current,
                    showProteinOnly: !current.showProteinOnly,
                  }))
                }
                style={[
                  onboardingStyles.optionButton,
                  displayPreferences.showProteinOnly
                    ? onboardingStyles.optionSelected
                    : null,
                ]}
              >
                <Text style={onboardingStyles.optionText}>
                  {t("onboarding.nutritionGoals.proteinOnly", {
                    defaultValue: "Show protein-only view",
                  })}
                </Text>
                <Switch
                  value={displayPreferences.showProteinOnly}
                  onValueChange={(value: boolean) =>
                    setDisplayPreferences((current) => ({
                      ...current,
                      showProteinOnly: value,
                    }))
                  }
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  setDisplayPreferences((current) => ({
                    ...current,
                    hideCalories: !current.hideCalories,
                  }))
                }
                style={[
                  onboardingStyles.optionButton,
                  displayPreferences.hideCalories
                    ? onboardingStyles.optionSelected
                    : null,
                ]}
              >
                <Text style={onboardingStyles.optionText}>
                  {t("onboarding.nutritionGoals.hideCalories", {
                    defaultValue: "Hide calorie totals",
                  })}
                </Text>
                <Switch
                  value={displayPreferences.hideCalories}
                  onValueChange={(value: boolean) =>
                    setDisplayPreferences((current) => ({
                      ...current,
                      hideCalories: value,
                    }))
                  }
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  setDisplayPreferences((current) => ({
                    ...current,
                    showWarnings: !current.showWarnings,
                  }))
                }
                style={[
                  onboardingStyles.optionButton,
                  displayPreferences.showWarnings
                    ? onboardingStyles.optionSelected
                    : null,
                ]}
              >
                <Text style={onboardingStyles.optionText}>
                  {t("onboarding.nutritionGoals.warnings", {
                    defaultValue: "Warnings vs suggestions",
                  })}
                </Text>
                <Switch
                  value={displayPreferences.showWarnings}
                  onValueChange={(value: boolean) =>
                    setDisplayPreferences((current) => ({
                      ...current,
                      showWarnings: value,
                    }))
                  }
                />
              </Pressable>
              {showAdvanced ? (
                <View style={onboardingStyles.inlineInputRow}>
                  <View style={[onboardingStyles.inputGroup, { flex: 1 }]}>
                    <Text style={onboardingStyles.inputLabel}>
                      {t("onboarding.nutritionGoals.mealCount", {
                        defaultValue: "Meals per day",
                      })}
                    </Text>
                    <TextInput
                      value={String(displayPreferences.mealCount ?? "")}
                      onChangeText={(value: string) =>
                        setDisplayPreferences((current) => ({
                          ...current,
                          mealCount:
                            Number.parseInt(value || "0", 10) || current.mealCount,
                        }))
                      }
                      keyboardType="numeric"
                      style={onboardingStyles.textField}
                      placeholder="3"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={onboardingStyles.helperText}>
                      {perMealPreview.calories
                        ? `${perMealPreview.calories} kcal/meal`
                        : ""}
                      {perMealPreview.protein
                        ? `  ·  ${perMealPreview.protein} g protein/meal`
                        : ""}
                    </Text>
                    <Text style={onboardingStyles.helperText}>
                      {t("onboarding.nutritionGoals.trainingHelper", {
                        defaultValue: "We’ll adjust for training vs rest days automatically.",
                      })}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 9, total: 10 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <OnboardingNavigation
        backLabel={t("onboarding.back")}
        busyLabel={t("onboarding.saving")}
        continueLabel={t("onboarding.next")}
        isBusy={isSubmitting}
        onBack={handleBack}
        onContinue={handleSave}
      />
    </View>
  );
}
