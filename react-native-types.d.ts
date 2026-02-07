// Type declarations to help TypeScript resolve React Native types with Expo's bundler module resolution
// Re-export all React Native types to work around module resolution issues
declare module "react-native" {
  // Import and re-export all types from React Native's type definitions
  export {
    Animated,
    Easing,
    FlatList,
    View,
    Text,
    Image,
    ImageBackground,
    ScrollView,
    Pressable,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    UIManager,
    Modal,
    Switch,
    KeyboardAvoidingView,
    SafeAreaView,
    TouchableWithoutFeedback,
    Keyboard,
    Clipboard,
    PanResponder,
    LayoutAnimation,
    AccessibilityInfo,
    Dimensions,
  } from "react-native/types/index";

  // Re-export types
  export type {
    ViewProps,
    TextProps,
    ImageProps,
    ScrollViewProps,
    PressableProps,
    TextInputProps,
    StyleProp,
    ImageStyle,
    ViewStyle,
    TextStyle,
    GestureResponderEvent,
    PanResponderGestureState,
  } from "react-native/types/index";

  // Re-export everything else
  export * from "react-native/types/index";
}
