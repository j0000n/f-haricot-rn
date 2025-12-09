import createOnboardingStyles from "@/styles/onboardingStyles";
import { api } from "@/convex/_generated/api";
import type {
  AccessibilityPreferences,
  BaseTextSize,
  HighContrastPreference,
} from "@/styles/tokens";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { useTranslation } from "@/i18n/useTranslation";

const TEXT_SIZE_OPTIONS: {
  value: BaseTextSize;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "extraSmall",
    labelKey: "onboarding.accessibility.extraSmall",
    descriptionKey: "onboarding.accessibility.extraSmallDesc",
  },
  {
    value: "base",
    labelKey: "onboarding.accessibility.standard",
    descriptionKey: "onboarding.accessibility.standardDesc",
  },
  {
    value: "large",
    labelKey: "onboarding.accessibility.large",
    descriptionKey: "onboarding.accessibility.largeDesc",
  },
  {
    value: "extraLarge",
    labelKey: "onboarding.accessibility.extraLarge",
    descriptionKey: "onboarding.accessibility.extraLargeDesc",
  },
];

const MOTION_OPTIONS: {
  value: AccessibilityPreferences["motionPreference"];
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "system",
    labelKey: "onboarding.accessibility.motionSystem",
    descriptionKey: "onboarding.accessibility.motionSystemDesc",
  },
  {
    value: "reduce",
    labelKey: "onboarding.accessibility.motionReduce",
    descriptionKey: "onboarding.accessibility.motionReduceDesc",
  },
  {
    value: "standard",
    labelKey: "onboarding.accessibility.motionStandard",
    descriptionKey: "onboarding.accessibility.motionStandardDesc",
  },
];

const HIGH_CONTRAST_VARIANTS: {
  value: Exclude<HighContrastPreference, "off">;
  labelKey: string;
  descriptionKey: string;
  defaultLabel: string;
  defaultDescription: string;
}[] = [
  {
    value: "light",
    labelKey: "onboarding.accessibility.highContrastLight",
    descriptionKey: "onboarding.accessibility.highContrastLightDesc",
    defaultLabel: "High contrast light",
    defaultDescription:
      "Bright backgrounds with crisp accents for maximum daylight readability.",
  },
  {
    value: "dark",
    labelKey: "onboarding.accessibility.highContrastDark",
    descriptionKey: "onboarding.accessibility.highContrastDarkDesc",
    defaultLabel: "High contrast dark",
    defaultDescription:
      "Inky surfaces with bright accents tuned for night-time clarity.",
  },
];

export default function AccessibilityPreferencesScreen() {
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);
  const {
    tokens,
    accessibilityPreferences,
    setAccessibilityPreferences,
    isUpdatingAccessibility,
  } = useTheme();
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const [lastHighContrastMode, setLastHighContrastMode] = useState<
    Exclude<HighContrastPreference, "off">
  >(
    accessibilityPreferences.highContrastMode === "off"
      ? "dark"
      : accessibilityPreferences.highContrastMode
  );

  useEffect(() => {
    if (accessibilityPreferences.highContrastMode !== "off") {
      setLastHighContrastMode(accessibilityPreferences.highContrastMode);
    }
  }, [accessibilityPreferences.highContrastMode]);

  const handleSelectTextSize = (value: BaseTextSize) => {
    void setAccessibilityPreferences({ baseTextSize: value });
  };

  const handleToggleDyslexia = (value: boolean) => {
    void setAccessibilityPreferences({ dyslexiaEnabled: value });
  };

  const handleToggleHighContrast = (value: boolean) => {
    if (value) {
      void setAccessibilityPreferences({ highContrastMode: lastHighContrastMode });
      return;
    }

    void setAccessibilityPreferences({ highContrastMode: "off" });
  };

  const handleSelectHighContrastMode = (
    value: Exclude<HighContrastPreference, "off">
  ) => {
    setLastHighContrastMode(value);
    void setAccessibilityPreferences({ highContrastMode: value });
  };

  const handleSelectMotionPreference = (
    value: AccessibilityPreferences["motionPreference"]
  ) => {
    void setAccessibilityPreferences({ motionPreference: value });
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (isSubmitting || isUpdatingAccessibility) {
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        preferredTextSize: accessibilityPreferences.baseTextSize,
        dyslexiaMode: accessibilityPreferences.dyslexiaEnabled,
        highContrastMode: accessibilityPreferences.highContrastMode,
        motionPreference: accessibilityPreferences.motionPreference,
      });
      router.push("/onboarding/theme");
    } catch (error) {
      console.error("Failed to save accessibility preferences", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.accessibility.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHighContrastActive =
    accessibilityPreferences.highContrastMode !== "off";

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
              {t("onboarding.accessibility.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.accessibility.description")}
            </Text>
          </View>

          <View style={onboardingStyles.settingsGroup}>
            <Text style={onboardingStyles.appearanceTitle}>
              {t("onboarding.accessibility.baseTextSize")}
            </Text>
            {TEXT_SIZE_OPTIONS.map((option) => {
              const isActive = accessibilityPreferences.baseTextSize === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelectTextSize(option.value)}
                  style={[
                    onboardingStyles.settingsOption,
                    isActive ? onboardingStyles.settingsOptionActive : null,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={onboardingStyles.settingsOptionTitle}>
                    {t(option.labelKey)}
                  </Text>
                  <Text style={onboardingStyles.settingsOptionDescription}>
                    {t(option.descriptionKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={onboardingStyles.settingsGroup}>
            <Text style={onboardingStyles.appearanceTitle}>
              {t("onboarding.accessibility.highContrast")}
            </Text>
            <View style={onboardingStyles.toggleRow}>
              <View style={onboardingStyles.toggleHeader}>
                <Text style={onboardingStyles.toggleLabel}>
                  {t("onboarding.accessibility.highContrastName")}
                </Text>
                <Switch
                  value={isHighContrastActive}
                  onValueChange={handleToggleHighContrast}
                  thumbColor={
                    isHighContrastActive
                      ? tokens.colors.accentOnPrimary
                      : tokens.colors.surface
                  }
                  trackColor={{
                    false: tokens.colors.border,
                    true: tokens.colors.accent,
                  }}
                />
              </View>
              <Text style={onboardingStyles.toggleDescription}>
                {t("onboarding.accessibility.highContrastDesc")}
              </Text>
              {isHighContrastActive ? (
                <View style={onboardingStyles.settingsNestedGroup}>
                  {HIGH_CONTRAST_VARIANTS.map((option) => {
                    const isVariantActive =
                      accessibilityPreferences.highContrastMode === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => handleSelectHighContrastMode(option.value)}
                        style={[
                          onboardingStyles.settingsOption,
                          isVariantActive
                            ? onboardingStyles.settingsOptionActive
                            : null,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isVariantActive }}
                      >
                        <Text style={onboardingStyles.settingsOptionTitle}>
                          {t(option.labelKey, {
                            defaultValue: option.defaultLabel,
                          })}
                        </Text>
                        <Text style={onboardingStyles.settingsOptionDescription}>
                          {t(option.descriptionKey, {
                            defaultValue: option.defaultDescription,
                          })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          <View style={onboardingStyles.settingsGroup}>
            <Text style={onboardingStyles.appearanceTitle}>
              {t("onboarding.accessibility.dyslexiaFont")}
            </Text>
            <View style={onboardingStyles.toggleRow}>
              <View style={onboardingStyles.toggleHeader}>
                <Text style={onboardingStyles.toggleLabel}>
                  {t("onboarding.accessibility.dyslexiaFontName")}
                </Text>
                <Switch
                  value={accessibilityPreferences.dyslexiaEnabled}
                  onValueChange={handleToggleDyslexia}
                  thumbColor={
                    accessibilityPreferences.dyslexiaEnabled
                      ? tokens.colors.accentOnPrimary
                      : tokens.colors.surface
                  }
                  trackColor={{
                    false: tokens.colors.border,
                    true: tokens.colors.accent,
                  }}
                />
              </View>
              <Text style={onboardingStyles.toggleDescription}>
                {t("onboarding.accessibility.dyslexiaFontDesc")}
              </Text>
            </View>
          </View>

          <View style={onboardingStyles.settingsGroup}>
            <Text style={onboardingStyles.appearanceTitle}>
              {t("onboarding.accessibility.motionPreference")}
            </Text>
            {MOTION_OPTIONS.map((option) => {
              const isActive = accessibilityPreferences.motionPreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelectMotionPreference(option.value)}
                  style={[
                    onboardingStyles.settingsOption,
                    isActive ? onboardingStyles.settingsOptionActive : null,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={onboardingStyles.settingsOptionTitle}>
                    {t(option.labelKey)}
                  </Text>
                  <Text style={onboardingStyles.settingsOptionDescription}>
                    {t(option.descriptionKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 1, total: 9 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <OnboardingNavigation
        backLabel={t("onboarding.back")}
        busyLabel={t("onboarding.saving")}
        continueLabel={t("onboarding.next")}
        isBusy={isSubmitting || isUpdatingAccessibility}
        onBack={handleBack}
        onContinue={handleContinue}
      />
    </View>
  );
}
