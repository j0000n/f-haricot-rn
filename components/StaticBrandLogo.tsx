import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { useTheme } from "@/styles/tokens";

type StaticBrandLogoProps = {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

// SVG path data from AnimatedBrandLogo
const SVG_VIEWBOX = "0 0 148.9 297.8";

const SVG_1_PRIMARY_PATH = "M37.22 260.57h74.45v37.22H37.22zM111.67 0v74.45c0 20.56-16.67 37.22-37.22 37.22-20.56 0-37.22-16.67-37.22-37.22V0H0v148.9h148.9V0h-37.22Z";
const SVG_1_SECONDARY_PATH = "M0 148.9v148.9h37.22V186.12h74.45V297.8h37.23V148.9zM37.22 0v74.45c0-20.56 16.67-37.22 37.22-37.22s37.22 16.67 37.22 37.22V0z";

const SVG_2_PRIMARY_PATH = "M0 148.9v148.9h37.23v-37.23l-.01-74.45h74.45V297.8h37.23V148.9zM37.22 0v74.45c0-20.56 16.67-37.22 37.22-37.22 20.56 0 37.22 16.67 37.22 37.22V0H37.21Z";
const SVG_2_SECONDARY_PATH = "M37.23 260.57h74.45v37.22H37.23zM111.67 0v74.45c0 20.56-16.67 37.22-37.22 37.22-20.56 0-37.22-16.67-37.22-37.22V0H0v148.9h148.9V0h-37.22Z";

export function StaticBrandLogo({
  size = 64,
  width,
  height,
  style,
  accessibilityLabel = "Haricot logo",
  primaryColor,
  secondaryColor,
}: StaticBrandLogoProps) {
  const { tokens } = useTheme();
  
  // Use provided colors or fall back to theme colors
  const resolvedPrimaryColor = primaryColor ?? tokens.colors.logoPrimaryColor ?? tokens.colors.textPrimary;
  const resolvedSecondaryColor = secondaryColor ?? tokens.colors.logoSecondaryColor ?? tokens.colors.textSecondary;
  
  // Calculate dimensions based on provided props
  // The SVG viewBox is 148.9 x 297.8, so natural aspect ratio is ~2:1 (height:width)
  const SVG_ASPECT_RATIO = 297.8 / 148.9; // ~2.0
  
  let svgWidth: number;
  let svgHeight: number;
  
  if (width !== undefined && height !== undefined) {
    // Both width and height provided - use them directly
    svgWidth = width;
    svgHeight = height;
  } else if (width !== undefined) {
    // Only width provided - calculate height from aspect ratio
    svgWidth = width;
    svgHeight = width * SVG_ASPECT_RATIO;
  } else if (height !== undefined) {
    // Only height provided - calculate width from aspect ratio
    svgHeight = height;
    svgWidth = height / SVG_ASPECT_RATIO;
  } else {
    // Neither provided - use size for width, calculate height
    svgWidth = size;
    svgHeight = size * SVG_ASPECT_RATIO;
  }
  
  // Container width for two SVGs side by side
  const containerWidth = svgWidth * 2;
  const combinedViewBox = `0 0 ${148.9 * 2} ${297.8}`;

  return (
    <View
      style={[
        {
          width: containerWidth,
          height: svgHeight,
          position: "relative",
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Combined SVG with both shapes positioned side by side */}
      <Svg width={containerWidth} height={svgHeight} viewBox={combinedViewBox} preserveAspectRatio="xMidYMid meet">
        <G>
          {/* First shape - positioned at x=0 */}
          <G transform={`translate(0, 0)`}>
            <Path d={SVG_1_PRIMARY_PATH} fill={resolvedPrimaryColor} />
            <Path d={SVG_1_SECONDARY_PATH} fill={resolvedSecondaryColor} />
          </G>
          {/* Second shape - positioned at x=148.9 (width of first SVG) */}
          <G transform={`translate(${148.9}, 0)`}>
            <Path d={SVG_2_SECONDARY_PATH} fill={resolvedSecondaryColor} />
            <Path d={SVG_2_PRIMARY_PATH} fill={resolvedPrimaryColor} />
          </G>
        </G>
      </Svg>
    </View>
  );
}
