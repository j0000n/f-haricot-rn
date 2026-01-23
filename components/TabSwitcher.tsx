import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";

type Tab = {
  id: string;
  label: string;
};

type TabSwitcherProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.xs,
      gap: tokens.spacing.xs,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    tabActive: {
      backgroundColor: tokens.colors.accent,
    },
    tabText: {
      fontFamily: tokens.fontFamilies.medium,
      fontSize: tokens.typography.body,
      color: tokens.colors.textSecondary,
    },
    tabTextActive: {
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.accentOnPrimary,
    },
  });

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
