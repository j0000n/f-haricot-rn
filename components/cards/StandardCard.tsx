import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { InventoryDisplayItem } from '@haricot/convex-client';
import { ThemeTokens } from '@/styles/themes/types';
import { useThemedStyles } from '@/styles/tokens';

interface StandardCardProps {
  item: InventoryDisplayItem;
  itemId: string;
  onPress?: () => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: 160,
      borderRadius: tokens.radii.sm,
      overflow: 'hidden',
      marginLeft: tokens.spacing.xxs,
      backgroundColor: tokens.colors.surface,
      ...tokens.shadows.card,
    },
    containerPressed: {
      opacity: tokens.opacity.disabled,
    },
    image: {
      width: '100%',
      height: 120,
    },
    content: {
      padding: tokens.padding.card,
    },
    title: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xxs,
    },
    variety: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      marginBottom: tokens.spacing.xxs,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quantity: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textPrimary,
    },
    date: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
  });

export const StandardCard: React.FC<StandardCardProps> = ({ item, itemId, onPress }) => {
  const styles = useThemedStyles(createStyles);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
      resizeMode="cover"
    />
    <View style={styles.content}>
      <Text style={styles.title} numberOfLines={1}>
        {item.displayName}
      </Text>
      {item.displayVariety ? (
        <Text style={styles.variety} numberOfLines={1}>
          {item.displayVariety}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.quantity}>
          Qty: {item.quantity}
        </Text>
          <Text style={styles.date}>
            {formatDate(item.purchaseDate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
