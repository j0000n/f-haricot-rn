import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";

import { api } from "@haricot/convex-client";
import {
  SUPPORTED_LANGUAGES,
  changeLanguage,
  getCurrentLanguage,
  useTranslation,
  type SupportedLanguage,
} from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/tokens";
import { useThemedStyles } from "@/styles/tokens";

type LanguageSwitcherProps = {
  variant?: "default" | "compact";
};

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  // Update current language when i18n language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      setCurrentLanguage(i18n.language);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  // Sync user's preferred language on mount
  useEffect(() => {
    if (user && user.preferredLanguage && user.preferredLanguage !== currentLanguage) {
      void changeLanguage(user.preferredLanguage);
    }
  }, [user, currentLanguage]);

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    if (languageCode === currentLanguage || isUpdating) {
      return;
    }

    setIsUpdating(true);

    // Change the language in i18next immediately
    await changeLanguage(languageCode);

    setIsUpdating(false);

    // Try to persist to user profile in the background (without blocking UI)
    try {
      await updateProfile({ preferredLanguage: languageCode });
    } catch (error) {
      console.error("Failed to persist language preference to backend:", error);
      // Don't show error to user since language change worked in the UI
      // The preference will be saved once the backend is updated
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsRow}>
        {SUPPORTED_LANGUAGES.map((language) => {
          const isActive = language.code === currentLanguage;
          const isDisabled = isUpdating && !isActive;

          return (
            <Pressable
              key={language.code}
              onPress={() => void handleLanguageChange(language.code)}
              disabled={isDisabled}
              style={({ pressed }: { pressed: boolean }) => [
                styles.option,
                variant === "compact" ? styles.optionCompact : null,
                isActive ? styles.optionActive : null,
                isDisabled ? styles.disabledOption : null,
                pressed ? styles.optionPressed : null,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive, disabled: isDisabled }}
              accessibilityLabel={`${language.name} (${language.nativeName})`}
            >
              <Text
                style={[
                  styles.optionLabel,
                  isActive ? styles.optionLabelActive : null,
                ]}
              >
                {language.nativeName}
              </Text>
              {variant === "default" ? (
                <Text
                  style={[
                    styles.optionDescription,
                    isActive ? styles.optionDescriptionActive : null,
                  ]}
                >
                  {language.name}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: tokens.spacing.sm,
    },
    optionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.sm,
    },
    option: {
      flexGrow: 1,
      minWidth: 160,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      justifyContent: "center",
      gap: tokens.spacing.xs,
    },
    optionCompact: {
      minWidth: 100,
      flexShrink: 1,
    },
    optionActive: {
      borderColor: tokens.colors.accent,
      backgroundColor: tokens.colors.overlay,
    },
    optionPressed: {
      opacity: 0.85,
    },
    disabledOption: {
      opacity: tokens.opacity.disabled,
    },
    optionLabel: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    optionLabelActive: {
      color: tokens.colors.accent,
    },
    optionDescription: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    optionDescriptionActive: {
      color: tokens.colors.textPrimary,
    },
  });
