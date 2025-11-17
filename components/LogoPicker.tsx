import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/tokens";
import { RobustColorPicker } from "./RobustColorPicker";
import { SvgLogo } from "./SvgLogo";
import { AVAILABLE_LOGOS, type LogoAsset } from "./logoAssets";

// Re-export for backward compatibility
export type { LogoAsset };
export { AVAILABLE_LOGOS };

type LogoPickerProps = {
  selectedLogoPath: string;
  onSelectLogo: (logo: LogoAsset) => void;
  logoFillColor?: string;
  onLogoFillColorChange?: (color: string) => void;
  colors?: {
    textPrimary: string;
    textSecondary: string;
    border: string;
    overlay: string;
    accent: string;
    accentOnPrimary: string;
    textMuted: string;
  };
  tokens?: ThemeTokens;
};

export function LogoPicker({ 
  selectedLogoPath, 
  onSelectLogo,
  logoFillColor = "#000000",
  onLogoFillColorChange,
  colors,
  tokens: providedTokens,
}: LogoPickerProps) {
  const styles = useThemedStyles(createStyles);
  const defaultTokens = useTokens();
  const themeColors = colors || styles.colors || {};
  const themeTokens = providedTokens || defaultTokens;

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.label}>Logo</Text>
        {onLogoFillColorChange && (
          <View style={styles.colorPickerContainer}>
            <Text style={[styles.colorLabel, { color: themeColors.textPrimary || styles.label.color }]}>
              Fill Color
            </Text>
            <RobustColorPicker
              value={logoFillColor}
              onChange={onLogoFillColorChange || (() => {})}
              colors={themeColors as any}
              tokens={themeTokens}
            />
            <TextInput
              style={[
                styles.colorInput,
                {
                  backgroundColor: themeColors.overlay || "#F0F0F0",
                  color: themeColors.textPrimary || "#000",
                  borderColor: themeColors.border || "#CCC",
                },
              ]}
              value={logoFillColor}
              onChangeText={(text: string) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(text) && onLogoFillColorChange) {
                  onLogoFillColorChange(text);
                }
              }}
              placeholder="#000000"
              placeholderTextColor={themeColors.textMuted || "#999"}
              autoCapitalize="none"
            />
          </View>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AVAILABLE_LOGOS.map((logo) => {
          const isSelected = logo.path === selectedLogoPath;
          const isSvg = logo.path.endsWith(".svg");
          // Use SvgLogo for haricot-logo.svg (the only one with SVG data), otherwise use Image with tintColor
          const useSvgLogo = logo.path === "@/assets/images/haricot-logo.svg";
          
          return (
            <Pressable
              key={logo.id}
              style={[styles.logoOption, isSelected ? styles.logoOptionSelected : null]}
              onPress={() => onSelectLogo(logo)}
            >
              <View style={styles.logoImageContainer}>
                {useSvgLogo ? (
                  <SvgLogo
                    width={60}
                    height={60}
                    fillColor={logoFillColor}
                    logoPath={logo.path}
                  />
                ) : (
                  <Image 
                    source={logo.source as any} 
                    style={styles.logoImage} 
                    contentFit="contain"
                    tintColor={isSvg ? logoFillColor : undefined}
                  />
                )}
              </View>
              <Text style={[styles.logoLabel, isSelected ? styles.logoLabelSelected : null]}>
                {logo.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: tokens.spacing.xs,
    },
    logoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: tokens.spacing.xs,
    },
    label: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    colorPickerContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    colorLabel: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
    },
    colorInput: {
      width: 80,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
    },
    scrollContent: {
      gap: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.xs,
    },
    logoOption: {
      width: 100,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      padding: tokens.spacing.sm,
      alignItems: "center",
      gap: tokens.spacing.xs,
    },
    logoOptionSelected: {
      borderColor: tokens.colors.accent,
      backgroundColor: tokens.colors.overlay,
    },
    logoImageContainer: {
      width: 60,
      height: 60,
      justifyContent: "center",
      alignItems: "center",
    },
    logoImage: {
      width: "100%",
      height: "100%",
    },
    logoLabel: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      textAlign: "center",
    },
    logoLabelSelected: {
      color: tokens.colors.accent,
      fontFamily: tokens.fontFamilies.semiBold,
    },
  });
