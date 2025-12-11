import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, TextStyle, View } from "react-native";
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
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const letterSpacing = useMemo(() => {
    if (textAlign !== "spread" || !containerWidth) {
      return undefined;
    }

    const baseFontSize = fontSize ?? tokens.typography.heading;
    const effectiveText = text.replace(/\s+/g, "");
    const visibleLength = Math.max(effectiveText.length, 1);

    if (visibleLength <= 1) {
      return undefined;
    }

    const estimatedCharWidth = baseFontSize * 0.55;
    const estimatedTextWidth = estimatedCharWidth * visibleLength;
    const availableSpacing = containerWidth - estimatedTextWidth;

    if (availableSpacing <= 0) {
      return 0;
    }

    return Math.min(availableSpacing / (visibleLength - 1), baseFontSize * 1.5);
  }, [containerWidth, fontSize, text, textAlign, tokens.typography.heading]);

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

  const textStyle: TextStyle = {
    color: color ?? tokens.colors.textPrimary,
    fontFamily: tokens.fontFamilies[font],
    fontSize: fontSize ?? tokens.typography.heading,
    textAlign: textAlign === "spread" ? "center" : textAlign,
    letterSpacing,
    fontWeight: textDecorations.includes("bold") ? "700" : undefined,
    fontStyle: textDecorations.includes("italic") ? "italic" : undefined,
    textDecorationLine,
    textTransform: textDecorations.includes("uppercase") ? "uppercase" : undefined,
  };

  return (
    <View onLayout={handleLayout} style={styles.container}>
      <Text style={[textStyle, style]} accessibilityRole="header">
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});

export const HEADER_FONTS = AVAILABLE_FONTS;
