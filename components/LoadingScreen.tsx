import React from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";

import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.colors.background,
      padding: tokens.padding.screen,
    },
    text: {
      marginTop: tokens.spacing.sm,
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
    },
  });

type Styles = ReturnType<typeof createStyles>;

export const LoadingScreen: React.FC = () => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={tokens.colors.accent} />
      <Text style={styles.text}>{t("common.loading")}</Text>
    </SafeAreaView>
  );
};
