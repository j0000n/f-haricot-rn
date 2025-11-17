import { StyleSheet, ViewStyle } from "react-native";
import type { ThemeTokens } from "./tokens";

const createTabLayoutStyles = (tokens: ThemeTokens) => {
  const {
    components: { tabBar },
  } = tokens;

  const listShadow = tabBar.list.shadow
    ? tokens.shadows[tabBar.list.shadow]
    : null;

  const pressedOpacity = (1 + tokens.opacity.disabled) / 2;

  const isSquareTrigger = tabBar.trigger.shape === "square";

  const tabButton: ViewStyle & Record<string, unknown> = {
    flex: isSquareTrigger ? 0 : 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingHorizontal: tabBar.trigger.paddingHorizontal,
    paddingVertical: tabBar.trigger.paddingVertical,
    borderRadius: tabBar.trigger.borderRadius,
    minHeight: tabBar.trigger.minHeight,
    backgroundColor: tabBar.trigger.inactiveBackgroundColor,
  };

  if (isSquareTrigger) {
    const { squareSize } = tabBar.trigger;

    if (squareSize) {
      tabButton.width = squareSize;
      tabButton.height = squareSize;
      tabButton.flexShrink = 0;
    } else {
      tabButton.aspectRatio = 1;
      tabButton.flex = 1;
    }
  }

  return StyleSheet.create({
    tabsContainer: {
      flex: 1,
      backgroundColor: tabBar.containerBackground,
      minHeight: tokens.spacing.none,
    },
    tabSlotWrapper: {
      flex: 1,
      backgroundColor: tabBar.slotBackground,
      minHeight: tokens.spacing.none,
    },
    tabList: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      alignSelf: "stretch",
      paddingHorizontal: tabBar.list.paddingHorizontal,
      paddingVertical: tabBar.list.paddingVertical,
      marginHorizontal: tabBar.list.marginHorizontal,
      marginBottom: tabBar.list.marginBottom,
      borderRadius: tabBar.list.borderRadius,
      backgroundColor: tabBar.list.backgroundColor,
      borderWidth: tabBar.list.borderWidth,
      borderColor: "",
      ...(listShadow ?? {}),
    },
    tabButton,
    tabButtonActive: {
      backgroundColor: tabBar.trigger.activeBackgroundColor,
    },
    tabButtonPressed: {
      opacity: pressedOpacity,
    },
    tabLabel: {
      fontSize: tokens.typography.subheading,
      fontFamily: tokens.fontFamilies.display,
      color: tabBar.label.color,
      textTransform: tabBar.label.uppercase ? "uppercase" : "none",
      letterSpacing: tabBar.label.letterSpacing,
    },
    tabLabelActive: {
      color: tabBar.label.activeColor,
    },
    tabLabelWithIcon: {
      marginLeft: tabBar.label.marginLeftWithIcon,
    },
  });
};

export default createTabLayoutStyles;
