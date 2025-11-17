import { PageHeader } from "@/components/PageHeader";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
import { useTranslation } from "@/i18n/useTranslation";
import createKitchenStyles from "@/styles/kitchenStyles";
import { useThemedStyles } from "@/styles/tokens";
import type { InventoryDisplayItem } from "@/types/food";
import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

type ViewMode = "list" | "grid";
type SortOption = "location" | "quantity" | "purchaseDate";

const LOCATION_ORDER = ["fridge", "freezer", "pantry", "spicecabinet"] as const;

const LOCATION_LABEL_KEYS: Record<(typeof LOCATION_ORDER)[number], string> = {
  fridge: "kitchen.locationFridge",
  freezer: "kitchen.locationFreezer",
  pantry: "kitchen.locationPantry",
  spicecabinet: "kitchen.locationSpiceCabinet",
};

const SORT_OPTION_KEYS: Record<SortOption, string> = {
  location: "kitchen.sortLocation",
  quantity: "kitchen.sortQuantity",
  purchaseDate: "kitchen.sortPurchaseDate",
};

const MS_IN_DAY = 86_400_000;

const getLocationIndex = (value: string) => {
  const index = LOCATION_ORDER.indexOf(value as (typeof LOCATION_ORDER)[number]);
  return index === -1 ? LOCATION_ORDER.length : index;
};

type DecoratedInventoryItem = InventoryDisplayItem & {
  daysOld: number;
};

export default function KitchenScreen() {
  const styles = useThemedStyles(createKitchenStyles);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortOption, setSortOption] = useState<SortOption>("location");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { t, i18n } = useTranslation();
  const { inventoryItems, isLoading } = useInventoryDisplay();
  const formatShortDate = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString(i18n.language || undefined, {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      });
    },
    [i18n.language]
  );

  const getLocationLabel = useCallback(
    (value: string) => {
      const key =
        LOCATION_LABEL_KEYS[value as (typeof LOCATION_ORDER)[number]];
      return key ? t(key) : value;
    },
    [t]
  );

  const inventory = useMemo<DecoratedInventoryItem[]>(() => {
    const now = Date.now();

    return inventoryItems
      .map((item) => {
        const purchaseMs = item.purchaseDate * 1000;
        const ageInDays = Math.max(0, Math.floor((now - purchaseMs) / MS_IN_DAY));

        return {
          ...item,
          daysOld: ageInDays,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [inventoryItems]);
  const filteredInventory = useMemo(() => {
    const items =
      locationFilter === "all"
        ? inventory
        : inventory.filter((item) => item.storageLocation === locationFilter);

    const sortedItems = [...items];

    sortedItems.sort((a, b) => {
      if (sortOption === "location") {
        const locationDelta =
          getLocationIndex(a.storageLocation) - getLocationIndex(b.storageLocation);
        if (locationDelta !== 0) {
          return locationDelta;
        }
        return a.displayName.localeCompare(b.displayName);
      }

      if (sortOption === "quantity") {
        const quantityDelta = b.quantity - a.quantity;
        if (quantityDelta !== 0) {
          return quantityDelta;
        }
        return getLocationIndex(a.storageLocation) - getLocationIndex(b.storageLocation);
      }

      if (sortOption === "purchaseDate") {
        const purchaseDelta = b.purchaseDate - a.purchaseDate;
        if (purchaseDelta !== 0) {
          return purchaseDelta;
        }
        return getLocationIndex(a.storageLocation) - getLocationIndex(b.storageLocation);
      }

      return 0;
    });

    return sortedItems;
  }, [inventory, locationFilter, sortOption]);

  const sortOptions = useMemo(
    () =>
      (Object.keys(SORT_OPTION_KEYS) as SortOption[]).map((value) => ({
        value,
        label: t(SORT_OPTION_KEYS[value]),
      })),
    [t]
  );

  const locationFilters = useMemo(
    () => [
      { value: "all", label: t("kitchen.locationAll") },
      ...LOCATION_ORDER.map((value) => ({
        value,
        label: t(LOCATION_LABEL_KEYS[value]),
      })),
    ],
    [t]
  );

  return (
    <View style={styles.container}>
      <PageHeader title={t("kitchen.title")} showProfileButton={true} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.controlsRow}>
          <View style={styles.controlsLeft}>
            <View style={styles.sortControl}>
              <Pressable
                onPress={() => setShowSortMenu((current) => !current)}
                accessibilityRole="button"
                accessibilityExpanded={showSortMenu}
                style={styles.sortTrigger}
              >
                <Text style={styles.sortTriggerLabel}>{t("kitchen.sortBy")}</Text>
                <Text style={styles.sortTriggerValue}>
                  {sortOptions.find((option) => option.value === sortOption)?.label}
                </Text>
              </Pressable>

              {showSortMenu ? (
                <View style={styles.sortMenu} accessibilityRole="menu">
                  {sortOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setSortOption(option.value);
                        setShowSortMenu(false);
                      }}
                      accessibilityRole="menuitem"
                      style={[
                        styles.sortMenuItem,
                        sortOption === option.value && styles.sortMenuItemActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortMenuLabel,
                          sortOption === option.value && styles.sortMenuLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.controlsRight}>
            <View style={styles.viewToggle}>
              {(["list", "grid"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setViewMode(mode);
                    setShowSortMenu(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: viewMode === mode }}
                  style={[
                    styles.viewToggleButton,
                    viewMode === mode && styles.viewToggleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.viewToggleLabel,
                      viewMode === mode && styles.viewToggleLabelActive,
                    ]}
                  >
                    {mode === "list" ? t("kitchen.viewList") : t("kitchen.viewGrid")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {locationFilters.map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => {
                setLocationFilter(filter.value);
                setShowSortMenu(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: locationFilter === filter.value }}
              style={[
                styles.filterPill,
                locationFilter === filter.value && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillLabel,
                  locationFilter === filter.value && styles.filterPillLabelActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>{t("kitchen.loading")}</Text>
          </View>
        ) : inventory.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>{t("kitchen.emptyTitle")}</Text>
            <Text style={styles.emptyStateText}>
              {t("kitchen.emptyDescription")}
            </Text>
          </View>
        ) : viewMode === "list" ? (
          <View style={styles.listContainer}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listHeaderCell, styles.listHeaderCellName]}>
                {t("kitchen.itemName")}
              </Text>
              <Text style={styles.listHeaderCell}>{t("kitchen.quantity")}</Text>
              <Text style={styles.listHeaderCell}>{t("kitchen.date")}</Text>
            </View>

            {filteredInventory.map((item, index) => (
              <View key={`${item.itemCode}-${index}`} style={styles.listRow}>
                <View style={[styles.listCell, styles.listCellName]}>
                  <Text style={styles.listItemName}>
                    {item.displayName}
                  </Text>
                  {item.displayVariety ? (
                    <Text style={styles.listItemMeta}>{item.displayVariety}</Text>
                  ) : null}
                  <Text style={styles.listItemMeta}>
                    {getLocationLabel(item.storageLocation)}
                  </Text>
                </View>
                <View style={[styles.listCell, styles.listCellQty]}>
                  <Text style={styles.listItemQuantity}>
                    {t("kitchen.itemCount", { count: item.quantity })}
                  </Text>
                </View>
                <View style={[styles.listCell, styles.listCellDate]}>
                  <Text style={styles.listItemDate}>{formatShortDate(item.purchaseDate)}</Text>
                  <Text style={styles.listItemMeta}>
                    {t("kitchen.dayAge", { count: item.daysOld })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredInventory.map((item, index) => (
              <View key={`${item.itemCode}-${index}`} style={styles.gridItem}>
              <View style={styles.gridMetaBar}>
                <Text style={styles.gridMetaBarLabel}>{formatShortDate(item.purchaseDate)}</Text>
                <View style={styles.gridQuantityPill}>
                  <Text style={styles.gridQuantityPillLabel}>
                    {t("kitchen.itemCount", { count: item.quantity })}
                  </Text>
                </View>
              </View>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                <View style={styles.gridContent}>
                  <Text style={styles.gridName}>{item.displayName}</Text>
                  {item.displayVariety ? (
                    <Text style={styles.gridVariety}>{item.displayVariety}</Text>
                  ) : null}
                  <View style={styles.gridMetaRow}>
                    <Text style={styles.gridMetaLabel}>{t("kitchen.daysOld")}</Text>
                    <Text style={styles.gridMetaValue}>{item.daysOld}</Text>
                  </View>
                  <View style={styles.gridMetaRow}>
                    <Text style={styles.gridMetaLabel}>{t("kitchen.location")}</Text>
                    <Text style={styles.gridMetaValue}>
                      {getLocationLabel(item.storageLocation)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
