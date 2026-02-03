import createOnboardingStyles from "@/styles/onboardingStyles";
import { api } from "@haricot/convex-client";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useThemedStyles } from "@/styles/tokens";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { useTranslation } from "@/i18n/useTranslation";

const HOUSEHOLD_OPTIONS: { labelKey: string; value: number }[] = [
  { labelKey: "onboarding.household.justMe", value: 1 },
  { labelKey: "onboarding.household.twoPeople", value: 2 },
  { labelKey: "onboarding.household.threePeople", value: 3 },
  { labelKey: "onboarding.household.fourPeople", value: 4 },
  { labelKey: "onboarding.household.fivePeople", value: 5 },
  { labelKey: "onboarding.household.sixOrMore", value: 6 },
];

export default function HouseholdSizeScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [selectedSize, setSelectedSize] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { t } = useTranslation();

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (typeof user?.householdSize === "number") {
      setSelectedSize(user.householdSize as number);
      return;
    }

    setSelectedSize(1);
  }, [user]);

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);
      await updateProfile({ householdSize: selectedSize });
      router.push("/onboarding/cuisines");
    } catch (error) {
      console.error("Failed to save household size", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.household.saveError")
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
              {t("onboarding.household.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.household.description")}
            </Text>
          </View>

          <View style={onboardingStyles.optionsContainer}>
            {HOUSEHOLD_OPTIONS.map((option) => {
              const isSelected = selectedSize === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedSize(option.value)}
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
              {t("onboarding.stepIndicator", { current: 6, total: 10 })}
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
