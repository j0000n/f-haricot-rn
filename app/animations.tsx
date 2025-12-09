import { useMemo, useRef, useState, useEffect } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/tokens";

type LayoutExampleItem = {
  id: string;
  label: string;
  height: number;
};

const DEFAULT_ITEMS: LayoutExampleItem[] = [
  { id: "io-bound", label: "I/O bound render", height: 56 },
  { id: "cpu-bound", label: "CPU bound render", height: 48 },
  { id: "gpu-bound", label: "GPU bound render", height: 64 },
];

export default function AnimationPlayground() {
  const tokens = useTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const timingValue = useRef(new Animated.Value(0)).current;
  const springValue = useRef(new Animated.Value(0)).current;

  const [layoutItems, setLayoutItems] = useState<LayoutExampleItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const runTimingSequence = () => {
    timingValue.setValue(0);

    Animated.sequence([
      Animated.timing(timingValue, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(timingValue, {
        toValue: 0,
        duration: 650,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const runSpring = () => {
    springValue.setValue(0);

    Animated.spring(springValue, {
      toValue: 1,
      velocity: 0.6,
      tension: 140,
      friction: 10,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        springValue.setValue(0.9);
      }
    });
  };

  const insertItem = () => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "easeInEaseOut", property: "scaleXY" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });

    setLayoutItems((items) => [
      {
        id: `adaptive-${items.length + 1}`,
        label: `Adaptive card ${items.length + 1}`,
        height: 44 + ((items.length + 1) % 3) * 6,
      },
      ...items,
    ]);
  };

  const toggleOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLayoutItems((items) => [...items].reverse());
  };

  const removeLast = () => {
    if (layoutItems.length === 0) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setLayoutItems((items) => items.slice(0, -1));
  };

  const timingTranslate = timingValue.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const timingOpacity = timingValue.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const springScale = springValue.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.08] });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Built-in animation APIs</Text>
      <Text style={styles.lead}>Developer preview with verbose, technical notes.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Animated (core API)</Text>
        <Text style={styles.sectionBody}>
          {"Animated.Value drives imperative timelines in JS with optional native driver offload. " +
            "Timing interpolations happen on the JS event loop, while useNativeDriver=true skips layout " +
            "properties and pushes transform/opacity updates to the native compositor."}
        </Text>
        <Text style={styles.sectionBody}>
          {"Below: a cubic timing sequence followed by a spring. The timing block animates opacity and translateY " +
            "using interpolation; the spring uses a high-tension, moderate-friction configuration to illustrate " +
            "frame-to-frame velocity dampening."}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timing interpolation demo</Text>
          <Text style={styles.cardBody}>
            {"Animated.sequence(timing → timing) keeps the value in JS, but useNativeDriver=true pushes the transform " +
              "and opacity nodes to the native layer. Interpolation maps 0→1 into physical units (px, opacity)."}
          </Text>
          <View style={styles.previewRow}>
            <View style={styles.previewLabelColumn}>
              <Text style={styles.previewLabel}>Transforms</Text>
              <Text style={styles.previewDetail}>opacity + translateY</Text>
              <Text style={styles.previewDetail}>duration: 650ms each</Text>
              <Text style={styles.previewDetail}>easing: Easing.out/in cubic</Text>
            </View>
            <Animated.View
              style={[
                styles.animatedBox,
                {
                  opacity: timingOpacity,
                  transform: [
                    {
                      translateY: timingTranslate,
                    },
                    {
                      scale: 1,
                    },
                  ],
                },
              ]}
            />
          </View>
          <Pressable onPress={runTimingSequence} style={styles.actionButton} accessibilityRole="button">
            <Text style={styles.actionButtonText}>Run timing sequence</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spring demo</Text>
          <Text style={styles.cardBody}>
            {"Animated.spring uses a damped harmonic oscillator with tension/friction. Velocity biases the initial " +
              "movement; here we explicitly set it to simulate a throw. Native driver keeps compositing off the JS thread."}
          </Text>
          <View style={styles.previewRow}>
            <View style={styles.previewLabelColumn}>
              <Text style={styles.previewLabel}>Transforms</Text>
              <Text style={styles.previewDetail}>scale</Text>
              <Text style={styles.previewDetail}>tension: 140</Text>
              <Text style={styles.previewDetail}>friction: 10</Text>
              <Text style={styles.previewDetail}>velocity: 0.6</Text>
            </View>
            <Animated.View
              style={[
                styles.animatedCircle,
                {
                  transform: [
                    {
                      scale: springScale,
                    },
                  ],
                },
              ]}
            />
          </View>
          <Pressable onPress={runSpring} style={styles.actionButton} accessibilityRole="button">
            <Text style={styles.actionButtonText}>Trigger spring</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LayoutAnimation</Text>
        <Text style={styles.sectionBody}>
          {"LayoutAnimation wraps layout mutations (insert/remove/re-order) in a process-wide transaction. " +
            "It measures before/after layout on the native side and interpolates intermediate positions without " +
            "per-element Animated.Values. ConfigureNext applies to the next layout pass only."}
        </Text>
        <Text style={styles.sectionBody}>
          {"Android requires UIManager.setLayoutAnimationEnabledExperimental(true); we enable it on mount. " +
            "The controls below exercise create/update/delete phases with different presets."}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>List mutate demo</Text>
          <Text style={styles.cardBody}>
            {"Tap the controls to insert, reverse, or remove items. LayoutAnimation computes start/end rects " +
              "and animates frame deltas using native interpolation, avoiding JS-bound per-frame work."}
          </Text>
          <View style={styles.layoutControls}>
            <Pressable onPress={insertItem} style={styles.layoutButton} accessibilityRole="button">
              <Text style={styles.layoutButtonText}>Insert</Text>
            </Pressable>
            <Pressable onPress={toggleOrder} style={styles.layoutButton} accessibilityRole="button">
              <Text style={styles.layoutButtonText}>Reverse</Text>
            </Pressable>
            <Pressable onPress={removeLast} style={styles.layoutButton} accessibilityRole="button">
              <Text style={styles.layoutButtonText}>Pop</Text>
            </Pressable>
          </View>
          <View style={styles.listContainer}>
            {layoutItems.map((item) => (
              <View key={item.id} style={[styles.listItem, { height: item.height }]}>
                <Text style={styles.listLabel}>{item.label}</Text>
                <Text style={styles.listMeta}>{`${item.height}px height · key=${item.id}`}</Text>
              </View>
            ))}
            {layoutItems.length === 0 ? (
              <Text style={styles.emptyState}>List is empty; insert to trigger create animation.</Text>
            ) : null}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    content: {
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.lg,
      paddingBottom: tokens.spacing.xl,
      gap: tokens.spacing.lg,
    },
    pageTitle: {
      fontSize: tokens.typography.display,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
    },
    lead: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      marginTop: tokens.spacing.xs,
    },
    section: {
      gap: tokens.spacing.sm,
    },
    sectionTitle: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    sectionBody: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.snug,
    },
    card: {
      backgroundColor: tokens.colors.surface,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.lg,
      gap: tokens.spacing.md,
      shadowColor: tokens.shadows.card.shadowColor,
      shadowOffset: tokens.shadows.card.shadowOffset,
      shadowOpacity: tokens.shadows.card.shadowOpacity,
      shadowRadius: tokens.shadows.card.shadowRadius,
      elevation: tokens.shadows.card.elevation,
    },
    cardTitle: {
      fontSize: tokens.typography.title,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    cardBody: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
      lineHeight: tokens.typography.body * tokens.lineHeights.snug,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacing.md,
    },
    previewLabelColumn: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    previewLabel: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    previewDetail: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    animatedBox: {
      width: 96,
      height: 96,
      borderRadius: tokens.radii.md,
      backgroundColor: tokens.colors.primary,
      shadowColor: tokens.shadows.card.shadowColor,
      shadowOffset: tokens.shadows.card.shadowOffset,
      shadowOpacity: tokens.shadows.card.shadowOpacity,
      shadowRadius: tokens.shadows.card.shadowRadius,
      elevation: tokens.shadows.card.elevation,
    },
    animatedCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: tokens.colors.accent,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: tokens.shadows.card.shadowColor,
      shadowOffset: tokens.shadows.card.shadowOffset,
      shadowOpacity: tokens.shadows.card.shadowOpacity,
      shadowRadius: tokens.shadows.card.shadowRadius,
      elevation: tokens.shadows.card.elevation,
    },
    actionButton: {
      alignSelf: "flex-start",
      backgroundColor: tokens.colors.primary,
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.radii.md,
    },
    actionButtonText: {
      color: tokens.colors.onPrimary,
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.body,
    },
    layoutControls: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
    },
    layoutButton: {
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.muted,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
    },
    layoutButtonText: {
      color: tokens.colors.textPrimary,
      fontFamily: tokens.fontFamilies.semiBold,
      fontSize: tokens.typography.small,
    },
    listContainer: {
      marginTop: tokens.spacing.md,
      gap: tokens.spacing.sm,
    },
    listItem: {
      backgroundColor: tokens.colors.surfaceSubdued,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.md,
      borderWidth: tokens.borderWidths.hairline,
      borderColor: tokens.colors.border,
      justifyContent: "center",
    },
    listLabel: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textPrimary,
    },
    listMeta: {
      marginTop: tokens.spacing.xs,
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
    emptyState: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textSecondary,
    },
  });

