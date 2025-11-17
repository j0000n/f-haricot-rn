import createOnboardingStyles from "@/styles/onboardingStyles";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useThemedStyles } from "@/styles/tokens";
import { BrandLogo } from "@/components/BrandLogo";
import { useTranslation } from "@/i18n/useTranslation";

const MEAL_PREFERENCE_OPTIONS: {
  value: string;
  labelKey: string;
  defaultLabel: string;
}[] = [
  {
    value: "Weekly meal prep",
    labelKey: "onboarding.mealPreferences.weeklyPrep",
    defaultLabel: "Weekly meal prep sessions",
  },
  {
    value: "Batch cooking",
    labelKey: "onboarding.mealPreferences.batchCooking",
    defaultLabel: "Batch cooking",
  },
  {
    value: "Leftover planning",
    labelKey: "onboarding.mealPreferences.leftovers",
    defaultLabel: "Plan for leftovers",
  },
  {
    value: "Grab-and-go",
    labelKey: "onboarding.mealPreferences.grabAndGo",
    defaultLabel: "Grab-and-go breakfasts",
  },
  {
    value: "Family lunches",
    labelKey: "onboarding.mealPreferences.familyLunches",
    defaultLabel: "Coordinated family lunches",
  },
  {
    value: "Special diets",
    labelKey: "onboarding.mealPreferences.specialDiets",
    defaultLabel: "Support multiple special diets",
  },
  {
    value: "Fresh daily cooking",
    labelKey: "onboarding.mealPreferences.freshDaily",
    defaultLabel: "Cook fresh every day",
  },
  {
    value: "Entertaining",
    labelKey: "onboarding.mealPreferences.entertaining",
    defaultLabel: "Plan for entertaining",
  },
  {
    value: "Budget meal planning",
    labelKey: "onboarding.mealPreferences.budgetPlanning",
    defaultLabel: "Budget-focused meal plans",
  },
  {
    value: "Seasonal menus",
    labelKey: "onboarding.mealPreferences.seasonal",
    defaultLabel: "Seasonal menu planning",
  },
  {
    value: "Delivery coordination",
    labelKey: "onboarding.mealPreferences.delivery",
    defaultLabel: "Coordinate with delivery or kits",
  },
];

export default function MealPreferencesScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { t } = useTranslation();

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (user && Array.isArray((user as { mealPlanningPreferences?: unknown }).mealPlanningPreferences)) {
      setSelectedOptions((user as { mealPlanningPreferences?: string[] | null }).mealPlanningPreferences ?? []);
      return;
    }

    setSelectedOptions([]);
  }, [user]);

  const toggleOption = (option: string) => {
    setSelectedOptions((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      }
      return [...current, option];
    });
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      await updateProfile({
        mealPlanningPreferences: selectedOptions,
        onboardingCompleted: true,
      });
      router.replace("/");
    } catch (error) {
      console.error("Failed to save meal planning preferences", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.mealPreferences.saveError")
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
        contentContainerStyle={onboardingStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={onboardingStyles.card}>
          <View style={onboardingStyles.logoRow}>
            <BrandLogo size={72} />
          </View>
          <View style={onboardingStyles.header}>
            <Text style={onboardingStyles.title}>
              {t("onboarding.mealPreferences.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.mealPreferences.description")}
            </Text>
          </View>

          <View style={onboardingStyles.optionsContainer}>
            {MEAL_PREFERENCE_OPTIONS.map((option) => {
              const isSelected = selectedOptions.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => toggleOption(option.value)}
                  style={[
                    onboardingStyles.optionButton,
                    isSelected ? onboardingStyles.optionSelected : null,
                  ]}
                >
                  <Text style={onboardingStyles.optionText}>
                    {t(option.labelKey, { defaultValue: option.defaultLabel })}
                  </Text>
                  {isSelected ? (
                    <Text style={onboardingStyles.optionText}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={onboardingStyles.buttonGroup}>
            <Pressable
              onPress={handleBack}
              style={[
                onboardingStyles.buttonSecondary,
                isSubmitting ? onboardingStyles.buttonDisabled : null,
              ]}
              disabled={isSubmitting}
            >
              <Text style={onboardingStyles.buttonSecondaryText}>
                {t("onboarding.back")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              style={[
                onboardingStyles.button,
                isSubmitting ? onboardingStyles.buttonDisabled : null,
              ]}
              disabled={isSubmitting}
            >
              <Text style={onboardingStyles.buttonText}>
                {isSubmitting ? t("onboarding.saving") : t("onboarding.finish")}
              </Text>
            </Pressable>
          </View>

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 9, total: 9 })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
