import { useEffect, useMemo, useRef } from "react";

import type { InventoryDisplayItem } from "@haricot/convex-client";
import type { Recipe } from "@haricot/convex-client";
import { buildWidgetPayload } from "@/widgets/data";
import { hasNativeWidgetSupport, setWidgetData } from "@/widgets/bridge";
import type { WidgetPayload } from "@/widgets/types";

type UseWidgetSyncOptions = {
  inventoryItems: InventoryDisplayItem[];
  recipes: Recipe[];
  inventoryCodes: string[];
  language: keyof Recipe["recipeName"];
  enabled?: boolean;
};

const serializePayload = (payload: WidgetPayload): string =>
  JSON.stringify(payload);

const sortCodes = (codes: string[]): string[] => [...codes].sort();

export const useWidgetSync = ({
  inventoryItems,
  recipes,
  inventoryCodes,
  language,
  enabled = true,
}: UseWidgetSyncOptions): void => {
  const sortedCodes = useMemo(() => sortCodes(inventoryCodes), [inventoryCodes]);

  const payload = useMemo(() => {
    if (!enabled || inventoryItems.length === 0) {
      return null;
    }

    return buildWidgetPayload({
      inventoryItems,
      recipes,
      inventoryCodes: sortedCodes,
      language,
    });
  }, [enabled, inventoryItems, recipes, sortedCodes, language]);

  const previousSerializedPayload = useRef<string | null>(null);

  useEffect(() => {
    if (!hasNativeWidgetSupport || !payload) {
      return;
    }

    const serialized = serializePayload(payload);
    if (serialized === previousSerializedPayload.current) {
      return;
    }

    previousSerializedPayload.current = serialized;

    setWidgetData(payload).catch((error) => {
      console.error("Haricot widgets: failed to update widget data", error);
      previousSerializedPayload.current = null;
    });
  }, [payload]);
};
