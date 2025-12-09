import { forwardRef, type ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { TabTriggerSlotProps } from "expo-router/ui";
import { Feather } from "@expo/vector-icons";

import type { AppTabKey, TabIconFamily } from "@/styles/themes";
import createTabLayoutStyles from "@/styles/tabLayoutStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";

type TabButtonProps = TabTriggerSlotProps & {
  tabKey: AppTabKey;
  label: string;
};

type IconProps = ComponentProps<typeof Feather>;

const ICON_COMPONENTS: Record<TabIconFamily, React.ComponentType<IconProps>> = {
  Feather,
};

const TabButton = forwardRef<View, TabButtonProps>((props, ref) => {
  const { tabKey, label, isFocused, ...rest } = props;
  const tabStyles = useThemedStyles(createTabLayoutStyles);
  const tokens = useTokens();

  const tabBar = tokens.components.tabBar;
  const iconConfig = tabBar.icon && tabBar.icon.show ? tabBar.icon : null;
  const IconComponent = iconConfig ? ICON_COMPONENTS[iconConfig.family] : null;
  const iconName = iconConfig?.names[tabKey as AppTabKey];
  const shouldShowIcon = Boolean(IconComponent && iconConfig?.show && iconName);
  const shouldShowLabel = tabBar.label.show || !shouldShowIcon;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      {...rest}
      style={({ pressed }: { pressed: boolean }) => [
        tabStyles.tabButton,
        isFocused ? tabStyles.tabButtonActive : null,
        pressed ? tabStyles.tabButtonPressed : null,
      ]}
    >
      {shouldShowIcon && IconComponent && iconName ? (
        <IconComponent
          name={iconName as IconProps["name"]}
          size={iconConfig.size}
          color={isFocused ? iconConfig.activeColor : iconConfig.inactiveColor}
        />
      ) : null}
      {shouldShowLabel ? (
        <Text
          style={[
            tabStyles.tabLabel,
            shouldShowIcon ? tabStyles.tabLabelWithIcon : null,
            isFocused ? tabStyles.tabLabelActive : null,
          ]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
});

TabButton.displayName = "TabButton";

export default TabButton;
