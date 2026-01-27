import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { Recipe } from "@/types/recipe";
import { calculateIngredientMatch } from "@/utils/inventory";
import { formatRecipeTime } from "@/utils/recipes";
import { getRecipeLanguage } from "@/utils/translation";
import { useQuery } from "convex/react";

interface RecipeCardCompactProps {
    recipe: Recipe;
    onPress?: () => void;
    userInventory?: string[];
    showAddToList?: boolean;
}

type Styles = ReturnType<typeof createStyles>;

export const COMPACT_CARD_WIDTH = 140;
const IMAGE_HEIGHT = 140;

const createStyles = (tokens: ThemeTokens) =>
    StyleSheet.create({
        container: {
            borderRadius: tokens.radii.md,
            marginRight: tokens.spacing.xs,
            backgroundColor: tokens.colors.surface,
            width: COMPACT_CARD_WIDTH,
            overflow: "hidden", // Ensure content respects border radius
            // Shadow for depth
            shadowColor: tokens.shadows.card.shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        containerPressed: {
            opacity: tokens.opacity.disabled,
        },
        imageContainer: {
            position: "relative",
            width: "100%",
            height: IMAGE_HEIGHT,
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
            paddingHorizontal: tokens.spacing.xs,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker backdrop for better contrast
            backdropFilter: "blur(4px)",
        },
        matchText: {
            fontFamily: tokens.fontFamilies.bold,
            fontSize: tokens.typography.tiny,
            color: "#FFFFFF", // Always white for contrast on dark badge
        },
        timeBadge: {
            position: "absolute",
            top: tokens.spacing.xs,
            right: tokens.spacing.xs,
            paddingHorizontal: tokens.spacing.xs,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        timeText: {
            fontFamily: tokens.fontFamilies.medium,
            fontSize: tokens.typography.tiny,
            color: tokens.colors.textPrimary,
        },
        content: {
            padding: tokens.spacing.sm,
            gap: tokens.spacing.xxs,
            flex: 1,
        },
        title: {
            fontFamily: tokens.fontFamilies.semiBold,
            fontSize: tokens.typography.body,
            color: tokens.colors.textPrimary,
            lineHeight: tokens.lineHeights.tight * tokens.typography.body,
            height: tokens.lineHeights.tight * tokens.typography.body * 2, // Fixed height for 2 lines
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: tokens.spacing.xxs,
        },
    });

export const RecipeCardCompact: React.FC<RecipeCardCompactProps> = ({
    recipe,
    onPress,
    userInventory = [],
}) => {
    const styles = useThemedStyles<Styles>(createStyles);
    const tokens = useTokens();
    const { t, i18n } = useTranslation();
    // Map i18n language code (e.g., "fr-FR") to recipe language code (e.g., "fr")
    const currentLanguage = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];

    const { matchPercentage } = calculateIngredientMatch(
        recipe.ingredients,
        userInventory,
    );

    const badgeColor =
        matchPercentage >= 75
            ? tokens.colors.success
            : matchPercentage >= 50
                ? tokens.colors.info
                : tokens.colors.danger;

    const hasInventory = userInventory.length > 0;
    const shouldShowMatch = hasInventory && matchPercentage < 100;

    // Get image URL with fallback chain
    const imageUrl = useQuery(api.fileUrls.getRecipeCardImageUrl, {
        transparentImageSmallStorageId: recipe.transparentImageSmallStorageId,
        originalImageSmallStorageId: recipe.originalImageSmallStorageId,
        imageUrls: recipe.imageUrls,
    });

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
                <Text style={styles.title} numberOfLines={2}>
                    {recipe.recipeName[currentLanguage] || recipe.recipeName.en}
                </Text>
            </View>
        </Pressable>
    );
};
