import { Pressable, Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";

type LegalCardProps = {
  onOpenDoc: (doc: "privacy" | "terms" | "consent") => void;
};

export function LegalCard({ onOpenDoc }: LegalCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.legalCard}>
      <Text style={styles.appearanceTitle}>{t("profile.legalTitle")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.legalDesc")}</Text>

      <View style={styles.legalRows}>
        <Pressable
          style={styles.legalRow}
          onPress={() => void onOpenDoc("privacy")}
          accessibilityRole="button"
        >
          <Text style={styles.legalRowText}>{t("profile.privacyPolicy")}</Text>
        </Pressable>
        <Pressable
          style={styles.legalRow}
          onPress={() => void onOpenDoc("terms")}
          accessibilityRole="button"
        >
          <Text style={styles.legalRowText}>{t("profile.termsOfService")}</Text>
        </Pressable>
        <Pressable
          style={styles.legalRow}
          onPress={() => void onOpenDoc("consent")}
          accessibilityRole="button"
        >
          <Text style={styles.legalRowText}>{t("profile.consentNotice")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
