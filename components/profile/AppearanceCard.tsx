import { Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

export function AppearanceCard() {
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.appearanceCard}>
      <Text style={styles.appearanceTitle}>{t("profile.appearance")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.appearanceDesc")}</Text>
      <ThemeSwitcher />
    </View>
  );
}
