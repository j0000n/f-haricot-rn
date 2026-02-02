import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "@/i18n/useTranslation";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { ThemeTokens } from "@/styles/themes/types";

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
      paddingTop: tokens.layout.headerTopPadding,
      paddingHorizontal: tokens.spacing.lg,
      paddingBottom: tokens.spacing.sm,
      borderBottomWidth: tokens.borderWidths.thin,
      borderBottomColor: tokens.colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: tokens.typography.title,
      fontFamily: tokens.fontFamilies.display,
      textTransform: "uppercase",
      color: tokens.colors.textPrimary,
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

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          {leftElement || (title && <Text style={styles.title}>{title}</Text>)}
        </View>
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
  );
};
