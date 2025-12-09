import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import createPartnerOnboardingStyles from "@/styles/partnerOnboardingStyles";
import { useThemedStyles } from "@/styles/tokens";
import { clearPendingUserType } from "@/utils/pendingUserType";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function CreatorOnboardingIntro() {
  const styles = useThemedStyles(createPartnerOnboardingStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);

  useEffect(() => {
    const persistUserType = async () => {
      try {
        await updateProfile({ userType: "creator", onboardingCompleted: false });
        await clearPendingUserType();
      } catch (error) {
        console.error("Failed to mark creator onboarding start", error);
      }
    };

    void persistUserType();
  }, [updateProfile]);

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("onboarding.partnerOnboarding.creatorIntroTitle")}</Text>
        <Text style={styles.body}>{t("onboarding.partnerOnboarding.creatorIntroBody")}</Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/onboarding/creator/profile")}
        >
          <Text style={styles.buttonText}>{t("onboarding.next")}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/onboarding/accessibility")}>
          <Text style={styles.secondaryLink}>
            {t("onboarding.partnerOnboarding.switchToStandard")}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
