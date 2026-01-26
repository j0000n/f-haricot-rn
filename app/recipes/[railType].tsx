import React, { useMemo } from "react";
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { RecipesViewCard } from "@/components/cards/RecipesViewCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";
import { getRecipeLanguage } from "@/utils/translation";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";

type RailType =
  | "forYou"
  | "readyToCook"
  | "quickEasy"
  | "cuisines"
  | "dietaryFriendly"
  | "householdCompatible";

const RAIL_TYPE_LABELS: Record<RailType, string> = {
  forYou: "For You",
  readyToCook: "Ready to Cook",
  quickEasy: "Quick & Easy",
  cuisines: "Your Favorite Cuisines",
  dietaryFriendly: "Dietary Friendly",
  householdCompatible: "For Your Household",
};

const createStyles = (tokens: ThemeTokens, windowWidth: number) => {
  // Responsive breakpoints
  const isTablet = windowWidth > 768;
  const isDesktop = windowWidth > 1024;
  
  // Use consistent horizontal spacing for gaps between cards
  const horizontalGap = tokens.spacing.sm; // Gap between cards horizontally (12px)
  // Use smaller vertical spacing, especially on mobile
  const verticalGap = isDesktop ? tokens.spacing.sm : tokens.spacing.xs; // Tighter vertical spacing on mobile
  
  // Calculate column count
  const columns = isDesktop ? 4 : isTablet ? 3 : 2;
  
  // Calculate precise item width percentage accounting for gaps
  // Formula: (100% - (columns - 1) * gap%) / columns
  // Convert gap from pixels to percentage of container width
  // Estimate container width (accounting for padding): windowWidth - 2*horizontalGap
  const estimatedContainerWidth = Math.max(windowWidth - 2 * horizontalGap, 300);
  const gapPercent = (horizontalGap / estimatedContainerWidth) * 100;
  const totalGapSpace = (columns - 1) * gapPercent;
  const itemWidthPercent = (100 - totalGapSpace) / columns;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: horizontalGap, // Edge spacing matches gap
      paddingTop: tokens.padding.screen,
      paddingBottom: tokens.spacing.xxl,
      ...(Platform.OS === "web" && isDesktop && {
        maxWidth: 1400, // Max width for very large screens
        alignSelf: "center",
        width: "100%",
      }),
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "stretch", // Ensure all items in a row have equal height
      width: "100%", // Ensure grid takes full width of container
    },
    gridItem: {
      width: `${itemWidthPercent}%`,
      marginBottom: verticalGap, // Vertical spacing (smaller on mobile)
    },
    gridItemNotLast: {
      marginRight: horizontalGap, // Horizontal spacing between cards
    },
    emptyState: {
      paddingVertical: tokens.spacing.xxl,
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    emptyTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    emptyText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      textAlign: "center",
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
  });
};

export default function ViewAllRecipesScreen() {
  const { railType } = useLocalSearchParams<{ railType: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const tokens = useTokens();
  const windowWidth = Dimensions.get("window").width;
  const isTablet = windowWidth > 768;
  const isDesktop = windowWidth > 1024;
  const styles = useThemedStyles(() => createStyles(tokens, windowWidth));
  const { inventoryEntries } = useInventoryDisplay();

  const normalizedRailType = useMemo(() => {
    const type = Array.isArray(railType) ? railType[0] : railType;
    return type as RailType;
  }, [railType]);

  // Fetch all recipes for this rail type (using a high limit to get all)
  const recipes = useQuery(
    api.recipes.listPersonalized,
    normalizedRailType
      ? { railType: normalizedRailType, limit: 1000 }
      : "skip",
  ) as Recipe[] | undefined;

  const userInventoryCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const entry of inventoryEntries) {
      codes.add(entry.itemCode);
      if (entry.varietyCode) {
        codes.add(entry.varietyCode);
      }
    }
    return Array.from(codes);
  }, [inventoryEntries]);

  const language = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe._id}`);
  };

  const pageTitle = normalizedRailType
    ? RAIL_TYPE_LABELS[normalizedRailType] || "All Recipes"
    : "All Recipes";

  const isLoading = recipes === undefined;
  const recipeList = recipes ?? [];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: pageTitle,
          headerBackTitle: t("home.title") || "Home",
        }}
      />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {recipeList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {t("recipes.noRecipesFound") || "No recipes found"}
              </Text>
              <Text style={styles.emptyText}>
                {t("recipes.noRecipesFoundDesc") ||
                  "We couldn't find any recipes for this category."}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {recipeList.map((recipe, index) => {
                // Calculate if this is the last item in a row
                const columns = isDesktop ? 4 : isTablet ? 3 : 2;
                const isLastInRow = (index + 1) % columns === 0;
                
                return (
                  <View
                    key={recipe._id}
                    style={[
                      styles.gridItem,
                      !isLastInRow && styles.gridItemNotLast,
                    ]}
                  >
                    <RecipesViewCard
                      recipe={recipe}
                      onPress={() => handleRecipePress(recipe)}
                      userInventory={userInventoryCodes}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
