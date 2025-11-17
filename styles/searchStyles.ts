import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

type Styles = ReturnType<typeof createSearchStyles>;

const createSearchStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    scrollContent: {
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.lg,
      gap: tokens.spacing.lg,
    },
    header: {
      gap: tokens.spacing.xs,
    },
    title: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.heading,
      color: tokens.colors.textPrimary,
    },
    subtitle: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
    },
    resultsList: {
      gap: tokens.spacing.sm,
    },
    resultCard: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.md,
      gap: tokens.spacing.xs,
    },
    resultTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    resultDescription: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.normal,
    },
    resultMeta: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    emptyState: {
      paddingVertical: tokens.spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      textAlign: "center",
    },
  });

export type SearchStyles = Styles;

export default createSearchStyles;
