import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles } from "@/styles/tokens";

export interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  image?: string | null;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: 260,
      borderRadius: tokens.radii.md,
      overflow: "hidden",
      marginLeft: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      ...tokens.shadows.card,
    },
    containerPressed: {
      opacity: tokens.opacity.disabled,
    },
    image: {
      width: "100%",
      height: 140,
      backgroundColor: tokens.colors.overlay,
    },
    placeholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: tokens.spacing.md,
    },
    placeholderText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textSecondary,
      textAlign: "center",
    },
    content: {
      padding: tokens.padding.card,
      gap: tokens.spacing.xs,
    },
    title: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    description: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    domain: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textMuted,
      textTransform: "uppercase",
    },
  });

interface LinkPreviewCardProps {
  preview: LinkPreviewData;
  onPress?: () => void;
}

const getDomainFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
};

export const LINK_PREVIEW_CARD_WIDTH = 260;

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ preview, onPress }) => {
  const styles = useThemedStyles(createStyles);
  const domain = getDomainFromUrl(preview.url);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      accessibilityRole="button"
      accessibilityLabel={preview.title}
    >
      {preview.image ? (
        <Image
          source={{ uri: preview.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{domain}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.domain} numberOfLines={1}>
          {domain}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {preview.title}
        </Text>
        {preview.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {preview.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export default LinkPreviewCard;
