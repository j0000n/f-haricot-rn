import type { ThemeTokens } from "@/styles/tokens";
import { useEffect, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type WebsiteStyleColorPickerProps = {
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
    background?: string;
    success?: string;
    danger?: string;
    info?: string;
    logoFill?: string;
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

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
};

const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
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

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const SQUARE_SIZE = 240;
const HUE_HEIGHT = 240;
const HUE_WIDTH = 32;

export function WebsiteStyleColorPicker({ value, onChange, colors, tokens }: WebsiteStyleColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hexValue, setHexValue] = useState(value);
  const squareRef = useRef<View>(null);
  const hueRef = useRef<View>(null);
  // These state variables are set but not currently read - kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDraggingSquare, setIsDraggingSquare] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  const rgb = hexToRgb(hexValue);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  useEffect(() => {
    setHexValue(value);
  }, [value]);

  const updateColor = (h: number, s: number, v: number) => {
    const newRgb = hsvToRgb(h, s, v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexValue(newHex);
    onChange(newHex);
  };

  const handleSquarePress = (evt: any) => {
    if (!squareRef.current) return;
    squareRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      const touchX = evt.nativeEvent.pageX - pageX;
      const touchY = evt.nativeEvent.pageY - pageY;
      const s = Math.max(0, Math.min(1, touchX / width));
      const v = Math.max(0, Math.min(1, 1 - touchY / height));
      updateColor(hsv.h, s, v);
    });
  };

  const handleHuePress = (evt: any) => {
    if (!hueRef.current) return;
    hueRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      const touchY = evt.nativeEvent.pageY - pageY;
      const h = Math.max(0, Math.min(360, (touchY / height) * 360));
      updateColor(h, hsv.s, hsv.v);
    });
  };

  const squarePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: any) => {
      setIsDraggingSquare(true);
      handleSquarePress(evt);
    },
    onPanResponderMove: handleSquarePress,
    onPanResponderRelease: () => {
      setIsDraggingSquare(false);
    },
  });

  const huePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: any) => {
      setIsDraggingHue(true);
      handleHuePress(evt);
    },
    onPanResponderMove: handleHuePress,
    onPanResponderRelease: () => {
      setIsDraggingHue(false);
    },
  });

  const handleHexChange = (newHex: string) => {
    setHexValue(newHex);
    if (/^#[0-9A-Fa-f]{6}$/i.test(newHex)) {
      onChange(newHex);
    }
  };

  // Generate hue gradient stops
  const hueStops = [
    { offset: "0%", color: "#ff0000" },
    { offset: "17%", color: "#ffff00" },
    { offset: "33%", color: "#00ff00" },
    { offset: "50%", color: "#00ffff" },
    { offset: "67%", color: "#0000ff" },
    { offset: "83%", color: "#ff00ff" },
    { offset: "100%", color: "#ff0000" },
  ];

  // Current hue color for saturation/brightness square
  const currentHueColor = hsvToRgb(hsv.h, 1, 1);
  const currentHueHex = rgbToHex(currentHueColor.r, currentHueColor.g, currentHueColor.b);

  const selectorX = hsv.s * SQUARE_SIZE;
  const selectorY = (1 - hsv.v) * SQUARE_SIZE;
  const hueSelectorY = (hsv.h / 360) * HUE_HEIGHT;

  // Generate presets from theme colors, removing duplicates and undefined values
  const themePresets = [
    colors.background,
    colors.surface,
    colors.overlay,
    colors.textPrimary,
    colors.textSecondary,
    colors.textMuted,
    colors.border,
    colors.accent,
    colors.accentOnPrimary,
    colors.success,
    colors.danger,
    colors.info,
    colors.logoFill,
  ]
    .filter((color): color is string => Boolean(color))
    .filter((color, index, self) => self.indexOf(color) === index);

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
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 20,
                borderRadius: 12,
                width: "90%",
                maxWidth: 400,
              }}
              onStartShouldSetResponder={() => true}
            >
              <Text style={{ color: colors.textPrimary, marginBottom: 12, fontSize: 16, fontFamily: tokens.fontFamilies.bold }}>
                Select Color
              </Text>

              {/* Color Square and Hue Slider */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                {/* Saturation/Brightness Square */}
                <View
                  ref={squareRef}
                  {...squarePanResponder.panHandlers}
                  style={{
                    width: SQUARE_SIZE,
                    height: SQUARE_SIZE,
                    borderRadius: 8,
                    position: "relative",
                  }}
                >
                  <Svg width={SQUARE_SIZE} height={SQUARE_SIZE}>
                    <Defs>
                      <LinearGradient id="sbGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={currentHueHex} stopOpacity="1" />
                        <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
                      </LinearGradient>
                      <LinearGradient id="sbGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    <Rect width={SQUARE_SIZE} height={SQUARE_SIZE} fill="url(#sbGradient)" />
                    <Rect width={SQUARE_SIZE} height={SQUARE_SIZE} fill="url(#sbGradient2)" />
                  </Svg>
                  {/* Selector indicator */}
                  <View
                    style={{
                      position: "absolute",
                      left: selectorX - 8,
                      top: selectorY - 8,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.textPrimary,
                      backgroundColor: "transparent",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: selectorX - 9,
                      top: selectorY - 9,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1,
                      borderColor: colors.surface,
                    }}
                  />
                </View>

                {/* Hue Slider */}
                <View
                  ref={hueRef}
                  {...huePanResponder.panHandlers}
                  style={{
                    width: HUE_WIDTH,
                    height: HUE_HEIGHT,
                    borderRadius: 8,
                    position: "relative",
                  }}
                >
                  <Svg width={HUE_WIDTH} height={HUE_HEIGHT}>
                    <Defs>
                      <LinearGradient id="hueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        {hueStops.map((stop, idx) => (
                          <Stop key={idx} offset={stop.offset} stopColor={stop.color} />
                        ))}
                      </LinearGradient>
                    </Defs>
                    <Rect width={HUE_WIDTH} height={HUE_HEIGHT} fill="url(#hueGradient)" />
                  </Svg>
                  {/* Hue selector indicator */}
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      top: hueSelectorY - 4,
                      width: HUE_WIDTH,
                      height: 8,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: colors.surface,
                      backgroundColor: "transparent",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: -1,
                      top: hueSelectorY - 5,
                      width: HUE_WIDTH + 2,
                      height: 10,
                      borderRadius: 5,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>
              </View>

              {/* Hex Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 14 }}>
                  Hex Code
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.border,
                      backgroundColor: hexValue,
                    }}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: colors.overlay,
                      color: colors.textPrimary,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      fontFamily: "monospace",
                    }}
                    value={hexValue}
                    onChangeText={handleHexChange}
                    placeholder="#000000"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Presets */}
              {themePresets.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 12, fontFamily: tokens.fontFamilies.semiBold }}>
                    Theme Colors
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {themePresets.map((preset, index) => (
                      <Pressable
                        key={`${preset}-${index}`}
                        onPress={() => handleHexChange(preset)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: preset,
                          borderWidth: hexValue.toLowerCase() === preset.toLowerCase() ? 3 : 1,
                          borderColor: hexValue.toLowerCase() === preset.toLowerCase() ? colors.accent : colors.border,
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}

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
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
