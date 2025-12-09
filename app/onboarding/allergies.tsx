import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";

import createOnboardingStyles from "@/styles/onboardingStyles";
import { useThemedStyles, useTheme } from "@/styles/tokens";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { useTranslation } from "@/i18n/useTranslation";

const ALLERGY_SUGGESTION_KEYS = [
  "onboarding.allergies.peanuts",
  "onboarding.allergies.treeNuts",
  "onboarding.allergies.shellfish",
  "onboarding.allergies.dairy",
  "onboarding.allergies.eggs",
  "onboarding.allergies.gluten",
  "onboarding.allergies.soy",
  "onboarding.allergies.sesame",
] as const;

const sanitizeAllergy = (value: string) => value.trim();

export default function AllergiesScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const [allergies, setAllergies] = useState<string[]>([]);
  const [pendingAllergy, setPendingAllergy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (user && Array.isArray(user.allergies)) {
      setAllergies((user.allergies as string[]).map((entry) => entry.trim()));
      return;
    }

    setAllergies([]);
  }, [user]);

  const addAllergy = (value: string) => {
    const sanitized = sanitizeAllergy(value);
    if (!sanitized) {
      return;
    }

    setAllergies((current) => {
      if (current.includes(sanitized)) {
        return current;
      }
      return [...current, sanitized];
    });
    setPendingAllergy("");
  };

  const removeAllergy = (value: string) => {
    setAllergies((current) => current.filter((item) => item !== value));
  };

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);
      await updateProfile({ allergies });
      router.push("/onboarding/household-code");
    } catch (error) {
      console.error("Failed to save allergies", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.allergies.saveError")
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
              {t("onboarding.allergies.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.allergies.description")}
            </Text>
          </View>

          <View style={onboardingStyles.inputGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.allergies.knownAllergies")}
            </Text>
            {allergies.length === 0 ? (
              <Text style={onboardingStyles.helperText}>
                {t("onboarding.allergies.knownAllergiesHelper")}
              </Text>
            ) : (
              <View style={onboardingStyles.tagList}>
                {allergies.map((item) => (
                  <View key={item} style={onboardingStyles.tag}>
                    <Text style={onboardingStyles.tagText}>{item}</Text>
                    <Pressable
                      onPress={() => removeAllergy(item)}
                      accessibilityLabel={t("onboarding.allergies.removeAccessibility", {
                        item,
                      })}
                      style={onboardingStyles.tagRemove}
                    >
                      <Text style={onboardingStyles.tagRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={onboardingStyles.inputGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.allergies.addAllergyLabel")}
            </Text>
            <View style={onboardingStyles.inlineInputRow}>
              <TextInput
                value={pendingAllergy}
                onChangeText={(value: string) => setPendingAllergy(value)}
                placeholder={t("onboarding.allergies.addAllergyPlaceholder")}
                placeholderTextColor={tokens.colors.textMuted}
                style={onboardingStyles.textField}
                autoCapitalize="words"
                autoCorrect
              />
              <Pressable
                onPress={() => addAllergy(pendingAllergy)}
                style={[
                  onboardingStyles.inlinePrimaryButton,
                  !pendingAllergy.trim() ? onboardingStyles.buttonDisabled : null,
                ]}
                disabled={!pendingAllergy.trim()}
              >
                <Text style={onboardingStyles.inlinePrimaryButtonText}>
                  {t("onboarding.allergies.addButton")}
                </Text>
              </Pressable>
            </View>
            <Text style={onboardingStyles.helperText}>
              {t("onboarding.allergies.addAllergyHelper")}
            </Text>
          </View>

          <View style={onboardingStyles.suggestionGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.allergies.quickAdd")}
            </Text>
            <View style={onboardingStyles.suggestionRow}>
              {ALLERGY_SUGGESTION_KEYS.map((key) => {
                const suggestion = t(key);
                const isActive = allergies.includes(suggestion);
                return (
                  <Pressable
                    key={key}
                    onPress={() => addAllergy(suggestion)}
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
                      {suggestion}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 4, total: 9 })}
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
