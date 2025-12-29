import { Pressable, Switch, Text, TextInput, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";
import {
  CATEGORY_BUCKETS,
  GOAL_PRESETS,
  SECONDARY_METRICS,
  type NutritionGoals,
  type NutritionMetric,
} from "@/utils/nutritionGoals";

type HouseholdMessage = {
  tone: "info" | "success" | "error";
  text: string;
};

type NutritionGoalsCardProps = {
  normalizedNutritionGoals: NutritionGoals;
  nutritionTargetsInput: Record<string, string>;
  perMealNutritionPreview: { calories?: number; protein?: number };
  isSavingNutritionGoals: boolean;
  nutritionMessage: HouseholdMessage | null;
  onSelectPreset: (presetId: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleMetric: (metric: NutritionMetric) => void;
  onTargetChange: (key: string, value: string) => void;
  onPreferenceToggle: (
    key: keyof NutritionGoals["displayPreferences"],
    value: boolean
  ) => void;
  onMealCountChange: (value: string) => void;
  onSaveNutritionGoals: () => void;
};

export function NutritionGoalsCard({
  normalizedNutritionGoals,
  nutritionTargetsInput,
  perMealNutritionPreview,
  isSavingNutritionGoals,
  nutritionMessage,
  onSelectPreset,
  onToggleCategory,
  onToggleMetric,
  onTargetChange,
  onPreferenceToggle,
  onMealCountChange,
  onSaveNutritionGoals,
}: NutritionGoalsCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.goalsCard}>
      <Text style={styles.appearanceTitle}>{t("profile.nutritionTitle")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.nutritionDesc")}</Text>

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>{t("profile.nutritionStarter")}</Text>
        <View style={styles.goalOptionList}>
          {GOAL_PRESETS.map((preset) => {
            const isActive = normalizedNutritionGoals.preset === preset.id;
            return (
              <Pressable
                key={preset.id}
                style={[styles.goalOption, isActive ? styles.goalOptionActive : null]}
                onPress={() => onSelectPreset(preset.id)}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.goalOptionTitle}>{preset.title}</Text>
                  <Text style={styles.goalOptionHelper}>{preset.description}</Text>
                </View>
                {isActive ? <Text style={styles.goalOptionTitle}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>{t("profile.nutritionCategories")}</Text>
        <Text style={styles.goalHelper}>{t("profile.nutritionCategoriesHelper")}</Text>
        {CATEGORY_BUCKETS.map((bucket) => (
          <View key={bucket.title} style={styles.goalBucketRow}>
            <Text style={styles.goalHelper}>{bucket.title}</Text>
            <View style={styles.goalChipRow}>
              {bucket.options.map((option) => {
                const isActive = normalizedNutritionGoals.categories.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => onToggleCategory(option)}
                    style={[styles.goalChip, isActive ? styles.goalChipActive : null]}
                  >
                    <Text
                      style={[
                        styles.goalChipText,
                        isActive ? styles.goalChipTextActive : null,
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

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>{t("profile.nutritionTargets")}</Text>
        <View style={styles.goalInputRow}>
          <View style={styles.goalInputGroup}>
            <Text style={styles.manageLabel}>{t("onboarding.nutritionGoals.calories")}</Text>
            <TextInput
              value={nutritionTargetsInput.calories ?? ""}
              onChangeText={(value: string) => onTargetChange("calories", value)}
              style={styles.goalInput}
              placeholder="2000"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.goalInputGroup}>
            <Text style={styles.manageLabel}>{t("onboarding.nutritionGoals.protein")}</Text>
            <TextInput
              value={nutritionTargetsInput.protein ?? ""}
              onChangeText={(value: string) => onTargetChange("protein", value)}
              style={styles.goalInput}
              placeholder="150"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.goalInputRow}>
          <View style={styles.goalInputGroup}>
            <Text style={styles.manageLabel}>{t("onboarding.nutritionGoals.fat")}</Text>
            <TextInput
              value={nutritionTargetsInput.fat ?? ""}
              onChangeText={(value: string) => onTargetChange("fat", value)}
              style={styles.goalInput}
              placeholder="70"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.goalInputGroup}>
            <Text style={styles.manageLabel}>{t("onboarding.nutritionGoals.carbs")}</Text>
            <TextInput
              value={nutritionTargetsInput.carbohydrates ?? ""}
              onChangeText={(value: string) => onTargetChange("carbohydrates", value)}
              style={styles.goalInput}
              placeholder="230"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>{t("profile.nutritionSecondary")}</Text>
        {SECONDARY_METRICS.map((metric) => {
          const isActive = normalizedNutritionGoals.trackedMetrics.includes(metric.key);
          const valueKey = metric.key as keyof typeof nutritionTargetsInput;
          return (
            <View key={metric.key} style={styles.goalOptionList}>
              <View style={styles.goalOptionRow}>
                <Pressable
                  style={styles.goalOptionPressable}
                  onPress={() => onToggleMetric(metric.key)}
                >
                  <Text style={styles.goalOptionTitle}>{metric.label}</Text>
                  <Text style={styles.goalOptionHelper}>{metric.helper}</Text>
                </Pressable>
                <Switch
                  value={isActive}
                  onValueChange={() => onToggleMetric(metric.key)}
                  thumbColor={tokens.colors.accentOnPrimary}
                  trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
                />
              </View>
              {isActive ? (
                <TextInput
                  value={nutritionTargetsInput[valueKey] ?? ""}
                  onChangeText={(value: string) => onTargetChange(valueKey, value)}
                  style={styles.goalInput}
                  placeholder="Target"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>{t("profile.nutritionDisplay")}</Text>
        <View style={styles.goalOptionRow}>
          <Text style={styles.goalOptionTitle}>{t("onboarding.nutritionGoals.perMeal")}</Text>
          <Switch
            value={normalizedNutritionGoals.displayPreferences.showPerMealTargets}
            onValueChange={(value: boolean) => onPreferenceToggle("showPerMealTargets", value)}
            thumbColor={tokens.colors.accentOnPrimary}
            trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
          />
        </View>
        <View style={styles.goalOptionRow}>
          <Text style={styles.goalOptionTitle}>{t("onboarding.nutritionGoals.proteinOnly")}</Text>
          <Switch
            value={normalizedNutritionGoals.displayPreferences.showProteinOnly}
            onValueChange={(value: boolean) => onPreferenceToggle("showProteinOnly", value)}
            thumbColor={tokens.colors.accentOnPrimary}
            trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
          />
        </View>
        <View style={styles.goalOptionRow}>
          <Text style={styles.goalOptionTitle}>{t("onboarding.nutritionGoals.hideCalories")}</Text>
          <Switch
            value={normalizedNutritionGoals.displayPreferences.hideCalories}
            onValueChange={(value: boolean) => onPreferenceToggle("hideCalories", value)}
            thumbColor={tokens.colors.accentOnPrimary}
            trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
          />
        </View>
        <View style={styles.goalOptionRow}>
          <Text style={styles.goalOptionTitle}>{t("onboarding.nutritionGoals.warnings")}</Text>
          <Switch
            value={normalizedNutritionGoals.displayPreferences.showWarnings}
            onValueChange={(value: boolean) => onPreferenceToggle("showWarnings", value)}
            thumbColor={tokens.colors.accentOnPrimary}
            trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
          />
        </View>

        <View style={styles.goalInputRow}>
          <View style={styles.goalInputGroup}>
            <Text style={styles.manageLabel}>{t("onboarding.nutritionGoals.mealCount")}</Text>
            <TextInput
              value={String(normalizedNutritionGoals.displayPreferences.mealCount ?? "")}
              onChangeText={onMealCountChange}
              style={styles.goalInput}
              placeholder="3"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.goalInputGroup}>
            <Text style={styles.goalHelper}>
              {t("profile.nutritionPreview", {
                calories: perMealNutritionPreview.calories ?? "—",
                protein: perMealNutritionPreview.protein ?? "—",
              })}
            </Text>
            <Text style={styles.goalHelper}>{t("profile.nutritionTrainingHint")}</Text>
          </View>
        </View>
      </View>

      {nutritionMessage ? (
        <Text
          style={[
            styles.householdMessage,
            nutritionMessage.tone === "info" ? styles.householdMessageInfo : null,
            nutritionMessage.tone === "success" ? styles.householdMessageSuccess : null,
            nutritionMessage.tone === "error" ? styles.householdMessageError : null,
          ]}
        >
          {nutritionMessage.text}
        </Text>
      ) : null}

      <View style={styles.goalActions}>
        <Pressable
          onPress={onSaveNutritionGoals}
          style={[
            styles.managePrimaryButton,
            isSavingNutritionGoals ? styles.disabledControl : null,
          ]}
          disabled={isSavingNutritionGoals}
        >
          <Text style={styles.managePrimaryText}>
            {isSavingNutritionGoals
              ? t("onboarding.saving")
              : t("profile.saveNutritionGoals")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
