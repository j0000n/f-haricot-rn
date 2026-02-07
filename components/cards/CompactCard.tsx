import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { InventoryDisplayItem } from '@haricot/convex-client';
import { ThemeTokens } from '@/styles/themes/types';
import { useThemedStyles } from '@/styles/tokens';

interface CompactCardProps {
  item: InventoryDisplayItem;
  itemId: string;
  onPress?: () => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: 120,
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
      height: 80,
    },
    content: {
      padding: tokens.spacing.xs,
    },
    title: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      marginBottom: 2,
    },
    quantity: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
  });

export const CompactCard: React.FC<CompactCardProps> = ({ item, itemId, onPress }) => {
  const styles = useThemedStyles(createStyles);

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
      <Text style={styles.quantity} numberOfLines={1}>
        Qty: {item.quantity}
      </Text>
      </View>
    </Pressable>
  );
};
