import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe, RecipeIngredient } from "@/types/recipe";
import { formatIngredientQuantity } from "@/utils/inventory";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
  userInventory?: string[];
  language: keyof Recipe["recipeName"];
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: tokens.spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: tokens.spacing.sm,
      padding: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
    },
    rowMissing: {
      borderColor: tokens.colors.danger,
      backgroundColor: tokens.colors.overlay,
    },
    quantity: {
      minWidth: 72,
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
      color: tokens.colors.textPrimary,
    },
    details: {
      flex: 1,
      gap: tokens.spacing.xxs,
    },
    name: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    nameMissing: {
      color: tokens.colors.danger,
    },
    preparation: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.tiny * tokens.lineHeights.normal,
    },
    statusBadge: {
      alignSelf: "flex-start",
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.xs,
    },
    statusMissing: {
      backgroundColor: tokens.colors.danger,
    },
    statusHave: {
      backgroundColor: tokens.colors.success,
    },
    statusText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.accentOnPrimary,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    loadingText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
  });

export const IngredientsList: React.FC<IngredientsListProps> = ({
  ingredients,
  userInventory = [],
  language,
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();

  const library = useQuery(api.foodLibrary.listAll, {});
  const inventorySet = useMemo(() => new Set(userInventory), [userInventory]);

  if (library === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={tokens.colors.accent} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const getDisplayName = (ingredient: RecipeIngredient) => {
    const entry = library?.find((item) => item.code === ingredient.foodCode);
    if (!entry) {
      return ingredient.foodCode;
    }

    // Handle database translation format (can be {singular, plural} object or string)
    const baseTranslation = entry.translations[language as keyof typeof entry.translations] || entry.translations.en;
    const baseName = typeof baseTranslation === "string"
      ? baseTranslation
      : baseTranslation?.singular || baseTranslation?.plural || "";

    if (!ingredient.varietyCode) {
      return baseName;
    }

    const variety = entry.varieties.find((variant) => variant.code === ingredient.varietyCode);
    if (!variety) {
      return baseName;
    }

    // Variety translations are strings in the schema
    const varietyName =
      variety.translations[language as keyof typeof variety.translations] || variety.translations.en;

    return `${baseName} (${varietyName})`;
  };

  return (
    <View style={styles.container}>
      {ingredients.map((ingredient) => {
        const hasIngredient =
          inventorySet.has(ingredient.foodCode) ||
          (ingredient.varietyCode ? inventorySet.has(ingredient.varietyCode) : false);
        const displayName = getDisplayName(ingredient);

        return (
          <View
            key={`${ingredient.foodCode}-${ingredient.varietyCode ?? "default"}`}
            style={[styles.row, !hasIngredient && styles.rowMissing]}
          >
            <Text style={styles.quantity}>{formatIngredientQuantity(ingredient)}</Text>

            <View style={styles.details}>
              <Text style={[styles.name, !hasIngredient && styles.nameMissing]}>{displayName}</Text>
              {ingredient.preparation ? (
                <Text style={styles.preparation}>{ingredient.preparation}</Text>
              ) : null}
            </View>

            <View style={[styles.statusBadge, hasIngredient ? styles.statusHave : styles.statusMissing]}>
              <Text style={styles.statusText}>
                {hasIngredient ? t("recipe.have") : t("recipe.missing")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
