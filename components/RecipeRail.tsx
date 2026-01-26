import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RecipeCard, RECIPE_CARD_WIDTHS } from "@/components/cards/RecipeCard";
import { FullImageCard, FULL_IMAGE_CARD_WIDTH } from "@/components/cards/FullImageCard";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

type RecipeCardVariant = "compact" | "standard" | "detailed" | "fullImage";

interface RecipeRailProps {
  header: string;
  subheader?: string;
  recipes: Recipe[];
  variant?: RecipeCardVariant;
  onSeeAll?: () => void;
  onRecipePress?: (recipe: Recipe) => void;
  userInventory?: string[];
  showAddToList?: boolean;
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
    seeAllButton: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      backgroundColor: tokens.colors.overlay,
      color: tokens.colors.accent,
      padding: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      borderColor: tokens.colors.accent,
      borderWidth: tokens.borderWidths.thin,
    },
    scrollContent: {
      paddingHorizontal: tokens.padding.card,
    },
  });

export const RecipeRail: React.FC<RecipeRailProps> = ({
  header,
  subheader,
  recipes,
  variant = "standard",
  onSeeAll,
  onRecipePress,
  userInventory = [],
  showAddToList = true,
}) => {
  const styles = useThemedStyles(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();

  const snapInterval = useMemo(() => {
    const cardWidth =
      variant === "fullImage" ? FULL_IMAGE_CARD_WIDTH : RECIPE_CARD_WIDTHS[variant];
    return cardWidth + tokens.spacing.xs;
  }, [tokens.spacing.xs, variant]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerText}>
          <Text style={styles.header}>{header}</Text>
          {subheader && variant !== "fullImage" ? (
            <Text style={styles.subheader}>{subheader}</Text>
          ) : null}
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAllButton}>{t("components.seeAll")}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
      >
        {recipes.map((recipe) =>
          variant === "fullImage" ? (
            <FullImageCard
              key={recipe._id}
              recipe={recipe}
              onPress={() => onRecipePress?.(recipe)}
              userInventory={userInventory}
            />
          ) : (
            <RecipeCard
              key={recipe._id}
              recipe={recipe}
              variant={variant}
              onPress={() => onRecipePress?.(recipe)}
              userInventory={userInventory}
              showAddToList={showAddToList}
            />
          ),
        )}
      </ScrollView>
    </View>
  );
};

export default RecipeRail;
