import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/styles/tokens";

type StaticBrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
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

export function StaticBrandLogo({
  size = 64,
  style,
  accessibilityLabel = "Haricot logo",
  primaryColor,
  secondaryColor,
  tertiaryColor,
}: StaticBrandLogoProps) {
  const { tokens } = useTheme();

  // Use provided colors or fall back to theme colors
  const resolvedPrimaryColor =
    primaryColor ?? tokens.colors.logoPrimaryColor ?? tokens.colors.textPrimary;
  const resolvedSecondaryColor =
    secondaryColor ?? tokens.colors.logoSecondaryColor ?? tokens.colors.textSecondary;
  const resolvedTertiaryColor =
    tertiaryColor ?? tokens.colors.logoTertiaryColor ?? tokens.colors.textMuted;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          position: "relative",
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox={SVG_VIEWBOX} preserveAspectRatio="xMidYMid meet">
        <G>
          {/* cls-2 rectangles (secondaryColor) */}
          <Rect
            x={RECT_1.x}
            y={RECT_1.y}
            width={RECT_1.width}
            height={RECT_1.height}
            rx={RECT_1.rx}
            ry={RECT_1.ry}
            fill={resolvedSecondaryColor}
          />
          <Rect
            x={RECT_2.x}
            y={RECT_2.y}
            width={RECT_2.width}
            height={RECT_2.height}
            rx={RECT_2.rx}
            ry={RECT_2.ry}
            fill={resolvedSecondaryColor}
          />
          {/* cls-1 path (primaryColor) */}
          <Path d={PRIMARY_PATH} fill={resolvedPrimaryColor} />
          {/* cls-2 path (secondaryColor) */}
          <Path d={SECONDARY_PATH} fill={resolvedSecondaryColor} />
          {/* cls-3 paths and rects (tertiaryColor) */}
          {TERTIARY_PATHS.map((path, index) => (
            <Path key={`tertiary-path-${index}`} d={path} fill={resolvedTertiaryColor} />
          ))}
          {TERTIARY_RECTS.map((rect, index) => (
            <Rect
              key={`tertiary-rect-${index}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={resolvedTertiaryColor}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
