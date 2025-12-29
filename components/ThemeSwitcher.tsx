import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import { defaultThemeName, getThemeDefinition } from "@/styles/themes";
import type { ThemeName, ThemeTokens } from "@/styles/tokens";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { ThemeCreatorModal } from "./ThemeCreatorModal";

type Styles = ReturnType<typeof createStyles>;

type ThemeSwitcherProps = {
  variant?: "default" | "compact";
};

export function ThemeSwitcher({ variant = "default" }: ThemeSwitcherProps) {
  const {
    availableThemes,
    themeName,
    setTheme,
    isUpdatingTheme,
    tokens,
    setCustomTheme,
    customTheme,
    accessibilityPreferences,
    setAccessibilityPreferences,
  } = useTheme();
  const styles = useThemedStyles<Styles>(createStyles);
  const [showCreator, setShowCreator] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [queryShareCode, setQueryShareCode] = useState<string | null>(null);
  const { t } = useTranslation();
  const updateProfile = useMutation(api.users.updateProfile);
  const user = useQuery(api.users.getCurrentUser);

  // Get saved custom theme share code from user profile
  const savedCustomThemeShareCode = (user as { customThemeShareCode?: string | null } | null)?.customThemeShareCode;

  // Load saved custom theme if it exists and isn't already loaded
  const savedCustomThemeQuery = useQuery(
    api.customThemes.getThemeByShareCode,
    savedCustomThemeShareCode && !customTheme ? { shareCode: savedCustomThemeShareCode } : "skip"
  );

  const customThemeQuery = useQuery(
    api.customThemes.getThemeByShareCode,
    queryShareCode ? { shareCode: queryShareCode } : "skip"
  );

  // Load saved custom theme on mount ONLY if we're currently using a custom theme
  // Don't auto-load if user has switched to a built-in theme
  useEffect(() => {
    if (savedCustomThemeQuery && savedCustomThemeShareCode && !customTheme && themeName === "custom") {
      console.log("Loading saved custom theme:", savedCustomThemeQuery.name, savedCustomThemeQuery.shareCode);

      const fallbackTokens = getThemeDefinition(defaultThemeName).tokens;

      setCustomTheme({
        name: savedCustomThemeQuery.name,
        shareCode: savedCustomThemeQuery.shareCode,
        colors: {
          ...fallbackTokens.colors,
          ...savedCustomThemeQuery.colors,
          logoFill: savedCustomThemeQuery.colors.logoFill ?? savedCustomThemeQuery.colors.textPrimary,
        },
        spacing: { ...fallbackTokens.spacing, ...savedCustomThemeQuery.spacing },
        padding: savedCustomThemeQuery.padding,
        radii: { ...fallbackTokens.radii, ...savedCustomThemeQuery.radii },
        typography: { ...fallbackTokens.typography, ...savedCustomThemeQuery.typography },
        fontFamilies: savedCustomThemeQuery.fontFamilies,
        logoAsset: savedCustomThemeQuery.logoAsset,
        tabBar: savedCustomThemeQuery.tabBar,
      });
    }
  }, [savedCustomThemeQuery, savedCustomThemeShareCode, customTheme, setCustomTheme, themeName]);

  const handleApplyShareCode = async () => {
    if (!shareCode.trim()) {
      Alert.alert(
        t("themeSwitcher.shareCodeRequiredTitle"),
        t("themeSwitcher.shareCodeRequiredMessage"),
        [{ text: t("common.ok") }]
      );
      return;
    }

    const code = shareCode.trim().toUpperCase();
    setQueryShareCode(code);
  };

  useEffect(() => {
    if (customThemeQuery !== undefined && queryShareCode) {
      if (customThemeQuery) {
        // Apply the custom theme
        // Ensure logoFill is included in colors (matching ThemeProvider logic)
        const fallbackTokens = getThemeDefinition(defaultThemeName).tokens;
        const themeData = {
          name: customThemeQuery.name,
          shareCode: customThemeQuery.shareCode,
          colors: {
            ...fallbackTokens.colors,
            ...customThemeQuery.colors,
            logoFill: customThemeQuery.colors.logoFill ?? customThemeQuery.colors.textPrimary,
          },
          spacing: { ...fallbackTokens.spacing, ...customThemeQuery.spacing },
          padding: customThemeQuery.padding,
          radii: { ...fallbackTokens.radii, ...customThemeQuery.radii },
          typography: { ...fallbackTokens.typography, ...customThemeQuery.typography },
          fontFamilies: customThemeQuery.fontFamilies,
          logoAsset: customThemeQuery.logoAsset,
          tabBar: customThemeQuery.tabBar,
        };
        console.log("Applying custom theme:", themeData.name, themeData.shareCode);
        setCustomTheme(themeData);

        // Save the share code to user profile for persistence
        // Also clear preferredTheme to ensure custom theme takes priority
        // Wait for this to complete to ensure persistence
        updateProfile({
          customThemeShareCode: customThemeQuery.shareCode,
          preferredTheme: null, // Clear built-in theme preference
        }).then(() => {
          // Only show alert if this wasn't triggered by ThemeCreatorModal
          // (ThemeCreatorModal already shows its own alert)
          // Check if shareCode input is empty (meaning it came from ThemeCreatorModal)
          if (shareCode.trim()) {
            Alert.alert(
              t("themeSwitcher.shareCodeSuccessTitle"),
              t("themeSwitcher.shareCodeSuccessMessage", {
                name: customThemeQuery.name,
              }),
              [
                {
                  text: t("common.ok"),
                  onPress: () => {
                    setShareCode("");
                    setQueryShareCode(null);
                  },
                },
              ]
            );
          } else {
            // Clear the query share code but don't show alert (ThemeCreatorModal already did)
            setQueryShareCode(null);
          }
        }).catch((error) => {
          console.error("Failed to save custom theme share code", error);
          Alert.alert(
            "Error",
            "Theme applied but failed to save preference. It may not persist after reload.",
            [{ text: t("common.ok") }]
          );
        });
      } else {
        Alert.alert(
          t("themeSwitcher.shareCodeNotFoundTitle"),
          t("themeSwitcher.shareCodeNotFoundMessage"),
          [
            {
              text: t("common.ok"),
              onPress: () => {
                setQueryShareCode(null);
              },
            },
          ]
        );
      }
    }
  }, [customThemeQuery, queryShareCode, shareCode, t, setCustomTheme, updateProfile]);

  const isHighContrastPreferenceActive =
    accessibilityPreferences.highContrastMode !== "off";

  const isHighContrastThemeName = (name: ThemeName) =>
    name === "highContrastLight" || name === "highContrastDark";

  const handleThemeSelection = (optionName: ThemeName, isActive: boolean) => {
    if (isActive) {
      return;
    }

    const applyTheme = () => {
      void setTheme(optionName);
    };

    const selectingHighContrast = isHighContrastThemeName(optionName);

    if (isHighContrastPreferenceActive && !selectingHighContrast) {
      Alert.alert(
        t("themeSwitcher.leaveHighContrastTitle", {
          defaultValue: "Turn off high contrast?",
        }),
        t("themeSwitcher.leaveHighContrastMessage", {
          defaultValue:
            "Choosing a different theme will disable your high-contrast preference.",
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("themeSwitcher.leaveHighContrastConfirm", {
              defaultValue: "Switch theme",
            }),
            style: "destructive",
            onPress: () => {
              void setAccessibilityPreferences({ highContrastMode: "off" });
              applyTheme();
            },
          },
        ]
      );
      return;
    }

    if (selectingHighContrast) {
      const targetPreference =
        optionName === "highContrastLight" ? "light" : "dark";
      if (accessibilityPreferences.highContrastMode !== targetPreference) {
        void setAccessibilityPreferences({ highContrastMode: targetPreference });
      }
    }

    applyTheme();
  };

  const accentColor = tokens.colors.accent;

  const handleCopyCustomShareCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert(
      t("themeSwitcher.copyShareCodeTitle"),
      t("themeSwitcher.copyShareCodeMessage", { code })
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsRow}>
        {availableThemes.map((themeOption) => {
          const isActive = themeOption.name === themeName;
          const isDisabled = isUpdatingTheme && !isActive;
          const optionLabel = t(`themes.${themeOption.name}.name`, {
            defaultValue: themeOption.label,
          });
          const optionDescription = t(`themes.${themeOption.name}.description`, {
            defaultValue: themeOption.description,
          });

          // Get the theme definition for this theme option
          const themeDef = getThemeDefinition(themeOption.name);
          const themeTokens = themeDef.tokens;

          return (
            <Pressable
              key={themeOption.name}
              onPress={() => {
                handleThemeSelection(themeOption.name, isActive);
              }}
              disabled={isDisabled}
              style={({ pressed }: { pressed: boolean }) => [
                styles.option,
                variant === "compact" ? styles.optionCompact : null,
                {
                  backgroundColor: isActive ? themeTokens.colors.accent : themeTokens.colors.surface,
                  borderColor: isActive ? themeTokens.colors.accent : themeTokens.colors.border,
                  borderWidth: themeTokens.borderWidths.thin,
                  borderRadius: themeTokens.radii.sm,
                  opacity: isDisabled ? tokens.opacity.disabled : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive, disabled: isDisabled }}
            >
              <Text
                style={[
                  {
                    fontSize: themeTokens.typography.body,
                    fontFamily: themeTokens.fontFamilies.display,
                    color: isActive ? themeTokens.colors.accentOnPrimary : themeTokens.colors.textPrimary,
                  },
                ]}
              >
                {optionLabel}
              </Text>
              {variant === "default" ? (
                <Text
                  style={[
                    {
                      fontSize: themeTokens.typography.tiny,
                      fontFamily: themeTokens.fontFamilies.regular,
                      color: isActive ? themeTokens.colors.accentOnPrimary : themeTokens.colors.textSecondary,
                    },
                  ]}
                >
                  {optionDescription}
                </Text>
              ) : null}
            </Pressable>
          );
        })}

        {/* Show saved custom theme if it exists */}
        {customTheme && (
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.option,
              variant === "compact" ? styles.optionCompact : null,
              {
                backgroundColor: themeName === "custom" ? customTheme.colors.accent : customTheme.colors.surface,
                borderColor: themeName === "custom" ? customTheme.colors.accent : customTheme.colors.border,
                borderWidth: tokens.borderWidths.thin, // Use current theme's borderWidth for consistency
                borderRadius: customTheme.radii.sm,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => {
              if (themeName !== "custom") {
                // Re-apply the custom theme
                setCustomTheme(customTheme);
                // Save the share code to profile and clear built-in theme preference
                updateProfile({
                  customThemeShareCode: customTheme.shareCode,
                  preferredTheme: null, // Clear built-in theme to ensure custom theme persists
                }).catch((error) => {
                  console.error("Failed to save custom theme share code", error);
                });
              }
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: themeName === "custom" }}
          >
            <View style={styles.customThemeContent}>
              <Feather
                name="droplet"
                size={20}
                color={themeName === "custom" ? customTheme.colors.accentOnPrimary : customTheme.colors.accent}
              />
              <Text
                style={{
                  fontSize: customTheme.typography.body,
                  fontFamily: customTheme.fontFamilies.semiBold,
                  color: themeName === "custom" ? customTheme.colors.accentOnPrimary : customTheme.colors.textPrimary,
                }}
              >
                {customTheme.name}
              </Text>
            </View>
            {variant === "default" ? (
              <Text
                style={{
                  fontSize: customTheme.typography.tiny,
                  fontFamily: customTheme.fontFamilies.regular,
                  color: themeName === "custom" ? customTheme.colors.accentOnPrimary : customTheme.colors.textSecondary,
                }}
              >
                {t("themeSwitcher.customThemeLabel")}
              </Text>
            ) : null}
            {customTheme.shareCode ? (
              <View
                style={[
                  styles.shareCodePill,
                  {
                    backgroundColor:
                      themeName === "custom" ? customTheme.colors.overlay : customTheme.colors.surface,
                    borderColor: customTheme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: customTheme.typography.tiny,
                    fontFamily: customTheme.fontFamilies.regular,
                    color: themeName === "custom"
                      ? customTheme.colors.accentOnPrimary
                      : customTheme.colors.textPrimary,
                  }}
                >
                  {t("themeSwitcher.shareCodeDisplay", { code: customTheme.shareCode })}
                </Text>
                <Pressable
                  onPress={() => handleCopyCustomShareCode(customTheme.shareCode)}
                  style={[styles.copyButton, { borderColor: customTheme.colors.border }]}
                >
                  <Text
                    style={{
                      fontSize: customTheme.typography.tiny,
                      fontFamily: customTheme.fontFamilies.semiBold,
                      color: customTheme.colors.accent,
                    }}
                  >
                    {t("themeSwitcher.copyShareCode")}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        )}

        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.option,
            styles.createButton,
            variant === "compact" ? styles.optionCompact : null,
            pressed ? styles.optionPressed : null,
          ]}
          onPress={() => setShowCreator(true)}
        >
          <View style={styles.createButtonContent}>
            <Feather name="plus-circle" size={24} color={accentColor} />
            <Text style={styles.createLabel}>{t("themeSwitcher.createTheme")}</Text>
          </View>
          {variant === "default" ? (
            <Text style={styles.createDescription}>
              {t("themeSwitcher.createThemeDescription")}
            </Text>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.shareCodeSection}>
        <Text style={styles.shareCodeLabel}>{t("themeSwitcher.shareCodePrompt")}</Text>
        <View style={styles.shareCodeRow}>
          <TextInput
            style={styles.shareCodeInput}
            value={shareCode}
            onChangeText={setShareCode}
            placeholder={t("themeSwitcher.shareCodePlaceholder")}
            placeholderTextColor={tokens.colors.textMuted}
            autoCapitalize="characters"
            maxLength={8}
          />
          <Pressable
            style={[styles.applyButton, queryShareCode !== null && styles.applyButtonDisabled]}
            onPress={handleApplyShareCode}
            disabled={queryShareCode !== null}
          >
            <Text style={styles.applyButtonText}>
              {queryShareCode !== null ? t("themeSwitcher.loading") : t("themeSwitcher.apply")}
            </Text>
          </Pressable>
        </View>
      </View>

      <ThemeCreatorModal
        visible={showCreator}
        onClose={() => {
          setShowCreator(false);
          // Clear share code input when closing modal to prevent duplicate alerts
          setShareCode("");
        }}
        onThemeCreated={async (code) => {
          console.log("Theme created with code:", code);
          // Automatically apply the newly created theme
          // Clear shareCode input first so the useEffect knows this came from ThemeCreatorModal
          setShareCode("");
          setQueryShareCode(code);
        }}
      />
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: tokens.spacing.sm,
    },
    optionsRow: {
      flexDirection: "column",
      gap: tokens.spacing.sm,
      width: "100%",
    },
    option: {
      width: "100%",
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
      minWidth: 120,
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
    customThemeButton: {
      borderColor: tokens.colors.accent,
      backgroundColor: tokens.colors.surface,
    },
    customThemeContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    createButton: {
      borderStyle: "dashed",
      borderColor: tokens.colors.accent,
      backgroundColor: tokens.colors.overlay,
    },
    createButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    createLabel: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.accent,
    },
    createDescription: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    shareCodeSection: {
      gap: tokens.spacing.xs,
      marginTop: tokens.spacing.sm,
    },
    shareCodeLabel: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    shareCodeRow: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
    },
    shareCodeInput: {
      flex: 1,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textPrimary,
    },
    applyButton: {
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.lg,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.accent,
      justifyContent: "center",
    },
    applyButtonDisabled: {
      opacity: tokens.opacity.disabled,
    },
    applyButtonText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.accentOnPrimary,
    },
    shareCodePill: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: tokens.borderWidths.thin,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      gap: tokens.spacing.sm,
      marginTop: tokens.spacing.xs,
    },
    copyButton: {
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      backgroundColor: tokens.colors.surface,
    },
  });
