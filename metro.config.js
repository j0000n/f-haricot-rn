const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Watch the linked @haricot/convex-client package
config.watchFolders = [
  path.resolve(__dirname, "../haricot-convex/packages/convex-client"),
];

// Ensure Metro can resolve the symlinked package
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
];

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
