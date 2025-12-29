module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Disable auto-inclusion of reanimated/worklets plugins to avoid duplicates
          // We'll include the plugin manually below
          reanimated: false,
        },
      ],
    ],
    plugins: [
      // Include reanimated plugin manually (it internally uses react-native-worklets)
      // Note: expo-router/babel is automatically included by babel-preset-expo in SDK 50+
      "react-native-reanimated/plugin",
    ],
  };
};
