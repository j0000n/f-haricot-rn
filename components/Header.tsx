import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { useTheme } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";

const AVAILABLE_FONTS: Array<keyof ThemeTokens["fontFamilies"]> = [
  "display",
  "regular",
  "light",
  "lightItalic",
  "medium",
  "semiBold",
  "bold",
];

export type HeaderTextAlign = "left" | "right" | "center" | "spread";

export type HeaderTextDecoration =
  | "underline"
  | "bold"
  | "italic"
  | "lineThrough"
  | "uppercase";

type HeaderProps = {
  text: string;
  textAlign?: HeaderTextAlign;
  font?: (typeof AVAILABLE_FONTS)[number];
  color?: string;
  fontSize?: number;
  textDecorations?: HeaderTextDecoration[];
  style?: TextStyle;
};

export const Header: React.FC<HeaderProps> = ({
  text,
  textAlign = "left",
  font = "display",
  color,
  fontSize,
  textDecorations = [],
  style,
}) => {
  const { tokens } = useTheme();
  const textDecorationLine = useMemo(() => {
    const decorations: Array<"underline" | "line-through"> = [];

    if (textDecorations.includes("underline")) {
      decorations.push("underline");
    }
    if (textDecorations.includes("lineThrough")) {
      decorations.push("line-through");
    }

    return decorations.length > 0 ? decorations.join(" ") : undefined;
  }, [textDecorations]);

  const resolvedText = useMemo(() => {
    return textDecorations.includes("uppercase") ? text.toUpperCase() : text;
  }, [text, textDecorations]);

  const textStyle: TextStyle = {
    color: color ?? tokens.colors.textPrimary,
    fontFamily: tokens.fontFamilies[font],
    fontSize: fontSize ?? tokens.typography.heading,
    textAlign: textAlign === "spread" ? undefined : textAlign,
    fontWeight: textDecorations.includes("bold") ? "700" : undefined,
    fontStyle: textDecorations.includes("italic") ? "italic" : undefined,
    textDecorationLine,
    textTransform: textDecorations.includes("uppercase") ? "uppercase" : undefined,
  };

  if (textAlign === "spread") {
    const characters = resolvedText.split("");

    return (
      <View
        accessibilityRole="header"
        accessibilityLabel={resolvedText}
        style={[styles.container, styles.spreadContainer]}
      >
        {characters.map((char, index) => (
          <Text key={`${char}-${index}`} style={[textStyle, style]}>
            {char === " " ? "\u00A0" : char}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[textStyle, style]} accessibilityRole="header">
        {resolvedText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  spreadContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
});

export const HEADER_FONTS = AVAILABLE_FONTS;
