import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import type { Doc } from "@/convex/_generated/dataModel";

import { RecipeCard } from "@/components/cards/RecipeCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { api } from "@/convex/_generated/api";
import { useRecipeLists } from "@/hooks/useRecipeLists";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
import { useTranslation } from "@/i18n/useTranslation";
import { EMOJI_TAGS } from "@/types/emojiTags";
import type { Recipe } from "@/types/recipe";
import createListDetailStyles from "@/styles/listDetailStyles";
import { useThemedStyles } from "@/styles/tokens";
import { getMissingIngredients, formatIngredientQuantity } from "@/utils/inventory";
import { getIngredientDisplayName } from "@/utils/recipes";
import { buildRecipeIds } from "@/utils/recipeLists";

type ViewMode = "list" | "grid";

type DecoratedRecipe = {
  recipe: Recipe;
  missingCount: number;
  missingLabels: string[];
};

const EMPTY_CODES: string[] = [];

export default function ListDetailScreen() {
  const styles = useThemedStyles(createListDetailStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { getListById, removeRecipeFromList, updateList, deleteList } = useRecipeLists();
  const list = listId ? getListById(listId) : undefined;
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const { foodLibrary } = useInventoryDisplay();
  const inventoryCodesQuery = useQuery(api.users.getCurrentInventory, {});
  const orderedRecipeIds = useMemo(() => (list ? buildRecipeIds(list) : []), [list]);
  const recipesResult = useQuery(
    api.recipes.getMany,
    orderedRecipeIds.length > 0 ? { ids: orderedRecipeIds } : "skip",
  );
  const recipesData = useMemo(
    () => (Array.isArray(recipesResult) ? recipesResult : []),
    [recipesResult],
  );
  const inventoryCodes = useMemo(
    () => (Array.isArray(inventoryCodesQuery) ? inventoryCodesQuery : EMPTY_CODES),
    [inventoryCodesQuery],
  );

  const recipeMap = useMemo(() => {
    return new Map(
      recipesData
        .filter((recipe): recipe is NonNullable<typeof recipe> => recipe != null)
        .map((recipe) => [recipe._id, recipe])
    );
  }, [recipesData]);

  const recipes: Recipe[] = useMemo(() => {
    return orderedRecipeIds
      .map((recipeId) => {
        const recipe = recipeMap.get(recipeId);
        if (!recipe) return null;
        // Convert Convex document to Recipe type (removing _creationTime)
        const { _creationTime, ...recipeWithoutCreationTime } = recipe;
        return recipeWithoutCreationTime as Recipe;
      })
      .filter((recipe): recipe is Recipe => recipe != null);
  }, [orderedRecipeIds, recipeMap]);

  const language = (i18n.language || "en") as keyof Recipe["recipeName"];
  const libraryMap = useMemo(() => {
    if (!Array.isArray(foodLibrary)) {
      return new Map<string, Doc<"foodLibrary">>();
    }

    return new Map(foodLibrary.map((item) => [item.code, item]));
  }, [foodLibrary]);

  const decoratedRecipes: DecoratedRecipe[] = useMemo(() => {
    return recipes.map((recipe) => {
      const missingIngredients = getMissingIngredients(recipe.ingredients, inventoryCodes);
      const missingLabels = missingIngredients.map((ingredient) => {
        const name = getIngredientDisplayName(ingredient, {
          foodLibrary: libraryMap,
          language,
        });

        return `${formatIngredientQuantity(ingredient)} · ${name}`;
      });

      return {
        recipe,
        missingCount: missingIngredients.length,
        missingLabels,
      };
    });
  }, [inventoryCodes, language, libraryMap, recipes]);

  const emojiFilters = useMemo(() => {
    const values = new Set<string>();
    for (const entry of decoratedRecipes) {
      for (const emoji of entry.recipe.emojiTags) {
        values.add(emoji);
      }
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [decoratedRecipes]);

  const filteredRecipes = useMemo(() => {
    if (selectedEmoji === "all") {
      return decoratedRecipes;
    }

    return decoratedRecipes.filter((entry) => entry.recipe.emojiTags.includes(selectedEmoji));
  }, [decoratedRecipes, selectedEmoji]);

  const listTitle = list?.name ?? t("lists.notFoundTitle");
  const listDescription =
    list?.type === "cook-asap"
      ? t("lists.cookAsapDescription")
      : t("lists.standardListDescription", { count: list?.recipeIds.length ?? 0 });
  const emptyTitle =
    list?.type === "cook-asap" ? t("lists.cookAsapEmptyTitle") : t("lists.standardEmptyTitle");
  const emptyMessage =
    list?.type === "cook-asap"
      ? t("lists.cookAsapEmpty")
      : t("lists.standardEmptyMessage");
  const isLoadingRecipes = orderedRecipeIds.length > 0 && recipesResult === undefined;

  const handleRemove = (recipeId: Recipe["_id"]) => {
    if (!list) {
      return;
    }

    removeRecipeFromList(list.id, recipeId);
  };

  const handleRecipePress = (recipeId: Recipe["_id"]) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleEditPress = () => {
    if (!list || list.type === "cook-asap") {
      return;
    }
    setEditName(list.name);
    setEditEmoji(list.emoji || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!list || list.type === "cook-asap") {
      return;
    }
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert(t("lists.editListErrorTitle"), t("lists.editListErrorNameRequired"));
      return;
    }
    updateList(list.id, {
      name: trimmedName,
      emoji: editEmoji.trim() || undefined,
    });
    setShowEditModal(false);
  };

  const handleDeletePress = () => {
    if (!list || list.type === "cook-asap") {
      return;
    }
    Alert.alert(
      t("lists.deleteListTitle"),
      t("lists.deleteListMessage", { name: list.name }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteList(list.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: listTitle,
          headerBackTitle: t("lists.title"),
        }}
      />

      {!list ? (
        <View style={[styles.scrollContent, { justifyContent: "center" }]}>
          <Text style={styles.title}>{t("lists.notFoundTitle")}</Text>
          <Text style={styles.description}>{t("lists.notFoundMessage")}</Text>
        </View>
      ) : isLoadingRecipes ? (
        <LoadingScreen />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{listTitle}</Text>
              <Text style={styles.description}>{listDescription}</Text>
            </View>
            {list && list.type !== "cook-asap" && (
              <View style={styles.headerActions}>
                <Pressable
                  onPress={handleEditPress}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("lists.editList")}
                >
                  <Text style={styles.actionButtonText}>{t("lists.editList")}</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeletePress}
                  style={[styles.actionButton, styles.deleteButton]}
                  accessibilityRole="button"
                  accessibilityLabel={t("lists.deleteList")}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    {t("lists.deleteList")}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.viewToggle}>
            {(["list", "grid"] as ViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={[
                  styles.viewToggleButton,
                  viewMode === mode ? styles.viewToggleButtonActive : undefined,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: viewMode === mode }}
              >
                <Text
                  style={[
                    styles.viewToggleLabel,
                    viewMode === mode ? styles.viewToggleLabelActive : undefined,
                  ]}
                >
                  {mode === "list" ? t("lists.viewList") : t("lists.viewGrid")}
                </Text>
              </Pressable>
            ))}
          </View>

          {emojiFilters.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterScroll}
            >
              <Pressable
                onPress={() => setSelectedEmoji("all")}
                style={[
                  styles.filterChip,
                  selectedEmoji === "all" ? styles.filterChipActive : undefined,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedEmoji === "all" }}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    selectedEmoji === "all" ? styles.filterChipLabelActive : undefined,
                  ]}
                >
                  {t("lists.filterAll")}
                </Text>
              </Pressable>

              {emojiFilters.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={[
                    styles.filterChip,
                    selectedEmoji === emoji ? styles.filterChipActive : undefined,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedEmoji === emoji }}
                >
                  <Text style={styles.filterChipLabel}>{emoji}</Text>
                  {EMOJI_TAGS[emoji as keyof typeof EMOJI_TAGS] ? (
                    <Text
                      style={[
                        styles.filterChipLabel,
                        selectedEmoji === emoji ? styles.filterChipLabelActive : undefined,
                      ]}
                    >
                      {EMOJI_TAGS[emoji as keyof typeof EMOJI_TAGS]}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : viewMode === "grid" ? (
          <View style={styles.grid}>
            {filteredRecipes.map(({ recipe }) => (
              <View key={recipe._id} style={styles.gridItem}>
                <RecipeCard
                  recipe={recipe}
                  variant="standard"
                  onPress={() => handleRecipePress(recipe._id)}
                  userInventory={inventoryCodes}
                  showAddToList={false}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.listSection}>
            {filteredRecipes.map(({ recipe, missingCount, missingLabels }) => (
              <View key={recipe._id} style={styles.listCard}>
                <Pressable
                  onPress={() => handleRecipePress(recipe._id)}
                  style={styles.listCardLink}
                  accessibilityRole="button"
                >
                  <Image
                    source={{ uri: recipe.imageUrls?.[0] ?? "" }}
                    style={styles.listImage}
                    resizeMode="cover"
                    accessibilityLabel={recipe.recipeName[language] || recipe.recipeName.en}
                  />

                  <View style={styles.listContent}>
                    <View style={styles.listTitleRow}>
                      <Text style={styles.listTitle} numberOfLines={2}>
                        {recipe.recipeName[language] || recipe.recipeName.en}
                      </Text>
                      <Text style={styles.listMeta}>
                        {t("recipe.servings")}: {recipe.servings}
                      </Text>
                    </View>

                    <View style={styles.emojiRow}>
                      {recipe.emojiTags.map((emoji) => (
                        <Text key={`${recipe._id}-${emoji}`} style={styles.emoji}>
                          {emoji}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.missingPill}>
                      <Text style={styles.missingPillText}>
                        {missingCount === 0
                          ? t("lists.cookAsapReady")
                          : t("lists.missingCount", { count: missingCount })}
                      </Text>
                    </View>

                    {missingLabels.length > 0 ? (
                      <View style={styles.missingList}>
                        {missingLabels.map((label, index) => (
                          <Text key={`${recipe._id}-missing-${index}`} style={styles.missingItem}>
                            {label}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => handleRemove(recipe._id)}
                  style={styles.removeButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.removeButtonLabel}>{t("lists.removeFromList")}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        </ScrollView>
      )}

      {list && list.type !== "cook-asap" && (
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("lists.editList")}</Text>

              <Text style={styles.modalLabel}>{t("lists.listName")}</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder={t("lists.listNamePlaceholder")}
                placeholderTextColor={styles.modalInput.color}
                style={styles.modalInput}
                autoFocus={true}
                returnKeyType="next"
              />

              <Text style={styles.modalLabel}>{t("lists.listEmoji")} ({t("lists.optional")})</Text>
              <TextInput
                value={editEmoji}
                onChangeText={setEditEmoji}
                placeholder={t("lists.listEmojiPlaceholder")}
                placeholderTextColor={styles.modalInput.color}
                style={styles.modalInput}
                maxLength={2}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => {
                    setShowEditModal(false);
                    setEditName("");
                    setEditEmoji("");
                  }}
                  style={[styles.modalButton, styles.modalButtonCancel]}
                >
                  <Text style={styles.modalButtonCancelText}>{t("common.cancel")}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  style={[styles.modalButton, styles.modalButtonSave]}
                >
                  <Text style={styles.modalButtonSaveText}>{t("common.save")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
