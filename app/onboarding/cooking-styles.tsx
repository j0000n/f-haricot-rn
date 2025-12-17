import createOnboardingStyles from "@/styles/onboardingStyles";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useThemedStyles } from "@/styles/tokens";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { useTranslation } from "@/i18n/useTranslation";

const COOKING_STYLE_OPTIONS: {
  value: string;
  labelKey: string;
  defaultLabel: string;
}[] = [
  {
    value: "Quick meals",
    labelKey: "onboarding.cookingStyles.quickMeals",
    defaultLabel: "Quick meals",
  },
  {
    value: "Slow cooking",
    labelKey: "onboarding.cookingStyles.slowCooking",
    defaultLabel: "Slow cooking",
  },
  {
    value: "Scratch cooking",
    labelKey: "onboarding.cookingStyles.scratchCooking",
    defaultLabel: "From-scratch cooking",
  },
  {
    value: "Convenience-forward",
    labelKey: "onboarding.cookingStyles.convenienceForward",
    defaultLabel: "Convenience-forward cooking",
  },
  {
    value: "Grilling",
    labelKey: "onboarding.cookingStyles.grilling",
    defaultLabel: "Grilling & smoking",
  },
  {
    value: "Baking",
    labelKey: "onboarding.cookingStyles.baking",
    defaultLabel: "Baking & pastry",
  },
  {
    value: "Fermentation",
    labelKey: "onboarding.cookingStyles.fermentation",
    defaultLabel: "Fermentation projects",
  },
  {
    value: "One-pot meals",
    labelKey: "onboarding.cookingStyles.onePot",
    defaultLabel: "One-pot meals",
  },
  {
    value: "Family-style",
    labelKey: "onboarding.cookingStyles.familyStyle",
    defaultLabel: "Family-style spreads",
  },
  {
    value: "Budget-friendly",
    labelKey: "onboarding.cookingStyles.budgetFriendly",
    defaultLabel: "Budget-friendly cooking",
  },
  {
    value: "Adventurous",
    labelKey: "onboarding.cookingStyles.adventurous",
    defaultLabel: "Adventurous experiments",
  },
];

export default function CookingStylesScreen() {
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

    if (user && Array.isArray((user as { cookingStylePreferences?: unknown }).cookingStylePreferences)) {
      setSelectedOptions((user as { cookingStylePreferences?: string[] | null }).cookingStylePreferences ?? []);
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

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);
      await updateProfile({ cookingStylePreferences: selectedOptions });
      router.push("/onboarding/nutrition-goals");
    } catch (error) {
      console.error("Failed to save cooking style preferences", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.cookingStyles.saveError")
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
              {t("onboarding.cookingStyles.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.cookingStyles.description")}
            </Text>
          </View>

          <View style={onboardingStyles.optionsContainer}>
            {COOKING_STYLE_OPTIONS.map((option) => {
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

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 8, total: 10 })}
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
        onContinue={handleContinue}
      />
    </View>
  );
}
