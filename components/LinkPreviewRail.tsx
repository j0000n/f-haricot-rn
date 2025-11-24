import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { LinkPreviewCard, LINK_PREVIEW_CARD_WIDTH, type LinkPreviewData } from "@/components/cards/LinkPreviewCard";
import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

interface LinkPreviewRailProps {
  header: string;
  subheader?: string;
  links: LinkPreviewData[];
  isLoading?: boolean;
  onLinkPress?: (url: string) => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      marginBottom: tokens.padding.section,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: tokens.padding.card,
      marginBottom: tokens.spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    header: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xxs,
    },
    subheader: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.lineHeights.normal * tokens.typography.small,
    },
    scrollContent: {
      paddingHorizontal: tokens.padding.card,
    },
    loadingContainer: {
      paddingHorizontal: tokens.padding.card,
    },
    loadingText: {
      marginTop: tokens.spacing.xs,
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      textAlign: "center",
    },
    emptyText: {
      paddingHorizontal: tokens.padding.card,
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
  });

export const LinkPreviewRail: React.FC<LinkPreviewRailProps> = ({
  header,
  subheader,
  links,
  isLoading = false,
  onLinkPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerText}>
            <Text style={styles.header}>{header}</Text>
            {subheader ? <Text style={styles.subheader}>{subheader}</Text> : null}
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.accent} />
          <Text style={styles.loadingText}>{t("home.webPreviewLoading")}</Text>
        </View>
      </View>
    );
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerText}>
          <Text style={styles.header}>{header}</Text>
          {subheader ? <Text style={styles.subheader}>{subheader}</Text> : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={LINK_PREVIEW_CARD_WIDTH + tokens.spacing.xs}
        snapToAlignment="start"
      >
        {links.map((link) => (
          <LinkPreviewCard
            key={link.url}
            preview={link}
            onPress={() => onLinkPress?.(link.url)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default LinkPreviewRail;
