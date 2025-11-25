import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { RecipeListPicker } from "@/components/RecipeListPicker";
import { useTranslation } from "@/i18n/useTranslation";
import type { Recipe } from "@/types/recipe";
import { EMOJI_TAGS } from "@/types/emojiTags";
import { formatRecipeTime, getRecipeDifficulty } from "@/utils/recipes";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles } from "@/styles/tokens";

interface RecipeHeaderProps {
  recipe: Recipe;
  language: keyof Recipe["recipeName"];
  onStartCooking: () => void;
  userInventory?: string[];
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: tokens.spacing.md,
    },
    heroImage: {
      width: "100%",
      height: 240,
      borderRadius: tokens.radii.md,
    },
    title: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: tokens.typography.heading,
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
    infoBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      gap: tokens.spacing.sm,
    },
    infoItem: {
      flex: 1,
      alignItems: "center",
      gap: tokens.spacing.xxs,
    },
    infoLabel: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    infoValue: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xs,
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.surface,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      gap: tokens.spacing.xxs,
    },
    tagEmoji: {
      fontSize: tokens.typography.subheading,
    },
    tagLabel: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    listPickerContainer: {
      marginTop: tokens.spacing.xs,
    },
    startButton: {
      marginTop: tokens.spacing.sm,
      borderRadius: tokens.radii.md,
      backgroundColor: tokens.colors.accent,
      paddingVertical: tokens.spacing.sm,
      alignItems: "center",
    },
    startButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.accentOnPrimary,
    },
  });

export const RecipeHeader: React.FC<RecipeHeaderProps> = ({
  recipe,
  language,
  onStartCooking,
  userInventory = [],
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const { t } = useTranslation();
  const difficulty = getRecipeDifficulty(recipe);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: recipe.imageUrl }}
        style={styles.heroImage}
        resizeMode="cover"
        accessibilityLabel={recipe.recipeName[language] || recipe.recipeName.en}
      />

      <Text style={styles.title}>
        {recipe.recipeName[language] || recipe.recipeName.en}
      </Text>

      <View style={styles.infoBar}>
        <InfoItem
          label={t("recipe.totalTime")}
          value={formatRecipeTime(recipe.totalTimeMinutes, t)}
          styles={styles}
        />
        <InfoItem
          label={t("recipe.servings")}
          value={`${recipe.servings}`}
          styles={styles}
        />
        <InfoItem
          label={t("recipe.difficulty")}
          value={difficulty ? `${difficulty.emoji} ${difficulty.label}` : t("recipe.difficultyUnknown")}
          styles={styles}
        />
      </View>

      <View style={styles.tagList}>
        {recipe.emojiTags.map((emoji) => (
          <View key={emoji} style={styles.tag}>
            <Text style={styles.tagEmoji}>{emoji}</Text>
            {EMOJI_TAGS[emoji as keyof typeof EMOJI_TAGS] ? (
              <Text style={styles.tagLabel}>
                {EMOJI_TAGS[emoji as keyof typeof EMOJI_TAGS]}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.listPickerContainer}>
        <RecipeListPicker recipe={recipe} userInventory={userInventory} />
      </View>

      <Pressable onPress={onStartCooking} style={styles.startButton} accessibilityRole="button">
        <Text style={styles.startButtonText}>👨‍🍳 {t("recipe.startCooking")}</Text>
      </Pressable>
    </View>
  );
};

type InfoItemProps = {
  label: string;
  value: string;
  styles: Styles;
};

const InfoItem: React.FC<InfoItemProps> = ({ label, value, styles }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);
