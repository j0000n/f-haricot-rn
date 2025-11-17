import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createOnboardingStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
      padding: tokens.spacing.lg,
    },
    content: {
      flexGrow: 1,
      alignItems: "center",
      paddingVertical: tokens.spacing.xl,
    },
    card: {
      width: tokens.widths.full,
      maxWidth: tokens.layout.maxFormWidth,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.xl,
      gap: tokens.spacing.lg,
      shadowColor: tokens.shadows.card.shadowColor,
      shadowOffset: tokens.shadows.card.shadowOffset,
      shadowOpacity: tokens.shadows.card.shadowOpacity,
      shadowRadius: tokens.shadows.card.shadowRadius,
      elevation: tokens.shadows.card.elevation,
    },
    header: {
      gap: tokens.spacing.sm,
    },
    logoRow: {
      alignItems: "center",
    },
    title: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    subtitle: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    optionsContainer: {
      gap: tokens.spacing.sm,
    },
    inputGroup: {
      gap: tokens.spacing.xs,
    },
    inputLabel: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    textField: {
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textPrimary,
      backgroundColor: tokens.colors.surface,
    },
    textArea: {
      minHeight: tokens.spacing.xl * 3,
      textAlignVertical: "top" as const,
    },
    helperText: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.tiny * tokens.lineHeights.normal,
    },
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xs,
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
      backgroundColor: tokens.colors.overlay,
      borderRadius: tokens.radii.lg,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    tagText: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    tagRemove: {
      paddingHorizontal: tokens.spacing.xs,
    },
    tagRemoveText: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textSecondary,
    },
    inlineInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    inlinePrimaryButton: {
      backgroundColor: tokens.colors.accent,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    inlinePrimaryButtonText: {
      color: tokens.colors.accentOnPrimary,
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    suggestionGroup: {
      gap: tokens.spacing.xs,
    },
    suggestionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xs,
    },
    suggestionChip: {
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.lg,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      backgroundColor: tokens.colors.surface,
    },
    suggestionChipActive: {
      backgroundColor: tokens.colors.accent,
      borderColor: tokens.colors.accent,
    },
    suggestionChipText: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    suggestionChipTextActive: {
      color: tokens.colors.accentOnPrimary,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    statusMessage: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      lineHeight: tokens.typography.tiny * tokens.lineHeights.normal,
    },
    statusMessageInfo: {
      color: tokens.colors.info,
    },
    statusMessageSuccess: {
      color: tokens.colors.success,
    },
    statusMessageError: {
      color: tokens.colors.danger,
    },
    joinButton: {
      backgroundColor: tokens.colors.accent,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.lg,
      alignItems: "center",
      alignSelf: "flex-start",
    },
    joinButtonText: {
      color: tokens.colors.accentOnPrimary,
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    optionButton: {
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: tokens.colors.surface,
    },
    optionSelected: {
      borderColor: tokens.colors.accent,
      backgroundColor: tokens.colors.overlay,
    },
    optionText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textPrimary,
    },
    appearanceSection: {
      gap: tokens.spacing.xs,
    },
    appearanceTitle: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      textTransform: "uppercase",
    },
    appearanceDescription: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
    },
    settingsGroup: {
      gap: tokens.spacing.sm,
    },
    settingsNestedGroup: {
      gap: tokens.spacing.xs,
      paddingLeft: tokens.spacing.md,
    },
    settingsOption: {
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.md,
      backgroundColor: tokens.colors.surface,
      gap: tokens.spacing.xs,
    },
    settingsOptionActive: {
      borderColor: tokens.colors.accent,
      backgroundColor: tokens.colors.overlay,
    },
    settingsOptionTitle: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    settingsOptionDescription: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.tiny * tokens.lineHeights.normal,
    },
    toggleRow: {
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      backgroundColor: tokens.colors.surface,
      gap: tokens.spacing.xs,
    },
    toggleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: tokens.spacing.xs,
    },
    toggleLabel: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    toggleDescription: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.tiny * tokens.lineHeights.normal,
    },
    button: {
      backgroundColor: tokens.colors.accent,
      borderRadius: tokens.radii.sm,
      paddingVertical: tokens.spacing.md,
      alignItems: "center",
    },
    buttonGroup: {
      gap: tokens.spacing.sm,
    },
    buttonSecondary: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      paddingVertical: tokens.spacing.md,
      alignItems: "center",
    },
    buttonDisabled: {
      opacity: tokens.opacity.disabled,
    },
    buttonText: {
      color: tokens.colors.accentOnPrimary,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    buttonSecondaryText: {
      color: tokens.colors.textPrimary,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
    },
    footer: {
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    progressText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
    },
  });

export default createOnboardingStyles;
