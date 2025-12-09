import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { NutrientCard, NUTRIENT_CARD_WIDTH } from "@/components/cards/NutrientCard";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { NutrientDish } from "@/types/nutrition";

interface NutrientRailProps {
  header: string;
  subheader?: string;
  dishes: NutrientDish[];
  onSeeAll?: () => void;
  onDishPress?: (dish: NutrientDish) => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      marginBottom: tokens.padding.section,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: tokens.padding.card,
      marginBottom: tokens.spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    header: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xxs,
    },
    subheader: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.lineHeights.normal * tokens.typography.small,
    },
    seeAllButton: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      backgroundColor: tokens.colors.overlay,
      color: tokens.colors.accent,
      padding: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      borderColor: tokens.colors.accent,
      borderWidth: tokens.borderWidths.thin,
    },
    scrollContent: {
      paddingHorizontal: tokens.padding.card,
    },
  });

export const NutrientRail: React.FC<NutrientRailProps> = ({
  header,
  subheader,
  dishes,
  onSeeAll,
  onDishPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const tokens = useTokens();

  const snapInterval = useMemo(
    () => NUTRIENT_CARD_WIDTH + tokens.spacing.xs,
    [tokens.spacing.xs],
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
            <Text style={styles.seeAllButton}>See all</Text>
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
        {dishes.map((dish) => (
          <NutrientCard
            key={dish.id}
            dish={dish}
            onPress={onDishPress ? () => onDishPress(dish) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
};
