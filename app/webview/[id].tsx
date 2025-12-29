import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import { useTranslation } from "@/i18n/useTranslation";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";
import { decodeUrl, getHostname } from "@/utils/url";
import { useLocalSearchParams, useRouter } from "expo-router";

// Conditionally import WebView - it requires native code and won't work in Expo Go
let WebView: typeof import("react-native-webview").WebView | null = null;
try {
  if (Platform.OS !== "web") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebViewModule = require("react-native-webview");
    WebView = WebViewModule.WebView;
  }
} catch (error) {
  // WebView not available (e.g., in Expo Go or if native module not linked)
  console.warn("react-native-webview not available:", error);
}

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
  const decodedUrl = useMemo(() => decodeUrl(id), [id]);
  const fallbackTitle = useMemo(() => getHostname(decodedUrl), [decodedUrl]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
  }, [decodedUrl]);

  // Fallback to external browser if WebView is not available
  const handleOpenInBrowser = async () => {
    if (decodedUrl) {
      await WebBrowser.openBrowserAsync(decodedUrl);
    }
  };

  const SafeArea = SafeAreaView as unknown as React.ComponentType<
    SafeAreaViewProps & { style?: StyleProp<ViewStyle> }
  >;

  if (!decodedUrl) {
    return (
      <SafeArea style={styles.container}>
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
      </SafeArea>
    );
  }

  return (
    <SafeArea style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backText}>{t("common.back")}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {pageTitle || fallbackTitle}
        </Text>
      </View>

      {isWeb ? (
        <View style={styles.webView}>
          <iframe
            title={decodedUrl}
            src={decodedUrl}
            style={{ border: "none", width: "100%", height: "100%" }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </View>
      ) : WebView ? (
        <WebView
          source={{ uri: decodedUrl }}
          style={styles.webView}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          mixedContentMode="always"
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
            setLoadError(true);
            setIsLoading(false);
          }}
          onLoadProgress={({ nativeEvent }) => {
            if (nativeEvent.title) {
              setPageTitle(nativeEvent.title);
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView HTTP error: ", nativeEvent);
            // Don't treat HTTP errors as fatal - some sites return 403/404 but still render
          }}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={[styles.backText, { marginTop: tokens.spacing.sm, textAlign: "center" }]}>
            {t("home.webPreviewUnavailable")}
          </Text>
          <Pressable
            onPress={handleOpenInBrowser}
            style={{
              marginTop: tokens.spacing.md,
              paddingHorizontal: tokens.spacing.lg,
              paddingVertical: tokens.spacing.sm,
              backgroundColor: tokens.colors.accent,
              borderRadius: tokens.radii.md,
            }}
          >
            <Text style={[styles.backText, { color: tokens.colors.surface }]}>
              {t("home.openInBrowser")}
            </Text>
          </Pressable>
        </View>
      )}

      {(isLoading || loadError) ? (
        <View style={styles.loadingContainer}>
          {!loadError ? (
            <>
              <ActivityIndicator color={tokens.colors.accent} />
              <Text style={[styles.backText, { marginTop: tokens.spacing.sm }]}>{t("home.webPreviewLoading")}</Text>
            </>
          ) : (
            <Text style={[styles.backText, { marginTop: tokens.spacing.sm }]}>
              {t("home.webPreviewUnavailable")}
            </Text>
          )}
        </View>
      ) : null}
    </SafeArea>
  );
};

export default WebViewScreen;
