import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTranslation } from "@/i18n/useTranslation";
import createOnboardingStyles from "@/styles/onboardingStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";

export default function ThemeSelectionScreen() {
  const router = useRouter();
  const { isUpdatingTheme } = useTheme();
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { t } = useTranslation();

  const handleContinue = () => {
    if (isUpdatingTheme) {
      return;
    }

    router.push("/onboarding/dietary");
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
              {t("onboarding.theme.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.theme.description")}
            </Text>
          </View>

          <View style={onboardingStyles.appearanceSection}>
            <Text style={onboardingStyles.appearanceTitle}>
              {t("onboarding.theme.themesLabel")}
            </Text>
            <Text style={onboardingStyles.appearanceDescription}>
              {t("onboarding.theme.revisitNote")}
            </Text>
          </View>

          <ThemeSwitcher />

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 2, total: 10 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <OnboardingNavigation
        backLabel={t("onboarding.back")}
        busyLabel={t("onboarding.saving")}
        continueLabel={t("onboarding.next")}
        isBusy={isUpdatingTheme}
        onBack={handleBack}
        onContinue={handleContinue}
      />
    </View>
  );
}
