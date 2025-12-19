export const SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "zh",
  "fr",
  "ar",
  "ja",
  "vi",
  "tl",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface LocalizedText {
  en: string;
  es?: string;
  zh?: string;
  fr?: string;
  ar?: string;
  ja?: string;
  vi?: string;
  tl?: string;
}

export interface FoodVariety {
  code: string;
  translations: LocalizedText;
  defaultImageUrl?: string;
}

export interface FoodLibraryItem {
  code: string;
  namespace: string;
  name: string;
  standardizedName?: string;
  aliases?: string[];
  translations: LocalizedText;
  category: string;
  categoryTranslations: LocalizedText;
  defaultImageUrl: string;
  emoji?: string;
  shelfLifeDays: number;
  storageLocation: "pantry" | "fridge" | "freezer" | "spicecabinet";
  storageTips: string;
  varieties: FoodVariety[];
  nutritionPer100g: import("./nutrition").NutritionFacts;
  densityHints?: import("./nutrition").DensityHints;
}

export interface UserInventoryEntry {
  itemCode: string;
  varietyCode?: string;
  quantity: number;
  purchaseDate: number;
  note?: string;
  imageUrlOverride?: string;
}

export interface InventoryDisplayItem {
  itemCode: string;
  category: string;
  categoryName: string;
  displayName: string;
  displayVariety?: string;
  quantity: number;
  purchaseDate: number;
  storageLocation: "pantry" | "fridge" | "freezer" | "spicecabinet";
  imageUrl: string;
  emoji: string;
  shelfLifeDays: number;
}

export type FoodLibrarySeedItem = FoodLibraryItem;
export type UserInventorySeedItem = UserInventoryEntry;
