import React, { useMemo } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@haricot/convex-client";
import type { Doc } from "@haricot/convex-client";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useTranslation } from "@/i18n/useTranslation";
import type { ThemeTokens } from "@/styles/themes/types";
import { useThemedStyles } from "@/styles/tokens";
import { normalizeLanguage, resolveTranslation } from "@/utils/translation";

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    scrollContent: {
      padding: tokens.padding.screen,
      paddingBottom: tokens.spacing.xxl,
      gap: tokens.spacing.lg,
    },
    headerCard: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.lg,
      overflow: "hidden",
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    image: {
      width: "100%",
      height: 200,
    },
    headerContent: {
      padding: tokens.spacing.md,
      gap: tokens.spacing.xs,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.sm,
    },
    emoji: {
      fontSize: tokens.typography.display,
    },
    title: {
      fontFamily: tokens.fontFamilies.bold,
      fontSize: tokens.typography.heading,
      color: tokens.colors.textPrimary,
      flexShrink: 1,
    },
    subtitle: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textSecondary,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: tokens.spacing.xs,
    },
    chip: {
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.surfaceVariant,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
    },
    chipText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    section: {
      gap: tokens.spacing.sm,
    },
    sectionCard: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.md,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      gap: tokens.spacing.sm,
    },
    sectionTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.subheading,
      color: tokens.colors.textPrimary,
    },
    sectionDescription: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.relaxed,
    },
    infoGrid: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
      flexWrap: "wrap",
    },
    infoCard: {
      flexGrow: 1,
      minWidth: "45%",
      backgroundColor: tokens.colors.surfaceVariant,
      borderRadius: tokens.radii.sm,
      padding: tokens.spacing.sm,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
      gap: tokens.spacing.xs,
    },
    infoLabel: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    infoValue: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    listItem: {
      padding: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.surfaceVariant,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
    },
    listItemTitle: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textPrimary,
    },
    listItemSubtitle: {
      fontFamily: tokens.fontFamilies.regular,
      fontSize: tokens.typography.small,
      color: tokens.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: tokens.padding.screen,
      backgroundColor: tokens.colors.background,
    },
    emptyStateText: {
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
      textAlign: "center",
    },
  });

type Styles = ReturnType<typeof createStyles>;

export default function IngredientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const foodCode = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const { t, i18n } = useTranslation();
  const styles = useThemedStyles<Styles>(createStyles);
  const language = normalizeLanguage(i18n.language);

  const foodLibrary = useQuery(api.foodLibrary.listAll, {});

  if (foodLibrary === undefined) {
    return <LoadingScreen />;
  }

  const food = foodLibrary?.find((item: Doc<"foodLibrary">) => item.code === foodCode);

  if (!food) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{t("ingredient.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const displayName = resolveTranslation(food.translations, language);
  const categoryName = resolveTranslation(food.categoryTranslations, language);

  const headerOptions = {
    title: displayName,
  } as const;

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={headerOptions} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          {food.defaultImageUrl ? (
            <Image source={{ uri: food.defaultImageUrl }} style={styles.image} />
          ) : null}

          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              {food.emoji ? <Text style={styles.emoji}>{food.emoji}</Text> : null}
              <Text style={styles.title}>{displayName}</Text>
            </View>
            <Text style={styles.subtitle}>{categoryName}</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{t("ingredient.code", { code: food.code })}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {t("ingredient.namespace", { namespace: food.namespace })}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {t(`ingredient.storage.${food.storageLocation}` as const)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t("ingredient.storageGuidance")}</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{t("ingredient.shelfLife")}</Text>
                <Text style={styles.infoValue}>
                  {t("ingredient.days", { count: food.shelfLifeDays })}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{t("ingredient.storageLocation")}</Text>
                <Text style={styles.infoValue}>
                  {t(`ingredient.storage.${food.storageLocation}` as const)}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionDescription}>{food.storageTips}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t("ingredient.translations")}</Text>
            <View style={styles.infoGrid}>
              {Object.entries(food.translations).map(([lang]) => {
                const translationLanguage = normalizeLanguage(lang);

                return (
                  <View key={lang} style={styles.infoCard}>
                    <Text style={styles.infoLabel}>{lang.toUpperCase()}</Text>
                    <Text style={styles.infoValue}>
                      {resolveTranslation(
                      food.translations as unknown as Record<string, string>,
                      translationLanguage,
                    )}
                  </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {food.varieties?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t("ingredient.varieties")}</Text>
              <View style={{ gap: styles.sectionCard.gap }}>
                {food.varieties.map((variety: Doc<"foodLibrary">["varieties"][number]) => (
                  <View key={variety.code} style={styles.listItem}>
                    <Text style={styles.listItemTitle}>
                      {resolveTranslation(variety.translations, language)}
                    </Text>
                    <Text style={styles.listItemSubtitle}>
                      {t("ingredient.varietyCode", { code: variety.code })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
