import React, { useEffect, useMemo, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  AccessibilityInfo,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTranslation } from "@/i18n/useTranslation";
import { useRecipeLists, COOK_ASAP_LIST_ID } from "@/hooks/useRecipeLists";
import type { Recipe } from "@/types/recipe";
import { calculateIngredientMatch } from "@/utils/inventory";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";

const EMPTY_INVENTORY: string[] = [];

interface RecipeListPickerProps {
  recipe: Recipe;
  userInventory?: string[];
  triggerLabel?: string;
  presentation?: "inline" | "dropdown";
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: tokens.widths.full,
    },
    containerDropdown: {
      position: "relative",
      alignItems: "flex-end",
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.sm,
    },
    triggerLabel: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.accent,
    },
    triggerIcon: {
      marginLeft: tokens.spacing.xs,
    },
    triggerDropdown: {
      alignSelf: "flex-end",
    },
    panel: {
      marginTop: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.sm,
      gap: tokens.spacing.xs,
      ...tokens.shadows.card,
    },
    panelDropdown: {
      position: "absolute",
      right: 0,
      bottom: "100%",
      marginTop: 0,
      marginBottom: tokens.spacing.xs,
      zIndex: 10,
      shadowColor: tokens.shadows.floating.shadowColor,
      shadowOffset: tokens.shadows.floating.shadowOffset,
      shadowOpacity: tokens.shadows.floating.shadowOpacity,
      shadowRadius: tokens.shadows.floating.shadowRadius,
      elevation: tokens.shadows.floating.elevation,
    },
    sectionLabel: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: tokens.letterSpacing.tight,
    },
    listButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      gap: tokens.spacing.sm,
    },
    listButtonActive: {
      backgroundColor: tokens.colors.overlay,
    },
    listName: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    listMeta: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    listMetaAccent: {
      color: tokens.colors.accent,
    },
    listRowContent: {
      flex: 1,
      gap: tokens.spacing.xxs,
    },
    seeMoreButton: {
      alignSelf: "flex-start",
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.overlay,
    },
    seeMoreText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.accent,
    },
    scrollArea: {
      maxHeight: tokens.spacing.xxl * 3,
      borderRadius: tokens.radii.sm,
    },
    scrollContent: {
      gap: tokens.spacing.xxs,
      paddingVertical: tokens.spacing.xxs,
    },
    createButton: {
      marginTop: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.accent,
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: tokens.spacing.xs,
    },
    createText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.accent,
    },
    icon: {
      color: tokens.colors.accent,
    },
    feedbackContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
      marginTop: tokens.spacing.xs,
    },
    feedbackText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.success,
      textTransform: "uppercase",
      letterSpacing: tokens.letterSpacing.tight,
    },
    feedbackIcon: {
      color: tokens.colors.success,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.md,
      width: "80%",
      maxWidth: 400,
      maxHeight: "80%",
      gap: tokens.spacing.md,
    },
    modalSearchInput: {
      backgroundColor: tokens.colors.overlay,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.sm,
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    modalListContainer: {
      maxHeight: tokens.spacing.xxl * 4,
    },
    modalListScroll: {
      gap: tokens.spacing.xs,
    },
    modalListButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      gap: tokens.spacing.sm,
    },
    modalListButtonActive: {
      backgroundColor: tokens.colors.overlay,
    },
    modalListName: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    modalListMeta: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    modalListRowContent: {
      flex: 1,
      gap: tokens.spacing.xxs,
    },
    modalCreateButton: {
      marginTop: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.accent,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: tokens.spacing.xs,
    },
    modalCreateText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.accent,
    },
    modalTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    modalInput: {
      backgroundColor: tokens.colors.overlay,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.sm,
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    modalButtons: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
      justifyContent: "flex-end",
    },
    modalButton: {
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      minWidth: 80,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: tokens.colors.overlay,
    },
    modalButtonCreate: {
      backgroundColor: tokens.colors.accent,
    },
    modalButtonText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
    },
    modalButtonTextCancel: {
      color: tokens.colors.textSecondary,
    },
    modalButtonTextCreate: {
      color: tokens.colors.accentOnPrimary,
    },
  });

export const RecipeListPicker: React.FC<RecipeListPickerProps> = ({
  recipe,
  userInventory = [],
  triggerLabel,
  presentation = "inline",
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();
  const {
    cookAsapList,
    recentLists,
    standardLists,
    allLists,
    addRecipeToList,
    removeRecipeFromList,
    isRecipeInList,
    createList,
  } = useRecipeLists();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedback = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  };

  const showFeedback = (message: string) => {
    clearFeedback();
    setFeedbackMessage(message);
    if (typeof AccessibilityInfo.announceForAccessibility === "function") {
      AccessibilityInfo.announceForAccessibility(message);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => () => {
    clearFeedback();
  }, []);

  const handleTogglePanel = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsOpen((current) => !current);
  };

  const inventoryCodes = userInventory && userInventory.length > 0 ? userInventory : EMPTY_INVENTORY;

  const cookAsapSummary = useMemo(
    () => calculateIngredientMatch(recipe.ingredients, inventoryCodes),
    [inventoryCodes, recipe.ingredients],
  );

  const isInCookAsap = isRecipeInList(COOK_ASAP_LIST_ID, recipe._id);

  const handleListPress = (listId: string) => {
    const alreadyIncluded = isRecipeInList(listId, recipe._id);
    if (alreadyIncluded) {
      removeRecipeFromList(listId, recipe._id);
      clearFeedback();
      setFeedbackMessage(null);
      return;
    }

    addRecipeToList(listId, recipe._id);
    const targetList = allLists.find((list) => list.id === listId);
    const listName = targetList?.name ?? t("lists.unnamedList");
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsOpen(false);
    showFeedback(t("lists.addedToList", { listName }));
  };

  const handleCreateListClick = () => {
    setShowCreateModal(true);
    setSearchQuery("");
  };

  const handleCreateListCancel = () => {
    setShowCreateModal(false);
    setSearchQuery("");
  };

  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) {
      return allLists;
    }

    const query = searchQuery.toLowerCase().trim();
    return allLists.filter((list) => list.name.toLowerCase().includes(query));
  }, [allLists, searchQuery]);

  const handleModalListPress = (listId: string) => {
    handleListPress(listId);
    setShowCreateModal(false);
    setSearchQuery("");
  };

  const additionalLists = useMemo(
    () =>
      standardLists.filter(
        (list) => !recentLists.some((recentList) => recentList.id === list.id),
      ),
    [recentLists, standardLists],
  );

  const hasAdditionalLists = additionalLists.length > 0;

  const isDropdown = presentation === "dropdown";

  const panel = isOpen ? (
    <View style={[styles.panel, isDropdown ? styles.panelDropdown : undefined]} accessible>
      <Pressable
        onPress={() => handleListPress(COOK_ASAP_LIST_ID)}
        accessibilityRole="button"
        style={[styles.listButton, isInCookAsap ? styles.listButtonActive : undefined]}
      >
        <View style={styles.listRowContent}>
          <Text style={styles.listName}>{cookAsapList.name}</Text>
          <Text
            style={[
              styles.listMeta,
              cookAsapSummary.missingIngredients === 0
                ? styles.listMetaAccent
                : undefined,
            ]}
          >
            {cookAsapSummary.missingIngredients === 0
              ? t("lists.cookAsapReady")
              : t("lists.missingCount", {
                  count: cookAsapSummary.missingIngredients,
                })}
          </Text>
        </View>
        {isInCookAsap ? (
          <Feather name="check" size={tokens.iconSizes.md} style={styles.icon} />
        ) : null}
      </Pressable>

      {recentLists.length > 0 ? (
        <View>
          <Text style={styles.sectionLabel}>{t("lists.recentListsLabel")}</Text>
          {recentLists.map((list) => (
            <Pressable
              key={list.id}
              onPress={() => handleListPress(list.id)}
              accessibilityRole="button"
              style={[
                styles.listButton,
                isRecipeInList(list.id, recipe._id) ? styles.listButtonActive : undefined,
              ]}
            >
              <View style={styles.listRowContent}>
                <Text style={styles.listName}>{list.name}</Text>
                <Text style={styles.listMeta}>
                  {t("lists.recipeCount", { count: list.recipeIds.length })}
                </Text>
              </View>
              {isRecipeInList(list.id, recipe._id) ? (
                <Feather name="check" size={tokens.iconSizes.md} style={styles.icon} />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {hasAdditionalLists ? (
        <Pressable
          onPress={() => setShowAll((current) => !current)}
          style={styles.seeMoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.seeMoreText}>
            {showAll ? t("lists.seeLess") : t("lists.seeMore")}
          </Text>
        </Pressable>
      ) : null}

      {showAll && hasAdditionalLists ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {additionalLists.map((list) => (
            <Pressable
              key={list.id}
              onPress={() => handleListPress(list.id)}
              accessibilityRole="button"
              style={[
                styles.listButton,
                isRecipeInList(list.id, recipe._id) ? styles.listButtonActive : undefined,
              ]}
            >
              <View style={styles.listRowContent}>
                <Text style={styles.listName}>{list.name}</Text>
                <Text style={styles.listMeta}>
                  {t("lists.recipeCount", { count: list.recipeIds.length })}
                </Text>
              </View>
              {isRecipeInList(list.id, recipe._id) ? (
                <Feather name="check" size={tokens.iconSizes.md} style={styles.icon} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <Pressable
        onPress={handleCreateListClick}
        style={styles.createButton}
        accessibilityRole="button"
      >
        <Feather name="plus" size={tokens.iconSizes.md} style={styles.icon} />
        <Text style={styles.createText}>{t("lists.createList")}</Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <>
      <View style={[styles.container, isDropdown ? styles.containerDropdown : undefined]}>
        <Pressable
          onPress={(e: { stopPropagation?: () => void }) => {
            // Stop propagation to prevent parent Pressable from handling this event
            // This prevents nested button errors in React Native Web
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            handleTogglePanel();
          }}
          style={[styles.trigger, isDropdown ? styles.triggerDropdown : undefined]}
          // Note: accessibilityRole removed to prevent nested button errors in React Native Web
          // The parent card already provides button semantics for navigation
          // This Pressable is a control, not a navigation button
          accessibilityState={{ expanded: isOpen }}
          // @ts-ignore - onClick is needed for web to stop propagation
          onClick={(e: any) => {
            if (e) {
              e.stopPropagation();
            }
          }}
        >
          <Text style={styles.triggerLabel}>{triggerLabel ?? t("lists.addToListAction")}</Text>
          <Feather
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={tokens.iconSizes.md}
            style={styles.triggerIcon}
          />
        </Pressable>
        {panel}
        {feedbackMessage ? (
          <View
            style={styles.feedbackContainer}
            accessibilityLiveRegion="polite"
            accessible
          >
            <Feather name="check-circle" size={tokens.iconSizes.md} style={styles.feedbackIcon} />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        ) : null}
      </View>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={handleCreateListCancel}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCreateListCancel}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>{t("lists.addToListAction")}</Text>
            <TextInput
              style={styles.modalSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("lists.searchLists")}
              placeholderTextColor={tokens.colors.textMuted}
              autoFocus
            />
            <ScrollView
              style={styles.modalListContainer}
              contentContainerStyle={styles.modalListScroll}
              keyboardShouldPersistTaps="handled"
            >
              {filteredLists.map((list) => {
                const isInList = isRecipeInList(list.id, recipe._id);
                const isCookAsap = list.id === COOK_ASAP_LIST_ID;
                const matchSummary = isCookAsap
                  ? calculateIngredientMatch(recipe.ingredients, inventoryCodes)
                  : null;

                return (
                  <Pressable
                    key={list.id}
                    onPress={() => handleModalListPress(list.id)}
                    accessibilityRole="button"
                    style={[
                      styles.modalListButton,
                      isInList ? styles.modalListButtonActive : undefined,
                    ]}
                  >
                    <View style={styles.modalListRowContent}>
                      <Text style={styles.modalListName}>{list.name}</Text>
                      <Text style={styles.modalListMeta}>
                        {isCookAsap && matchSummary
                          ? matchSummary.missingIngredients === 0
                            ? t("lists.cookAsapReady")
                            : t("lists.missingCount", {
                                count: matchSummary.missingIngredients,
                              })
                          : t("lists.recipeCount", {
                              count: list.type === "standard" ? list.recipeIds.length : 0,
                            })}
                      </Text>
                    </View>
                    {isInList ? (
                      <Feather name="check" size={tokens.iconSizes.md} style={styles.icon} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => {
                setShowCreateModal(false);
                const defaultName = t("lists.defaultListName", {
                  index: standardLists.length + 1,
                });
                // Open a separate create modal or inline form
                // For now, create immediately with default name
                const newList = createList(defaultName);
                addRecipeToList(newList.id, recipe._id);
                setShowAll(true);
                if (Platform.OS !== "web") {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                }
                setIsOpen(false);
                setSearchQuery("");
                showFeedback(t("lists.addedToList", { listName: newList.name }));
              }}
              style={styles.modalCreateButton}
              accessibilityRole="button"
            >
              <Feather name="plus" size={tokens.iconSizes.md} style={styles.icon} />
              <Text style={styles.modalCreateText}>{t("lists.createList")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default RecipeListPicker;
