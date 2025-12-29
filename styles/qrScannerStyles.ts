import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createQrScannerStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    cameraContainer: {
      flex: 1,
      backgroundColor: tokens.colors.surface,
      borderBottomWidth: tokens.borderWidths.hairline,
      borderBottomColor: tokens.colors.border,
    },
    cameraView: {
      flex: 1,
    },
    permissionCard: {
      margin: tokens.spacing.lg,
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.lg,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      gap: tokens.spacing.sm,
    },
    permissionTitle: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    permissionCopy: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    actionButton: {
      marginTop: tokens.spacing.sm,
      paddingVertical: tokens.spacing.sm,
      alignItems: "center",
      borderRadius: tokens.radii.md,
      backgroundColor: tokens.colors.accent,
    },
    actionButtonText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.accentOnPrimary,
    },
    content: {
      flex: 1,
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: tokens.spacing.md,
    },
    headline: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
    body: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      textAlign: "center",
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    qrFrame: {
      width: "70%",
      aspectRatio: 1,
      borderRadius: tokens.radii.lg,
      borderWidth: tokens.borderWidths.thick,
      borderColor: tokens.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.colors.overlay,
    },
    qrInner: {
      width: "85%",
      aspectRatio: 1,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.hairline,
      borderStyle: "dashed",
      borderColor: tokens.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.colors.background,
    },
    statusPill: {
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.radii.round,
      backgroundColor: tokens.colors.overlay,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
    },
    statusText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    errorText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.danger,
      textAlign: "center",
    },
    metadata: {
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    metadataLabel: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: tokens.letterSpacing.tight,
    },
    metadataValue: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
  });

export default createQrScannerStyles;
