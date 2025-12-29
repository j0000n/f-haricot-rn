import { Pressable, Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";

type DsarCardProps = {
  isExporting: boolean;
  isDeleting: boolean;
  onExport: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export function DsarCard({ isExporting, isDeleting, onExport, onDelete }: DsarCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.dsarCard}>
      <Text style={styles.appearanceTitle}>{t("profile.dsarTitle")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.dsarDesc")}</Text>

      <View style={styles.dsarActions}>
        <Pressable
          style={styles.dsarPrimaryButton}
          onPress={() => void onExport()}
          accessibilityRole="button"
          disabled={isExporting || isDeleting}
        >
          <Text style={styles.dsarPrimaryText}>
            {isExporting ? t("profile.dsarExporting") : t("profile.dsarExport")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dsarSecondaryButton, isDeleting ? styles.disabledControl : null]}
          onPress={() => void onDelete()}
          accessibilityRole="button"
          disabled={isDeleting || isExporting}
        >
          <Text style={styles.dsarSecondaryText}>
            {isDeleting ? t("profile.dsarDeleting") : t("profile.dsarDelete")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
