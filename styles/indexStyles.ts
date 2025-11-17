import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createIndexStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    header: {
      backgroundColor: tokens.colors.surface,
      paddingTop: tokens.layout.headerTopPadding,
      paddingHorizontal: tokens.spacing.lg,
      paddingBottom: tokens.spacing.lg,
      borderBottomWidth: tokens.borderWidths.regular,
      borderBottomColor: tokens.colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    title: {
      fontSize: tokens.typography.title,
      fontFamily: tokens.fontFamilies.display,
      textTransform: "uppercase",
      marginBottom: tokens.spacing.xs,
      color: tokens.colors.textPrimary,
    },
    email: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    logoutButton: {
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
    },
    logoutText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textPrimary,
    },
    tasksContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.lg,
      paddingBottom: tokens.layout.fabOffset + tokens.spacing.lg,
    },
    section: {
      marginBottom: tokens.spacing.xxl,
    },
    sectionTitle: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.sm,
    },
    sectionEmptyText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing.sm,
      lineHeight: tokens.typography.body * tokens.lineHeights.normal,
    },
    taskCard: {
      backgroundColor: tokens.colors.surface,
      padding: tokens.spacing.lg,
      borderRadius: tokens.radii.md,
      marginBottom: tokens.spacing.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      shadowColor: tokens.shadows.card.shadowColor,
      shadowOffset: tokens.shadows.card.shadowOffset,
      shadowOpacity: tokens.shadows.card.shadowOpacity,
      shadowRadius: tokens.shadows.card.shadowRadius,
      elevation: tokens.shadows.card.elevation,
    },
    taskTitle: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    completedBadge: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.success,
      marginTop: tokens.spacing.sm,
    },
    inventoryList: {
      marginTop: tokens.spacing.sm,
    },
    inventoryItem: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.sm,
    },
    inventoryItemId: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    inventoryItemVariety: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      marginTop: tokens.spacing.xs,
    },
    fab: {
      position: "absolute",
      right: tokens.layout.fabOffset,
      bottom: tokens.layout.fabOffset,
      width: tokens.layout.fabSize,
      height: tokens.layout.fabSize,
      borderRadius: tokens.layout.fabSize / 2,
      backgroundColor: tokens.colors.accent,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: tokens.shadows.floating.shadowColor,
      shadowOffset: tokens.shadows.floating.shadowOffset,
      shadowOpacity: tokens.shadows.floating.shadowOpacity,
      shadowRadius: tokens.shadows.floating.shadowRadius,
      elevation: tokens.shadows.floating.elevation,
    },
    fabText: {
      fontSize: tokens.typography.title,
      color: tokens.colors.accentOnPrimary,
      fontFamily: tokens.fontFamilies.semiBold,
    },
  });

export default createIndexStyles;
