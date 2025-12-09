import { LoadingScreen } from "@/components/LoadingScreen";
import { PageHeader } from "@/components/PageHeader";
import { RecipeRail } from "@/components/RecipeRail";
import { api } from "@/convex/_generated/api";
import { useRecipeLists, type RecipeList } from "@/hooks/useRecipeLists";
import { useTranslation } from "@/i18n/useTranslation";
import createListsStyles from "@/styles/listsStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { Recipe } from "@/types/recipe";
import {
  buildRecipeIds,
  decorateRecipesWithMatches,
  sortRecipesByReadiness,
  type DecoratedRecipe,
} from "@/utils/recipeLists";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type ViewMode = "list" | "detailed";

type SortOption = "name" | "recipes" | "ready" | "match" | "updated";

type FilterOption = "all" | "cookAsap" | "standard" | "ready";

type DecoratedList = {
  list: RecipeList;
  recipes: DecoratedRecipe[];
  sortedRecipes: Recipe[];
  readyCount: number;
  averageMatch: number;
  totalRecipes: number;
  updatedAt: number;
};

const EMPTY_CODES: string[] = [];

export default function ListsScreen() {
  const styles = useThemedStyles(createListsStyles);
  const tokens = useTokens();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { allLists } = useRecipeLists();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortOption, setSortOption] = useState<SortOption>("ready");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const allRecipeIds = useMemo(() => {
    const ids = new Set<Recipe["_id"]>();
    for (const list of allLists) {
      for (const id of buildRecipeIds(list)) {
        ids.add(id);
      }
    }

    return Array.from(ids);
  }, [allLists]);

  const recipesResult = useQuery(
    api.recipes.getMany,
    allRecipeIds.length > 0 ? { ids: allRecipeIds } : "skip",
  );
  const recipes = useMemo(
    () => (Array.isArray(recipesResult) ? (recipesResult as Recipe[]) : []),
    [recipesResult],
  );
  const recipeMap = useMemo(() => new Map(recipes.map((recipe) => [recipe._id, recipe])), [recipes]);

  const inventoryCodesQuery = useQuery(api.users.getCurrentInventory, {});
  const inventoryCodes = useMemo(
    () => (Array.isArray(inventoryCodesQuery) ? inventoryCodesQuery : EMPTY_CODES),
    [inventoryCodesQuery],
  );

  const language = (i18n.language || "en") as keyof Recipe["recipeName"];
  const isLoading =
    (allRecipeIds.length > 0 && recipesResult === undefined) ||
    inventoryCodesQuery === undefined;

  const decoratedLists = useMemo<DecoratedList[]>(() => {
    return allLists.map((list) => {
      const recipeIds = buildRecipeIds(list);
      const listRecipes = recipeIds
        .map((id) => recipeMap.get(id))
        .filter((recipe): recipe is Recipe => Boolean(recipe));

      const decoratedRecipes = decorateRecipesWithMatches(listRecipes, inventoryCodes);

      const readyCount = decoratedRecipes.filter((entry) => entry.matchPercentage === 100).length;
      const totalRecipes = decoratedRecipes.length;
      const averageMatch =
        totalRecipes === 0
          ? 0
          : Math.round(
              decoratedRecipes.reduce((sum, entry) => sum + entry.matchPercentage, 0) /
                totalRecipes,
            );
      const sortedRecipes = sortRecipesByReadiness(decoratedRecipes, language);

      return {
        list,
        recipes: decoratedRecipes,
        sortedRecipes,
        readyCount,
        averageMatch,
        totalRecipes,
        updatedAt: list.updatedAt ?? 0,
      } satisfies DecoratedList;
    });
  }, [allLists, inventoryCodes, language, recipeMap]);

  const sortedLists = useMemo(() => {
    const lists = [...decoratedLists];

    lists.sort((a, b) => {
      if (sortOption === "name") {
        return a.list.name.localeCompare(b.list.name);
      }

      if (sortOption === "recipes") {
        const delta = b.totalRecipes - a.totalRecipes;
        return delta !== 0 ? delta : a.list.name.localeCompare(b.list.name);
      }

      if (sortOption === "ready") {
        const delta = b.readyCount - a.readyCount;
        return delta !== 0 ? delta : a.list.name.localeCompare(b.list.name);
      }

      if (sortOption === "match") {
        const delta = b.averageMatch - a.averageMatch;
        return delta !== 0 ? delta : a.list.name.localeCompare(b.list.name);
      }

      const delta = (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      return delta !== 0 ? delta : a.list.name.localeCompare(b.list.name);
    });

    return lists;
  }, [decoratedLists, sortOption]);

  const trimmedSearch = searchTerm.trim().toLowerCase();

  const filteredLists = useMemo(() => {
    return sortedLists.filter((entry) => {
      if (filterOption === "cookAsap" && entry.list.type !== "cook-asap") {
        return false;
      }

      if (filterOption === "standard" && entry.list.type !== "standard") {
        return false;
      }

      if (filterOption === "ready" && entry.readyCount === 0) {
        return false;
      }

      if (!trimmedSearch) {
        return true;
      }

      return entry.list.name.toLowerCase().includes(trimmedSearch);
    });
  }, [filterOption, sortedLists, trimmedSearch]);

  const sortOptions = useMemo(
    () => [
      { value: "ready" satisfies SortOption, label: t("lists.sortReadyCount") },
      { value: "name" satisfies SortOption, label: t("lists.sortName") },
      { value: "recipes" satisfies SortOption, label: t("lists.sortRecipeCount") },
      { value: "match" satisfies SortOption, label: t("lists.sortMatch") },
      { value: "updated" satisfies SortOption, label: t("lists.sortUpdated") },
    ],
    [t],
  );

  const filterOptions = useMemo(
    () => [
      { value: "all" satisfies FilterOption, label: t("lists.filterAllLists") },
      { value: "cookAsap" satisfies FilterOption, label: t("lists.filterCookAsap") },
      { value: "standard" satisfies FilterOption, label: t("lists.filterStandard") },
      { value: "ready" satisfies FilterOption, label: t("lists.filterReady") },
    ],
    [t],
  );

  const handleListPress = useCallback(
    (listId: string) => {
      router.push(`/lists/${listId}`);
    },
    [router],
  );

  const handleRecipePress = useCallback(
    (recipeId: Recipe["_id"]) => {
      router.push(`/recipe/${recipeId}`);
    },
    [router],
  );

  const buildSummary = useCallback(
    (readyCount: number, averageMatch: number, totalRecipes: number) => {
      const readyLabel = t(
        readyCount === 1 ? "lists.readyToCook_one" : "lists.readyToCook_other",
        { count: readyCount },
      );
      const stockedLabel = t("lists.stockedPercentage", { percentage: averageMatch });
      const totalLabel = t(
        totalRecipes === 1 ? "lists.recipeCount_one" : "lists.recipeCount_other",
        { count: totalRecipes },
      );

      return t("lists.listSummary", {
        ready: readyLabel,
        stocked: stockedLabel,
        total: totalLabel,
      });
    },
    [t],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  const hasAnyLists = sortedLists.length > 0;
  const hasFilteredLists = filteredLists.length > 0;

  return (
    <View style={styles.container}>
      <PageHeader title={t("lists.title")} showProfileButton={true} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>{t("lists.searchLabel")}</Text>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t("lists.searchLists")}
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel={t("lists.searchLabel")}
            returnKeyType="search"
          />
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.sortControl}>
            <Pressable
              onPress={() => setShowSortMenu((current) => !current)}
              accessibilityRole="button"
              accessibilityExpanded={showSortMenu}
              style={styles.sortTrigger}
            >
              <Text style={styles.sortTriggerLabel}>{t("lists.sortBy")}</Text>
              <Text style={styles.sortTriggerValue}>
                {sortOptions.find((option) => option.value === sortOption)?.label}
              </Text>
            </Pressable>

            {showSortMenu ? (
              <View style={styles.sortMenu}>
                {sortOptions.map((option) => {
                  const isActive = option.value === sortOption;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setSortOption(option.value as SortOption);
                        setShowSortMenu(false);
                      }}
                      style={[
                        styles.sortMenuItem,
                        isActive ? styles.sortMenuItemActive : undefined,
                      ]}
                      accessibilityRole="menuitem"
                    >
                      <Text
                        style={[
                          styles.sortMenuLabel,
                          isActive ? styles.sortMenuLabelActive : undefined,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.controlsRight}>
            <View style={styles.viewToggle}>
              {(["list", "detailed"] as ViewMode[]).map((mode) => {
                const isActive = viewMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setViewMode(mode)}
                    style={[
                      styles.viewToggleButton,
                      isActive ? styles.viewToggleButtonActive : undefined,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.viewToggleLabel,
                        isActive ? styles.viewToggleLabelActive : undefined,
                      ]}
                    >
                      {mode === "list" ? t("lists.viewList") : t("lists.viewDetailed")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRowContent}
        >
          {filterOptions.map((option) => {
            const isActive = option.value === filterOption;
            return (
              <Pressable
                key={option.value}
                onPress={() => setFilterOption(option.value as FilterOption)}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : undefined,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    isActive ? styles.filterChipLabelActive : undefined,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!hasAnyLists ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t("lists.noListsTitle")}</Text>
            <Text style={styles.emptyStateSubtext}>{t("lists.noListsDescription")}</Text>
          </View>
        ) : !hasFilteredLists ? (
          <Text style={styles.noResultsText}>{t("lists.noResults")}</Text>
        ) : viewMode === "list" ? (
          <View style={styles.listCollection}>
            {filteredLists.map((entry) => {
              const summary = buildSummary(
                entry.readyCount,
                entry.averageMatch,
                entry.totalRecipes,
              );

              return (
                <Pressable
                  key={entry.list.id}
                  onPress={() => handleListPress(entry.list.id)}
                  accessibilityRole="button"
                  accessibilityLabel={entry.list.name}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.listCard,
                    pressed ? styles.listCardPressed : undefined,
                  ]}
                >
                  <View style={styles.listCardHeader}>
                    {entry.list.emoji ? (
                      <Text style={styles.listCardEmoji}>{entry.list.emoji}</Text>
                    ) : null}
                    <Text style={styles.listCardTitle}>{entry.list.name}</Text>
                  </View>
                  <Text style={styles.listCardSummary}>{summary}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          filteredLists.map((entry) => {
            const summary = buildSummary(
              entry.readyCount,
              entry.averageMatch,
              entry.totalRecipes,
            );

            return (
              <View key={entry.list.id} style={styles.detailedSection}>
                <RecipeRail
                  header={`${entry.list.emoji ? `${entry.list.emoji} ` : ""}${entry.list.name}`.trim()}
                  subheader={summary}
                  recipes={entry.sortedRecipes}
                  variant="detailed"
                  onSeeAll={() => handleListPress(entry.list.id)}
                  onRecipePress={(recipe) => handleRecipePress(recipe._id)}
                  userInventory={inventoryCodes}
                  showAddToList={false}
                />
                {entry.totalRecipes === 0 ? (
                  <Text style={styles.railEmptyMessage}>{t("lists.emptyList")}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
