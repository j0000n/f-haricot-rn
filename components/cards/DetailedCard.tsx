import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemeTokens } from '@/styles/themes/types';
import { useThemedStyles } from '@/styles/tokens';
import type { InventoryDisplayItem } from '@/types/food';

interface DetailedCardProps {
  item: InventoryDisplayItem;
  itemId: string;
  onPress?: () => void;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      width: 240,
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
      height: 240,
    },
    content: {
      padding: tokens.padding.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: tokens.spacing.xs,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
      marginBottom: 2,
    },
    variety: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    badge: {
      minWidth: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.spacing.xs,
      backgroundColor: tokens.colors.overlay,
    },
    badgeText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
    },
    info: {
      gap: 4,
      marginBottom: tokens.spacing.xs,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    value: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textPrimary,
    },
    expiryBanner: {
      padding: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
      alignItems: 'center',
    },
    expiryText: {
      color: '#fff',
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
    },
  });

export const DetailedCard: React.FC<DetailedCardProps> = ({ item, itemId, onPress }) => {
  const styles = useThemedStyles(createStyles);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (purchaseDate: number, shelfLifeDays: number) => {
    const now = Date.now();
    const purchase = purchaseDate * 1000;
    const expiryDate = purchase + shelfLifeDays * 24 * 60 * 60 * 1000;
    const daysLeft = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
    return daysLeft;
  };

  const daysLeft = getDaysUntilExpiry(item.purchaseDate, item.shelfLifeDays);
  const expiryColor = daysLeft <= 2 ? '#ef4444' : daysLeft <= 4 ? '#f59e0b' : '#10b981';

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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.displayVariety ? (
            <Text style={styles.variety} numberOfLines={1}>
              {item.displayVariety}
            </Text>
          ) : null}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.quantity}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Category:
          </Text>
          <Text style={styles.value}>
            {item.categoryName}
          </Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.label}>
              Location:
            </Text>
            <Text style={styles.value}>
              {item.storageLocation.charAt(0).toUpperCase() + item.storageLocation.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Purchased:
            </Text>
            <Text style={styles.value}>
              {formatDate(item.purchaseDate)}
            </Text>
          </View>
        </View>

        <View style={[styles.expiryBanner, { backgroundColor: expiryColor }]}>
          <Text style={styles.expiryText}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
