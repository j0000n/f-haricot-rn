import { api } from "@haricot/convex-client";
import TabButton from "@/components/TabButton";
import { useTranslation } from "@/i18n/useTranslation";
import createTabLayoutStyles from "@/styles/tabLayoutStyles";
import { useThemedStyles } from "@/styles/tokens";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { View } from "react-native";
import { useMemo } from "react";
import { useQuery } from "convex/react";

const BASE_TABS = [
  { name: "home", href: "/", labelKey: "tabs.home" },
  { name: "kitchen", href: "/kitchen", labelKey: "tabs.kitchen" },
  { name: "lists", href: "/lists", labelKey: "tabs.lists" },
] as const;

export default function TabsLayout() {
  const tabStyles = useThemedStyles(createTabLayoutStyles);
  const { t } = useTranslation();
  const user = useQuery(api.users.getCurrentUser);
  const userType = (user as { userType?: string } | null)?.userType ?? "";

  const tabs = useMemo(() => {
    if (userType === "creator") {
      return [
        ...BASE_TABS,
        { name: "creator", href: "/creator", labelKey: "tabs.creator" as const },
      ];
    }

    if (userType === "vendor") {
      return [
        ...BASE_TABS,
        { name: "vendor", href: "/vendor", labelKey: "tabs.vendor" as const },
      ];
    }

    return BASE_TABS;
  }, [userType]);

  return (
    <View style={tabStyles.tabsContainer}>
      <Tabs>
        <View style={tabStyles.tabSlotWrapper}>
          <TabSlot />
        </View>
        <TabList style={tabStyles.tabList}>
          {tabs.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} asChild>
              <TabButton tabKey={tab.name} label={t(tab.labelKey)} />
            </TabTrigger>
          ))}
        </TabList>
      </Tabs>
    </View>
  );
}
