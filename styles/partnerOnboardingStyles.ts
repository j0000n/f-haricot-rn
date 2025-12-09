import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createPartnerOnboardingStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: tokens.colors.surface,
    },
    content: {
      flex: 1,
      padding: tokens.spacing.xl,
      justifyContent: "center",
      gap: tokens.spacing.lg,
    },
    title: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    body: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textPrimary,
      lineHeight: tokens.typography.body * 1.4,
    },
    button: {
      backgroundColor: tokens.colors.accent,
      paddingVertical: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      alignItems: "center",
    },
    buttonText: {
      color: tokens.colors.accentOnPrimary,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    secondaryLink: {
      color: tokens.colors.info,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.medium,
      textAlign: "center",
    },
  });

export default createPartnerOnboardingStyles;
