import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import createProfileStyles from "@/styles/profileStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

export function AppearanceCard() {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.appearanceCard}>
      <Text style={styles.appearanceTitle}>{t("profile.appearance")}</Text>
      <Text style={styles.appearanceDescription}>{t("profile.appearanceDesc")}</Text>
      <Pressable
        onPress={() => router.push("/theme-lab")}
        style={{
          marginBottom: tokens.spacing.spacingStandard,
          paddingVertical: tokens.spacing.spacingCompact,
          paddingHorizontal: tokens.spacing.spacingStandard,
          borderRadius: tokens.radii.radiusControl,
          borderWidth: tokens.borderWidths.thin,
          borderColor: tokens.colors.border,
          backgroundColor: tokens.colors.surface,
        }}
      >
        <Text
          style={{
            color: tokens.colors.textPrimary,
            fontFamily: tokens.fontFamilies.semiBold,
            fontSize: tokens.typography.typeBodySmall,
          }}
        >
          Open Theme Lab
        </Text>
      </Pressable>
      <ThemeSwitcher />
    </View>
  );
}
