import { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
// @ts-ignore - Slider types have JSX component issues but works at runtime
import Slider from "@react-native-community/slider";
import type { ThemeTokens } from "@/styles/tokens";

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  colors: {
    textPrimary: string;
    textSecondary: string;
    border: string;
    overlay: string;
    accent: string;
    accentOnPrimary: string;
    textMuted: string;
    surface: string;
  };
  tokens: ThemeTokens;
};

// Helper functions for color conversion
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("")}`;
};

const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((diff / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
};

const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
};

const COLOR_PRESETS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#008000", "#000080",
];

export function RobustColorPicker({ value, onChange, colors, tokens }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hexValue, setHexValue] = useState(value);
  const rgb = hexToRgb(hexValue);
  const [rgbValues, setRgbValues] = useState(rgb);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const [hsvValues, setHsvValues] = useState(hsv);

  useEffect(() => {
    setHexValue(value);
    const newRgb = hexToRgb(value);
    setRgbValues(newRgb);
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    setHsvValues(newHsv);
  }, [value]);

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgbValues({ r, g, b });
    const hex = rgbToHex(r, g, b);
    setHexValue(hex);
    const newHsv = rgbToHsv(r, g, b);
    setHsvValues(newHsv);
    onChange(hex);
  };

  const updateFromHsv = (h: number, s: number, v: number) => {
    setHsvValues({ h, s, v });
    const newRgb = hsvToRgb(h, s, v);
    setRgbValues(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexValue(hex);
    onChange(hex);
  };

  const updateFromHex = (hex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setHexValue(hex);
      const newRgb = hexToRgb(hex);
      setRgbValues(newRgb);
      const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setHsvValues(newHsv);
      onChange(hex);
    } else {
      setHexValue(hex);
    }
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
            backgroundColor: hexValue,
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
            <ScrollView
              style={{
                backgroundColor: colors.surface,
                padding: 20,
                borderRadius: 12,
                width: "90%",
                maxWidth: 400,
                maxHeight: "80%",
              }}
              onStartShouldSetResponder={() => true}
            >
              <Text style={{ color: colors.textPrimary, marginBottom: 16, fontSize: 18, fontFamily: tokens.fontFamilies.bold }}>
                Color Picker
              </Text>

              {/* Color Preview */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    backgroundColor: hexValue,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                />
                <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 14 }}>
                  {hexValue}
                </Text>
              </View>

              {/* Presets */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
                  Presets
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {COLOR_PRESETS.map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => updateFromHex(preset)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        backgroundColor: preset,
                        borderWidth: hexValue === preset ? 3 : 1,
                        borderColor: hexValue === preset ? colors.accent : colors.border,
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* RGB Sliders */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 12, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
                  RGB
                </Text>
                <View style={{ gap: 12 }}>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Red</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{rgbValues.r}</Text>
                    </View>
                    {/* @ts-ignore - Slider component types have issues but works at runtime */}
                    <Slider
                      value={rgbValues.r}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      onValueChange={(val: number) => updateFromRgb(val, rgbValues.g, rgbValues.b)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Green</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{rgbValues.g}</Text>
                    </View>
                    {/* @ts-ignore - Slider component types have issues but works at runtime */}
                    <Slider
                      value={rgbValues.g}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      onValueChange={(val: number) => updateFromRgb(rgbValues.r, val, rgbValues.b)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Blue</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{rgbValues.b}</Text>
                    </View>
                    {/* @ts-ignore - Slider component types have issues but works at runtime */}
                    <Slider
                      value={rgbValues.b}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      onValueChange={(val: number) => updateFromRgb(rgbValues.r, rgbValues.g, val)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                </View>
              </View>

              {/* HSV Sliders */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 12, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
                  HSV
                </Text>
                <View style={{ gap: 12 }}>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Hue</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{hsvValues.h}°</Text>
                    </View>
                    {/* @ts-ignore - Slider component types have issues but works at runtime */}
                    <Slider
                      value={hsvValues.h}
                      minimumValue={0}
                      maximumValue={360}
                      step={1}
                      onValueChange={(val: number) => updateFromHsv(val, hsvValues.s, hsvValues.v)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Saturation</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{hsvValues.s}%</Text>
                    </View>
                    {/* @ts-ignore - Slider component types have issues but works at runtime */}
                    <Slider
                      value={hsvValues.s}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      onValueChange={(val: number) => updateFromHsv(hsvValues.h, val, hsvValues.v)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Value</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{hsvValues.v}%</Text>
                    </View>
                    {/* @ts-ignore - Slider component types have issues but works at runtime */}
                    <Slider
                      value={hsvValues.v}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      onValueChange={(val: number) => updateFromHsv(hsvValues.h, hsvValues.s, val)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.accent}
                    />
                  </View>
                </View>
              </View>

              {/* Hex Input */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
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
                    fontFamily: tokens.fontFamilies.regular,
                  }}
                  value={hexValue}
                  onChangeText={updateFromHex}
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
                <Text style={{ color: colors.accentOnPrimary, fontSize: 16, fontFamily: tokens.fontFamilies.semiBold }}>
                  Done
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Modal>
      )}
    </>
  );
}



