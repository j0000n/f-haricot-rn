import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createSignInStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: tokens.colors.surface,
    },
    keyboardAvoiding: {
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.surface,
      gap: tokens.spacing.xl,
    },
    title: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
      textAlign: "center",
      marginTop: -tokens.spacing.sm,
    },
    input: {
      width: tokens.widths.full,
      maxWidth: tokens.layout.maxFormWidth,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.md,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      marginBottom: tokens.spacing.md,
      backgroundColor: tokens.colors.surface,
      color: tokens.colors.textPrimary,
    },
    button: {
      width: tokens.widths.full,
      maxWidth: tokens.layout.maxFormWidth,
      backgroundColor: tokens.colors.accent,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.md,
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
    description: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      marginBottom: tokens.spacing.md,
      textAlign: "center",
      color: tokens.colors.textPrimary,
    },
    link: {
      color: tokens.colors.info,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.medium,
    },
    linkContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: tokens.spacing.md,
      gap: tokens.spacing.sm,
    },
    linkSeparator: {
      color: tokens.colors.textMuted,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
    },
    footerLinks: {
      alignItems: "center",
      marginTop: tokens.spacing.lg,
      gap: tokens.spacing.xs,
    },
    signUpLinks: {
      alignItems: "center",
      gap: tokens.spacing.sm,
    },
    helperText: {
      color: tokens.colors.textPrimary,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      textAlign: "center",
    },
    userTypeLinks: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.sm,
    },
  });

export default createSignInStyles;
