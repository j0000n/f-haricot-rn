import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/tokens";

type FontSelectorProps = {
  fonts: string[];
  selectedFont: string;
  onSelectFont: (font: string) => void;
  colors?: {
    textPrimary: string;
    textSecondary: string;
    border: string;
    overlay: string;
    accent: string;
    accentOnPrimary: string;
    background: string;
    surface: string;
  };
  tokens?: ThemeTokens;
};

export function FontSelector({
  fonts,
  selectedFont,
  onSelectFont,
  colors,
  tokens,
}: FontSelectorProps) {
  const styles = useThemedStyles(createStyles);
  const themeColors = colors || styles.colors || {};
  const scrollViewRef = useRef<ScrollView>(null);
  const itemPositions = useRef<Map<string, number>>(new Map());
  const lastSelectedFont = useRef<string | null>(null);

  // Scroll to selected font when component mounts or selectedFont changes
  useEffect(() => {
    if (selectedFont && scrollViewRef.current && itemPositions.current.has(selectedFont)) {
      // Only scroll if the selected font actually changed
      if (lastSelectedFont.current !== selectedFont) {
        const yPosition = itemPositions.current.get(selectedFont);
        if (yPosition !== undefined) {
          // Use setTimeout to ensure layout is complete
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, yPosition - 50), // Offset by 50px to show some context above
              animated: true,
            });
          }, 200);
        }
        lastSelectedFont.current = selectedFont;
      }
    }
  }, [selectedFont]);

  const handleItemLayout = (font: string, event: { nativeEvent: { layout: { y: number } } }) => {
    const { y } = event.nativeEvent.layout;
    // Store the actual y position from layout (relative to ScrollView content)
    itemPositions.current.set(font, y);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface || "#FFFFFF",
          borderColor: themeColors.border || "#CCCCCC",
        },
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {fonts.map((font) => {
          const isSelected = font === selectedFont;

          return (
            <Pressable
              key={font}
              style={({ pressed }: { pressed: boolean }) => [
                styles.fontItem,
                {
                  backgroundColor: isSelected
                    ? (themeColors.accent || "#007AFF")
                    : pressed
                      ? (themeColors.overlay || "#F5F5F5")
                      : "transparent",
                  borderLeftWidth: isSelected ? 4 : 0,
                  borderLeftColor: isSelected
                    ? (themeColors.accent || "#007AFF")
                    : "transparent",
                },
              ]}
              onPress={() => {
                console.log("Font selected:", font);
                onSelectFont(font);
                // Scroll to selected item immediately
                setTimeout(() => {
                  const yPosition = itemPositions.current.get(font);
                  if (yPosition !== undefined) {
                    scrollViewRef.current?.scrollTo({
                      y: Math.max(0, yPosition - 50),
                      animated: true,
                    });
                  } else {
                    // Fallback: estimate position based on index
                    const index = fonts.indexOf(font);
                    if (index >= 0) {
                      scrollViewRef.current?.scrollTo({
                        y: Math.max(0, index * 44 - 50),
                        animated: true,
                      });
                    }
                  }
                }, 50);
              }}
              onLayout={(event: { nativeEvent: { layout: { y: number } } }) => handleItemLayout(font, event)}
            >
              <Text
                style={[
                  styles.fontName,
                  {
                    color: isSelected
                      ? themeColors.accentOnPrimary || "#FFFFFF"
                      : themeColors.textPrimary || "#000000",
                    fontFamily: font,
                  },
                ]}
              >
                {font}
              </Text>
              {isSelected && (
                <View
                  style={[
                    styles.selectedIndicator,
                    {
                      backgroundColor: themeColors.accentOnPrimary || "#FFFFFF",
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      height: 200,
      borderRadius: tokens.radii.md,
      borderWidth: tokens.borderWidths.regular,
      backgroundColor: tokens.colors.surface,
      borderColor: tokens.colors.border,
      overflow: "hidden",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: tokens.spacing.xs,
    },
    fontItem: {
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
    },
    fontName: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      flex: 1,
    },
    selectedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: tokens.spacing.sm,
    },
  });

