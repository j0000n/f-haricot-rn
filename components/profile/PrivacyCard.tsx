import { Switch, Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";

type PrivacyCardProps = {
  analyticsOptIn: boolean;
  sessionReplayOptIn: boolean;
  isSaving: boolean;
  onToggleAnalytics: (value: boolean) => void;
  onToggleSessionReplay: (value: boolean) => void;
};

export function PrivacyCard({
  analyticsOptIn,
  sessionReplayOptIn,
  isSaving,
  onToggleAnalytics,
  onToggleSessionReplay,
}: PrivacyCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.privacyCard}>
      <Text style={styles.appearanceTitle}>{t("profile.privacyTitle")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.privacyDesc")}</Text>

      <View style={styles.accessibilityToggle}>
        <View style={styles.accessibilityToggleRow}>
          <Text style={styles.accessibilityToggleText}>
            {t("profile.analyticsToggleLabel")}
          </Text>
          <Switch
            value={analyticsOptIn}
            onValueChange={(value: boolean) => void onToggleAnalytics(value)}
            disabled={isSaving}
            thumbColor={analyticsOptIn ? tokens.colors.accentOnPrimary : tokens.colors.surface}
            trackColor={{
              false: tokens.colors.border,
              true: tokens.colors.accent,
            }}
          />
        </View>
        <Text style={styles.accessibilityToggleDescription}>
          {t("profile.analyticsToggleDesc")}
        </Text>
      </View>

      <View style={styles.accessibilityToggle}>
        <View style={styles.accessibilityToggleRow}>
          <Text style={styles.accessibilityToggleText}>
            {t("profile.sessionReplayToggleLabel")}
          </Text>
          <Switch
            value={sessionReplayOptIn}
            onValueChange={(value: boolean) => void onToggleSessionReplay(value)}
            disabled={isSaving}
            thumbColor={sessionReplayOptIn ? tokens.colors.accentOnPrimary : tokens.colors.surface}
            trackColor={{
              false: tokens.colors.border,
              true: tokens.colors.accent,
            }}
          />
        </View>
        <Text style={styles.accessibilityToggleDescription}>
          {t("profile.sessionReplayToggleDesc")}
        </Text>
      </View>

      {isSaving ? (
        <Text style={styles.accessibilityStatus}>{t("profile.savingPrivacy")}</Text>
      ) : null}
    </View>
  );
}
