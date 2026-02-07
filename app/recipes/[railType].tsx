import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { RecipesViewCard } from "@/components/cards/RecipesViewCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { api } from "@haricot/convex-client";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@haricot/convex-client";
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

type RecipeCardListItem = {
  _id: Recipe["_id"];
  recipeName: Recipe["recipeName"];
  description: Recipe["description"];
  ingredients: Array<{
    foodCode: string;
    varietyCode?: string;
  }>;
  emojiTags: string[];
  totalTimeMinutes: number;
  servings: number;
  sourceUrl: string;
  attribution: Recipe["attribution"];
  cuisineTags?: string[];
  difficultyLevel?: "easy" | "medium" | "hard";
  imageUrls?: string[];
  originalImageSmallStorageId?: Recipe["originalImageSmallStorageId"];
  transparentImageSmallStorageId?: Recipe["transparentImageSmallStorageId"];
  createdAt: number;
};

const dedupeRecipesById = (recipes: RecipeCardListItem[]) =>
  Array.from(new Map(recipes.map((recipe) => [recipe._id, recipe])).values());

const createStyles = (
  tokens: ThemeTokens,
  windowWidth: number,
  columns: number,
  horizontalGap: number,
) => {
  // Responsive breakpoints
  const isDesktop = windowWidth > 1024;
  const verticalGap = isDesktop ? tokens.spacing.sm : tokens.spacing.xs; // Tighter vertical spacing on mobile
  const estimatedContainerWidth = Math.max(windowWidth - horizontalGap * 2, 320);
  const itemWidth = Math.floor(
    (estimatedContainerWidth - horizontalGap * (columns - 1)) / columns,
  );

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
    itemWrapper: {
      width: itemWidth,
      marginBottom: verticalGap,
    },
    itemWrapperWithGap: {
      marginRight: horizontalGap,
    },
    listFooter: {
      paddingVertical: tokens.spacing.md,
      alignItems: "center",
    },
    listEmpty: {
      flexGrow: 1,
      justifyContent: "center",
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
  const { t } = useTranslation();
  const tokens = useTokens();
  const windowWidth =
    typeof globalThis !== "undefined" &&
    (globalThis as { window?: { innerWidth?: number } }).window?.innerWidth
      ? (globalThis as { window: { innerWidth: number } }).window.innerWidth
      : 390;
  const isTablet = windowWidth > 768;
  const isDesktop = windowWidth > 1024;
  const columns = isDesktop ? 4 : isTablet ? 3 : 2;
  const pageSize = isTablet || isDesktop ? 40 : 24;
  const horizontalGap = tokens.spacing.sm;
  const styles = useThemedStyles(() =>
    createStyles(tokens, windowWidth, columns, horizontalGap),
  );
  const { inventoryEntries } = useInventoryDisplay();
  const [page, setPage] = useState(0);
  const [recipes, setRecipes] = useState<RecipeCardListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const normalizedRailType = useMemo(() => {
    const type = Array.isArray(railType) ? railType[0] : railType;
    return type as RailType;
  }, [railType]);

  const recipePage = useQuery(
    api.recipes.listPersonalizedCardsPage,
    normalizedRailType
      ? { railType: normalizedRailType, limit: pageSize, page }
      : "skip",
  );

  useEffect(() => {
    setPage(0);
    setHasMore(false);
    setRecipes([]);
  }, [normalizedRailType, pageSize]);

  useEffect(() => {
    if (!recipePage) return;
    setHasMore(recipePage.hasMore);
    setRecipes((previous) => {
      if (recipePage.page === 0) {
        return dedupeRecipesById(recipePage.recipes as RecipeCardListItem[]);
      }
      return dedupeRecipesById([
        ...previous,
        ...(recipePage.recipes as RecipeCardListItem[]),
      ]);
    });
  }, [recipePage]);

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

  const handleRecipePress = (recipe: RecipeCardListItem) => {
    router.push(`/recipe/${recipe._id}`);
  };

  const handleLoadMore = () => {
    if (!hasMore || recipePage === undefined) return;
    setPage((previous) => previous + 1);
  };

  const pageTitle = normalizedRailType
    ? RAIL_TYPE_LABELS[normalizedRailType] || "All Recipes"
    : "All Recipes";

  const isLoading = recipePage === undefined && page === 0 && recipes.length === 0;
  const isLoadingMore = recipePage === undefined && page > 0;
  const recipeList = recipes;

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
        <FlatList<RecipeCardListItem>
          data={recipeList}
          key={`${normalizedRailType}-${columns}`}
          keyExtractor={(item: RecipeCardListItem) => item._id}
          renderItem={({ item, index }: { item: RecipeCardListItem; index: number }) => {
            const isLastInRow = (index + 1) % columns === 0;
            return (
              <View
                style={[
                  styles.itemWrapper,
                  !isLastInRow && styles.itemWrapperWithGap,
                ]}
              >
                <RecipesViewCard
                  recipe={item as unknown as Recipe}
                  onPress={() => handleRecipePress(item)}
                  userInventory={userInventoryCodes}
                />
              </View>
            );
          }}
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            recipeList.length === 0 && styles.listEmpty,
          ]}
          // Force list remount when column count changes so layout remains stable.
          numColumns={columns}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {t("recipes.noRecipesFound") || "No recipes found"}
              </Text>
              <Text style={styles.emptyText}>
                {t("recipes.noRecipesFoundDesc") ||
                  "We couldn't find any recipes for this category."}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={tokens.colors.accent} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
