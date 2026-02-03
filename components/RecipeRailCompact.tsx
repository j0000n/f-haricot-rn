import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RecipeCardCompact, COMPACT_CARD_WIDTH } from "@/components/cards/RecipeCardCompact";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@haricot/convex-client";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

interface RecipeRailCompactProps {
    header: string;
    subheader?: string;
    recipes: Recipe[];
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
            alignItems: "flex-end", // Align baseline
            paddingHorizontal: tokens.padding.card,
            marginBottom: tokens.spacing.sm,
        },
        headerText: {
            flex: 1,
            marginRight: tokens.spacing.md,
        },
        header: {
            fontSize: tokens.typography.subheading,
            fontFamily: tokens.fontFamilies.bold,
            color: tokens.colors.textPrimary,
            marginBottom: 2,
        },
        subheader: {
            fontSize: tokens.typography.small,
            fontFamily: tokens.fontFamilies.regular,
            color: tokens.colors.textSecondary,
        },
        seeAllButton: {
            fontSize: tokens.typography.small,
            fontFamily: tokens.fontFamilies.semiBold,
            color: tokens.colors.accent,
            paddingVertical: 4,
            paddingHorizontal: 8,
        },
        scrollContent: {
            paddingHorizontal: tokens.padding.card,
            paddingBottom: tokens.spacing.sm, // Space for shadows
        },
    });

export const RecipeRailCompact: React.FC<RecipeRailCompactProps> = ({
    header,
    subheader,
    recipes,
    onSeeAll,
    onRecipePress,
    userInventory = [],
    showAddToList = true,
}) => {
    const styles = useThemedStyles(createStyles);
    const tokens = useTokens();
    const { t } = useTranslation();

    const snapInterval = useMemo(
        () => COMPACT_CARD_WIDTH + tokens.spacing.sm,
        [tokens.spacing.sm],
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerText}>
                    <Text style={styles.header}>{header}</Text>
                    {subheader ? <Text style={styles.subheader}>{subheader}</Text> : null}
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
                {recipes.map((recipe) => (
                    <RecipeCardCompact
                        key={recipe._id}
                        recipe={recipe}
                        onPress={() => onRecipePress?.(recipe)}
                        userInventory={userInventory}
                        showAddToList={showAddToList}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

export default RecipeRailCompact;
