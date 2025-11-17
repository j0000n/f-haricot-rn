import { StyleSheet } from "react-native";
import type { ThemeTokens } from "./tokens";

const createLayoutStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    rootContainer: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: tokens.colors.surface,
    },
  });

export default createLayoutStyles;
