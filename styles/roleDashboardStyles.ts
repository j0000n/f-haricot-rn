import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createRoleDashboardStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      paddingHorizontal: tokens.padding.screen,
      paddingBottom: tokens.spacing.xxl,
      gap: tokens.spacing.lg,
    },
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.lg,
      padding: tokens.padding.card,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
      gap: tokens.spacing.sm,
    },
    title: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    description: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.lineHeights.relaxed,
    },
    profileGroup: {
      gap: tokens.spacing.sm,
    },
    profileRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: tokens.spacing.xs,
      borderBottomWidth: tokens.borderWidths.hairline,
      borderBottomColor: tokens.colors.border,
    },
    profileLabel: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textPrimary,
    },
    profileValue: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.radii.round,
      backgroundColor: tokens.colors.surfaceVariant,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
    },
    badgeText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: tokens.colors.background,
    },
  });

export default createRoleDashboardStyles;
