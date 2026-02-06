import { api } from "@haricot/convex-client";
import type { TabBarTokens } from "@/styles/themes/types";
import type { ThemeTokens } from "@/styles/tokens";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
// @ts-ignore - react-native exports are runtime values
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { WebsiteStyleColorPicker } from "./WebsiteStyleColorPicker";
import { FeatherIconPicker } from "./FeatherIconPicker";
import { FontSelector } from "./FontSelector";
import { Slider } from "./Slider";

type ThemeCreatorModalProps = {
  visible: boolean;
  onClose: () => void;
  onThemeCreated?: (shareCode: string) => void;
};

type ColorSection = {
  background: string;
  surface: string;
  overlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentOnPrimary: string;
  success: string;
  danger: string;
  info: string;
  logoFill: string;
};

type EditorMode = "edit" | "preview";

// Curated font list for Theme Lab builder; must match FONT_SOURCES.
const AVAILABLE_FONTS = [
  "Peignot",
  "Source Sans Pro",
  "Source Sans Pro Light",
  "Source Sans Pro Light Italic",
  "Source Sans Pro SemiBold",
  "Source Sans Pro Bold",
  "East Market NF",
  "Metaloxcide",
  "W95FA",
  "Sprat-Regular",
  "Sprat-Bold",
  "Gloock-Regular",
  "OpenDyslexic-Regular",
  "Saira-Regular",
  "FT88-Regular",
  "CutiveMono-Regular",
];

// Color picker presets
const COLOR_PRESETS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#008000", "#000080",
];

// Helper function to convert hex to RGB (currently unused but kept for potential future use)
// const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
//   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//   return result
//     ? {
//         r: parseInt(result[1], 16),
//         g: parseInt(result[2], 16),
//         b: parseInt(result[3], 16),
//       }
//     : null;
// };

// Simple color picker component
export function ColorPicker({
  value,
  onChange,
  colors,
  tokens,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: ColorSection;
  tokens: ThemeTokens;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempColor, setTempColor] = useState(value);

  const handlePresetSelect = (preset: string) => {
    setTempColor(preset);
    onChange(preset);
    setShowPicker(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: colors.border,
            backgroundColor: value,
          },
        ]}
      />
      {showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setShowPicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 20,
                borderRadius: 12,
                width: "80%",
                maxWidth: 400,
              }}
              onStartShouldSetResponder={() => true}
            >
              <Text style={{ color: colors.textPrimary, marginBottom: 12, fontSize: 16 }}>
                Select Color
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {COLOR_PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => handlePresetSelect(preset)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: preset,
                      borderWidth: tempColor === preset ? 3 : 1,
                      borderColor: tempColor === preset ? colors.accent : colors.border,
                    }}
                  />
                ))}
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 14 }}>
                  Hex Code
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.overlay,
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={tempColor}
                  onChangeText={(text: string) => {
                    setTempColor(text);
                    if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
                      onChange(text);
                    }
                  }}
                  placeholder="#000000"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
              <Pressable
                onPress={() => setShowPicker(false)}
                style={{
                  backgroundColor: colors.accent,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.accentOnPrimary, fontSize: 16 }}>
                  Done
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

export function ThemeCreatorModal({
  visible,
  onClose,
  onThemeCreated,
}: ThemeCreatorModalProps) {
  const styles = useThemedStyles(createStyles);
  const { tokens, definition } = useTheme();
  const { t } = useTranslation();
  const createTheme = useMutation(api.customThemes.createCustomTheme);

  const [mode, setMode] = useState<EditorMode>("edit");
  const [themeName, setThemeName] = useState("");
  const [isPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with current theme colors
  const [colors, setColors] = useState<ColorSection>({
    background: tokens.colors.background,
    surface: tokens.colors.surface,
    overlay: tokens.colors.overlay,
    textPrimary: tokens.colors.textPrimary,
    textSecondary: tokens.colors.textSecondary,
    textMuted: tokens.colors.textMuted,
    border: tokens.colors.border,
    accent: tokens.colors.accent,
    accentOnPrimary: tokens.colors.accentOnPrimary,
    success: tokens.colors.success,
    danger: tokens.colors.danger,
    info: tokens.colors.info,
    logoFill: tokens.colors.logoFill || tokens.colors.textPrimary,
  });

  const [spacing, setSpacing] = useState(tokens.spacing);
  const [padding, setPadding] = useState(tokens.padding);
  const [radii, setRadii] = useState(tokens.radii);
  const [typography, setTypography] = useState(tokens.typography);

  // Component tokens - initialize from current theme with fallbacks
  const [componentTokens, setComponentTokens] = useState(() => {
    // Fallback to base component tokens if not present in current theme
    const fallbackComponents: ThemeTokens["components"] = {
      card: { padding: 10, borderRadius: 12, gap: 8, margin: 8, imageHeight: 120 },
      button: {
        primary: {
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          fontSize: 16,
          colorCustom: undefined,
          textColorCustom: undefined,
        },
        secondary: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, fontSize: 16 },
        pill: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          colorCustom: undefined,
          textColorCustom: undefined,
        },
        text: { paddingHorizontal: 16, paddingVertical: 8 },
      },
      list: {
        itemPadding: { horizontal: 16, vertical: 16 },
        itemGap: 16,
        borderRadius: 12,
        headerPadding: { horizontal: 16, vertical: 12 },
      },
      header: {
        page: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
        section: { marginBottom: 12, gap: 4 },
      },
      input: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, fontSize: 16, labelGap: 4 },
      textArea: { minHeight: 150, padding: 20, borderRadius: 12 },
      rail: { headerGap: 4, headerMarginBottom: 12, cardGap: 4, scrollPadding: 0 },
      tabBar: tokens.components.tabBar,
    };
    const getComponentToken = <K extends keyof ThemeTokens["components"]>(
      key: K
    ): ThemeTokens["components"][K] => {
      return (tokens.components[key] || fallbackComponents[key]) as ThemeTokens["components"][K];
    };

    return {
      card: getComponentToken("card"),
      button: getComponentToken("button"),
      list: getComponentToken("list"),
      header: getComponentToken("header"),
      input: getComponentToken("input"),
      textArea: getComponentToken("textArea"),
      rail: getComponentToken("rail"),
    };
  });

  const [fontFamilies, setFontFamilies] = useState({
    display: tokens.fontFamilies.display,
    regular: tokens.fontFamilies.regular,
    light: tokens.fontFamilies.light,
    lightItalic: tokens.fontFamilies.lightItalic,
    medium: tokens.fontFamilies.medium,
    semiBold: tokens.fontFamilies.semiBold,
    bold: tokens.fontFamilies.bold,
  });

  // Initialize tabBar from current theme's components
  const getDefaultTabBar = (): TabBarTokens => {
    if (definition.tokens.components?.tabBar) {
      return definition.tokens.components.tabBar;
    }
    return {
      containerBackground: colors.background,
      slotBackground: colors.background,
      list: {
        paddingHorizontal: tokens.spacing.sm,
        paddingVertical: tokens.spacing.sm,
        marginHorizontal: tokens.spacing.md,
        marginBottom: tokens.spacing.lg,
        borderRadius: tokens.radii.lg,
        backgroundColor: colors.surface,
        borderWidth: tokens.borderWidths.regular,
        borderColor: colors.border,
        shadow: null,
      },
      trigger: {
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.sm,
        borderRadius: tokens.radii.md,
        minHeight: tokens.spacing.xl,
        shape: "pill" as const,
        inactiveBackgroundColor: "transparent",
        activeBackgroundColor: colors.accent,
      },
      label: {
        show: true,
        color: colors.textSecondary,
        activeColor: colors.accentOnPrimary,
        uppercase: false,
        letterSpacing: tokens.letterSpacing.normal,
        marginLeftWithIcon: tokens.spacing.xs,
      },
      icon: {
        show: false,
        family: "Feather",
        size: tokens.iconSizes.md,
        inactiveColor: colors.textSecondary,
        activeColor: colors.accentOnPrimary,
        names: {
          home: "home",
          kitchen: "shopping-cart",
          lists: "list",
          creator: "edit",
          vendor: "store",
        },
      },
    };
  };

  const [tabBar, setTabBar] = useState<TabBarTokens>(() => getDefaultTabBar());
  const [activeTab, setActiveTab] = useState<"home" | "kitchen" | "lists">("home");

  // Reset form to current theme when modal opens
  useEffect(() => {
    if (visible) {
      // Update all values to match the current theme
      setColors({
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        overlay: tokens.colors.overlay,
        textPrimary: tokens.colors.textPrimary,
        textSecondary: tokens.colors.textSecondary,
        textMuted: tokens.colors.textMuted,
        border: tokens.colors.border,
        accent: tokens.colors.accent,
        accentOnPrimary: tokens.colors.accentOnPrimary,
        success: tokens.colors.success,
        danger: tokens.colors.danger,
        info: tokens.colors.info,
        logoFill: tokens.colors.logoFill || tokens.colors.textPrimary,
      });
      setSpacing(tokens.spacing);
      setPadding(tokens.padding);
      setRadii(tokens.radii);
      setTypography(tokens.typography);
      // Update component tokens with fallbacks
      const getComponentToken = <K extends keyof ThemeTokens["components"]>(
        key: K
      ): ThemeTokens["components"][K] => {
        if (key === "tabBar") {
          return tokens.components.tabBar as ThemeTokens["components"][K];
        }
        const fallback = componentTokens[key as keyof typeof componentTokens];
        return (tokens.components[key] || fallback) as ThemeTokens["components"][K];
      };

      setComponentTokens({
        card: getComponentToken("card"),
        button: getComponentToken("button"),
        list: getComponentToken("list"),
        header: getComponentToken("header"),
        input: getComponentToken("input"),
        textArea: getComponentToken("textArea"),
        rail: getComponentToken("rail"),
      });
      setFontFamilies({
        display: tokens.fontFamilies.display,
        regular: tokens.fontFamilies.regular,
        light: tokens.fontFamilies.light,
        lightItalic: tokens.fontFamilies.lightItalic,
        medium: tokens.fontFamilies.medium,
        semiBold: tokens.fontFamilies.semiBold,
        bold: tokens.fontFamilies.bold,
      });
      setThemeName("");
      setMode("edit");

      // Reset tabBar to current theme's tabBar configuration
      if (definition.tokens.components?.tabBar) {
        setTabBar(definition.tokens.components.tabBar);
      } else {
        const currentTabBar = getDefaultTabBar();
        setTabBar(currentTabBar);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tokens, definition]);

  const updateColor = (key: keyof ColorSection, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  // Unused update functions kept for potential future use
  // const updateSpacing = (key: keyof typeof spacing, value: number) => {
  //   setSpacing((prev) => ({ ...prev, [key]: value }));
  // };

  // const updatePadding = (key: keyof typeof padding, value: number) => {
  //   setPadding((prev) => ({ ...prev, [key]: value }));
  // };

  // const updateRadii = (key: keyof typeof radii, value: number) => {
  //   setRadii((prev) => ({ ...prev, [key]: value }));
  // };

  const updateTypography = (key: keyof typeof typography, value: number) => {
    setTypography((prev) => ({ ...prev, [key]: value }));
  };

  const updateFontFamily = (key: keyof typeof fontFamilies, value: string) => {
    setFontFamilies((prev) => ({ ...prev, [key]: value }));
  };

  // Component token update functions
  const updateCardToken = <K extends keyof typeof componentTokens.card>(
    key: K,
    value: typeof componentTokens.card[K]
  ) => {
    setComponentTokens((prev) => ({
      ...prev,
      card: { ...prev.card, [key]: value },
    }));
  };

  const updateButtonToken = <Variant extends keyof typeof componentTokens.button>(
    variant: Variant,
    key: keyof typeof componentTokens.button[Variant],
    value: number
  ) => {
    setComponentTokens((prev) => ({
      ...prev,
      button: {
        ...prev.button,
        [variant]: { ...prev.button[variant], [key]: value },
      },
    }));
  };

  const updateListToken = <K extends keyof typeof componentTokens.list>(
    key: K,
    value: typeof componentTokens.list[K]
  ) => {
    setComponentTokens((prev) => ({
      ...prev,
      list: { ...prev.list, [key]: value },
    }));
  };

  const updateHeaderToken = <Type extends keyof typeof componentTokens.header>(
    type: Type,
    key: keyof typeof componentTokens.header[Type],
    value: number
  ) => {
    setComponentTokens((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [type]: { ...prev.header[type], [key]: value },
      },
    }));
  };

  const updateInputToken = <K extends keyof typeof componentTokens.input>(
    key: K,
    value: typeof componentTokens.input[K]
  ) => {
    setComponentTokens((prev) => ({
      ...prev,
      input: { ...prev.input, [key]: value },
    }));
  };

  // Unused update functions kept for potential future use
  // const updateTextAreaToken = <K extends keyof typeof componentTokens.textArea>(
  //   key: K,
  //   value: typeof componentTokens.textArea[K]
  // ) => {
  //   setComponentTokens((prev) => ({
  //     ...prev,
  //     textArea: { ...prev.textArea, [key]: value },
  //   }));
  // };

  // const updateRailToken = <K extends keyof typeof componentTokens.rail>(
  //   key: K,
  //   value: typeof componentTokens.rail[K]
  // ) => {
  //   setComponentTokens((prev) => ({
  //     ...prev,
  //     rail: { ...prev.rail, [key]: value },
  //   }));
  // };

  const generateRandomThemeName = () => {
    const adjectives = t("themeCreator.randomName.adjectives", {
      returnObjects: true,
    }) as string[];
    const nouns = t("themeCreator.randomName.nouns", { returnObjects: true }) as string[];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${randomAdj} ${randomNoun} ${randomNum}`;
  };

  const handleSave = async () => {
    const finalThemeName = themeName.trim() || generateRandomThemeName();

    try {
      setIsSaving(true);

      // Derive global tokens from component tokens for backward compatibility
      // Use component tokens as source of truth, estimate global tokens
      const derivedSpacing = {
        spacingMicro: componentTokens.rail.cardGap || 2,
        spacingTight: componentTokens.input.labelGap || 4,
        spacingCompact: componentTokens.card.gap || 8,
        spacingStandard: componentTokens.header.section.marginBottom || 12,
        spacingComfortable: componentTokens.list.itemPadding.horizontal || 16,
        spacingRoomy: componentTokens.header.page.paddingHorizontal || 20,
        spacingSpacious: componentTokens.header.page.paddingTop || 24,
        spacingHero: 40,
      };

      const derivedPadding = {
        screen: componentTokens.header.page.paddingHorizontal || 12,
        section: componentTokens.header.page.paddingHorizontal || 16,
        card: componentTokens.card.padding,
        compact: componentTokens.button.pill.paddingHorizontal || 6,
      };

      const derivedRadii = {
        radiusControl: componentTokens.button.primary.borderRadius,
        radiusCard: componentTokens.card.borderRadius,
        radiusSurface: componentTokens.list.borderRadius,
        radiusPill: 999,
      };

      const derivedTypography = {
        typeDisplay: typography.typeDisplay ?? typography.display,
        typeTitle: typography.typeTitle ?? typography.title,
        typeHeading: typography.typeHeading ?? typography.heading,
        typeSubheading: typography.typeSubheading ?? typography.subheading,
        typeBody: typography.typeBody ?? typography.body,
        typeBodySmall: typography.typeBodySmall ?? typography.extraSmall,
        typeCaption: typography.typeCaption ?? typography.small,
        typeMicro: typography.typeMicro ?? typography.tiny,
      };

      const result = await createTheme({
        name: finalThemeName,
        colors: {
          ...colors,
          logoFill: colors.logoFill || colors.textPrimary, // Ensure logoFill is included
        },
        spacing: derivedSpacing,
        padding: derivedPadding,
        radii: derivedRadii,
        typography: derivedTypography,
        fontFamilies,
        isPublic,
        tabBar: tabBar, // Include tabBar configuration
      });

      // Call onThemeCreated before showing alert so theme can be applied immediately
      // This prevents duplicate alerts (ThemeSwitcher will handle applying the theme)
      if (onThemeCreated) {
        onThemeCreated(result.shareCode);
      }

      onClose();

      Alert.alert(
        t("themeCreator.alerts.successTitle"),
        t("themeCreator.alerts.successMessage", { shareCode: result.shareCode }),
        [
          {
            text: t("themeCreator.alerts.copyCode"),
            onPress: async () => {
              await Clipboard.setStringAsync(result.shareCode);
              Alert.alert(
                t("themeCreator.alerts.copiedTitle"),
                t("themeCreator.alerts.copiedMessage", { shareCode: result.shareCode })
              );
            },
          },
          {
            text: t("themeCreator.alerts.dismiss"),
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Failed to create theme:", error);
      Alert.alert(
        t("themeCreator.alerts.errorTitle"),
        t("themeCreator.alerts.errorMessage")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const previewTokens = useMemo(
    () => ({
      colors,
      spacing,
      padding,
      radii,
      typography,
      fontFamilies,
    }),
    [colors, spacing, padding, radii, typography, fontFamilies]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>
              {mode === "edit"
                ? t("themeCreator.header.create")
                : t("themeCreator.header.preview")}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={tokens.colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.modeToggle}>
            <Pressable
              style={[
                styles.modeButton,
                { borderColor: colors.border },
                mode === "edit"
                  ? { backgroundColor: colors.accent }
                  : { backgroundColor: colors.surface },
              ]}
              onPress={() => setMode("edit")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: mode === "edit" ? colors.accentOnPrimary : colors.textSecondary },
                ]}
              >
                {t("themeCreator.header.editMode")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                { borderColor: colors.border },
                mode === "preview"
                  ? { backgroundColor: colors.accent }
                  : { backgroundColor: colors.surface },
              ]}
              onPress={() => setMode("preview")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: mode === "preview" ? colors.accentOnPrimary : colors.textSecondary },
                ]}
              >
                {t("themeCreator.header.previewMode")}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {mode === "edit" ? (
            <>
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t("themeCreator.themeInfo.title")}
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {t("themeCreator.themeInfo.nameLabel")}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.overlay,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    value={themeName}
                    onChangeText={setThemeName}
                    placeholder={t("themeCreator.themeInfo.placeholder")}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t("themeCreator.colors.title")}
                </Text>

                {/* Background Colors */}
                <View style={[styles.colorSubsection, { borderTopWidth: 0, paddingTop: 0 }]}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>
                    {t("themeCreator.colors.backgroundSection")}
                  </Text>
                  {Object.entries(colors)
                    .filter(([key]) => ["background", "surface", "overlay"].includes(key))
                    .map(([key, value]) => (
                      <View key={key} style={styles.inputGroup}>
                        <View>
                          <Text style={[styles.label, { color: colors.textPrimary }]}>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </Text>
                          <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {key === "background" && t("themeCreator.colors.backgroundDescription")}
                            {key === "surface" && t("themeCreator.colors.surfaceDescription")}
                            {key === "overlay" && t("themeCreator.colors.overlayDescription")}
                          </Text>
                        </View>
                        <View style={styles.colorInputRow}>
                          <WebsiteStyleColorPicker
                            value={value}
                            onChange={(newColor) => updateColor(key as keyof ColorSection, newColor)}
                            colors={colors}
                            tokens={tokens}
                          />
                          <TextInput
                            style={[
                              styles.input,
                              styles.colorInput,
                              {
                                backgroundColor: colors.overlay,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                              },
                            ]}
                            value={value}
                            onChangeText={(text: string) =>
                              updateColor(key as keyof ColorSection, text)
                            }
                            placeholder="#000000"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    ))}
                </View>

                {/* Text Colors */}
                <View style={styles.colorSubsection}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>
                    {t("themeCreator.colors.textSection")}
                  </Text>

                  {/* Text Colors Preview */}
                  <View
                    style={{
                      backgroundColor: colors.overlay,
                      borderRadius: tokens.radii.md,
                      padding: tokens.spacing.md,
                      marginBottom: tokens.spacing.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <Text style={{ fontSize: tokens.typography.heading, color: colors.textPrimary, fontFamily: tokens.fontFamilies.bold }}>
                      {t("themeCreator.colors.textPreview.heading")}
                    </Text>
                    <Text style={{ fontSize: tokens.typography.body, color: colors.textSecondary, fontFamily: tokens.fontFamilies.regular }}>
                      {t("themeCreator.colors.textPreview.body")}
                    </Text>
                    <Text style={{ fontSize: tokens.typography.small, color: colors.textMuted, fontFamily: tokens.fontFamilies.regular }}>
                      {t("themeCreator.colors.textPreview.muted")}
                    </Text>
                  </View>

                  {Object.entries(colors)
                    .filter(([key]) => ["textPrimary", "textSecondary", "textMuted"].includes(key))
                    .map(([key, value]) => (
                      <View key={key} style={styles.inputGroup}>
                        <View>
                          <Text style={[styles.label, { color: colors.textPrimary }]}>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </Text>
                          <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {key === "textPrimary" && "Main text content, headings, and labels"}
                            {key === "textSecondary" && "Secondary text and descriptions"}
                            {key === "textMuted" && "Muted text, placeholders, and hints"}
                          </Text>
                        </View>
                        <View style={styles.colorInputRow}>
                          <WebsiteStyleColorPicker
                            value={value}
                            onChange={(newColor) => updateColor(key as keyof ColorSection, newColor)}
                            colors={colors}
                            tokens={tokens}
                          />
                          <TextInput
                            style={[
                              styles.input,
                              styles.colorInput,
                              {
                                backgroundColor: colors.overlay,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                              },
                            ]}
                            value={value}
                            onChangeText={(text: string) =>
                              updateColor(key as keyof ColorSection, text)
                            }
                            placeholder="#000000"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    ))}
                </View>

                {/* Interactive Colors */}
                <View style={styles.colorSubsection}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>
                    {t("themeCreator.colors.interactiveSection")}
                  </Text>

                  {/* Interactive Colors Preview */}
                  <View
                    style={{
                      backgroundColor: colors.overlay,
                      borderRadius: tokens.radii.md,
                      padding: tokens.spacing.md,
                      marginBottom: tokens.spacing.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.accent,
                        borderRadius: tokens.radii.sm,
                        paddingHorizontal: tokens.spacing.md,
                        paddingVertical: tokens.spacing.sm,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: colors.accentOnPrimary, fontSize: tokens.typography.body, fontFamily: tokens.fontFamilies.semiBold }}>
                        {t("themeCreator.colors.interactivePreview.button")}
                      </Text>
                    </View>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: tokens.radii.sm,
                        paddingHorizontal: tokens.spacing.md,
                        paddingVertical: tokens.spacing.sm,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: tokens.typography.body, fontFamily: tokens.fontFamilies.regular }}>
                        {t("themeCreator.colors.interactivePreview.bordered")}
                      </Text>
                    </View>
                  </View>

                  {Object.entries(colors)
                    .filter(([key]) => ["accent", "accentOnPrimary", "border"].includes(key))
                    .map(([key, value]) => (
                      <View key={key} style={styles.inputGroup}>
                        <View>
                          <Text style={[styles.label, { color: colors.textPrimary }]}>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </Text>
                          <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {key === "accent" && t("themeCreator.colors.accentDescription")}
                            {key === "accentOnPrimary" && t("themeCreator.colors.accentOnPrimaryDescription")}
                            {key === "border" && t("themeCreator.colors.borderDescription")}
                          </Text>
                        </View>
                        <View style={styles.colorInputRow}>
                          <WebsiteStyleColorPicker
                            value={value}
                            onChange={(newColor) => updateColor(key as keyof ColorSection, newColor)}
                            colors={colors}
                            tokens={tokens}
                          />
                          <TextInput
                            style={[
                              styles.input,
                              styles.colorInput,
                              {
                                backgroundColor: colors.overlay,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                              },
                            ]}
                            value={value}
                            onChangeText={(text: string) =>
                              updateColor(key as keyof ColorSection, text)
                            }
                            placeholder="#000000"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    ))}
                </View>

                {/* Status Colors */}
                <View style={styles.colorSubsection}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>
                    {t("themeCreator.colors.statusSection")}
                  </Text>

                  {/* Status Colors Preview */}
                  <View
                    style={{
                      backgroundColor: colors.overlay,
                      borderRadius: tokens.radii.md,
                      padding: tokens.spacing.md,
                      marginBottom: tokens.spacing.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      gap: tokens.spacing.sm,
                      flexWrap: "wrap",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.success,
                        borderRadius: tokens.radii.sm,
                        paddingHorizontal: tokens.spacing.md,
                        paddingVertical: tokens.spacing.xs,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: tokens.typography.small, fontFamily: tokens.fontFamilies.semiBold }}>
                        {t("themeCreator.colors.statusPreview.success")}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.danger,
                        borderRadius: tokens.radii.sm,
                        paddingHorizontal: tokens.spacing.md,
                        paddingVertical: tokens.spacing.xs,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: tokens.typography.small, fontFamily: tokens.fontFamilies.semiBold }}>
                        {t("themeCreator.colors.statusPreview.danger")}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.info,
                        borderRadius: tokens.radii.sm,
                        paddingHorizontal: tokens.spacing.md,
                        paddingVertical: tokens.spacing.xs,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: tokens.typography.small, fontFamily: tokens.fontFamilies.semiBold }}>
                        {t("themeCreator.colors.statusPreview.info")}
                      </Text>
                    </View>
                  </View>

                  {Object.entries(colors)
                    .filter(([key]) => ["success", "danger", "info"].includes(key))
                    .map(([key, value]) => (
                      <View key={key} style={styles.inputGroup}>
                        <View>
                          <Text style={[styles.label, { color: colors.textPrimary }]}>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </Text>
                          <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {key === "success" && t("themeCreator.colors.successDescription")}
                            {key === "danger" && t("themeCreator.colors.dangerDescription")}
                            {key === "info" && t("themeCreator.colors.infoDescription")}
                          </Text>
                        </View>
                        <View style={styles.colorInputRow}>
                          <WebsiteStyleColorPicker
                            value={value}
                            onChange={(newColor) => updateColor(key as keyof ColorSection, newColor)}
                            colors={colors}
                            tokens={tokens}
                          />
                          <TextInput
                            style={[
                              styles.input,
                              styles.colorInput,
                              {
                                backgroundColor: colors.overlay,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                              },
                            ]}
                            value={value}
                            onChangeText={(text: string) =>
                              updateColor(key as keyof ColorSection, text)
                            }
                            placeholder="#000000"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    ))}
                </View>

              </View>

              {/* Cards Section */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cards</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Customize card components used throughout the app (recipe cards, inventory cards, etc.)
                </Text>

                {/* Card Preview */}
                <View
                  style={{
                    width: "100%",
                    backgroundColor: colors.overlay,
                    borderRadius: componentTokens.card.borderRadius,
                    padding: componentTokens.card.padding,
                    marginBottom: tokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: componentTokens.card.gap,
                  }}
                >
                  <Text style={{ fontSize: tokens.typography.body, color: colors.textPrimary, fontFamily: tokens.fontFamilies.semiBold }}>
                    Card Preview
                  </Text>
                  <Text style={{ fontSize: tokens.typography.small, color: colors.textSecondary }}>
                    This is how cards will look
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Padding</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Internal spacing inside cards
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.card.padding}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={40}
                    step={1}
                    value={componentTokens.card.padding}
                    onValueChange={(val) => updateCardToken("padding", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Border Radius</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Corner roundness of cards
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.card.borderRadius}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    value={componentTokens.card.borderRadius}
                    onValueChange={(val) => updateCardToken("borderRadius", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Gap Between Elements</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Spacing between card content elements
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.card.gap}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={32}
                    step={1}
                    value={componentTokens.card.gap}
                    onValueChange={(val) => updateCardToken("gap", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Margin Between Cards</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Spacing between multiple cards
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.card.margin}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={32}
                    step={1}
                    value={componentTokens.card.margin}
                    onValueChange={(val) => updateCardToken("margin", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>
              </View>

              {/* Buttons Section */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Buttons</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Customize button styles for primary actions, secondary actions, and pill buttons
                </Text>

                {/* Primary Button */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>Primary Button</Text>

                  {/* Preview */}
                  <View
                    style={{
                      backgroundColor: componentTokens.button.primary.colorCustom || colors.accent,
                      borderRadius: componentTokens.button.primary.borderRadius,
                      paddingHorizontal: componentTokens.button.primary.paddingHorizontal,
                      paddingVertical: componentTokens.button.primary.paddingVertical,
                      marginBottom: tokens.spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{
                      color: componentTokens.button.primary.textColorCustom || colors.accentOnPrimary,
                      fontSize: componentTokens.button.primary.fontSize,
                      fontFamily: tokens.fontFamilies.semiBold
                    }}>
                      Primary Button
                    </Text>
                  </View>

                  {/* Custom Color Controls */}
                  <View style={styles.inputGroup}>
                    <View>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Button Color (Optional)</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Override accent color for primary buttons. Leave empty to use accent color.
                      </Text>
                    </View>
                    <View style={styles.colorInputRow}>
                      <WebsiteStyleColorPicker
                        value={componentTokens.button.primary.colorCustom || colors.accent}
                        onChange={(newColor) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              primary: { ...prev.button.primary, colorCustom: newColor },
                            },
                          }));
                        }}
                        colors={colors}
                        tokens={tokens}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.colorInput,
                          {
                            backgroundColor: colors.overlay,
                            color: colors.textPrimary,
                            borderColor: colors.border,
                          },
                        ]}
                        value={componentTokens.button.primary.colorCustom || ""}
                        onChangeText={(text: string) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              primary: { ...prev.button.primary, colorCustom: text || undefined },
                            },
                          }));
                        }}
                        placeholder={colors.accent}
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                      />
                      <Pressable
                        onPress={() => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              primary: { ...prev.button.primary, colorCustom: undefined },
                            },
                          }));
                        }}
                        style={{
                          padding: tokens.spacing.xs,
                          backgroundColor: colors.overlay,
                          borderRadius: tokens.radii.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: tokens.typography.small }}>
                          Reset
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Button Text Color (Optional)</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Override text color for primary buttons. Leave empty to use accentOnPrimary color.
                      </Text>
                    </View>
                    <View style={styles.colorInputRow}>
                      <WebsiteStyleColorPicker
                        value={componentTokens.button.primary.textColorCustom || colors.accentOnPrimary}
                        onChange={(newColor) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              primary: { ...prev.button.primary, textColorCustom: newColor },
                            },
                          }));
                        }}
                        colors={colors}
                        tokens={tokens}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.colorInput,
                          {
                            backgroundColor: colors.overlay,
                            color: colors.textPrimary,
                            borderColor: colors.border,
                          },
                        ]}
                        value={componentTokens.button.primary.textColorCustom || ""}
                        onChangeText={(text: string) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              primary: { ...prev.button.primary, textColorCustom: text || undefined },
                            },
                          }));
                        }}
                        placeholder={colors.accentOnPrimary}
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                      />
                      <Pressable
                        onPress={() => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              primary: { ...prev.button.primary, textColorCustom: undefined },
                            },
                          }));
                        }}
                        style={{
                          padding: tokens.spacing.xs,
                          backgroundColor: colors.overlay,
                          borderRadius: tokens.radii.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: tokens.typography.small }}>
                          Reset
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Horizontal Padding</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.button.primary.paddingHorizontal}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={8}
                      maximumValue={48}
                      step={1}
                      value={componentTokens.button.primary.paddingHorizontal}
                      onValueChange={(val) => updateButtonToken("primary", "paddingHorizontal", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Vertical Padding</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.button.primary.paddingVertical}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={4}
                      maximumValue={32}
                      step={1}
                      value={componentTokens.button.primary.paddingVertical}
                      onValueChange={(val) => updateButtonToken("primary", "paddingVertical", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Border Radius</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.button.primary.borderRadius}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={50}
                      step={1}
                      value={componentTokens.button.primary.borderRadius}
                      onValueChange={(val) => updateButtonToken("primary", "borderRadius", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                </View>

                {/* Pill Button */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>Pill Button</Text>

                  {/* Preview */}
                  <View
                    style={{
                      backgroundColor: componentTokens.button.pill.colorCustom || colors.overlay,
                      borderRadius: componentTokens.button.pill.borderRadius,
                      paddingHorizontal: componentTokens.button.pill.paddingHorizontal,
                      paddingVertical: componentTokens.button.pill.paddingVertical,
                      marginBottom: tokens.spacing.sm,
                      borderWidth: componentTokens.button.pill.colorCustom ? 0 : 1,
                      borderColor: colors.border,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{
                      color: componentTokens.button.pill.textColorCustom || colors.textPrimary,
                      fontSize: tokens.typography.small
                    }}>
                      Pill Button
                    </Text>
                  </View>

                  {/* Custom Color Controls */}
                  <View style={styles.inputGroup}>
                    <View>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Button Color (Optional)</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Override background color for pill buttons. Leave empty to use overlay color.
                      </Text>
                    </View>
                    <View style={styles.colorInputRow}>
                      <WebsiteStyleColorPicker
                        value={componentTokens.button.pill.colorCustom || colors.overlay}
                        onChange={(newColor) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              pill: { ...prev.button.pill, colorCustom: newColor },
                            },
                          }));
                        }}
                        colors={colors}
                        tokens={tokens}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.colorInput,
                          {
                            backgroundColor: colors.overlay,
                            color: colors.textPrimary,
                            borderColor: colors.border,
                          },
                        ]}
                        value={componentTokens.button.pill.colorCustom || ""}
                        onChangeText={(text: string) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              pill: { ...prev.button.pill, colorCustom: text || undefined },
                            },
                          }));
                        }}
                        placeholder={colors.overlay}
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                      />
                      <Pressable
                        onPress={() => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              pill: { ...prev.button.pill, colorCustom: undefined },
                            },
                          }));
                        }}
                        style={{
                          padding: tokens.spacing.xs,
                          backgroundColor: colors.overlay,
                          borderRadius: tokens.radii.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: tokens.typography.small }}>
                          Reset
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Button Text Color (Optional)</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Override text color for pill buttons. Leave empty to use textPrimary color.
                      </Text>
                    </View>
                    <View style={styles.colorInputRow}>
                      <WebsiteStyleColorPicker
                        value={componentTokens.button.pill.textColorCustom || colors.textPrimary}
                        onChange={(newColor) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              pill: { ...prev.button.pill, textColorCustom: newColor },
                            },
                          }));
                        }}
                        colors={colors}
                        tokens={tokens}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.colorInput,
                          {
                            backgroundColor: colors.overlay,
                            color: colors.textPrimary,
                            borderColor: colors.border,
                          },
                        ]}
                        value={componentTokens.button.pill.textColorCustom || ""}
                        onChangeText={(text: string) => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              pill: { ...prev.button.pill, textColorCustom: text || undefined },
                            },
                          }));
                        }}
                        placeholder={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                      />
                      <Pressable
                        onPress={() => {
                          setComponentTokens((prev) => ({
                            ...prev,
                            button: {
                              ...prev.button,
                              pill: { ...prev.button.pill, textColorCustom: undefined },
                            },
                          }));
                        }}
                        style={{
                          padding: tokens.spacing.xs,
                          backgroundColor: colors.overlay,
                          borderRadius: tokens.radii.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: tokens.typography.small }}>
                          Reset
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Horizontal Padding</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.button.pill.paddingHorizontal}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={4}
                      maximumValue={32}
                      step={1}
                      value={componentTokens.button.pill.paddingHorizontal}
                      onValueChange={(val) => updateButtonToken("pill", "paddingHorizontal", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Border Radius</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.button.pill.borderRadius}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={50}
                      step={1}
                      value={componentTokens.button.pill.borderRadius}
                      onValueChange={(val) => updateButtonToken("pill", "borderRadius", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                </View>
              </View>

              {/* Lists Section */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lists</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Customize list item spacing and styling
                </Text>

                {/* List Preview */}
                <View
                  style={{
                    backgroundColor: colors.overlay,
                    borderRadius: componentTokens.list.borderRadius,
                    padding: tokens.spacing.sm,
                    marginBottom: tokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: componentTokens.list.itemGap,
                  }}
                >
                  {[1, 2, 3].map((item) => (
                    <View
                      key={item}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: tokens.radii.sm,
                        paddingHorizontal: componentTokens.list.itemPadding.horizontal,
                        paddingVertical: componentTokens.list.itemPadding.vertical,
                      }}
                    >
                      <Text style={{ fontSize: tokens.typography.body, color: colors.textPrimary, fontFamily: tokens.fontFamilies.regular }}>
                        List Item {item}
                      </Text>
                      <Text style={{ fontSize: tokens.typography.small, color: colors.textSecondary, fontFamily: tokens.fontFamilies.regular }}>
                        Secondary text for item {item}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Item Padding (Horizontal)</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Horizontal padding inside list items
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.list.itemPadding.horizontal}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={4}
                    maximumValue={32}
                    step={1}
                    value={componentTokens.list.itemPadding.horizontal}
                    onValueChange={(val) => updateListToken("itemPadding", { ...componentTokens.list.itemPadding, horizontal: Math.round(val) })}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Item Padding (Vertical)</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Vertical padding inside list items
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.list.itemPadding.vertical}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={4}
                    maximumValue={32}
                    step={1}
                    value={componentTokens.list.itemPadding.vertical}
                    onValueChange={(val) => updateListToken("itemPadding", { ...componentTokens.list.itemPadding, vertical: Math.round(val) })}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Item Gap</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Spacing between list items
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.list.itemGap}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={32}
                    step={1}
                    value={componentTokens.list.itemGap}
                    onValueChange={(val) => updateListToken("itemGap", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Border Radius</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Corner roundness of list containers
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.list.borderRadius}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    value={componentTokens.list.borderRadius}
                    onValueChange={(val) => updateListToken("borderRadius", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>
              </View>

              {/* Headers Section */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Headers</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Customize page headers and section headers
                </Text>

                {/* Header Preview */}
                <View
                  style={{
                    backgroundColor: colors.overlay,
                    borderRadius: tokens.radii.md,
                    padding: tokens.spacing.md,
                    marginBottom: tokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: componentTokens.header.section.gap,
                  }}
                >
                  {/* Page Header Preview */}
                  <View
                    style={{
                      paddingTop: componentTokens.header.page.paddingTop,
                      paddingHorizontal: componentTokens.header.page.paddingHorizontal,
                      paddingBottom: componentTokens.header.page.paddingBottom,
                      gap: componentTokens.header.page.gap,
                    }}
                  >
                    <Text style={{ fontSize: tokens.typography.heading, color: colors.textPrimary, fontFamily: tokens.fontFamilies.bold }}>
                      Page Title
                    </Text>
                    <Text style={{ fontSize: tokens.typography.body, color: colors.textSecondary, fontFamily: tokens.fontFamilies.regular }}>
                      Page description or subtitle
                    </Text>
                  </View>

                  {/* Section Header Preview */}
                  <View
                    style={{
                      marginBottom: componentTokens.header.section.marginBottom,
                      gap: componentTokens.header.section.gap,
                    }}
                  >
                    <Text style={{ fontSize: tokens.typography.subheading, color: colors.textPrimary, fontFamily: tokens.fontFamilies.semiBold }}>
                      Section Header
                    </Text>
                    <Text style={{ fontSize: tokens.typography.small, color: colors.textSecondary, fontFamily: tokens.fontFamilies.regular }}>
                      Section description
                    </Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>Page Header</Text>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Padding Horizontal</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.header.page.paddingHorizontal}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={8}
                      maximumValue={48}
                      step={1}
                      value={componentTokens.header.page.paddingHorizontal}
                      onValueChange={(val) => updateHeaderToken("page", "paddingHorizontal", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>Section Header</Text>

                  <View style={styles.inputGroup}>
                    <View style={styles.sliderRow}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Margin Bottom</Text>
                      <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                        {componentTokens.header.section.marginBottom}px
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={48}
                      step={1}
                      value={componentTokens.header.section.marginBottom}
                      onValueChange={(val) => updateHeaderToken("section", "marginBottom", Math.round(val))}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                </View>
              </View>

              {/* Inputs Section */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Inputs</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Customize text input fields and search bars
                </Text>

                {/* Preview */}
                <View
                  style={{
                    backgroundColor: colors.overlay,
                    borderRadius: componentTokens.input.borderRadius,
                    paddingHorizontal: componentTokens.input.paddingHorizontal,
                    paddingVertical: componentTokens.input.paddingVertical,
                    marginBottom: tokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: componentTokens.input.fontSize, color: colors.textPrimary }}>
                    Input Preview
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Padding Horizontal</Text>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.input.paddingHorizontal}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={4}
                    maximumValue={32}
                    step={1}
                    value={componentTokens.input.paddingHorizontal}
                    onValueChange={(val) => updateInputToken("paddingHorizontal", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Border Radius</Text>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {componentTokens.input.borderRadius}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    value={componentTokens.input.borderRadius}
                    onValueChange={(val) => updateInputToken("borderRadius", Math.round(val))}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Typography
                </Text>
                {Object.entries(typography).map(([key, value]) => {
                  // Determine which font family key corresponds to this typography type
                  let fontFamilyKey: keyof typeof fontFamilies = "regular";
                  let previewFontFamily = fontFamilies.regular;

                  if (key === "title") {
                    fontFamilyKey = "display";
                    previewFontFamily = fontFamilies.display || fontFamilies.bold;
                  } else if (key === "heading") {
                    fontFamilyKey = "bold";
                    previewFontFamily = fontFamilies.bold;
                  } else if (key === "subheading") {
                    fontFamilyKey = "semiBold";
                    previewFontFamily = fontFamilies.semiBold;
                  } else if (key === "body") {
                    fontFamilyKey = "regular";
                    previewFontFamily = fontFamilies.regular;
                  } else if (key === "small") {
                    fontFamilyKey = "regular";
                    previewFontFamily = fontFamilies.regular;
                  } else if (key === "tiny") {
                    fontFamilyKey = "regular";
                    previewFontFamily = fontFamilies.regular;
                  }

                  return (
                    <View key={key} style={styles.inputGroup}>
                      {/* Typography Preview */}
                      <View
                        style={{
                          width: "100%",
                          padding: tokens.spacing.md,
                          backgroundColor: colors.overlay,
                          borderRadius: tokens.radii.sm,
                          marginBottom: tokens.spacing.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: value,
                            fontFamily: previewFontFamily,
                            color: colors.textPrimary,
                            marginBottom: tokens.spacing.xxs,
                          }}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)} Text Preview
                        </Text>
                        <Text
                          style={{
                            fontSize: tokens.typography.small,
                            fontFamily: tokens.fontFamilies.regular,
                            color: colors.textSecondary,
                          }}
                        >
                          Size: {value}px • Font: {previewFontFamily}
                        </Text>
                      </View>

                      {/* Font Selector for this typography type */}
                      <View style={{ marginBottom: tokens.spacing.md }}>
                        <Text style={[styles.label, { color: colors.textPrimary, marginBottom: tokens.spacing.xs }]}>
                          Font Family ({fontFamilyKey})
                        </Text>
                        <FontSelector
                          fonts={AVAILABLE_FONTS}
                          selectedFont={fontFamilies[fontFamilyKey]}
                          onSelectFont={(font) =>
                            updateFontFamily(fontFamilyKey, font)
                          }
                          colors={colors}
                          tokens={tokens}
                        />
                      </View>

                      {/* Size Slider */}
                      <View style={styles.sliderRow}>
                        <Text style={[styles.label, { color: colors.textPrimary }]}>Size</Text>
                        <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                          {value}px
                        </Text>
                      </View>
                      <Slider
                        style={styles.slider}
                        minimumValue={8}
                        maximumValue={72}
                        step={1}
                        value={value}
                        onValueChange={(val) =>
                          updateTypography(key as keyof typeof typography, Math.round(val))
                        }
                        minimumTrackTintColor={colors.accent}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor={colors.accent}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Tab Bar Navigation Settings */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t("themeCreator.navigation.title")}
                </Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  {t("themeCreator.navigation.description")}
                </Text>

                {/* Preview */}
                <View
                  style={{
                    backgroundColor: tabBar.containerBackground,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.radii.md,
                    marginBottom: tokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: tabBar.list.backgroundColor,
                      borderRadius: tabBar.list.borderRadius,
                      borderWidth: tabBar.list.borderWidth,
                      borderColor: tabBar.list.borderColor,
                      paddingHorizontal: tabBar.list.paddingHorizontal,
                      paddingVertical: tabBar.list.paddingVertical,
                      flexDirection: "row",
                      justifyContent: "space-around",
                      alignItems: "center",
                      minHeight: 60,
                    }}
                  >
                    {(["home", "kitchen", "lists"] as const).map((tab) => {
                      const isActive = activeTab === tab;
                      const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
                      const iconName = tabBar.icon?.names[tab] || "circle";

                      return (
                        <Pressable
                          key={tab}
                          onPress={() => setActiveTab(tab)}
                          style={{
                            paddingHorizontal: tabBar.trigger.paddingHorizontal,
                            paddingVertical: tabBar.trigger.paddingVertical,
                            borderRadius: tabBar.trigger.borderRadius,
                            backgroundColor: isActive
                              ? tabBar.trigger.activeBackgroundColor
                              : tabBar.trigger.inactiveBackgroundColor,
                            minHeight: tabBar.trigger.minHeight,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: tabBar.label.marginLeftWithIcon,
                          }}
                        >
                          {tabBar.icon?.show && (
                            <Feather
                              name={iconName as any}
                              size={tabBar.icon.size}
                              color={
                                isActive
                                  ? tabBar.icon.activeColor
                                  : tabBar.icon.inactiveColor
                              }
                            />
                          )}
                          {tabBar.label.show && (
                            <Text
                              style={{
                                color: isActive
                                  ? tabBar.label.activeColor
                                  : tabBar.label.color,
                                fontSize: tokens.typography.small,
                                fontFamily: tokens.fontFamilies.regular,
                                letterSpacing: tabBar.label.letterSpacing,
                                textTransform: tabBar.label.uppercase ? "uppercase" : "none",
                              }}
                            >
                              {tabLabel}
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Show Icons Toggle */}
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>
                        {t("themeCreator.navigation.showIcons")}
                      </Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {t("themeCreator.navigation.showIconsDescription")}
                      </Text>
                    </View>
                    <Switch
                      value={tabBar.icon?.show || false}
                      onValueChange={(value: boolean) =>
                        setTabBar((prev) => ({
                          ...prev,
                          icon: prev.icon
                            ? { ...prev.icon, show: value }
                            : {
                                show: value,
                                family: "Feather",
                                size: tokens.iconSizes.md,
                                inactiveColor: colors.textSecondary,
                                activeColor: colors.accentOnPrimary,
                                names: {
                                  home: "home",
                                  kitchen: "shopping-cart",
                                  lists: "list",
                                  creator: "edit",
                                  vendor: "store",
                                },
                              },
                        }))
                      }
                      trackColor={{ false: colors.border, true: colors.accent }}
                      thumbColor={colors.surface}
                    />
                  </View>
                </View>

                {/* Icon Selection - Only show if icons are enabled */}
                {tabBar.icon?.show && (
                  <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {t("themeCreator.navigation.tabIcons")}
                  </Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {t("themeCreator.navigation.tabIconsDescription")}
                  </Text>
                    {(["home", "kitchen", "lists"] as const).map((tab) => (
                      <View key={tab} style={{ marginBottom: tokens.spacing.sm }}>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: tokens.typography.small,
                            fontFamily: tokens.fontFamilies.regular,
                            marginBottom: tokens.spacing.xs,
                            textTransform: "capitalize",
                          }}
                        >
                          {tab} Icon
                        </Text>
                        <FeatherIconPicker
                          value={tabBar.icon?.names[tab] || "circle"}
                          onChange={(iconName) =>
                            setTabBar((prev) => ({
                              ...prev,
                              icon: prev.icon
                                ? {
                                    ...prev.icon,
                                    names: {
                                      ...prev.icon.names,
                                      [tab]: iconName,
                                    },
                                  }
                                : {
                                    show: true,
                                    family: "Feather",
                                    size: tokens.iconSizes.md,
                                    inactiveColor: colors.textSecondary,
                                    activeColor: colors.accentOnPrimary,
                                    names: {
                                      home: tab === "home" ? iconName : "home",
                                      kitchen: tab === "kitchen" ? iconName : "shopping-cart",
                                      lists: tab === "lists" ? iconName : "list",
                                      creator: "edit",
                                      vendor: "store",
                                    },
                                  },
                            }))
                          }
                          colors={colors}
                          tokens={tokens}
                        />
                      </View>
                    ))}

                    <View style={styles.inputGroup}>
                      <View style={styles.sliderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.label, { color: colors.textPrimary }]}>
                            {t("themeCreator.navigation.iconSize")}
                          </Text>
                          <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {t("themeCreator.navigation.iconSizeDescription")}
                          </Text>
                        </View>
                        <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                          {(tabBar.icon?.size || tokens.iconSizes.md)}px
                        </Text>
                      </View>
                      <Slider
                        style={styles.slider}
                        minimumValue={12}
                        maximumValue={48}
                        step={1}
                        value={tabBar.icon?.size || tokens.iconSizes.md}
                        onValueChange={(val) =>
                          setTabBar((prev) => ({
                            ...prev,
                            icon: prev.icon
                              ? { ...prev.icon, size: Math.round(val), show: true }
                              : {
                                  show: true,
                                  family: "Feather",
                                  size: Math.round(val),
                                  inactiveColor: colors.textSecondary,
                                  activeColor: colors.accentOnPrimary,
                                  names: {
                                    home: "home",
                                    kitchen: "shopping-cart",
                                    lists: "list",
                                    creator: "edit",
                                    vendor: "store",
                                  },
                                },
                          }))
                        }
                        minimumTrackTintColor={colors.accent}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor={colors.accent}
                      />
                    </View>
                  </View>
                )}

                {/* Show Labels Toggle */}
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>
                        {t("themeCreator.navigation.showLabels")}
                      </Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {t("themeCreator.navigation.showLabelsDescription")}
                      </Text>
                    </View>
                    <Switch
                      value={tabBar.label.show}
                      onValueChange={(value: boolean) =>
                        setTabBar((prev) => ({
                          ...prev,
                          label: { ...prev.label, show: value },
                        }))
                      }
                      trackColor={{ false: colors.border, true: colors.accent }}
                      thumbColor={colors.surface}
                    />
                  </View>
                </View>

                {/* Uppercase Labels Toggle */}
                {tabBar.label.show && (
                  <View style={styles.inputGroup}>
                    <View style={styles.switchRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.textPrimary }]}>
                          {t("themeCreator.navigation.uppercaseLabels")}
                        </Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                          {t("themeCreator.navigation.uppercaseLabelsDescription")}
                        </Text>
                      </View>
                      <Switch
                        value={tabBar.label.uppercase}
                        onValueChange={(value: boolean) =>
                          setTabBar((prev) => ({
                            ...prev,
                            label: { ...prev.label, uppercase: value },
                          }))
                        }
                        trackColor={{ false: colors.border, true: colors.accent }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </View>
                )}

                {/* Shape Selection */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {t("themeCreator.navigation.buttonShape")}
                  </Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {t("themeCreator.navigation.buttonShapeDescription")}
                  </Text>
                  <View style={{ flexDirection: "row", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
                    <Pressable
                      onPress={() =>
                        setTabBar((prev) => ({
                          ...prev,
                          trigger: { ...prev.trigger, shape: "pill" },
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: tokens.spacing.sm,
                        borderRadius: tokens.radii.sm,
                        borderWidth: 2,
                        borderColor:
                          tabBar.trigger.shape === "pill" ? colors.accent : colors.border,
                        backgroundColor:
                          tabBar.trigger.shape === "pill" ? colors.overlay : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            tabBar.trigger.shape === "pill"
                              ? colors.accent
                              : colors.textSecondary,
                          fontFamily: tokens.fontFamilies.semiBold,
                        }}
                      >
                        {t("themeCreator.navigation.pillShape")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setTabBar((prev) => ({
                          ...prev,
                          trigger: { ...prev.trigger, shape: "square" },
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: tokens.spacing.sm,
                        borderRadius: tokens.radii.sm,
                        borderWidth: 2,
                        borderColor:
                          tabBar.trigger.shape === "square" ? colors.accent : colors.border,
                        backgroundColor:
                          tabBar.trigger.shape === "square" ? colors.overlay : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            tabBar.trigger.shape === "square"
                              ? colors.accent
                              : colors.textSecondary,
                          fontFamily: tokens.fontFamilies.semiBold,
                        }}
                      >
                        {t("themeCreator.navigation.boxShape")}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* List Border Radius */}
                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>List Border Radius</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Corner radius of the navigation bar container
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {tabBar.list.borderRadius}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    value={tabBar.list.borderRadius}
                    onValueChange={(val) =>
                      setTabBar((prev) => ({
                        ...prev,
                        list: { ...prev.list, borderRadius: Math.round(val) },
                      }))
                    }
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>

                {/* Trigger Border Radius */}
                <View style={styles.inputGroup}>
                  <View style={styles.sliderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Button Border Radius</Text>
                      <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Corner radius of individual navigation buttons
                      </Text>
                    </View>
                    <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {tabBar.trigger.borderRadius}px
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    value={tabBar.trigger.borderRadius}
                    onValueChange={(val) =>
                      setTabBar((prev) => ({
                        ...prev,
                        trigger: { ...prev.trigger, borderRadius: Math.round(val) },
                      }))
                    }
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.accent}
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
                <Text
                  style={{
                    fontSize: previewTokens.typography.title,
                    fontFamily: previewTokens.fontFamilies.bold,
                    color: previewTokens.colors.textPrimary,
                    marginBottom: previewTokens.spacing.sm,
                  }}
                >
                  Title Text
                </Text>
                <Text
                  style={{
                    fontSize: previewTokens.typography.heading,
                    fontFamily: previewTokens.fontFamilies.semiBold,
                    color: previewTokens.colors.textPrimary,
                    marginBottom: previewTokens.spacing.xs,
                  }}
                >
                  Heading Text
                </Text>
                <Text
                  style={{
                    fontSize: previewTokens.typography.body,
                    fontFamily: previewTokens.fontFamilies.regular,
                    color: previewTokens.colors.textSecondary,
                    marginBottom: previewTokens.spacing.md,
                  }}
                >
                  This is body text showing how your theme looks in practice. The colors, spacing,
                  and typography all work together.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: previewTokens.spacing.sm,
                    marginBottom: previewTokens.spacing.md,
                  }}
                >
                  <View
                    style={{
                      padding: previewTokens.padding.card,
                      backgroundColor: previewTokens.colors.accent,
                      borderRadius: previewTokens.radii.sm,
                    }}
                  >
                    <Text
                      style={{
                        color: previewTokens.colors.accentOnPrimary,
                        fontFamily: previewTokens.fontFamilies.semiBold,
                      }}
                    >
                      Accent Button
                    </Text>
                  </View>
                  <View
                    style={{
                      padding: previewTokens.padding.card,
                      backgroundColor: previewTokens.colors.overlay,
                      borderRadius: previewTokens.radii.sm,
                      borderWidth: 1,
                      borderColor: previewTokens.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: previewTokens.colors.textPrimary,
                        fontFamily: previewTokens.fontFamilies.regular,
                      }}
                    >
                      Secondary
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: previewTokens.spacing.xs }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: previewTokens.colors.success,
                      borderRadius: previewTokens.radii.md,
                    }}
                  />
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: previewTokens.colors.danger,
                      borderRadius: previewTokens.radii.md,
                    }}
                  />
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: previewTokens.colors.info,
                      borderRadius: previewTokens.radii.md,
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Persistent Tab Bar - Only show in preview mode */}
        {mode === "preview" && (
          <View
            style={{
              backgroundColor: tabBar.containerBackground,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderTopWidth: tokens.borderWidths.thin,
              borderTopColor: colors.border,
            }}
          >
          <View
            style={{
              backgroundColor: tabBar.list.backgroundColor,
              borderRadius: tabBar.list.borderRadius,
              borderWidth: tabBar.list.borderWidth,
              borderColor: tabBar.list.borderColor,
              paddingHorizontal: tabBar.list.paddingHorizontal,
              paddingVertical: tabBar.list.paddingVertical,
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              minHeight: 50,
            }}
          >
            {(["home", "kitchen", "lists"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
              const iconName = tabBar.icon?.names[tab] || "circle";

              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    paddingHorizontal: tabBar.trigger.paddingHorizontal,
                    paddingVertical: tabBar.trigger.paddingVertical,
                    borderRadius: tabBar.trigger.borderRadius,
                    backgroundColor: isActive
                      ? tabBar.trigger.activeBackgroundColor
                      : tabBar.trigger.inactiveBackgroundColor,
                    minHeight: tabBar.trigger.minHeight,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: tabBar.label.marginLeftWithIcon,
                  }}
                >
                  {tabBar.icon?.show && (
                    <Feather
                      name={iconName as any}
                      size={tabBar.icon.size}
                      color={
                        isActive
                          ? tabBar.icon.activeColor
                          : tabBar.icon.inactiveColor
                      }
                    />
                  )}
                  {tabBar.label.show && (
                    <Text
                      style={{
                        color: isActive
                          ? tabBar.label.activeColor
                          : tabBar.label.color,
                        fontSize: tokens.typography.small,
                        fontFamily: tokens.fontFamilies.regular,
                        letterSpacing: tabBar.label.letterSpacing,
                        textTransform: tabBar.label.uppercase ? "uppercase" : "none",
                      }}
                    >
                      {tabLabel}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
        )}

        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={[styles.saveButtonText, { color: colors.accentOnPrimary }]}>
              {isSaving ? "Saving..." : "Save Theme"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: tokens.spacing.md,
      paddingHorizontal: tokens.padding.screen,
      paddingBottom: tokens.spacing.sm,
      borderBottomWidth: tokens.borderWidths.thin,
      borderBottomColor: tokens.colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: tokens.spacing.sm,
    },
    headerTitle: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
    },
    closeButton: {
      padding: tokens.spacing.xs,
    },
    modeToggle: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
    },
    modeButton: {
      flex: 1,
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
      alignItems: "center",
    },
    modeButtonText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.padding.screen,
      paddingBottom: tokens.padding.screen + 80, // Extra padding to prevent save button from covering content
      gap: tokens.spacing.sm,
    },
    section: {
      padding: tokens.padding.card,
      borderRadius: tokens.radii.md,
      gap: tokens.spacing.sm,
    },
    sectionTitle: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.bold,
      marginBottom: tokens.spacing.xs,
    },
    sectionDescription: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      marginBottom: tokens.spacing.md,
      lineHeight: tokens.typography.small * 1.5,
    },
    colorSubsection: {
      marginBottom: tokens.spacing.lg,
      paddingTop: tokens.spacing.md,
      borderTopWidth: tokens.borderWidths.thin,
      borderTopColor: tokens.colors.border,
    },
    subsectionTitle: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      marginBottom: tokens.spacing.sm,
    },
    description: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      marginTop: tokens.spacing.xxs,
      color: tokens.colors.textSecondary,
    },
    inputGroup: {
      gap: tokens.spacing.xxs,
      marginBottom: tokens.spacing.md,
    },
    label: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
    },
    input: {
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
    },
    colorInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.sm,
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
    },
    colorInput: {
      flex: 1,
    },
    sliderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: tokens.spacing.xs,
    },
    slider: {
      width: "100%",
      height: 40,
    },
    valueLabel: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      minWidth: 40,
      textAlign: "right",
    },
    fontPickerContainer: {
      marginTop: tokens.spacing.xs,
    },
    fontScrollContent: {
      gap: tokens.spacing.xs,
    },
    fontOption: {
      paddingVertical: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      borderWidth: tokens.borderWidths.regular,
    },
    fontOptionText: {
      fontSize: tokens.typography.small,
    },
    previewContainer: {
      flex: 1,
      padding: tokens.padding.section,
    },
    previewCard: {
      padding: tokens.padding.section,
      borderRadius: tokens.radii.md,
    },
    footer: {
      padding: tokens.padding.screen,
      borderTopWidth: tokens.borderWidths.thin,
      borderTopColor: tokens.colors.border,
    },
    saveButton: {
      paddingVertical: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      alignItems: "center",
    },
    saveButtonText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.bold,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: tokens.spacing.md,
    },
  });
