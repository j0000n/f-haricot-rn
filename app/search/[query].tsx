import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@haricot/convex-client";
import { decodeUrl } from "@/utils/url";
import createSearchStyles, { type SearchStyles } from "@/styles/searchStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@haricot/convex-client";
import { getRecipeLanguage } from "@/utils/translation";

const SEARCH_RESULTS_LIMIT = 50;

const COOKING_TIME_OPTIONS = [
  { label: "Any", value: null },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
] as const;

const SORT_OPTIONS = [
  { value: "relevance" as const, labelKey: "search.sortRelevance" },
  { value: "timeAsc" as const, labelKey: "search.sortTimeAsc" },
  { value: "timeDesc" as const, labelKey: "search.sortTimeDesc" },
  { value: "difficulty" as const, labelKey: "search.sortDifficulty" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const router = useRouter();
  const searchTerm = useMemo(() => decodeUrl(query), [query]);
  const trimmedSearchTerm = searchTerm.trim();
  const styles = useThemedStyles<SearchStyles>(createSearchStyles);
  const tokens = useTokens();
  const { t, i18n } = useTranslation();
  // Map i18n language code (e.g., "fr-FR") to recipe language code (e.g., "fr")
  const language = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];

  const currentUser = useQuery(api.users.getCurrentUser);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [maxCookTime, setMaxCookTime] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  // Get user preferences as defaults
  const userDietary = useMemo(
    () => (currentUser as { dietaryRestrictions?: string[] } | null)?.dietaryRestrictions ?? [],
    [currentUser]
  );
  const userCuisines = useMemo(
    () => (currentUser as { favoriteCuisines?: string[] } | null)?.favoriteCuisines ?? [],
    [currentUser]
  );

  // Search results
  const searchResults = useQuery(
    api.recipes.search,
    trimmedSearchTerm
      ? { query: trimmedSearchTerm, limit: SEARCH_RESULTS_LIMIT }
      : "skip",
  );

  // Filtered results using listByPreferences
  const filteredResults = useQuery(
    api.recipes.listByPreferences,
    (selectedDietary.length > 0 || selectedCuisines.length > 0 || maxCookTime !== null)
      ? {
          dietaryRestrictions: selectedDietary.length > 0 ? selectedDietary : undefined,
          favoriteCuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
          maxCookTime: maxCookTime ?? undefined,
          limit: SEARCH_RESULTS_LIMIT,
        }
      : "skip",
  );

  // Combine search and filter results
  const recipes = useMemo(() => {
    const searchRecipes = (searchResults ?? []) as Recipe[];

    // If filters are applied, use filtered results and then filter by search term
    if (selectedDietary.length > 0 || selectedCuisines.length > 0 || maxCookTime !== null) {
      const filtered = (filteredResults ?? []) as Recipe[];
      if (!trimmedSearchTerm) {
        return filtered;
      }
      // Filter filtered results by search term
      return filtered.filter((recipe) =>
        Object.values(recipe.recipeName).some((name) =>
          name.toLowerCase().includes(trimmedSearchTerm.toLowerCase())
        ) ||
        Object.values(recipe.description).some((description) =>
          description.toLowerCase().includes(trimmedSearchTerm.toLowerCase())
        )
      );
    }

    return searchRecipes;
  }, [searchResults, filteredResults, trimmedSearchTerm, selectedDietary, selectedCuisines, maxCookTime]);

  const DIETARY_OPTIONS = [
    "Vegetarian", "Vegan", "Pescatarian", "Gluten-free", "Dairy-free", "Halal", "Kosher"
  ];
  const CUISINE_OPTIONS = [
    "Italian", "Mexican", "Indian", "Thai", "Mediterranean", "Japanese", "American"
  ];

  const hasActiveFilters = selectedDietary.length > 0 || selectedCuisines.length > 0 || maxCookTime !== null;
  const isLoading =
    (trimmedSearchTerm.length > 0 && searchResults === undefined) ||
    (hasActiveFilters && filteredResults === undefined);

  const sortedRecipes = useMemo(() => {
    const list = recipes.slice();

    if (sortOption === "relevance") {
      return list;
    }

    if (sortOption === "timeAsc") {
      return list.sort(
        (a, b) => (a.totalTimeMinutes ?? Number.POSITIVE_INFINITY) - (b.totalTimeMinutes ?? Number.POSITIVE_INFINITY),
      );
    }

    if (sortOption === "timeDesc") {
      return list.sort(
        (a, b) => (b.totalTimeMinutes ?? Number.NEGATIVE_INFINITY) - (a.totalTimeMinutes ?? Number.NEGATIVE_INFINITY),
      );
    }

    return list.sort((a, b) => {
      const difficultyRank: Record<NonNullable<Recipe["difficultyLevel"]>, number> = {
        easy: 0,
        medium: 1,
        hard: 2,
      };
      const aRank = a.difficultyLevel ? difficultyRank[a.difficultyLevel] : Number.POSITIVE_INFINITY;
      const bRank = b.difficultyLevel ? difficultyRank[b.difficultyLevel] : Number.POSITIVE_INFINITY;

      if (aRank === bRank) {
        return (a.totalTimeMinutes ?? Number.POSITIVE_INFINITY) - (b.totalTimeMinutes ?? Number.POSITIVE_INFINITY);
      }

      return aRank - bRank;
    });
  }, [recipes, sortOption]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("search.title") }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t("search.resultsTitle")}</Text>
              {trimmedSearchTerm ? (
                <Text style={styles.subtitle}>
                  {t("search.resultsSubtitle", { query: trimmedSearchTerm })}
                </Text>
              ) : (
                <Text style={styles.subtitle}>{t("search.emptyQuery")}</Text>
              )}
            </View>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                {t("search.filters")} {hasActiveFilters ? `(${selectedDietary.length + selectedCuisines.length + (maxCookTime ? 1 : 0)})` : ""}
              </Text>
            </Pressable>
          </View>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortOption === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSortOption(option.value)}
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[styles.sortChipText, isActive && styles.sortChipTextActive]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {showFilters && (
          <View style={styles.filtersSection}>
            <Text style={styles.filterSectionTitle}>{t("search.dietaryRestrictions")}</Text>
            <View style={styles.filterChips}>
              {DIETARY_OPTIONS.map((option) => {
                const isSelected = selectedDietary.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setSelectedDietary((current) =>
                        isSelected
                          ? current.filter((item) => item !== option)
                          : [...current, option]
                      );
                    }}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.filterSectionTitle}>{t("search.cuisines")}</Text>
            <View style={styles.filterChips}>
              {CUISINE_OPTIONS.map((option) => {
                const isSelected = selectedCuisines.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setSelectedCuisines((current) =>
                        isSelected
                          ? current.filter((item) => item !== option)
                          : [...current, option]
                      );
                    }}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.filterSectionTitle}>{t("search.maxCookTime")}</Text>
            <View style={styles.filterChips}>
              {COOKING_TIME_OPTIONS.map((option) => {
                const isSelected = maxCookTime === option.value;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setMaxCookTime(option.value)}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {hasActiveFilters && (
              <Pressable
                onPress={() => {
                  setSelectedDietary([]);
                  setSelectedCuisines([]);
                  setMaxCookTime(null);
                }}
                style={styles.clearFiltersButton}
                accessibilityRole="button"
              >
                <Text style={styles.clearFiltersText}>{t("search.clearFilters")}</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.resultsList}>
          {isLoading ? (
            <Text style={styles.subtitle}>{t("search.loading")}</Text>
          ) : sortedRecipes.length > 0 ? (
            sortedRecipes.map((recipe) => (
              <Pressable
                key={recipe._id}
                onPress={() => router.push(`/recipe/${recipe._id}`)}
                style={styles.resultCard}
                accessibilityRole="button"
              >
                <Text style={styles.resultTitle}>
                  {recipe.recipeName[language] || recipe.recipeName.en}
                </Text>
                <Text style={styles.resultMeta}>
                  {`${t("recipe.totalTime")}: ${recipe.totalTimeMinutes} ${t(
                    "recipe.minutesLabel",
                  )} · ${t("recipe.servings")}: ${recipe.servings}`}
                </Text>
                <Text style={styles.resultDescription} numberOfLines={3}>
                  {recipe.description[language] || recipe.description.en}
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {trimmedSearchTerm
                  ? t("search.noResults", { query: trimmedSearchTerm })
                  : t("search.emptyQuery")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
