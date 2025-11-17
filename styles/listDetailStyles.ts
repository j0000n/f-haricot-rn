import { StyleSheet } from "react-native";

import type { ThemeTokens } from "./tokens";

const createListDetailStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.padding.screen,
      paddingBottom: tokens.spacing.xxl,
      gap: tokens.spacing.lg,
    },
    header: {
      gap: tokens.spacing.xs,
    },
    title: {
      fontFamily: tokens.fontFamilies.display,
      fontSize: tokens.typography.title,
      color: tokens.colors.textPrimary,
      textTransform: "uppercase",
    },
    description: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    controlsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: tokens.spacing.sm,
    },
    viewToggle: {
      flexDirection: "row",
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      overflow: "hidden",
    },
    viewToggleButton: {
      flex: 1,
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.sm,
      alignItems: "center",
    },
    viewToggleButtonActive: {
      backgroundColor: tokens.colors.accent,
    },
    viewToggleLabel: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    viewToggleLabelActive: {
      color: tokens.colors.accentOnPrimary,
    },
    filterContainer: {
      marginTop: tokens.spacing.xs,
    },
    filterScroll: {
      paddingVertical: tokens.spacing.xxs,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.xs,
      marginRight: tokens.spacing.xs,
      backgroundColor: tokens.colors.surface,
      gap: tokens.spacing.xxs,
    },
    filterChipActive: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    filterChipLabel: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    filterChipLabelActive: {
      color: tokens.colors.accentOnPrimary,
    },
    listSection: {
      gap: tokens.spacing.sm,
    },
    listCard: {
      flexDirection: "row",
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.sm,
      gap: tokens.spacing.sm,
      alignItems: "stretch",
    },
    listCardLink: {
      flexDirection: "row",
      flex: 1,
      gap: tokens.spacing.sm,
    },
    listImage: {
      width: tokens.spacing.xl * 4,
      height: tokens.spacing.xl * 4,
      borderRadius: tokens.radii.sm,
    },
    listContent: {
      flex: 1,
      gap: tokens.spacing.xxs,
    },
    listTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: tokens.spacing.sm,
    },
    listTitle: {
      flex: 1,
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    listMeta: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
    emojiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xxs,
    },
    emoji: {
      fontSize: tokens.typography.heading,
    },
    missingPill: {
      alignSelf: "flex-start",
      borderRadius: tokens.radii.sm,
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxs,
      backgroundColor: tokens.colors.overlay,
    },
    missingPillText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.accent,
    },
    missingList: {
      marginTop: tokens.spacing.xxs,
      gap: tokens.spacing.xxs,
    },
    missingItem: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.sm,
    },
    gridItem: {
      width: "48%",
    },
    emptyState: {
      paddingVertical: tokens.spacing.xxl,
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    emptyTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    emptyText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      textAlign: "center",
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    removeButton: {
      marginTop: tokens.spacing.xs,
      alignSelf: "flex-start",
      paddingVertical: tokens.spacing.xxs,
      paddingHorizontal: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.overlay,
    },
    removeButtonLabel: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.tiny,
      color: tokens.colors.textSecondary,
    },
  });

export default createListDetailStyles;
