import createOnboardingStyles from "@/styles/onboardingStyles";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { BrandLogo } from "@/components/BrandLogo";
import { useTranslation } from "@/i18n/useTranslation";

const DIETARY_OPTIONS: { value: string; labelKey: string; defaultLabel: string }[] = [
  {
    value: "No preference",
    labelKey: "onboarding.dietary.noPreference",
    defaultLabel: "No preference",
  },
  { value: "Vegetarian", labelKey: "onboarding.dietary.vegetarian", defaultLabel: "Vegetarian" },
  { value: "Vegan", labelKey: "onboarding.dietary.vegan", defaultLabel: "Vegan" },
  { value: "Pescatarian", labelKey: "onboarding.dietary.pescatarian", defaultLabel: "Pescatarian" },
  { value: "Flexitarian", labelKey: "onboarding.dietary.flexitarian", defaultLabel: "Flexitarian" },
  { value: "Mediterranean", labelKey: "onboarding.dietary.mediterranean", defaultLabel: "Mediterranean" },
  { value: "Halal", labelKey: "onboarding.dietary.halal", defaultLabel: "Halal" },
  { value: "Kosher", labelKey: "onboarding.dietary.kosher", defaultLabel: "Kosher" },
  { value: "Jain", labelKey: "onboarding.dietary.jain", defaultLabel: "Jain" },
  { value: "Buddhist", labelKey: "onboarding.dietary.buddhist", defaultLabel: "Buddhist" },
  { value: "Ayurvedic", labelKey: "onboarding.dietary.ayurvedic", defaultLabel: "Ayurvedic" },
  { value: "Gluten-free", labelKey: "onboarding.dietary.glutenFree", defaultLabel: "Gluten-free" },
  { value: "Dairy-free", labelKey: "onboarding.dietary.dairyFree", defaultLabel: "Dairy-free" },
  { value: "Low FODMAP", labelKey: "onboarding.dietary.lowFodmap", defaultLabel: "Low FODMAP" },
  { value: "Low carb", labelKey: "onboarding.dietary.lowCarb", defaultLabel: "Low carb" },
  { value: "Keto", labelKey: "onboarding.dietary.keto", defaultLabel: "Keto" },
  { value: "Paleo", labelKey: "onboarding.dietary.paleo", defaultLabel: "Paleo" },
  { value: "Whole30", labelKey: "onboarding.dietary.whole30", defaultLabel: "Whole30" },
  { value: "Low sugar", labelKey: "onboarding.dietary.lowSugar", defaultLabel: "Low sugar" },
  { value: "Low sodium", labelKey: "onboarding.dietary.lowSodium", defaultLabel: "Low sodium" },
  {
    value: "Diabetic-friendly",
    labelKey: "onboarding.dietary.diabeticFriendly",
    defaultLabel: "Diabetic-friendly",
  },
  { value: "Heart-healthy", labelKey: "onboarding.dietary.heartHealthy", defaultLabel: "Heart-healthy" },
];

export default function DietaryRestrictionsScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const submitCustomDiet = useMutation(api.dietary.submitCustomDiet);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDietName, setCustomDietName] = useState("");
  const [customDietDescription, setCustomDietDescription] = useState("");
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (user && Array.isArray(user.dietaryRestrictions)) {
      setSelectedOptions(user.dietaryRestrictions as string[]);
    } else {
      setSelectedOptions([]);
    }

    const customDiet =
      (user as {
        customDiet?: { name?: string | null; description?: string | null } | null;
      } | null)?.customDiet ?? null;

    setCustomDietName(customDiet?.name ?? "");
    setCustomDietDescription(customDiet?.description ?? "");
  }, [user]);

  const toggleOption = (option: string) => {
    setSelectedOptions((current) => {
      const isNoPreference = option === "No preference";

      if (current.includes(option)) {
        if (isNoPreference) {
          return [];
        }
        return current.filter((item) => item !== option);
      }

      if (isNoPreference) {
        return [option];
      }

      return current.filter((item) => item !== "No preference").concat(option);
    });
  };

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);
      const trimmedName = customDietName.trim();
      const trimmedDescription = customDietDescription.trim();

      if (!trimmedName && trimmedDescription) {
        Alert.alert(
          t("onboarding.dietary.customDietNameRequiredTitle", {
            defaultValue: "Name required",
          }),
          t("onboarding.dietary.customDietNameRequired", {
            defaultValue: "Please give your custom diet a name so we can keep it in your profile.",
          })
        );
        setIsSubmitting(false);
        return;
      }

      const customDietPayload =
        trimmedName || trimmedDescription
          ? {
              name: trimmedName,
              description: trimmedDescription || undefined,
            }
          : null;

      await updateProfile({
        dietaryRestrictions: selectedOptions,
        customDiet: customDietPayload,
      });

      if (customDietPayload) {
        await submitCustomDiet({
          name: customDietPayload.name,
          description: customDietPayload.description,
          userDietarySelections: selectedOptions,
        });
      }
      router.push("/onboarding/allergies");
    } catch (error) {
      console.error("Failed to save dietary restrictions", error);
      Alert.alert(
        t("onboarding.somethingWrong"),
        t("onboarding.dietary.saveError")
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
              {t("onboarding.dietary.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.dietary.description")}
            </Text>
          </View>

          <View style={onboardingStyles.optionsContainer}>
            {DIETARY_OPTIONS.map((option) => {
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
                    {t(option.labelKey, { defaultValue: option.defaultLabel })}
                  </Text>
                  {isSelected ? (
                    <Text style={onboardingStyles.optionText}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={onboardingStyles.inputGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.dietary.customDietTitle", {
                defaultValue: "Name your diet",
              })}
            </Text>
            <Text style={onboardingStyles.helperText}>
              {t("onboarding.dietary.customDietDescription", {
                defaultValue:
                  "Add a label and a short description so we can recognize your unique approach.",
              })}
            </Text>
            <TextInput
              value={customDietName}
              onChangeText={setCustomDietName}
              placeholder={t("onboarding.dietary.customDietNamePlaceholder", {
                defaultValue: "e.g. Flex-vegan weekdays",
              })}
              placeholderTextColor={tokens.colors.textMuted}
              style={onboardingStyles.textField}
              autoCapitalize="words"
              autoCorrect
            />
            <TextInput
              value={customDietDescription}
              onChangeText={setCustomDietDescription}
              placeholder={t(
                "onboarding.dietary.customDietDetailsPlaceholder",
                {
                  defaultValue:
                    "Share any guidelines, staples, or ingredients you lean on.",
                }
              )}
              placeholderTextColor={tokens.colors.textMuted}
              style={[onboardingStyles.textField, onboardingStyles.textArea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
              onPress={handleContinue}
              style={[
                onboardingStyles.button,
                isSubmitting ? onboardingStyles.buttonDisabled : null,
              ]}
              disabled={isSubmitting}
            >
              <Text style={onboardingStyles.buttonText}>
                {isSubmitting ? t("onboarding.saving") : t("onboarding.next")}
              </Text>
            </Pressable>
          </View>

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 3, total: 9 })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
