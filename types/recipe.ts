import type { Id } from "../convex/_generated/dataModel";

export type SupportedRecipeLanguage =
  | "en"
  | "es"
  | "zh"
  | "fr"
  | "tl"
  | "vi"
  | "ar"
  | "ja";

export type LocalizedRecipeText = Record<SupportedRecipeLanguage, string>;

export interface RecipeIngredient {
  foodCode: string;
  varietyCode?: string;
  quantity: number;
  unit: string;
  preparation?: string;
  displayQuantity?: string;
  displayUnit?: string;
  normalizedQuantity?: number;
  normalizedUnit?: "g" | "ml" | "count";
  originalText?: string;
  validation?: {
    status: "matched" | "ambiguous" | "missing";
    suggestions?: string[];
  };
}

export type TemperatureUnit = "F" | "C";

export interface RecipeStepTemperature {
  value: number;
  unit: TemperatureUnit;
}

export interface RecipeSourceStep {
  stepNumber: number;
  text: string;
  timeInMinutes?: number;
  temperature?: RecipeStepTemperature;
}

export interface RecipeAttribution {
  source: string;
  sourceUrl: string;
  author?: string;
  authorName?: string;
  authorWebsite?: string;
  authorSocial?: {
    instagram?: string;
    pinterest?: string;
    youtube?: string;
    facebook?: string;
  };
  sourceHost?: string;
  dateRetrieved: string;
}

export interface Recipe {
  _id: Id<"recipes">;
  recipeName: LocalizedRecipeText;
  description: LocalizedRecipeText;
  ingredients: RecipeIngredient[];
  sourceSteps?: RecipeSourceStep[];
  emojiTags: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  sourceHost?: string;
  authorName?: string;
  authorWebsite?: string;
  authorSocial?: RecipeAttribution["authorSocial"];
  authorSocialInstagram?: string;
  authorSocialPinterest?: string;
  authorSocialYoutube?: string;
  authorSocialFacebook?: string;
  source?: string;
  sourceUrl: string;
  attribution: RecipeAttribution;
  imageUrls?: string[];
  originalImageLargeStorageId?: Id<"_storage">;
  originalImageSmallStorageId?: Id<"_storage">;
  transparentImageLargeStorageId?: Id<"_storage">;
  transparentImageSmallStorageId?: Id<"_storage">;
  encodedSteps: string;
  encodingVersion: string;
  foodItemsAdded?: Id<"foodLibrary">[];
  createdAt: number;
  updatedAt: number;
  createdBy?: Id<"users">;
  isPublic: boolean;
}
