const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Only configure SVG transformer if the package is installed
try {
  const svgTransformerPath = require.resolve("react-native-svg-transformer");
  config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
  config.resolver.sourceExts.push("svg");
  config.transformer.babelTransformerPath = svgTransformerPath;
} catch (error) {
  // react-native-svg-transformer is not installed, skip SVG transformer configuration
  console.warn("react-native-svg-transformer not found, SVG transformer configuration skipped");
}

module.exports = config;
