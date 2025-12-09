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

const CUISINE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "Italian", labelKey: "onboarding.cuisines.italian" },
  { value: "Mexican", labelKey: "onboarding.cuisines.mexican" },
  { value: "Indian", labelKey: "onboarding.cuisines.indian" },
  { value: "Thai", labelKey: "onboarding.cuisines.thai" },
  { value: "Mediterranean", labelKey: "onboarding.cuisines.mediterranean" },
  { value: "Japanese", labelKey: "onboarding.cuisines.japanese" },
  { value: "American", labelKey: "onboarding.cuisines.american" },
];

export default function FavoriteCuisinesScreen() {
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

    if (user && Array.isArray(user.favoriteCuisines)) {
      setSelectedOptions(user.favoriteCuisines as string[]);
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
      await updateProfile({
        favoriteCuisines: selectedOptions,
      });
      router.push("/onboarding/cooking-styles");
    } catch (error) {
      console.error("Failed to save favorite cuisines", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.cuisines.saveError")
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
              {t("onboarding.cuisines.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.cuisines.description")}
            </Text>
          </View>

          <View style={onboardingStyles.optionsContainer}>
            {CUISINE_OPTIONS.map((option) => {
              const isSelected = selectedOptions.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => toggleOption(option.value)}
                  style={[
                    onboardingStyles.optionButton,
                    isSelected && onboardingStyles.optionSelected,
                  ]}
                >
                  <Text style={onboardingStyles.optionText}>
                    {t(option.labelKey)}
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
              {t("onboarding.stepIndicator", { current: 7, total: 9 })}
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
