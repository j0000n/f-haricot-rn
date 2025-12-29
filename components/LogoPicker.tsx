import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import type { StyleProp, ImageStyle } from "react-native";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/tokens";
import { WebsiteStyleColorPicker } from "./WebsiteStyleColorPicker";
import { SvgLogo } from "./SvgLogo";
import { AVAILABLE_LOGOS, type LogoAsset } from "./logoAssets";
import { useTranslation } from "@/i18n/useTranslation";

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
  const { t } = useTranslation();
  const themeColors = colors || styles.colors || {};
  const themeTokens = providedTokens || defaultTokens;
  const colorPickerColors = {
    ...themeColors,
    surface: (themeColors as any).surface || themeTokens.colors.surface,
    background: (themeColors as any).background || themeTokens.colors.background,
  } as any;

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.label}>{t("themeCreator.logo.fieldLabel")}</Text>
        {onLogoFillColorChange && (
          <View style={styles.colorPickerContainer}>
            <Text style={[styles.colorLabel, { color: themeColors.textPrimary || styles.label.color }]}>
              {t("themeCreator.logo.fillColor")}
            </Text>
            <WebsiteStyleColorPicker
              value={logoFillColor}
              onChange={onLogoFillColorChange || (() => {})}
              colors={colorPickerColors as any}
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
          // Use SvgLogo for haricot-logo.svg (the only one with SVG data)
          const useSvgLogo = logo.path === "@/assets/images/haricot-logo.svg";

          // Check if logo.source is a React component (SVG transformers can return components)
          const logoSource = logo.source;
          const isDirectFunctionComponent = typeof logoSource === "function";
          const hasComponentInDefault =
            typeof logoSource === "object" &&
            logoSource !== null &&
            "default" in logoSource &&
            typeof (logoSource as any).default === "function";
          const hasReactComponentProperties =
            typeof logoSource === "object" &&
            logoSource !== null &&
            ("$$typeof" in logoSource || "displayName" in logoSource || "render" in logoSource || "prototype" in logoSource);
          const isReactComponent = isDirectFunctionComponent || hasComponentInDefault || hasReactComponentProperties;

          // Validate that logoSource is a valid image source for expo-image
          // A valid image source should be:
          // - A number (require() result for non-SVG images)
          // - An object with uri/localUri
          const isValidImageSource =
            typeof logoSource === "number" ||
            (typeof logoSource === "object" &&
             logoSource !== null &&
             !isReactComponent &&
             ("uri" in logoSource || "localUri" in logoSource));

          // Render function to determine what to display
          const renderLogo = () => {
            // Use SvgLogo for haricot logo if we have fill color support
            if (useSvgLogo) {
              return (
                <SvgLogo
                  width={60}
                  height={60}
                  fillColor={logoFillColor}
                  logoPath={logo.path}
                />
              );
            }

            // If it's a React component (like SVG transformers return), render it directly
            if (isReactComponent) {
              try {
                let LogoComponent: React.ComponentType<{
                  width?: number | string;
                  height?: number | string;
                  style?: StyleProp<ImageStyle>;
                }>;

                if (hasComponentInDefault) {
                  LogoComponent = (logoSource as any).default;
                } else if (isDirectFunctionComponent) {
                  LogoComponent = logoSource as React.ComponentType<{
                    width?: number | string;
                    height?: number | string;
                    style?: StyleProp<ImageStyle>;
                  }>;
                } else {
                  LogoComponent = logoSource as any;
                }

                return (
                  <LogoComponent
                    width={60}
                    height={60}
                    style={styles.logoImage}
                  />
                );
              } catch (error) {
                console.warn("LogoPicker: Error rendering SVG component", error);
                // Fall through to Image component
              }
            }

            // Only use Image component if we have a valid image source
            if (isValidImageSource) {
              return (
                <Image
                  source={logoSource as any}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              );
            }

            // Fallback: return null if we can't render anything
            return null;
          };

          return (
            <Pressable
              key={logo.id}
              style={[styles.logoOption, isSelected ? styles.logoOptionSelected : null]}
              onPress={() => onSelectLogo(logo)}
            >
              <View style={styles.logoImageContainer}>
                {renderLogo()}
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
