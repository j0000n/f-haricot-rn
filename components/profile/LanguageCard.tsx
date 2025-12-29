import { Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

export function LanguageCard() {
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.appearanceCard}>
      <Text style={styles.appearanceTitle}>{t("profile.language")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.languageDesc")}</Text>
      <LanguageSwitcher />
    </View>
  );
}
