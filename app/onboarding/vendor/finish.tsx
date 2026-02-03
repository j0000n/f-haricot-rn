import { api } from "@haricot/convex-client";
import { useTranslation } from "@/i18n/useTranslation";
import createPartnerOnboardingStyles from "@/styles/partnerOnboardingStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function VendorFinishOnboarding() {
  const styles = useThemedStyles(createPartnerOnboardingStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);

  const handleComplete = async () => {
    try {
      await updateProfile({ onboardingCompleted: true, userType: "vendor" });
      router.replace("/");
    } catch (error) {
      console.error("Failed to complete vendor onboarding", error);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("onboarding.partnerOnboarding.vendorFinishTitle")}</Text>
        <Text style={styles.body}>{t("onboarding.partnerOnboarding.vendorFinishBody")}</Text>
        <Pressable style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>{t("onboarding.finish")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
