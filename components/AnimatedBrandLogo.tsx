import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleProp, View, ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";

type AnimatedBrandLogoProps = {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// Color palette matching the HTML animation
const PRIMARY_COLORS = [
  "#4a1f1f", // Red - dark burgundy
  "#4a2a1f", // Orange - dark brown-orange
  "#4a3f1f", // Yellow - dark olive
  "#1f4a1f", // Green - dark forest green
  "#1f1f4a", // Blue - dark navy
  "#2a1f4a", // Indigo - dark indigo
  "#4a1f4a", // Violet - dark purple
  "#4a1f1f", // Red (back to start)
];

const SECONDARY_COLORS = [
  "#f3a6a6", // Red
  "#f3c8a6", // Orange
  "#f3d8a6", // Yellow
  "#a6f3b8", // Green
  "#a6d8f3", // Blue
  "#b8a6f3", // Indigo
  "#e6a6f3", // Violet
  "#f3a6a6", // Red (back to start)

];

// SVG path data from the HTML
const SVG_VIEWBOX = "0 0 148.9 297.8";

const SVG_1_PRIMARY_PATH = "M37.22 260.57h74.45v37.22H37.22zM111.67 0v74.45c0 20.56-16.67 37.22-37.22 37.22-20.56 0-37.22-16.67-37.22-37.22V0H0v148.9h148.9V0h-37.22Z";
const SVG_1_SECONDARY_PATH = "M0 148.9v148.9h37.22V186.12h74.45V297.8h37.23V148.9zM37.22 0v74.45c0-20.56 16.67-37.22 37.22-37.22s37.22 16.67 37.22 37.22V0z";

const SVG_2_PRIMARY_PATH = "M0 148.9v148.9h37.23v-37.23l-.01-74.45h74.45V297.8h37.23V148.9zM37.22 0v74.45c0-20.56 16.67-37.22 37.22-37.22 20.56 0 37.22 16.67 37.22 37.22V0H37.21Z";
const SVG_2_SECONDARY_PATH = "M37.23 260.57h74.45v37.22H37.23zM111.67 0v74.45c0 20.56-16.67 37.22-37.22 37.22-20.56 0-37.22-16.67-37.22-37.22V0H0v148.9h148.9V0h-37.22Z";

// Helper function to interpolate color from animated value
function getColorForValue(value: number, colors: string[]): string {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value));

  // Calculate the segment index
  const segmentCount = colors.length - 1;
  const segmentSize = 1 / segmentCount;
  const segmentIndex = Math.min(
    Math.floor(clampedValue / segmentSize),
    segmentCount - 1
  );

  const startColor = colors[segmentIndex];
  const endColor = colors[segmentIndex + 1];
  const segmentStart = segmentIndex * segmentSize;
  const segmentEnd = (segmentIndex + 1) * segmentSize;
  const ratio = (clampedValue - segmentStart) / (segmentEnd - segmentStart);

  // Simple linear interpolation between hex colors
  return interpolateHexColor(startColor, endColor, ratio);
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
  width,
  height,
  style,
  accessibilityLabel = "Haricot animated logo",
}: AnimatedBrandLogoProps) {
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  // Calculate SVG dimensions maintaining aspect ratio
  // The SVG viewBox is 148.9 x 297.8, so height is approximately 2x width
  const svgWidth = resolvedWidth;
  const svgHeight = (resolvedWidth / 148.9) * 297.8;

  // Container width for two SVGs side by side
  const containerWidth = svgWidth * 2;

  const animationValue = useRef(new Animated.Value(0)).current;
  const [primaryColor1, setPrimaryColor1] = useState(PRIMARY_COLORS[0]);
  const [secondaryColor1, setSecondaryColor1] = useState(SECONDARY_COLORS[0]);
  // For SVG 2, colors are inverted: first path gets secondary, second path gets primary
  const [secondaryColor2, setSecondaryColor2] = useState(SECONDARY_COLORS[0]);
  const [primaryColor2, setPrimaryColor2] = useState(PRIMARY_COLORS[0]);

  useEffect(() => {
    animationValue.setValue(0);
    const loop = Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 14000, // 7 seconds as in HTML
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false, // Color interpolation requires useNativeDriver: false
      })
    );

    const listenerId = animationValue.addListener(({ value }: { value: number }) => {
      setPrimaryColor1(getColorForValue(value, PRIMARY_COLORS));
      setSecondaryColor1(getColorForValue(value, SECONDARY_COLORS));
      // SVG 2 has inverted colors: first path (secondary) gets SECONDARY_COLORS, second path (primary) gets PRIMARY_COLORS
      setSecondaryColor2(getColorForValue(value, SECONDARY_COLORS));
      setPrimaryColor2(getColorForValue(value, PRIMARY_COLORS));
    });

    loop.start();
    return () => {
      loop.stop();
      animationValue.removeListener(listenerId);
    };
  }, [animationValue]);

  return (
    <View
      style={[
        {
          width: containerWidth,
          height: svgHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {/* First SVG */}
      <Svg width={svgWidth} height={svgHeight} viewBox={SVG_VIEWBOX}>
        <G>
          <Path d={SVG_1_PRIMARY_PATH} fill={primaryColor1} />
          <Path d={SVG_1_SECONDARY_PATH} fill={secondaryColor1} />
        </G>
      </Svg>

      {/* Second SVG - colors are inverted */}
      <Svg width={svgWidth} height={svgHeight} viewBox={SVG_VIEWBOX}>
        <G>
          <Path d={SVG_2_SECONDARY_PATH} fill={secondaryColor2} />
          <Path d={SVG_2_PRIMARY_PATH} fill={primaryColor2} />
        </G>
      </Svg>
    </View>
  );
}
