import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe, RecipeIngredient } from "@/types/recipe";
import { formatIngredientQuantity, extractIngredientNameFromText } from "@/utils/inventory";
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
    
    if (entry) {
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
    }

    // Fallback: Extract name from originalText
    if (ingredient.originalText) {
      const cleanedName = extractIngredientNameFromText(ingredient.originalText);
      if (cleanedName && cleanedName.length > 0) {
        return cleanedName;
      }
    }

    // Fallback: Extract from provisional code
    if (ingredient.foodCode.startsWith("provisional.")) {
      const codeName = ingredient.foodCode
        .replace("provisional.", "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
      return codeName;
    }

    // Last resort: return foodCode
    return ingredient.foodCode;
  };

  const translatePreparation = (preparation: string): string => {
    if (!preparation) return "";

    // Map common preparation terms to translation keys
    const prepMap: Record<string, string> = {
      "diced": "recipe.preparation.diced",
      "chopped": "recipe.preparation.chopped",
      "minced": "recipe.preparation.minced",
      "sliced": "recipe.preparation.sliced",
      "cubed": "recipe.preparation.cubed",
      "julienned": "recipe.preparation.julienned",
      "crushed": "recipe.preparation.crushed",
      "grated": "recipe.preparation.grated",
      "shredded": "recipe.preparation.shredded",
      "whole": "recipe.preparation.whole",
      "peeled": "recipe.preparation.peeled",
      "seeded": "recipe.preparation.seeded",
      "small": "recipe.preparation.small",
      "large": "recipe.preparation.large",
      "fine": "recipe.preparation.fine",
      "coarse": "recipe.preparation.coarse",
    };

    // Split preparation string into words and translate each part
    const words = preparation.toLowerCase().split(/\s+/);
    const translatedWords = words.map((word) => {
      // Remove common punctuation
      const cleanWord = word.replace(/[.,;:!?]/g, "");
      const translationKey = prepMap[cleanWord];
      if (translationKey) {
        const translated = t(translationKey);
        // If translation returns the key, translation is missing, use original
        return translated !== translationKey ? translated : word;
      }
      return word;
    });

    // Join translated words, preserving original capitalization pattern
    const result = translatedWords.join(" ");
    // Try to preserve original capitalization (capitalize first letter if original was)
    if (preparation[0] && preparation[0] === preparation[0].toUpperCase()) {
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  };

  // Detect optional serving ingredients (unit: "count", quantity: 1, often in "For serving" sections)
  const isOptionalServingIngredient = (ingredient: RecipeIngredient): boolean => {
    // Check if it's a count-based ingredient with quantity 1
    if (ingredient.unit === "count" && ingredient.quantity === 1) {
      // Check if originalText suggests it's optional (contains "optional", "for serving", "for garnish")
      const origText = (ingredient.originalText || "").toLowerCase();
      if (
        origText.includes("optional") ||
        origText.includes("for serving") ||
        origText.includes("for garnish") ||
        origText.includes("pictured")
      ) {
        return true;
      }
      // Check if displayName suggests it's optional
      const name = getDisplayName(ingredient).toLowerCase();
      if (name.includes("optional") || name.includes("for serving") || name.includes("for garnish")) {
        return true;
      }
    }
    return false;
  };

  return (
    <View style={styles.container}>
      {ingredients.map((ingredient) => {
        const hasIngredient =
          inventorySet.has(ingredient.foodCode) ||
          (ingredient.varietyCode ? inventorySet.has(ingredient.varietyCode) : false);
        const displayName = getDisplayName(ingredient);
        const isOptional = isOptionalServingIngredient(ingredient);

        return (
          <View
            key={`${ingredient.foodCode}-${ingredient.varietyCode ?? "default"}`}
            style={[styles.row, !hasIngredient && styles.rowMissing]}
          >
            {!isOptional && (
              <Text style={styles.quantity}>
                {formatIngredientQuantity(ingredient, { language, t })}
              </Text>
            )}

            <View style={styles.details}>
              <Text style={[styles.name, !hasIngredient && styles.nameMissing]}>
                {displayName}
                {isOptional && (
                  <Text style={styles.preparation}> ({t("common.optional", { defaultValue: "optional" })})</Text>
                )}
              </Text>
              {ingredient.preparation ? (
                <Text style={styles.preparation}>{translatePreparation(ingredient.preparation)}</Text>
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
