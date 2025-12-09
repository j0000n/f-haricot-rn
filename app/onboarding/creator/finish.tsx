import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import createPartnerOnboardingStyles from "@/styles/partnerOnboardingStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function CreatorFinishOnboarding() {
  const styles = useThemedStyles(createPartnerOnboardingStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);

  const handleComplete = async () => {
    try {
      await updateProfile({ onboardingCompleted: true, userType: "creator" });
      router.replace("/");
    } catch (error) {
      console.error("Failed to complete creator onboarding", error);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("onboarding.partnerOnboarding.creatorFinishTitle")}</Text>
        <Text style={styles.body}>{t("onboarding.partnerOnboarding.creatorFinishBody")}</Text>
        <Pressable style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>{t("onboarding.finish")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
