import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { InventoryDisplayItem } from "@haricot/convex-client";
import { useTranslation } from "@/i18n/useTranslation";
import { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles } from "@/styles/tokens";

import { CompactCard } from "./cards/CompactCard";
import { DetailedCard } from "./cards/DetailedCard";
import { StandardCard } from "./cards/StandardCard";

export type CardVariant = "compact" | "standard" | "detailed";

interface RailProps {
  header: string;
  subheader?: string;
  items: { id: string; data: InventoryDisplayItem }[];
  variant: CardVariant;
  onSeeAll?: () => void;
  onItemPress?: (itemId: string, item: InventoryDisplayItem) => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      marginBottom: tokens.padding.section,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: tokens.padding.card,
      marginBottom: tokens.spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    header: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xxs,
    },
    subheader: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.lineHeights.normal * tokens.typography.small,
    },
    seeAllButton: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      backgroundColor: tokens.colors.overlay,
      color: tokens.colors.accent,
      padding: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      borderColor: tokens.colors.accent,
      borderWidth: tokens.borderWidths.thin,
    },
    scrollContent: {
      paddingHorizontal: 0,
    },
  });

export const Rail: React.FC<RailProps> = ({
  header,
  subheader,
  items,
  variant,
  onSeeAll,
  onItemPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const renderCard = (id: string, item: InventoryDisplayItem) => {
    const handlePress = () => onItemPress?.(id, item);

    switch (variant) {
      case "compact":
        return <CompactCard key={id} itemId={id} item={item} onPress={handlePress} />;
      case "standard":
        return <StandardCard key={id} itemId={id} item={item} onPress={handlePress} />;
      case "detailed":
        return <DetailedCard key={id} itemId={id} item={item} onPress={handlePress} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerText}>
          <Text style={styles.header}>{header}</Text>
          {subheader ? <Text style={styles.subheader}>{subheader}</Text> : null}
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAllButton}>{t("components.seeAll")}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={variant === "compact" ? 132 : variant === "standard" ? 172 : 252}
        snapToAlignment="start"
      >
        {items.map(({ id, data }) => renderCard(id, data))}
      </ScrollView>
    </View>
  );
};
