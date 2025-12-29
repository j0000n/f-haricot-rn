import { Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";

type ProfileInfoEntry = {
  label: string;
  value: string;
};

type ProfileInfoCardProps = {
  entries: ProfileInfoEntry[];
  hasUser: boolean;
};

export function ProfileInfoCard({ entries, hasUser }: ProfileInfoCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();

  if (!hasUser) {
    return <Text style={styles.emptyStateText}>{t("profile.errorLoadProfile")}</Text>;
  }

  return (
    <View style={styles.infoCard}>
      {entries.map(({ label, value }) => (
        <View key={label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}
