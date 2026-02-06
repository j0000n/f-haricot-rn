import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/styles/tokens";
import { SvgLogo } from "./SvgLogo";

type BrandLogoProps = {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const DEFAULT_LOGO_PATH = "@/assets/images/haricot-logo.svg";

export function BrandLogo({
  size = 64,
  width,
  height,
  style,
}: BrandLogoProps) {
  const { tokens } = useTheme();
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  return (
    <SvgLogo
      width={resolvedWidth}
      height={resolvedHeight}
      fillColor={tokens.colors.logoFill || tokens.colors.textPrimary}
      style={style}
      logoPath={DEFAULT_LOGO_PATH}
    />
  );
}
