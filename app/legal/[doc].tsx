import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "@/i18n/useTranslation";
import { useThemedStyles } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";

type LegalDocKey = "privacy" | "terms" | "consent";

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      paddingHorizontal: tokens.spacing.lg,
      paddingBottom: tokens.spacing.xxl,
      paddingTop: tokens.spacing.lg,
      gap: tokens.spacing.lg,
    },
    title: {
      fontSize: tokens.typography.title,
      fontFamily: tokens.fontFamilies.display,
      color: tokens.colors.textPrimary,
    },
    updated: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
    },
    intro: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.normal,
    },
    section: {
      gap: tokens.spacing.xs,
    },
    sectionTitle: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    sectionBody: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.normal,
    },
  });

const DOCS: Record<
  LegalDocKey,
  { titleKey: string; introKey: string; updatedKey: string; sections: { titleKey: string; bodyKey: string }[] }
> = {
  privacy: {
    titleKey: "legal.privacy.title",
    introKey: "legal.privacy.intro",
    updatedKey: "legal.privacy.updated",
    sections: [
      { titleKey: "legal.privacy.sections.collect.title", bodyKey: "legal.privacy.sections.collect.body" },
      { titleKey: "legal.privacy.sections.use.title", bodyKey: "legal.privacy.sections.use.body" },
      { titleKey: "legal.privacy.sections.share.title", bodyKey: "legal.privacy.sections.share.body" },
      { titleKey: "legal.privacy.sections.retention.title", bodyKey: "legal.privacy.sections.retention.body" },
      { titleKey: "legal.privacy.sections.rights.title", bodyKey: "legal.privacy.sections.rights.body" },
      { titleKey: "legal.privacy.sections.contact.title", bodyKey: "legal.privacy.sections.contact.body" },
    ],
  },
  terms: {
    titleKey: "legal.terms.title",
    introKey: "legal.terms.intro",
    updatedKey: "legal.terms.updated",
    sections: [
      { titleKey: "legal.terms.sections.use.title", bodyKey: "legal.terms.sections.use.body" },
      { titleKey: "legal.terms.sections.accounts.title", bodyKey: "legal.terms.sections.accounts.body" },
      { titleKey: "legal.terms.sections.content.title", bodyKey: "legal.terms.sections.content.body" },
      { titleKey: "legal.terms.sections.disclaimer.title", bodyKey: "legal.terms.sections.disclaimer.body" },
      { titleKey: "legal.terms.sections.termination.title", bodyKey: "legal.terms.sections.termination.body" },
    ],
  },
  consent: {
    titleKey: "legal.consent.title",
    introKey: "legal.consent.intro",
    updatedKey: "legal.consent.updated",
    sections: [
      { titleKey: "legal.consent.sections.analytics.title", bodyKey: "legal.consent.sections.analytics.body" },
      { titleKey: "legal.consent.sections.sessionReplay.title", bodyKey: "legal.consent.sections.sessionReplay.body" },
      { titleKey: "legal.consent.sections.location.title", bodyKey: "legal.consent.sections.location.body" },
      { titleKey: "legal.consent.sections.voice.title", bodyKey: "legal.consent.sections.voice.body" },
    ],
  },
};

export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const resolvedDoc = useMemo(() => {
    if (doc === "privacy" || doc === "terms" || doc === "consent") {
      return doc;
    }
    return "privacy";
  }, [doc]);

  const content = DOCS[resolvedDoc];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t(content.titleKey),
          headerBackTitle: t("common.back"),
          headerShown: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t(content.titleKey)}</Text>
        <Text style={styles.updated}>{t(content.updatedKey)}</Text>
        <Text style={styles.intro}>{t(content.introKey)}</Text>

        {content.sections.map((section) => (
          <View key={section.titleKey} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
            <Text style={styles.sectionBody}>{t(section.bodyKey)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
