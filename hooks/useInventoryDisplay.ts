import { useMemo } from "react";

import { api } from "@haricot/convex-client";
import { useQuery } from "convex/react";
import type { Doc } from "@haricot/convex-client";

import {
  SUPPORTED_LANGUAGES,
  type InventoryDisplayItem,
  type SupportedLanguage,
  type UserInventoryEntry,
} from "@haricot/convex-client";

const DEFAULT_LANGUAGE: SupportedLanguage = "en";

// Database format has {singular, plural} objects
type DbTranslation = {
  singular: string;
  plural: string;
};

type FoodLibraryLookupItem = Pick<
  Doc<"foodLibrary">,
  | "code"
  | "translations"
  | "category"
  | "categoryTranslations"
  | "storageLocation"
  | "defaultImageUrl"
  | "emoji"
  | "shelfLifeDays"
  | "varieties"
>;

// Helper to extract string from database translation object
const getTranslationString = (
  translations:
    | Record<string, DbTranslation>
    | Record<string, string>,
  language: SupportedLanguage,
): string => {
  const translation = translations[language] ?? translations[DEFAULT_LANGUAGE] ?? translations["en"];

  // If it's a string, return it directly (for categoryTranslations and variety translations)
  if (typeof translation === "string") {
    return translation;
  }

  // If it's an object with singular/plural, use singular (or plural if quantity > 1, but we'll use singular for now)
  if (translation && typeof translation === "object" && "singular" in translation) {
    return translation.singular;
  }

  return "";
};

const getLocalizedValue = (
  translations: Record<string, DbTranslation> | Record<string, string>,
  language: SupportedLanguage,
): string => {
  return getTranslationString(translations, language);
};

const normalizeLanguage = (language: string | undefined): SupportedLanguage => {
  if (language === undefined) {
    return DEFAULT_LANGUAGE;
  }

  // Support the languages from types, fallback to en if not supported
  if (SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
    return language as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
};

const buildInventoryItem = (
  entry: UserInventoryEntry,
  libraryItem: FoodLibraryLookupItem,
  language: SupportedLanguage,
): InventoryDisplayItem => {
  const variety = entry.varietyCode
    ? libraryItem.varieties.find(
        (itemVariety: FoodLibraryLookupItem["varieties"][number]) =>
          itemVariety.code === entry.varietyCode,
      )
    : undefined;

  const displayName = getLocalizedValue(libraryItem.translations, language);
  const categoryName = getLocalizedValue(libraryItem.categoryTranslations, language);
  const displayVariety = variety
    ? getLocalizedValue(variety.translations, language)
    : undefined;

  return {
    itemCode: entry.itemCode,
    category: libraryItem.category,
    categoryName,
    displayName,
    displayVariety,
    quantity: entry.quantity,
    purchaseDate: entry.purchaseDate,
    storageLocation: libraryItem.storageLocation,
    imageUrl:
      entry.imageUrlOverride ??
      variety?.defaultImageUrl ??
      libraryItem.defaultImageUrl,
    emoji: libraryItem.emoji ?? "🍽️",
    shelfLifeDays: libraryItem.shelfLifeDays,
  };
};

export const useInventoryDisplay = () => {
  const user = useQuery(api.users.getCurrentUser);
  const household = useQuery(api.households.getHousehold);

  const inventoryEntries = useMemo<UserInventoryEntry[]>(() => {
    if (!household || household === null) {
      return [];
    }

    if (household.status !== "member") {
      return [];
    }

    return (household.household.inventory ?? []) as UserInventoryEntry[];
  }, [household]);

  const inventoryCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const entry of inventoryEntries) {
      codes.add(entry.itemCode);
    }
    return Array.from(codes);
  }, [inventoryEntries]);

  const foodLibrary = useQuery(api.foodLibrary.getByCodes, {
    codes: inventoryCodes,
  });

  const inventoryItems = useMemo<InventoryDisplayItem[]>(() => {
    if (!user || !foodLibrary) {
      return [];
    }

    const language = normalizeLanguage(
      (user as { preferredLanguage?: string } | null)?.preferredLanguage,
    );

    const libraryByCode = new Map<string, FoodLibraryLookupItem>(
      foodLibrary.map((item: FoodLibraryLookupItem) => [item.code, item]),
    );

    const items: InventoryDisplayItem[] = [];

    for (const entry of inventoryEntries) {
      const libraryItem = libraryByCode.get(entry.itemCode);
      if (!libraryItem) {
        continue;
      }

      items.push(buildInventoryItem(entry, libraryItem, language));
    }

    return items;
  }, [foodLibrary, inventoryEntries, user]);

  const isLoading =
    user === undefined ||
    foodLibrary === undefined ||
    household === undefined;

  return {
    user,
    household,
    foodLibrary,
    inventoryItems,
    inventoryEntries,
    isLoading,
  } as const;
};
