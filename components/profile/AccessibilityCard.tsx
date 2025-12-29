import { Pressable, Switch, Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import type { AccessibilityPreferences, BaseTextSize } from "@/styles/tokens";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";

const TEXT_SIZE_OPTIONS: {
  value: BaseTextSize;
  label: string;
  description: string;
}[] = [
  {
    value: "extraSmall",
    label: "Extra small",
    description: "Compact text for fitting more content on screen.",
  },
  {
    value: "base",
    label: "Standard",
    description: "Balanced sizes for most readers.",
  },
  {
    value: "large",
    label: "Large",
    description: "A little extra breathing room for text-heavy screens.",
  },
  {
    value: "extraLarge",
    label: "Extra large",
    description: "Maximum legibility when you need the biggest type.",
  },
];

const MOTION_OPTIONS: {
  value: AccessibilityPreferences["motionPreference"];
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "system",
    labelKey: "profile.motionSystem",
    descriptionKey: "profile.motionSystemDesc",
  },
  {
    value: "reduce",
    labelKey: "profile.motionReduce",
    descriptionKey: "profile.motionReduceDesc",
  },
  {
    value: "standard",
    labelKey: "profile.motionStandard",
    descriptionKey: "profile.motionStandardDesc",
  },
];

type AccessibilityCardProps = {
  accessibilityPreferences: AccessibilityPreferences;
  isUpdatingAccessibility: boolean;
  onSelectTextSize: (value: BaseTextSize) => void;
  onToggleHighContrast: (value: boolean) => void;
  onToggleDyslexia: (value: boolean) => void;
  onSelectMotionPreference: (value: AccessibilityPreferences["motionPreference"]) => void;
};

export function AccessibilityCard({
  accessibilityPreferences,
  isUpdatingAccessibility,
  onSelectTextSize,
  onToggleHighContrast,
  onToggleDyslexia,
  onSelectMotionPreference,
}: AccessibilityCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.accessibilityCard}>
      <Text style={styles.appearanceTitle}>{t("profile.accessibility")}</Text>
      <Text style={styles.accessibilityDescription}>
        {t("profile.accessibilityDesc")}
      </Text>

      <View style={styles.textSizeGroup}>
        <Text style={styles.appearanceDescription}>{t("profile.baseTextSize")}</Text>
        {TEXT_SIZE_OPTIONS.map((option) => {
          const isActive = accessibilityPreferences.baseTextSize === option.value;
          const labelKey = `profile.${option.value}` as const;
          const descKey = `profile.${option.value}Desc` as const;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.textSizeOption,
                isActive ? styles.textSizeOptionActive : null,
              ]}
              onPress={() => void onSelectTextSize(option.value)}
              disabled={isUpdatingAccessibility}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={styles.textSizeOptionTitle}>{t(labelKey)}</Text>
              <Text style={styles.textSizeOptionDescription}>{t(descKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.accessibilityToggle}>
        <View style={styles.accessibilityToggleRow}>
          <Text style={styles.accessibilityToggleText}>{t("profile.highContrast")}</Text>
          <Switch
            value={accessibilityPreferences.highContrastMode !== "off"}
            onValueChange={(value: boolean) => void onToggleHighContrast(value)}
            disabled={isUpdatingAccessibility}
            thumbColor={
              accessibilityPreferences.highContrastMode !== "off"
                ? tokens.colors.accentOnPrimary
                : tokens.colors.surface
            }
            trackColor={{
              false: tokens.colors.border,
              true: tokens.colors.accent,
            }}
          />
        </View>
        <Text style={styles.accessibilityToggleDescription}>
          {t("profile.highContrastDesc")}
        </Text>
      </View>

      <View style={styles.accessibilityToggle}>
        <View style={styles.accessibilityToggleRow}>
          <Text style={styles.accessibilityToggleText}>{t("profile.dyslexiaFont")}</Text>
          <Switch
            value={accessibilityPreferences.dyslexiaEnabled}
            onValueChange={(value: boolean) => void onToggleDyslexia(value)}
            disabled={isUpdatingAccessibility}
            thumbColor={
              accessibilityPreferences.dyslexiaEnabled
                ? tokens.colors.accentOnPrimary
                : tokens.colors.surface
            }
            trackColor={{
              false: tokens.colors.border,
              true: tokens.colors.accent,
            }}
          />
        </View>
        <Text style={styles.accessibilityToggleDescription}>
          {t("profile.dyslexiaFontDesc")}
        </Text>
      </View>

      <View style={styles.textSizeGroup}>
        <Text style={styles.appearanceDescription}>{t("profile.motionPreference")}</Text>
        {MOTION_OPTIONS.map((option) => {
          const isActive = accessibilityPreferences.motionPreference === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.textSizeOption,
                isActive ? styles.textSizeOptionActive : null,
              ]}
              onPress={() => void onSelectMotionPreference(option.value)}
              disabled={isUpdatingAccessibility}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={styles.textSizeOptionTitle}>{t(option.labelKey)}</Text>
              <Text style={styles.textSizeOptionDescription}>
                {t(option.descriptionKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isUpdatingAccessibility ? (
        <Text style={styles.accessibilityStatus}>{t("profile.savingPreferences")}</Text>
      ) : null}
    </View>
  );
}
