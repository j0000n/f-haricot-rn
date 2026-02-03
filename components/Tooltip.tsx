import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { Id } from "@haricot/convex-client";

export interface Tooltip {
  _id: Id<"tooltips">;
  title: string;
  content: string;
  isDismissed: boolean;
  createdAt: number;
  dismissedAt?: number;
}

interface TooltipProps {
  tooltip: Tooltip;
  onDismiss: (id: Id<"tooltips">) => void;
}

export function Tooltip({ tooltip, onDismiss }: TooltipProps) {
  const tokens = useTokens();
  const styles = useThemedStyles(createTooltipStyles);

  return (
    <View style={styles.container}>
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{tooltip.title}</Text>
          <Pressable
            onPress={() => onDismiss(tooltip._id)}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close tooltip"
          >
            <Feather name="x" size={20} color={tokens.colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={styles.contentText}>{tooltip.content}</Text>
      </View>
    </View>
  );
}

const createTooltipStyles = (tokens: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      marginBottom: tokens.spacing.md,
      overflow: "hidden",
      shadowColor: tokens.shadows.card.shadowColor,
      shadowOffset: tokens.shadows.card.shadowOffset,
      shadowOpacity: tokens.shadows.card.shadowOpacity,
      shadowRadius: tokens.shadows.card.shadowRadius,
      elevation: tokens.shadows.card.elevation,
    },
    leftBorder: {
      width: 4,
      backgroundColor: tokens.colors.accent,
    },
    content: {
      flex: 1,
      padding: tokens.spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: tokens.spacing.xs,
    },
    title: {
      flex: 1,
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.display,
      color: tokens.colors.textPrimary,
      marginRight: tokens.spacing.sm,
    },
    closeButton: {
      padding: tokens.spacing.xs,
      marginTop: -tokens.spacing.xs,
      marginRight: -tokens.spacing.xs,
    },
    contentText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.normal,
    },
  });
