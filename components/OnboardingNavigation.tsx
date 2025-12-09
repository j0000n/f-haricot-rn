import React from "react";
import { Pressable, Text, View } from "react-native";

import createOnboardingStyles from "@/styles/onboardingStyles";
import { useThemedStyles } from "@/styles/tokens";

type OnboardingNavigationProps = {
  backLabel: string;
  continueLabel: string;
  onBack: () => void;
  onContinue: () => void;
  busyLabel?: string;
  isBusy?: boolean;
};

export function OnboardingNavigation({
  backLabel,
  busyLabel,
  continueLabel,
  isBusy = false,
  onBack,
  onContinue,
}: OnboardingNavigationProps) {
  const onboardingStyles = useThemedStyles(createOnboardingStyles);
  const continueText = isBusy && busyLabel ? busyLabel : continueLabel;

  return (
    <View pointerEvents="box-none" style={onboardingStyles.navigationContainer}>
      <View style={onboardingStyles.navigationCard}>
        <Pressable
          onPress={onBack}
          style={[
            onboardingStyles.buttonSecondary,
            isBusy ? onboardingStyles.buttonDisabled : null,
          ]}
          disabled={isBusy}
        >
          <Text style={onboardingStyles.buttonSecondaryText}>{backLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onContinue}
          style={[
            onboardingStyles.button,
            isBusy ? onboardingStyles.buttonDisabled : null,
          ]}
          disabled={isBusy}
        >
          <Text style={onboardingStyles.buttonText}>{continueText}</Text>
        </Pressable>
      </View>
    </View>
  );
}
