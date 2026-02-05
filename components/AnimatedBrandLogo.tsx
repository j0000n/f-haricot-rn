import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleProp, View, ViewStyle } from "react-native";
import Svg, { G, Path, Rect } from "react-native-svg";

type AnimatedBrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  baseColor?: string; // Base color to generate 3 tones from
};

// SVG viewBox from Logo.tsx - square format
const SVG_VIEWBOX = "0 0 100 100";

// SVG paths from Logo.tsx
// cls-2 (secondaryColor) - two rectangles
const RECT_1 = { x: 0, y: 0, width: 33.33, height: 100, rx: 8.12, ry: 8.12 };
const RECT_2 = { x: 66.66, y: 0, width: 33.33, height: 100, rx: 8.12, ry: 8.12 };

// cls-1 (primaryColor) - main path
const PRIMARY_PATH = "M66.67,16.67h0c0,9.2-7.46,16.67-16.67,16.67h0c-9.2,0-16.67-7.46-16.67-16.67h0C33.33,7.46,25.87,0,16.67,0h0C7.46,0,0,7.46,0,16.67v16.67s0,33.33,0,33.33v16.67c0,9.2,7.46,16.67,16.67,16.67h0c9.2,0,16.67-7.46,16.67-16.67h0c0-9.2,7.46-16.67,16.67-16.67h0c9.2,0,16.67,7.46,16.67,16.67h0c0,9.2,7.46,16.67,16.67,16.67h0c9.2,0,16.67-7.46,16.67-16.67v-16.67s0-33.33,0-33.33v-16.67C100,7.46,92.54,0,83.33,0h0c-9.2,0-16.67,7.46-16.67,16.67Z";

// cls-2 (secondaryColor) - outline path
const SECONDARY_PATH = "M83.33,0c-9.2,0-16.67,7.46-16.67,16.66v16.67h-33.33v-16.67C33.33,7.46,25.87,0,16.67,0S0,7.46,0,16.66v66.67c0,9.2,7.46,16.66,16.67,16.66s16.66-7.46,16.66-16.66v-16.67h33.33v16.67c0,9.2,7.46,16.66,16.67,16.66s16.66-7.46,16.66-16.66V16.66c0-9.2-7.46-16.66-16.66-16.66ZM94.99,83.34c0,6.44-5.22,11.66-11.66,11.66s-11.67-5.22-11.67-11.66v-21.67H28.33v21.67c0,6.44-5.22,11.66-11.66,11.66s-11.67-5.22-11.67-11.66V16.66c0-6.44,5.22-11.66,11.67-11.66s11.66,5.22,11.66,11.66v21.67h43.33v-21.67c0-6.44,5.22-11.66,11.67-11.66s11.66,5.22,11.66,11.66v66.67Z";

// cls-3 (tertiaryColor) - detail paths and rects
const TERTIARY_PATHS = [
  "M5,50s0,.07,0,.1v-.2s0,.07,0,.1Z",
  "M5.01,38.1v-21.44c0-6.44,5.22-11.66,11.67-11.66s11.66,5.22,11.66,11.66v16.67h5v-16.67C33.34,7.46,25.87,0,16.67,0S0,7.46,0,16.66v33.24c.03-4.62,1.94-8.79,5-11.8Z",
  "M28.34,83.34c0,6.44-5.22,11.66-11.66,11.66s-11.67-5.22-11.67-11.66v-21.44C1.94,58.89.03,54.72,0,50.1v33.24c0,9.2,7.46,16.66,16.67,16.66s16.66-7.46,16.66-16.66v-16.67h-5v16.67Z",
  "M95,49.9v-11.8c-3.01-2.95-7.12-4.77-11.66-4.77h-11.67v5h11.67c6.41,0,11.61,5.17,11.66,11.57Z",
  "M16.66,38.33h11.67v-5h-11.67c-4.54,0-8.65,1.82-11.66,4.77v11.8c.05-6.4,5.25-11.57,11.66-11.57Z",
  "M5.01,50.1v11.8c3.01,2.95,7.12,4.77,11.66,4.77h11.67v-5h-11.67c-6.41,0-11.61-5.17-11.66-11.57Z",
  "M0,50s0,.07,0,.1v-.2s0,.07,0,.1Z",
  "M100,50s0-.06,0-.1v.2s0-.06,0-.1Z",
  "M83.34,61.66h-11.67v5h11.67c4.54,0,8.65-1.82,11.66-4.77v-11.8c-.05,6.4-5.25,11.57-11.66,11.57Z",
  "M71.67,16.66c0-6.44,5.22-11.66,11.67-11.66s11.66,5.22,11.66,11.66v21.44c3.06,3,4.97,7.18,5,11.8V16.66c0-9.2-7.46-16.66-16.66-16.66s-16.67,7.46-16.67,16.66v16.67h5v-16.67Z",
  "M95,61.9v21.44c0,6.44-5.22,11.66-11.66,11.66s-11.67-5.22-11.67-11.66v-16.67h-5v16.67c0,9.2,7.46,16.66,16.67,16.66s16.66-7.46,16.66-16.66v-33.24c-.03,4.62-1.94,8.8-5,11.8Z",
  "M95,50s0-.06,0-.1v.2s0-.06,0-.1Z",
];

const TERTIARY_RECTS = [
  { x: 28.34, y: 38.33, width: 5, height: 23.33 },
  { x: 33.34, y: 61.66, width: 33.33, height: 5 },
  { x: 33.34, y: 33.33, width: 33.33, height: 5 },
  { x: 66.67, y: 38.33, width: 5, height: 23.33 },
];

// Helper function to convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

// Helper function to convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate 3 tones from a base color
function generateThreeTones(baseColor: string): [string, string, string] {
  const [h, s, l] = hexToHsl(baseColor);

  // Light tone: increase lightness by 30%
  const lightL = Math.min(100, l + 30);
  const lightColor = hslToHex(h, s, lightL);

  // Medium tone: base color
  const mediumColor = baseColor;

  // Dark tone: decrease lightness by 30%
  const darkL = Math.max(0, l - 30);
  const darkColor = hslToHex(h, s, darkL);

  return [lightColor, mediumColor, darkColor];
}

// Helper function to interpolate between two hex colors
function interpolateHexColor(color1: string, color2: string, ratio: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function AnimatedBrandLogo({
  size = 64,
  style,
  accessibilityLabel = "Haricot animated logo",
  baseColor = "#4a1f1f", // Default dark burgundy
}: AnimatedBrandLogoProps) {
  // Generate 3 tones from base color
  const [lightTone, mediumTone, darkTone] = generateThreeTones(baseColor);

  // Create color arrays for smooth animation (cycling through tones)
  const color1Tones = [lightTone, mediumTone, darkTone, lightTone];
  const color2Tones = [mediumTone, darkTone, lightTone, mediumTone];
  const color3Tones = [darkTone, lightTone, mediumTone, darkTone];

  const [color1, setColor1] = useState(color1Tones[0]);
  const [color2, setColor2] = useState(color2Tones[0]);
  const [color3, setColor3] = useState(color3Tones[0]);

  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Regenerate tones if baseColor changes
    const [newLightTone, newMediumTone, newDarkTone] = generateThreeTones(baseColor);
    const newColor1Tones = [newLightTone, newMediumTone, newDarkTone, newLightTone];
    const newColor2Tones = [newMediumTone, newDarkTone, newLightTone, newMediumTone];
    const newColor3Tones = [newDarkTone, newLightTone, newMediumTone, newDarkTone];

    animationValue.setValue(0);
    const loop = Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 14000, // 14 seconds for full cycle
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false, // Color interpolation requires useNativeDriver: false
      })
    );

    const listenerId = animationValue.addListener(({ value }: { value: number }) => {
      // Clamp value between 0 and 1
      const clampedValue = Math.max(0, Math.min(1, value));

      // Calculate which segment we're in (0-2, since we have 3 tones)
      const segmentCount = newColor1Tones.length - 1;
      const segmentSize = 1 / segmentCount;
      const segmentIndex = Math.min(Math.floor(clampedValue / segmentSize), segmentCount - 1);

      const startColor1 = newColor1Tones[segmentIndex];
      const endColor1 = newColor1Tones[segmentIndex + 1];
      const startColor2 = newColor2Tones[segmentIndex];
      const endColor2 = newColor2Tones[segmentIndex + 1];
      const startColor3 = newColor3Tones[segmentIndex];
      const endColor3 = newColor3Tones[segmentIndex + 1];

      const segmentStart = segmentIndex * segmentSize;
      const segmentEnd = (segmentIndex + 1) * segmentSize;
      const ratio = (clampedValue - segmentStart) / (segmentEnd - segmentStart);

      setColor1(interpolateHexColor(startColor1, endColor1, ratio));
      setColor2(interpolateHexColor(startColor2, endColor2, ratio));
      setColor3(interpolateHexColor(startColor3, endColor3, ratio));
    });

    loop.start();
    return () => {
      loop.stop();
      animationValue.removeListener(listenerId);
    };
  }, [animationValue, baseColor]);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox={SVG_VIEWBOX} preserveAspectRatio="xMidYMid meet">
        <G>
          {/* cls-2 rectangles (color2) */}
          <Rect
            x={RECT_1.x}
            y={RECT_1.y}
            width={RECT_1.width}
            height={RECT_1.height}
            rx={RECT_1.rx}
            ry={RECT_1.ry}
            fill={color2}
          />
          <Rect
            x={RECT_2.x}
            y={RECT_2.y}
            width={RECT_2.width}
            height={RECT_2.height}
            rx={RECT_2.rx}
            ry={RECT_2.ry}
            fill={color2}
          />
          {/* cls-1 path (color1) */}
          <Path d={PRIMARY_PATH} fill={color1} />
          {/* cls-2 path (color2) */}
          <Path d={SECONDARY_PATH} fill={color2} />
          {/* cls-3 paths and rects (color3) */}
          {TERTIARY_PATHS.map((path, index) => (
            <Path key={`tertiary-path-${index}`} d={path} fill={color3} />
          ))}
          {TERTIARY_RECTS.map((rect, index) => (
            <Rect
              key={`tertiary-rect-${index}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={color3}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
