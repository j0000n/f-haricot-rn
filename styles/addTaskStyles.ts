import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createAddTaskStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      flex: 1,
      padding: tokens.spacing.lg,
    },
    section: {
      marginBottom: tokens.spacing.xl,
      gap: tokens.spacing.md,
    },
    heading: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.heading,
      color: tokens.colors.textPrimary,
    },
    helperText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.lineHeights.normal,
    },
    label: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
    },
    micButton: {
      paddingVertical: tokens.spacing.lg,
      paddingHorizontal: tokens.spacing.xl,
      borderRadius: tokens.radii.lg,
      backgroundColor: tokens.colors.surface,
      borderWidth: tokens.borderWidths.regular,
      borderColor: tokens.colors.border,
      alignItems: "center",
    },
    micButtonDisabled: {
      opacity: tokens.opacity.disabled,
    },
    micButtonActive: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    micButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    micButtonTextActive: {
      color: tokens.colors.accentOnPrimary,
    },
    resetButton: {
      alignSelf: "flex-start",
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
    },
    resetButtonText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textMuted,
    },
    transcriptBox: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.lg,
      gap: tokens.spacing.xs,
      minHeight: tokens.componentSizes.textAreaMinHeight,
      justifyContent: "center",
    },
    transcriptText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    interimText: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textMuted,
    },
    warningText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.info,
      backgroundColor: tokens.colors.overlay,
      padding: tokens.spacing.md,
      borderRadius: tokens.radii.md,
    },
    actionButton: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.lg,
      alignItems: "center",
      borderWidth: tokens.borderWidths.regular,
      borderColor: tokens.colors.border,
    },
    actionButtonDisabled: {
      opacity: tokens.opacity.disabled,
    },
    actionButtonText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    suggestionList: {
      gap: tokens.spacing.md,
    },
    suggestionCard: {
      backgroundColor: tokens.colors.overlay,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      padding: tokens.spacing.lg,
      gap: tokens.spacing.xs,
    },
    suggestionTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    suggestionMeta: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    errorText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.danger,
      backgroundColor: tokens.colors.overlay,
      padding: tokens.spacing.md,
      borderRadius: tokens.radii.md,
    },
    actions: {
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.surface,
      borderTopWidth: tokens.borderWidths.regular,
      borderTopColor: tokens.colors.border,
    },
    primaryButton: {
      backgroundColor: tokens.colors.accent,
      paddingVertical: tokens.spacing.lg,
      borderRadius: tokens.radii.md,
      alignItems: "center",
    },
    primaryButtonDisabled: {
      opacity: tokens.opacity.disabled,
    },
    primaryButtonText: {
      color: tokens.colors.accentOnPrimary,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
    },
  });

export default createAddTaskStyles;
