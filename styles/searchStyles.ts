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
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: tokens.spacing.md,
    },
    headerText: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    filterButton: {
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.md,
      backgroundColor: tokens.colors.surface,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    filterButtonActive: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    filterButtonText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
    },
    filterButtonTextActive: {
      color: tokens.colors.accentOnPrimary,
    },
    filtersSection: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.md,
      gap: tokens.spacing.md,
    },
    filterSectionTitle: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      textTransform: "uppercase",
      letterSpacing: tokens.letterSpacing.tight,
    },
    filterChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xs,
    },
    filterChip: {
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.background,
    },
    filterChipActive: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    filterChipText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
    },
    filterChipTextActive: {
      color: tokens.colors.accentOnPrimary,
    },
    clearFiltersButton: {
      alignSelf: "flex-start",
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.md,
    },
    clearFiltersText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
      textDecorationLine: "underline",
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
