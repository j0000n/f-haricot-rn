import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "@/i18n/useTranslation";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { ThemeTokens } from "@/styles/themes/types";
import { StaticBrandLogo } from "@/components/StaticBrandLogo";

interface PageHeaderProps {
  title?: string;
  showProfileButton?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    header: {
      backgroundColor: tokens.colors.surface,
      ...(Platform.OS !== "web" && { paddingTop: tokens.spacing.xxl }),
      ...(Platform.OS === "web" && { paddingTop: tokens.spacing.sm }),
      paddingHorizontal: tokens.spacing.sm,
      paddingBottom: tokens.spacing.sm,
      borderBottomWidth: tokens.borderWidths.thin,
      borderBottomColor: tokens.colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
    },
    headerLeft: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerCenter: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    headerRight: {
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: tokens.typography.title,
      fontFamily: tokens.fontFamilies.display,
      lineHeight: tokens.lineHeights.tight,
      textTransform: "uppercase",
      color: tokens.colors.textPrimary,
      textAlign: "center",
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
  });

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showProfileButton = false,
  rightElement,
  leftElement,
}) => {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { tokens } = useTheme();
  const { t } = useTranslation();

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const defaultLeftElement = (
    <StaticBrandLogo
      size={40}
      accessibilityLabel={t("home.logoAccessibility")}
    />
  );

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          {leftElement ?? defaultLeftElement}
        </View>
        {title && (
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        <View style={styles.headerRight}>
          {rightElement}
          {showProfileButton && (
            <Pressable
              style={styles.profileButton}
              onPress={handleProfilePress}
              accessibilityLabel={t("components.goToProfile")}
              accessibilityRole="button"
            >
              <Feather name="user" size={20} color={tokens.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};
