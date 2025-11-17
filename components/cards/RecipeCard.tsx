import React, { useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { RecipeListPicker } from "@/components/RecipeListPicker";
import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { Recipe } from "@/types/recipe";
import { calculateIngredientMatch } from "@/utils/inventory";
import { formatRecipeTime } from "@/utils/recipes";
import { useQuery } from "convex/react";

interface RecipeCardProps {
  recipe: Recipe;
  variant: "compact" | "standard" | "detailed";
  onPress?: () => void;
  userInventory?: string[];
  showAddToList?: boolean;
}

type Styles = ReturnType<typeof createStyles>;

export const RECIPE_CARD_WIDTHS: Record<RecipeCardProps["variant"], number> = {
  compact: 120,
  standard: 160,
  detailed: 240,
};

const IMAGE_HEIGHTS: Record<RecipeCardProps["variant"], number> = {
  compact: 120,
  standard: 160,
  detailed: 240,
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      marginRight: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      borderColor: tokens.colors.border,
    },
    containerPressed: {
      opacity: tokens.opacity.disabled,
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      overflow: "hidden",
      borderTopLeftRadius: tokens.radii.sm,
      borderTopRightRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.imageBackgroundColor,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    matchBadge: {
      position: "absolute",
      top: tokens.spacing.xs,
      left: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.xxs,
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
      bottom: tokens.spacing.xs,
      right: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.xxs,
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
      gap: tokens.spacing.xxs,
    },
    title: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
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
    description: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.small * tokens.lineHeights.relaxed,
    },
    actionsRow: {
      marginTop: tokens.spacing.xs,
      alignItems: "flex-end",
    },
  });

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  variant,
  onPress,
  userInventory = [],
  showAddToList = true,
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.language || "en") as keyof Recipe["recipeName"];

  const { matchPercentage, missingIngredients } = calculateIngredientMatch(
    recipe.ingredients,
    userInventory,
  );

  const visibleEmojiCount =
    variant === "compact" ? 3 : variant === "standard" ? 5 : recipe.emojiTags.length;

  const cardWidth = RECIPE_CARD_WIDTHS[variant];
  const imageHeight = IMAGE_HEIGHTS[variant];

  const badgeColor =
    matchPercentage >= 75
      ? tokens.colors.success
      : matchPercentage >= 50
      ? tokens.colors.info
      : tokens.colors.danger;

  const hasInventory = userInventory.length > 0;
  const shouldShowMatch = hasInventory && matchPercentage < 100;
  const actionsRowRef = useRef<View>(null);

  // Get image URL with fallback chain following Convex file serving best practices
  // https://docs.convex.dev/file-storage/serve-files
  // Fallback: transparentImageSmallStorageId → originalImageSmallStorageId → imageUrls[0]
  const imageUrl = useQuery(api.fileUrls.getRecipeCardImageUrl, {
    transparentImageSmallStorageId: recipe.transparentImageSmallStorageId,
    originalImageSmallStorageId: recipe.originalImageSmallStorageId,
    imageUrls: recipe.imageUrls,
  });

  const handleCardPress = (event: any) => {
    // Check if the press originated from within the actions row
    if (actionsRowRef.current) {
      // @ts-ignore - For web compatibility
      const target = event?.target || event?.nativeEvent?.target;
      if (target && actionsRowRef.current) {
        // @ts-ignore - For web compatibility
        const actionsElement = actionsRowRef.current as any;
        if (actionsElement?.contains?.(target)) {
          return; // Don't trigger card press if clicking inside actions row
        }
      }
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        { width: cardWidth },
        pressed && styles.containerPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={recipe.recipeName[currentLanguage]}
    >
      <View style={[styles.imageContainer, { height: imageHeight }]}>
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

        {variant !== "compact" && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>
              {formatRecipeTime(recipe.totalTimeMinutes, t)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={variant === "compact" ? 1 : 2}>
          {recipe.recipeName[currentLanguage] || recipe.recipeName.en}
        </Text>

        <View style={styles.emojiRow}>
          {recipe.emojiTags.slice(0, visibleEmojiCount).map((emoji) => (
            <Text key={emoji} style={styles.emoji}>
              {emoji}
            </Text>
          ))}
        </View>

        {variant !== "compact" && (
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
        )}

        {variant === "detailed" && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description[currentLanguage] || recipe.description.en}
          </Text>
        )}

        {variant !== "compact" && showAddToList ? (
          <View ref={actionsRowRef} style={styles.actionsRow}>
            <RecipeListPicker
              recipe={recipe}
              userInventory={userInventory}
              presentation="dropdown"
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};
