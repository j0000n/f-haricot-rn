import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";

import { api } from "@haricot/convex-client";
import type { Doc } from "@haricot/convex-client";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe, RecipeIngredient } from "@haricot/convex-client";
import { formatIngredientQuantity, extractIngredientNameFromText } from "@/utils/inventory";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
  userInventory?: string[];
  language: keyof Recipe["recipeName"];
}

type Styles = ReturnType<typeof createStyles>;

type FoodLibraryLookupItem = Pick<
  Doc<"foodLibrary">,
  "code" | "translations" | "varieties"
>;

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
    quantityColumn: {
      width: 190,
      flexShrink: 0,
    },
    quantity: {
      width: "100%",
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

  const ingredientCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const ingredient of ingredients) {
      codes.add(ingredient.foodCode);
    }
    return Array.from(codes);
  }, [ingredients]);

  const library = useQuery(api.foodLibrary.getByCodes, {
    codes: ingredientCodes,
  });
  const libraryByCode = useMemo(() => {
    if (!Array.isArray(library)) {
      return new Map<string, FoodLibraryLookupItem>();
    }

    return new Map(library.map((item) => [item.code, item]));
  }, [library]);
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
    const ingredientWithLocalizedFallback = ingredient as RecipeIngredient & {
      displayNameLocalized?: Partial<Record<keyof Recipe["recipeName"], string>>;
    };
    const entry = libraryByCode.get(ingredient.foodCode);

    if (entry) {
      // Handle database translation format (can be {singular, plural} object or string)
      const baseTranslation = entry.translations[language as keyof typeof entry.translations] || entry.translations.en;
      const baseName = typeof baseTranslation === "string"
        ? baseTranslation
        : baseTranslation?.singular || baseTranslation?.plural || "";

      if (!ingredient.varietyCode) {
        return baseName;
      }

      const varieties = entry.varieties as Array<{
        code: string;
        translations: Record<string, string>;
      }>;
      const variety = varieties.find((variant) => variant.code === ingredient.varietyCode);
      if (!variety) {
        return baseName;
      }

      // Variety translations are strings in the schema
      const varietyName =
        variety.translations[language as keyof typeof variety.translations] || variety.translations.en;

      return `${baseName} (${varietyName})`;
    }

    const localizedFallbackName =
      ingredientWithLocalizedFallback.displayNameLocalized?.[language] ||
      ingredientWithLocalizedFallback.displayNameLocalized?.en;
    if (localizedFallbackName) {
      return localizedFallbackName;
    }

    // Fallback: Extract name from originalText
    if (ingredient.originalText) {
      const cleanedName = extractIngredientNameFromText(ingredient.originalText);
      if (cleanedName && cleanedName.length > 0) {
        return cleanedName;
      }
    }

    if (ingredient.foodCode.startsWith("missing.")) {
      return ingredient.foodCode
        .replace("missing.", "")
        .replace(/_/g, " ")
        .trim();
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

    const normalizedPreparation = preparation
      .toLowerCase()
      .replace(/[.,;:!?()/-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const preparationPhraseMap: Record<
      string,
      { key: string; defaultFr: string; defaultEn: string }
    > = {
      "optional": {
        key: "recipe.preparation.optional",
        defaultFr: "facultatif",
        defaultEn: "optional",
      },
      "to taste": {
        key: "recipe.preparation.toTaste",
        defaultFr: "au goût",
        defaultEn: "to taste",
      },
      "or to taste": {
        key: "recipe.preparation.orToTaste",
        defaultFr: "ou au goût",
        defaultEn: "or to taste",
      },
      "for serving": {
        key: "recipe.preparation.forServing",
        defaultFr: "pour servir",
        defaultEn: "for serving",
      },
      "for garnish": {
        key: "recipe.preparation.forGarnish",
        defaultFr: "pour garnir",
        defaultEn: "for garnish",
      },
      "drained rinsed": {
        key: "recipe.preparation.drainedRinsed",
        defaultFr: "egouttes, rinces",
        defaultEn: "drained, rinsed",
      },
      "packed washed and dried divided": {
        key: "recipe.preparation.packedWashedDriedDivided",
        defaultFr: "tasse, lave et seche, divise",
        defaultEn: "packed, washed and dried, divided",
      },
      "bite sized pieces small potatoes": {
        key: "recipe.preparation.biteSizedPiecesSmallPotatoes",
        defaultFr: "en morceaux de la taille d une bouchee / petites pommes de terre",
        defaultEn: "bite-sized pieces / small potatoes",
      },
    };

    const preparationPhrase = preparationPhraseMap[normalizedPreparation];
    if (preparationPhrase) {
      return t(preparationPhrase.key, {
        defaultValue: language === "fr" ? preparationPhrase.defaultFr : preparationPhrase.defaultEn,
      });
    }

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
      "optional": "recipe.preparation.optional",
      "and": "recipe.preparation.and",
      "drained": "recipe.preparation.drained",
      "rinsed": "recipe.preparation.rinsed",
      "washed": "recipe.preparation.washed",
      "dried": "recipe.preparation.dried",
      "packed": "recipe.preparation.packed",
      "divided": "recipe.preparation.divided",
      "potato": "recipe.preparation.potato",
      "potatoes": "recipe.preparation.potatoes",
      "piece": "recipe.preparation.piece",
      "pieces": "recipe.preparation.pieces",
      "bite": "recipe.preparation.bite",
      "sized": "recipe.preparation.sized",
    };

    // Split preparation string into words and translate each part
    const words = normalizedPreparation.split(/\s+/);
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

  const shouldHidePreparation = (preparation: string | undefined, isOptional: boolean): boolean => {
    if (!preparation) return true;

    const normalized = preparation
      .toLowerCase()
      .replace(/[.,;:!?()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) return true;
    if (!isOptional) return false;

    // Avoid duplicate rendering when optional is already shown next to the ingredient name.
    return normalized === "optional" || normalized === "for serving" || normalized === "for garnish";
  };

  const stripOptionalMarker = (name: string): string => {
    return name
      .replace(/\s*\((optional|facultatif)\)\s*$/i, "")
      .replace(/\s*,\s*(optional|facultatif)\s*$/i, "")
      .trim();
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
      {ingredients.map((ingredient, index) => {
        const hasIngredient =
          inventorySet.has(ingredient.foodCode) ||
          (ingredient.varietyCode ? inventorySet.has(ingredient.varietyCode) : false);
        const displayName = getDisplayName(ingredient);
        const isOptional = isOptionalServingIngredient(ingredient);
        const preparationText = ingredient.preparation ?? "";
        const displayNameWithoutOptional = isOptional ? stripOptionalMarker(displayName) : displayName;

        return (
          <View
            key={`${ingredient.foodCode}-${ingredient.varietyCode ?? "default"}-${ingredient.originalText ?? ""}-${index}`}
            style={[styles.row, !hasIngredient && styles.rowMissing]}
          >
            <View style={styles.quantityColumn}>
              {!isOptional && (
                <Text style={styles.quantity}>
                  {formatIngredientQuantity(ingredient, { language, t })}
                </Text>
              )}
            </View>

            <View style={styles.details}>
              <Text style={[styles.name, !hasIngredient && styles.nameMissing]}>
                {displayNameWithoutOptional}
                {isOptional && (
                  <Text style={styles.preparation}>
                    {" "}
                    ({t("recipe.preparation.optional", {
                      defaultValue: language === "fr" ? "facultatif" : "optional",
                    })})
                  </Text>
                )}
              </Text>
              {!shouldHidePreparation(preparationText, isOptional) ? (
                <Text style={styles.preparation}>{translatePreparation(preparationText)}</Text>
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
