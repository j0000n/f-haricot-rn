import type { ThemeTokens } from "@/styles/tokens";
// @ts-ignore - Slider types have JSX component issues but works at runtime
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";

type CompactColorPickerProps = {
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

export function CompactColorPicker({ value, onChange, colors, tokens }: CompactColorPickerProps) {
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
            width: 32,
            height: 32,
            borderRadius: 6,
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
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                width: "85%",
                maxWidth: 380,
              }}
              onStartShouldSetResponder={() => true}
            >
              <Text style={{ color: colors.textPrimary, marginBottom: 12, fontSize: 16, fontFamily: tokens.fontFamilies.bold }}>
                Color Picker
              </Text>

              {/* Compact Color Preview */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    backgroundColor: hexValue,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Hex</Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.overlay,
                      color: colors.textPrimary,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 6,
                      padding: 8,
                      fontSize: 14,
                      fontFamily: tokens.fontFamilies.regular,
                    }}
                    value={hexValue}
                    onChangeText={updateFromHex}
                    placeholder="#000000"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* HSB Color Selection Area */}
              <View style={{ marginBottom: 16 }}>
                {/* Color Preview Square */}
                <View
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 8,
                    backgroundColor: hexValue,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 12,
                  }}
                />

                {/* Hue Slider */}
                <View style={{ marginBottom: 12 }}>
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

                {/* Saturation Slider */}
                <View style={{ marginBottom: 12 }}>
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

                {/* Brightness Slider */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Brightness</Text>
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

              {/* RGB Inputs */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 12, fontFamily: tokens.fontFamilies.semiBold }}>
                  RGB
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>R</Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.overlay,
                        color: colors.textPrimary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        padding: 8,
                        fontSize: 12,
                        fontFamily: tokens.fontFamilies.regular,
                      }}
                      value={rgbValues.r.toString()}
                      onChangeText={(text: string) => {
                        const val = parseInt(text) || 0;
                        if (val >= 0 && val <= 255) {
                          updateFromRgb(val, rgbValues.g, rgbValues.b);
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>G</Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.overlay,
                        color: colors.textPrimary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        padding: 8,
                        fontSize: 12,
                        fontFamily: tokens.fontFamilies.regular,
                      }}
                      value={rgbValues.g.toString()}
                      onChangeText={(text: string) => {
                        const val = parseInt(text) || 0;
                        if (val >= 0 && val <= 255) {
                          updateFromRgb(rgbValues.r, val, rgbValues.b);
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>B</Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.overlay,
                        color: colors.textPrimary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        padding: 8,
                        fontSize: 12,
                        fontFamily: tokens.fontFamilies.regular,
                      }}
                      value={rgbValues.b.toString()}
                      onChangeText={(text: string) => {
                        const val = parseInt(text) || 0;
                        if (val >= 0 && val <= 255) {
                          updateFromRgb(rgbValues.r, rgbValues.g, val);
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Presets */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 12, fontFamily: tokens.fontFamilies.semiBold }}>
                  Presets
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {COLOR_PRESETS.map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => updateFromHex(preset)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        backgroundColor: preset,
                        borderWidth: hexValue === preset ? 2 : 1,
                        borderColor: hexValue === preset ? colors.accent : colors.border,
                      }}
                    />
                  ))}
                </View>
              </View>

              <Pressable
                onPress={() => setShowPicker(false)}
                style={{
                  backgroundColor: colors.accent,
                  padding: 10,
                  borderRadius: 6,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.accentOnPrimary, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
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
