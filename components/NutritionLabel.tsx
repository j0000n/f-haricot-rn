import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles } from "@/styles/tokens";

type NutrientLine = {
  key: string;
  label: string;
  amount: string;
  percentDailyValue?: number;
  isHeader?: boolean;
  isSubItem?: boolean;
};

type DailyValueGoals = {
  default?: Record<string, number>;
  user?: Record<string, number>;
  family?: Record<string, number>;
};

type GoalContext = "default" | "user" | "family";

type NutritionFactsData = {
  servingPerContainer?: string;
  servingSize: string;
  calories: number;
  nutrients: NutrientLine[];
  notes?: string[];
  caloriesPerGram?: {
    fat: number;
    carbohydrate: number;
    protein: number;
  };
};

interface NutritionLabelProps {
  facts: NutritionFactsData;
  goalContext?: GoalContext;
  dailyValues?: DailyValueGoals;
  showGoalContextLabel?: boolean;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: tokens.colors.surface,
      borderColor: tokens.colors.textPrimary,
      borderWidth: 1.5,
      padding: tokens.spacing.md,
      gap: tokens.spacing.xs,
    },
    title: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: 28,
      color: tokens.colors.textPrimary,
      letterSpacing: 0.5,
    },
    boldDivider: {
      height: 6,
      backgroundColor: tokens.colors.textPrimary,
    },
    thinDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.textPrimary,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    labelText: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    subLabelText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
      color: tokens.colors.textPrimary,
      marginLeft: tokens.spacing.sm,
    },
    calorieRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingVertical: tokens.spacing.xxs,
    },
    caloriesLabel: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    caloriesValue: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: 38,
      color: tokens.colors.textPrimary,
    },
    dailyValueHeading: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
      color: tokens.colors.textPrimary,
      textAlign: "right",
    },
    nutrientAmount: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    nutrientPercent: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    noteText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textPrimary,
      lineHeight: tokens.typography.tiny * tokens.lineHeights.relaxed,
    },
    caloriesPerGram: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
    goalPill: {
      alignSelf: "flex-start",
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
      paddingVertical: tokens.spacing.xxxs,
      paddingHorizontal: tokens.spacing.xs,
      borderRadius: tokens.radii.lg,
      backgroundColor: tokens.colors.background,
    },
    goalPillText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
  });

type Styles = ReturnType<typeof createStyles>;

const formatAmount = (line: NutrientLine, styles: Styles) => {
  if (line.isHeader) {
    return (
      <Text style={styles.nutrientAmount}>
        {line.label} {line.amount}
      </Text>
    );
  }

  return (
    <Text style={line.isSubItem ? styles.subLabelText : styles.labelText}>
      {line.label}
      <Text style={styles.nutrientAmount}> {line.amount}</Text>
    </Text>
  );
};

const resolveDailyValuePercent = (
  line: NutrientLine,
  goalContext: GoalContext,
  dailyValues?: DailyValueGoals,
) => {
  if (typeof line.percentDailyValue === "number") {
    return line.percentDailyValue;
  }

  const goals = dailyValues?.[goalContext] ?? dailyValues?.default;
  const goalValue = goals?.[line.key];

  if (!goalValue) return undefined;

  const numericAmount = Number(line.amount.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numericAmount) || goalValue === 0) return undefined;

  return Math.round((numericAmount / goalValue) * 100);
};

export const NutritionLabel: React.FC<NutritionLabelProps> = ({
  facts,
  goalContext = "default",
  dailyValues,
  showGoalContextLabel = false,
}) => {
  const styles = useThemedStyles<Styles>(createStyles);

  return (
    <View style={styles.container} accessibilityRole="summary">
      {showGoalContextLabel ? (
        <View style={styles.goalPill}>
          <Text style={styles.goalPillText}>{goalContext === "default" ? "Daily values" : `${goalContext} goals`}</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Nutrition Facts</Text>
      <View style={styles.boldDivider} />

      <View style={styles.labelRow}>
        <Text style={styles.labelText}>
          {facts.servingPerContainer ? `${facts.servingPerContainer} Servings Per Container` : "1 Serving Per Container"}
        </Text>
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Serving Size</Text>
        <Text style={styles.labelText}>{facts.servingSize}</Text>
      </View>

      <View style={styles.boldDivider} />

      <View style={styles.calorieRow}>
        <View>
          <Text style={styles.caloriesLabel}>Amount Per Serving</Text>
          <Text style={styles.caloriesLabel}>Calories</Text>
        </View>
        <Text style={styles.caloriesValue}>{facts.calories}</Text>
      </View>

      <View style={styles.boldDivider} />
      <Text style={styles.dailyValueHeading}>% Daily Value *</Text>

      {facts.nutrients.map((line) => {
        const percent = resolveDailyValuePercent(line, goalContext, dailyValues);
        return (
          <View
            key={line.key}
            style={[styles.labelRow, { paddingVertical: line.isHeader ? 6 : 4 }]}
          >
            {formatAmount(line, styles)}
            {percent !== undefined ? <Text style={styles.nutrientPercent}>{percent}%</Text> : <Text />}
          </View>
        );
      })}

      <View style={styles.thinDivider} />

      {facts.notes?.map((note) => (
        <Text key={note} style={styles.noteText}>
          {note}
        </Text>
      ))}

      {facts.caloriesPerGram ? (
        <Text style={styles.caloriesPerGram}>
          Calories per gram: Fat {facts.caloriesPerGram.fat} • Carbohydrate {facts.caloriesPerGram.carbohydrate} • Protein {facts.caloriesPerGram.protein}
        </Text>
      ) : null}
    </View>
  );
};
