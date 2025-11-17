import TabButton from "@/components/TabButton";
import { useTranslation } from "@/i18n/useTranslation";
import createTabLayoutStyles from "@/styles/tabLayoutStyles";
import { useThemedStyles } from "@/styles/tokens";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { View } from "react-native";

const TABS = [
  { name: "home", href: "/", labelKey: "tabs.home" },
  { name: "kitchen", href: "/kitchen", labelKey: "tabs.kitchen" },
  { name: "lists", href: "/lists", labelKey: "tabs.lists" },
] as const;

export default function TabsLayout() {
  const tabStyles = useThemedStyles(createTabLayoutStyles);
  const { t } = useTranslation();

  return (
    <View style={tabStyles.tabsContainer}>
      <Tabs>
        <View style={tabStyles.tabSlotWrapper}>
          <TabSlot />
        </View>
        <TabList style={tabStyles.tabList}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton tabKey={tab.name} label={t(tab.labelKey)} />
            </TabTrigger>
          ))}
        </TabList>
      </Tabs>
    </View>
  );
}
