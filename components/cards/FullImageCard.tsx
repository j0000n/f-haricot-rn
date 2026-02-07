import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@haricot/convex-client";
import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { Recipe } from "@haricot/convex-client";
import { calculateIngredientMatch } from "@/utils/inventory";
import { formatRecipeTime, getRecipeDisplayTitle } from "@/utils/recipes";
import { getRecipeLanguage } from "@/utils/translation";
import { useQuery } from "convex/react";

interface FullImageCardProps {
  recipe: Recipe;
  onPress?: () => void;
  userInventory?: string[];
}

type Styles = ReturnType<typeof createStyles>;

const SCREEN_WIDTH =
  typeof globalThis !== "undefined" &&
  (globalThis as { window?: { innerWidth?: number } }).window?.innerWidth
    ? (globalThis as { window: { innerWidth: number } }).window.innerWidth
    : 390;
export const FULL_IMAGE_CARD_WIDTH = SCREEN_WIDTH * 0.8; // 4/5 of screen width
const FULL_IMAGE_CARD_HEIGHT = FULL_IMAGE_CARD_WIDTH * 1.2; // Slightly taller for better aspect ratio

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Fallback to white if hex parsing fails
    return `rgba(255, 255, 255, ${opacity})`;
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: FULL_IMAGE_CARD_WIDTH,
      height: FULL_IMAGE_CARD_HEIGHT,
      borderRadius: tokens.radii.md,
      marginRight: tokens.spacing.xxs,
      overflow: "hidden",
      backgroundColor: tokens.colors.surface,
    },
    containerPressed: {
      opacity: tokens.opacity.disabled,
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      height: "100%",
      backgroundColor: tokens.colors.imageBackgroundColor,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    pillsContainer: {
      position: "absolute",
      top: tokens.spacing.xs,
      right: tokens.spacing.xs,
      flexDirection: "column",
      alignItems: "flex-end",
      gap: tokens.spacing.xs,
    },
    pill: {
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xxs,
      borderRadius: tokens.radii.round,
      backgroundColor: tokens.colors.overlay,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.accent,
    },
    pillIngredient: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    pillText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.accent,
    },
    pillTextIngredient: {
      color: tokens.colors.accentOnPrimary,
    },
    titleContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: tokens.padding.card * 1.5,
      paddingHorizontal: tokens.padding.card,
      backgroundColor: hexToRgba(tokens.colors.surface, 0.75),
      alignItems: "start",
      borderBottomLeftRadius: tokens.radii.md,
      borderBottomRightRadius: tokens.radii.md,
    },
    title: {
      fontFamily: tokens.fontFamilies.display,
      fontSize: tokens.typography.subheading ,
      color: tokens.colors.textPrimary,
    },
  });

export const FullImageCard: React.FC<FullImageCardProps> = ({
  recipe,
  onPress,
  userInventory = [],
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t, i18n } = useTranslation();
  const currentLanguage = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];
  const displayTitle = getRecipeDisplayTitle(recipe, currentLanguage);

  const { matchPercentage, missingIngredients } = calculateIngredientMatch(
    recipe.ingredients,
    userInventory,
  );

  const hasInventory = userInventory.length > 0;
  const ownedCount = hasInventory
    ? recipe.ingredients.filter(
        (ing) =>
          userInventory.includes(ing.foodCode) ||
          (ing.varietyCode && userInventory.includes(ing.varietyCode)),
      ).length
    : 0;
  const totalIngredients = recipe.ingredients.length;

  // Get image URL with fallback chain
  const imageUrl = useQuery(api.fileUrls.getRecipeCardImageUrl, {
    transparentImageSmallStorageId: recipe.transparentImageSmallStorageId,
    originalImageSmallStorageId: recipe.originalImageSmallStorageId,
    imageUrls: recipe.imageUrls,
  });

  // Build pills array - always prioritize ingredient information
  const pills: Array<{ text: string; isIngredient?: boolean }> = [];

  // Ingredient count pill - always show if recipe has ingredients
  if (totalIngredients > 0) {
    if (hasInventory) {
      // Show owned/total when user has inventory
      pills.push({
        text: `${ownedCount}/${totalIngredients} ${t("recipe.ingredients")}`,
        isIngredient: true,
      });
    } else {
      // Show total ingredients when no inventory
      pills.push({
        text: `${totalIngredients} ${t("recipe.ingredients")}`,
        isIngredient: true,
      });
    }
  }

  // Cuisine tag pill
  if (recipe.cuisineTags && recipe.cuisineTags.length > 0) {
    pills.push({ text: recipe.cuisineTags[0] });
  }

  // Time pill
  if (recipe.totalTimeMinutes > 0) {
    pills.push({ text: formatRecipeTime(recipe.totalTimeMinutes, t) });
  }

  // Difficulty pill
  if (recipe.difficultyLevel) {
    pills.push({
      text:
        recipe.difficultyLevel.charAt(0).toUpperCase() + recipe.difficultyLevel.slice(1),
    });
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        pressed && styles.containerPressed,
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

        {/* Pills in top right */}
        {pills.length > 0 && (
          <View style={styles.pillsContainer}>
            {pills.map((pill, index) => (
              <View
                key={index}
                style={[styles.pill, pill.isIngredient && styles.pillIngredient]}
              >
                <Text
                  style={[styles.pillText, pill.isIngredient && styles.pillTextIngredient]}
                >
                  {pill.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recipe name at bottom */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default FullImageCard;
