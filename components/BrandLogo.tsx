import React from "react";
import { Image } from "expo-image";
import { StyleProp, ImageStyle } from "react-native";
import { useTheme } from "@/styles/tokens";
import { SvgLogo } from "./SvgLogo";

type BrandLogoProps = {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

// Map of known SVG logo paths for dynamic rendering
const SVG_LOGO_PATHS: Record<string, string> = {
  "@/assets/images/haricot-logo.svg": "@/assets/images/haricot-logo.svg",
  "@/assets/images/sunrise-logo.svg": "@/assets/images/sunrise-logo.svg",
  "@/assets/images/midnight-logo.svg": "@/assets/images/midnight-logo.svg",
  "@/assets/images/logo.svg": "@/assets/images/logo.svg",
  "@/assets/images/black-metal.svg": "@/assets/images/black-metal.svg",
  "@/assets/images/1950s.svg": "@/assets/images/1950s.svg",
  "@/assets/images/1960s.svg": "@/assets/images/1960s.svg",
  "@/assets/images/1990s.svg": "@/assets/images/1990s.svg",
  "@/assets/images/logo-jan-23.svg": "@/assets/images/logo-jan-23.svg",
};

export function BrandLogo({
  size = 64,
  width,
  height,
  style,
  accessibilityLabel = "Haricot logo",
}: BrandLogoProps) {
  const { assets, tokens, customTheme } = useTheme();
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  // Get logo source and path
  const logoSource = assets.logo;

  // EARLY DETECTION: Check for React components FIRST (before any other logic)
  // SVG transformers can return components in various formats:
  // 1. Direct function component: typeof logoSource === "function"
  // 2. Object with default property: logoSource.default is a function
  // 3. Object with React component properties: $$typeof, displayName, render, prototype

  const isDirectFunctionComponent = typeof logoSource === "function";

  const hasComponentInDefault =
    typeof logoSource === "object" &&
    logoSource !== null &&
    "default" in logoSource &&
    typeof (logoSource as any).default === "function";

  const hasReactComponentProperties =
    typeof logoSource === "object" &&
    logoSource !== null &&
    ("$$typeof" in logoSource || "displayName" in logoSource || "render" in logoSource || "prototype" in logoSource);

  const isReactComponent = isDirectFunctionComponent || hasComponentInDefault || hasReactComponentProperties;

  // If it's a React component, render it immediately (don't pass to Image)
  if (isReactComponent) {
    try {
      let LogoComponent: React.ComponentType<{
        width?: number | string;
        height?: number | string;
        style?: StyleProp<ImageStyle>;
      }>;

      if (hasComponentInDefault) {
        LogoComponent = (logoSource as any).default;
      } else if (isDirectFunctionComponent) {
        LogoComponent = logoSource as React.ComponentType<{
          width?: number | string;
          height?: number | string;
          style?: StyleProp<ImageStyle>;
        }>;
      } else {
        // Fallback: try to use it as-is
        LogoComponent = logoSource as any;
      }

      return (
        <LogoComponent
          width={resolvedWidth}
          height={resolvedHeight}
          style={style}
        />
      );
    } catch (error) {
      console.warn("BrandLogo: Error rendering SVG component, falling back", error);
      // Fall through to other rendering methods
    }
  }

  // Get logo path - for custom themes, use the stored path; for built-in themes, try to determine from asset
  let logoPath: string | null = null;
  if (customTheme) {
    // Custom theme has the path stored
    logoPath = customTheme.logoAsset;
  } else {
    // For built-in themes, check if asset has a URI or we can determine the path
    // Only check if it's not a component (components don't have URIs)
    if (!isReactComponent && typeof logoSource === "object" && logoSource !== null && "uri" in logoSource && logoSource.uri) {
      logoPath = logoSource.uri;
    }
  }

  // Check if this is an SVG file based on path
  const isSvgPath = logoPath && (logoPath.endsWith(".svg") || logoPath.includes(".svg"));

  const hasLogoFill = tokens.colors.logoFill && tokens.colors.logoFill !== tokens.colors.textPrimary;

  // If it's an SVG path we know about and we have a logoFill color, use SvgLogo component
  if (isSvgPath && hasLogoFill && logoPath && SVG_LOGO_PATHS[logoPath]) {
    return (
      <SvgLogo
        width={resolvedWidth}
        height={resolvedHeight}
        fillColor={tokens.colors.logoFill}
        style={style}
        logoPath={logoPath}
      />
    );
  }

  // At this point, we know it's NOT a React component
  // Validate that logoSource is a valid image source before using Image component
  // A valid image source should be:
  // - A number (require() result for non-SVG images)
  // - An object with uri/localUri
  const isValidImageSource =
    typeof logoSource === "number" ||
    (typeof logoSource === "object" &&
     logoSource !== null &&
     ("uri" in logoSource || "localUri" in logoSource));

  // If it's not a valid image source and we have an SVG path, try to use SvgLogo as a fallback
  if (!isValidImageSource && isSvgPath && logoPath && SVG_LOGO_PATHS[logoPath]) {
    // Try to use SvgLogo even without logoFill if it's an SVG
    return (
      <SvgLogo
        width={resolvedWidth}
        height={resolvedHeight}
        fillColor={tokens.colors.logoFill || tokens.colors.textPrimary}
        style={style}
        logoPath={logoPath}
      />
    );
  }

  // Only use Image component if we have a valid source
  if (isValidImageSource) {
    return (
      <Image
        source={logoSource as any}
        style={[{ width: resolvedWidth, height: resolvedHeight }, style]}
        contentFit="contain"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  // Final fallback: return null or a placeholder if we can't render anything
  console.warn("BrandLogo: Unable to render logo", {
    type: typeof logoSource,
    isFunction: typeof logoSource === "function",
    isReactComponent,
    hasComponentInDefault,
    hasReactComponentProperties,
    isSvgPath,
    logoPath,
    hasValidSource: isValidImageSource,
    logoSourceKeys: typeof logoSource === "object" && logoSource !== null ? Object.keys(logoSource) : null,
  });
  return null;
}
