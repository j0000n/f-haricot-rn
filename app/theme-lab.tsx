import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "@/i18n/useTranslation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme } from "@/styles/tokens";

export default function ThemeLabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.colors.background }}
      contentContainerStyle={{
        padding: tokens.spacing.spacingRoomy,
        gap: tokens.spacing.spacingStandard,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={{
          alignSelf: "flex-start",
          borderWidth: tokens.borderWidths.thin,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radii.radiusControl,
          backgroundColor: tokens.colors.surface,
          paddingHorizontal: tokens.spacing.spacingStandard,
          paddingVertical: tokens.spacing.spacingTight,
        }}
      >
        <Text
          style={{
            color: tokens.colors.textPrimary,
            fontFamily: tokens.fontFamilies.semiBold,
            fontSize: tokens.typography.typeBodySmall,
          }}
        >
          {t("common.back", { defaultValue: "Back" })}
        </Text>
      </Pressable>

      <View>
        <Text
          style={{
            color: tokens.colors.textPrimary,
            fontFamily: tokens.fontFamilies.display,
            fontSize: tokens.typography.typeTitle,
          }}
        >
          Theme Lab
        </Text>
        <Text
          style={{
            marginTop: tokens.spacing.spacingTight,
            color: tokens.colors.textSecondary,
            fontFamily: tokens.fontFamilies.regular,
            fontSize: tokens.typography.typeBodySmall,
          }}
        >
          Create or apply themes and keep your app appearance in sync.
        </Text>
      </View>

      <ThemeSwitcher />
    </ScrollView>
  );
}
