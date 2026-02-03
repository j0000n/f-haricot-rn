import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";

import createOnboardingStyles from "@/styles/onboardingStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { api } from "@haricot/convex-client";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingNavigation } from "@/components/OnboardingNavigation";
import { useTranslation } from "@/i18n/useTranslation";

type FeedbackTone = "info" | "success" | "error";

type JoinFeedback = {
  message: string;
  tone: FeedbackTone;
};

const sanitizeCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export default function HouseholdCodeScreen() {
  const router = useRouter();
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const joinHousehold = useMutation(api.households.joinHouseholdByCode);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<JoinFeedback | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push("/onboarding/household");
  };

  const handleJoin = async () => {
    const trimmed = sanitizeCode(code);
    if (!trimmed) {
      setFeedback({
        message: t("onboarding.household.code.enterCodeError"),
        tone: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await joinHousehold({ code: trimmed });
      if (result.status === "not_found") {
        setFeedback({
          message: t("onboarding.household.code.notFoundError"),
          tone: "error",
        });
        return;
      }

      if (result.status === "already_in_household") {
        setFeedback({
          message: t("onboarding.household.code.alreadyInHouseholdError"),
          tone: "error",
        });
        return;
      }

      if (result.status === "member") {
        setFeedback({
          message: t("onboarding.household.code.alreadyMemberSuccess"),
          tone: "success",
        });
        setCode("");
        return;
      }

      setFeedback({
        message: t("onboarding.household.code.pendingSuccess"),
        tone: "info",
      });
      setCode("");
    } catch (error) {
      console.error("Failed to join household", error);
      Alert.alert(
        t("onboarding.household.code.sendRequestErrorTitle"),
        t("onboarding.household.code.sendRequestError")
      );
    } finally {
      setIsSubmitting(false);
    }
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
              {t("onboarding.household.code.title")}
            </Text>
            <Text style={onboardingStyles.subtitle}>
              {t("onboarding.household.code.description")}
            </Text>
          </View>

          <View style={onboardingStyles.inputGroup}>
            <Text style={onboardingStyles.inputLabel}>
              {t("onboarding.household.code.label")}
            </Text>
            <TextInput
              value={code}
              onChangeText={(value: string) => {
                setCode(sanitizeCode(value));
              }}
              placeholder={t("onboarding.household.code.placeholder")}
              placeholderTextColor={tokens.colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              style={onboardingStyles.textField}
              maxLength={12}
              keyboardType="default"
            />
            <Pressable
              onPress={handleJoin}
              style={[
                onboardingStyles.joinButton,
                isSubmitting ? onboardingStyles.buttonDisabled : null,
              ]}
              disabled={isSubmitting}
            >
              <Text style={onboardingStyles.joinButtonText}>
                {isSubmitting
                  ? t("onboarding.household.code.joinButtonSending")
                  : t("onboarding.household.code.joinButton")}
              </Text>
            </Pressable>
            {feedback ? (
              <Text
                style={[
                  onboardingStyles.statusMessage,
                  feedback.tone === "info"
                    ? onboardingStyles.statusMessageInfo
                    : null,
                  feedback.tone === "success"
                    ? onboardingStyles.statusMessageSuccess
                    : null,
                  feedback.tone === "error"
                    ? onboardingStyles.statusMessageError
                    : null,
                ]}
              >
                {feedback.message}
              </Text>
            ) : null}
          </View>

          <View style={onboardingStyles.footer}>
            <Text style={onboardingStyles.progressText}>
              {t("onboarding.stepIndicator", { current: 5, total: 10 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <OnboardingNavigation
        backLabel={t("onboarding.back")}
        busyLabel={t("onboarding.joining")}
        continueLabel={t("onboarding.household.code.continueButton")}
        isBusy={isSubmitting}
        onBack={handleBack}
        onContinue={handleContinue}
      />
    </View>
  );
}
