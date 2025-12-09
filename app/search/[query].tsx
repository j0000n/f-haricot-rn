import { useMemo } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { decodeUrl } from "@/utils/url";
import createSearchStyles, { type SearchStyles } from "@/styles/searchStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";

const SEARCH_RESULTS_LIMIT = 50;

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const router = useRouter();
  const searchTerm = useMemo(() => decodeUrl(query), [query]);
  const trimmedSearchTerm = searchTerm.trim();
  const styles = useThemedStyles<SearchStyles>(createSearchStyles);
  const { t, i18n } = useTranslation();
  const language = (i18n.language || "en") as keyof Recipe["recipeName"];

  const results = useQuery(
    api.recipes.search,
    trimmedSearchTerm
      ? { query: trimmedSearchTerm, limit: SEARCH_RESULTS_LIMIT }
      : "skip",
  );

  const recipes = useMemo(() => (results ?? []) as Recipe[], [results]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("search.title") }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("search.resultsTitle")}</Text>
          {trimmedSearchTerm ? (
            <Text style={styles.subtitle}>
              {t("search.resultsSubtitle", { query: trimmedSearchTerm })}
            </Text>
          ) : (
            <Text style={styles.subtitle}>{t("search.emptyQuery")}</Text>
          )}
        </View>

        <View style={styles.resultsList}>
          {results === undefined ? (
            <Text style={styles.subtitle}>{t("search.loading")}</Text>
          ) : recipes.length > 0 ? (
            recipes.map((recipe) => (
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
