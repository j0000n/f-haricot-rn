import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createTaskDetailStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      flex: 1,
      padding: tokens.spacing.lg,
    },
    loadingText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
      textAlign: "center",
      marginTop: tokens.spacing.xxl,
    },
    section: {
      backgroundColor: tokens.colors.surface,
      padding: tokens.spacing.lg,
      borderRadius: tokens.radii.md,
      marginBottom: tokens.spacing.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    label: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: tokens.letterSpacing.tight,
      marginBottom: tokens.spacing.sm,
    },
    title: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
    },
    description: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
      color: tokens.colors.textSecondary,
    },
    statusButton: {
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.overlay,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    statusText: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    statusHint: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing.xs,
    },
    actions: {
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.surface,
      borderTopWidth: tokens.borderWidths.regular,
      borderTopColor: tokens.colors.border,
    },
    deleteButton: {
      backgroundColor: tokens.colors.surface,
      borderWidth: tokens.borderWidths.thick,
      borderColor: tokens.colors.danger,
      padding: tokens.spacing.lg,
      borderRadius: tokens.radii.md,
      alignItems: "center",
    },
    deleteButtonText: {
      color: tokens.colors.danger,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
    },
  });

export default createTaskDetailStyles;
