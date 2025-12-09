import { useTranslation } from "@/i18n/useTranslation";
import createPartnerOnboardingStyles from "@/styles/partnerOnboardingStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function CreatorProfileOnboarding() {
  const styles = useThemedStyles(createPartnerOnboardingStyles);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("onboarding.partnerOnboarding.creatorProfileTitle")}</Text>
        <Text style={styles.body}>{t("onboarding.partnerOnboarding.creatorProfileBody")}</Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/onboarding/creator/finish")}
        >
          <Text style={styles.buttonText}>{t("onboarding.next")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
