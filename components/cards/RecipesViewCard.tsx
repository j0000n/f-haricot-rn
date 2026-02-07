import React, { useRef } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@haricot/convex-client";
import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { Recipe } from "@haricot/convex-client";
import { calculateIngredientMatch } from "@/utils/inventory";
import { formatRecipeTime, getRecipeDisplayTitle } from "@/utils/recipes";
import { getRecipeLanguage } from "@/utils/translation";
import { useQuery } from "convex/react";

interface RecipesViewCardProps {
  recipe: Recipe;
  onPress?: () => void;
  userInventory?: string[];
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (tokens: ThemeTokens, cardWidth?: number) =>
  StyleSheet.create({
    container: {
      width: "100%",
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      backgroundColor: tokens.colors.surface,
      borderColor: tokens.colors.border,
      overflow: "hidden",
      ...(Platform.OS === "web" && {
        // Add hover effect for web
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }),
    },
    containerPressed: {
      opacity: tokens.opacity.disabled,
    },
    containerWebHover: {
      ...(Platform.OS === "web" && {
        transform: [{ scale: 1.02 }],
        shadowColor: tokens.shadows.card.shadowColor,
        shadowOffset: tokens.shadows.card.shadowOffset,
        shadowOpacity: tokens.shadows.card.shadowOpacity * 1.5,
        shadowRadius: tokens.shadows.card.shadowRadius * 1.5,
        elevation: tokens.shadows.card.elevation * 1.5,
      }),
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      aspectRatio: 4 / 3, // 4:3 aspect ratio for consistent card heights
      overflow: "hidden",
      backgroundColor: tokens.colors.imageBackgroundColor,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    matchBadge: {
      position: "absolute",
      top: tokens.spacing.sm,
      left: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
    },
    matchText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.accentOnPrimary,
    },
    timeBadge: {
      position: "absolute",
      bottom: tokens.spacing.sm,
      right: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.overlay,
    },
    timeText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textPrimary,
    },
    content: {
      padding: tokens.padding.card,
      gap: tokens.spacing.xs,
      minHeight: 120, // Fixed minimum height for content area
      justifyContent: "space-between",
    },
    titleContainer: {
      minHeight: 48, // Fixed height for title area (2 lines max)
      justifyContent: "flex-start",
    },
    title: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    emojiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xxs,
    },
    emoji: {
      fontSize: tokens.typography.heading,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: tokens.spacing.xxs,
    },
    metaText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    missingText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.danger,
    },
  });

export const RecipesViewCard: React.FC<RecipesViewCardProps> = ({
  recipe,
  onPress,
  userInventory = [],
}) => {
  const windowWidth =
    typeof globalThis !== "undefined" &&
    (globalThis as { window?: { innerWidth?: number } }).window?.innerWidth
      ? (globalThis as { window: { innerWidth: number } }).window.innerWidth
      : 390;
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t, i18n } = useTranslation();
  // Map i18n language code (e.g., "fr-FR") to recipe language code (e.g., "fr")
  const currentLanguage = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];
  const displayTitle = getRecipeDisplayTitle(recipe, currentLanguage);

  const { matchPercentage, missingIngredients } = calculateIngredientMatch(
    recipe.ingredients,
    userInventory,
  );

  // Show more emojis on larger screens
  const isLargeScreen = windowWidth > 768; // Tablet/desktop breakpoint
  const visibleEmojiCount = isLargeScreen ? 8 : 6;

  const badgeColor =
    matchPercentage >= 75
      ? tokens.colors.success
      : matchPercentage >= 50
      ? tokens.colors.info
      : tokens.colors.danger;

  const hasInventory = userInventory.length > 0;
  const shouldShowMatch = hasInventory && matchPercentage < 100;

  // Get image URL with fallback chain following Convex file serving best practices
  // https://docs.convex.dev/file-storage/serve-files
  // Fallback: transparentImageSmallStorageId → originalImageSmallStorageId → imageUrls[0]
  const imageUrl = useQuery(api.fileUrls.getRecipeCardImageUrl, {
    transparentImageSmallStorageId: recipe.transparentImageSmallStorageId,
    originalImageSmallStorageId: recipe.originalImageSmallStorageId,
    imageUrls: recipe.imageUrls,
  });

  const handleCardPress = (event: any) => {
    onPress?.();
  };

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        pressed && styles.containerPressed,
        Platform.OS === "web" && !pressed && styles.containerWebHover,
      ]}
      accessibilityRole="button"
      accessibilityLabel={recipe.recipeName[currentLanguage]}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            defaultSource={undefined}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}

        {shouldShowMatch && (
          <View style={[styles.matchBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.matchText}>{matchPercentage}%</Text>
          </View>
        )}

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>
            {formatRecipeTime(recipe.totalTimeMinutes, t)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>
        </View>

        <View style={styles.emojiRow}>
          {recipe.emojiTags.slice(0, visibleEmojiCount).map((emoji) => (
            <Text key={emoji} style={styles.emoji}>
              {emoji}
            </Text>
          ))}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {recipe.servings} {t("common.servings")}
          </Text>
          {hasInventory && missingIngredients > 0 && (
            <Text style={styles.missingText}>
              {missingIngredients} {t("recipe.missingIngredients")}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default RecipesViewCard;
