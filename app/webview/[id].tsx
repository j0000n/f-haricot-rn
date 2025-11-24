import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, Pressable } from "react-native";
import { WebView } from "react-native-webview";

import { useTranslation } from "@/i18n/useTranslation";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";
import { useLocalSearchParams, useRouter } from "expo-router";

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    header: {
      paddingTop: tokens.layout.headerTopPadding,
      paddingHorizontal: tokens.spacing.lg,
      paddingBottom: tokens.spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.sm,
      borderBottomWidth: tokens.borderWidths.thin,
      borderBottomColor: tokens.colors.border,
    },
    backButton: {
      padding: tokens.spacing.xs,
      borderRadius: tokens.radii.sm,
    },
    backText: {
      color: tokens.colors.accent,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    title: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
      flex: 1,
    },
    webView: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    loadingContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.colors.overlay,
    },
  });

const WebViewScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const decodedUrl = useMemo(() => (typeof id === "string" ? decodeURIComponent(id) : ""), [id]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
  }, [decodedUrl]);

  if (!decodedUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>{t("common.back")}</Text>
          </Pressable>
          <Text style={styles.title}>{t("home.webPreviewHeader")}</Text>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: "transparent" }]}>
          <Text style={styles.title}>{t("home.webPreviewUnavailable")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backText}>{t("common.back")}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {pageTitle || decodedUrl}
        </Text>
      </View>

      <WebView
        source={{ uri: decodedUrl }}
        style={styles.webView}
        startInLoadingState
        onLoadEnd={() => setIsLoading(false)}
        onLoadProgress={({ nativeEvent }) => setPageTitle(nativeEvent.title || decodedUrl)}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.accent} />
          <Text style={[styles.backText, { marginTop: tokens.spacing.sm }]}>{t("home.webPreviewLoading")}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default WebViewScreen;
