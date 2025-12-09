import { useTranslation } from "@/i18n/useTranslation";
import createPartnerOnboardingStyles from "@/styles/partnerOnboardingStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function VendorProfileOnboarding() {
  const styles = useThemedStyles(createPartnerOnboardingStyles);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("onboarding.partnerOnboarding.vendorProfileTitle")}</Text>
        <Text style={styles.body}>{t("onboarding.partnerOnboarding.vendorProfileBody")}</Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/onboarding/vendor/finish")}
        >
          <Text style={styles.buttonText}>{t("onboarding.next")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
