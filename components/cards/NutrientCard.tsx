import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { NutrientDish } from "@haricot/convex-client";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";

export const NUTRIENT_CARD_WIDTH = 260;

interface NutrientCardProps {
  dish: NutrientDish;
  onPress?: () => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: NUTRIENT_CARD_WIDTH,
      borderRadius: tokens.radii.md,
      overflow: "hidden",
      marginLeft: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      ...tokens.shadows.card,
    },
    containerPressed: {
      opacity: tokens.opacity.disabled,
    },
    image: {
      width: "100%",
      height: 140,
    },
    content: {
      padding: tokens.padding.card,
      gap: tokens.spacing.xs,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: tokens.spacing.xs,
    },
    title: {
      flex: 1,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    caloriesBadge: {
      backgroundColor: tokens.colors.overlay,
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      alignItems: "flex-end",
    },
    caloriesLabel: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
    },
    caloriesValue: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.accent,
    },
    description: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.lineHeights.normal * tokens.typography.small,
    },
    macroRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: tokens.spacing.xs,
    },
    macroPill: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      padding: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
    },
    macroLabel: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
      marginBottom: tokens.spacing.xxxs,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    macroValue: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    macroPercent: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      marginTop: tokens.spacing.xxxs,
    },
    micronutrientSection: {
      borderTopWidth: tokens.borderWidths.hairline,
      borderTopColor: tokens.colors.border,
      paddingTop: tokens.spacing.xs,
      gap: tokens.spacing.xxxs,
    },
    micronutrientLabel: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    micronutrientRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xxs,
    },
    micronutrientPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xxxs,
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxxs,
      backgroundColor: tokens.colors.surfaceMuted,
      borderRadius: tokens.radii.round,
    },
    micronutrientName: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textPrimary,
    },
    micronutrientValue: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
  });

const formatMicronutrientValue = (amount: number, unit: string, percent?: number) => {
  if (percent !== undefined) {
    return `${amount}${unit} · ${percent}% DV`;
  }

  return `${amount}${unit}`;
};

export const NutrientCard: React.FC<NutrientCardProps> = ({ dish, onPress }) => {
  const styles = useThemedStyles(createStyles);
  const tokens = useTokens();

  const macroPercents = useMemo(() => {
    const macroCalories = {
      protein: dish.macronutrients.protein * 4,
      carbohydrates: dish.macronutrients.carbohydrates * 4,
      fat: dish.macronutrients.fat * 9,
    };

    const totalCalories =
      dish.calories ||
      macroCalories.protein + macroCalories.carbohydrates + macroCalories.fat ||
      1;

    return {
      protein: Math.round((macroCalories.protein / totalCalories) * 100),
      carbohydrates: Math.round((macroCalories.carbohydrates / totalCalories) * 100),
      fat: Math.round((macroCalories.fat / totalCalories) * 100),
    };
  }, [dish.calories, dish.macronutrients.carbohydrates, dish.macronutrients.fat, dish.macronutrients.protein]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [styles.container, pressed && styles.containerPressed]}
    >
      <Image source={{ uri: dish.imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {dish.name}
          </Text>
          <View style={styles.caloriesBadge}>
            <Text style={styles.caloriesLabel}>Calories</Text>
            <Text style={styles.caloriesValue}>{dish.calories}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {dish.description}
        </Text>

        <View style={styles.macroRow}>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{dish.macronutrients.protein} g</Text>
            <Text style={styles.macroPercent}>{macroPercents.protein}% kcal</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{dish.macronutrients.carbohydrates} g</Text>
            <Text style={styles.macroPercent}>{macroPercents.carbohydrates}% kcal</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>{dish.macronutrients.fat} g</Text>
            <Text style={styles.macroPercent}>{macroPercents.fat}% kcal</Text>
          </View>
        </View>

        <View style={styles.micronutrientSection}>
          <Text style={styles.micronutrientLabel}>Micronutrients</Text>
          <View style={styles.micronutrientRow}>
            {dish.micronutrients.map((nutrient) => (
              <View key={`${dish.id}-${nutrient.label}`} style={styles.micronutrientPill}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: tokens.radii.round,
                    backgroundColor: tokens.colors.accent,
                  }}
                />
                <Text style={styles.micronutrientName}>{nutrient.label}</Text>
                <Text style={styles.micronutrientValue}>
                  {formatMicronutrientValue(
                    nutrient.amount,
                    nutrient.unit,
                    nutrient.dailyValuePercent,
                  )}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
