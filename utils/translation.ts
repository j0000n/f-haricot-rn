/**
 * Translation and language utilities for food library and recipes
 */

import type { SupportedLanguage } from "@haricot/convex-client";
import type { SupportedRecipeLanguage } from "@haricot/convex-client";

type FoodLanguage = SupportedLanguage | "ja" | "vi" | "tl";

export const SUPPORTED_LANGUAGES: FoodLanguage[] = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"];

const RECIPE_LANGUAGE_MAP: Record<string, SupportedRecipeLanguage> = {
  en: "en",
  es: "es",
  zh: "zh",
  fr: "fr",
  tl: "tl",
  vi: "vi",
  ar: "ar",
  ja: "ja",
};
const UNSUPPORTED_RECIPE_LANGUAGE_FALLBACKS = new Set(["hi", "ur"]);

type TranslationValue = string | { singular?: string; plural?: string };

/**
 * Normalizes a language code to a supported food language
 * @param language - The language code to normalize
 * @returns A supported food language, defaults to "en"
 */
export function normalizeLanguage(language?: string): FoodLanguage {
  if (language && SUPPORTED_LANGUAGES.includes(language as FoodLanguage)) {
    return language as FoodLanguage;
  }

  return "en";
}

/**
 * Resolves a translation value from a translations object
 * @param translations - The translations object
 * @param language - The target language
 * @returns The resolved translation string
 */
export function resolveTranslation(
  translations: Record<string, TranslationValue>,
  language: FoodLanguage,
): string {
  const translation =
    translations?.[language] ?? translations?.en ?? Object.values(translations ?? {})[0];

  if (typeof translation === "string") {
    return translation;
  }

  if (translation && typeof translation === "object" && "singular" in translation) {
    return translation.singular ?? translation.plural ?? "";
  }

  return "";
}

/**
 * Maps i18n language codes (e.g., "fr-FR", "en-US") to recipe language codes (e.g., "fr", "en")
 * @param i18nLanguage - The i18n language code (can be "fr-FR", "en-US", "fr", etc.)
 * @returns A SupportedRecipeLanguage code (2-letter format)
 */
export function getRecipeLanguage(i18nLanguage: string): SupportedRecipeLanguage {
  return getRecipeLanguageResolution(i18nLanguage).recipeLanguage;
}

export function getRecipeLanguageResolution(i18nLanguage: string): {
  requestedLanguage: string;
  normalizedBaseLanguage: string;
  recipeLanguage: SupportedRecipeLanguage;
  usedFallback: boolean;
  shouldLogUnsupportedFallback: boolean;
  fallbackLanguage: SupportedRecipeLanguage;
} {
  const requestedLanguage = i18nLanguage || "en";
  const normalizedBaseLanguage = requestedLanguage.split("-")[0].toLowerCase();
  const recipeLanguage = RECIPE_LANGUAGE_MAP[normalizedBaseLanguage] || "en";
  const usedFallback = !(normalizedBaseLanguage in RECIPE_LANGUAGE_MAP);

  return {
    requestedLanguage,
    normalizedBaseLanguage,
    recipeLanguage,
    usedFallback,
    shouldLogUnsupportedFallback:
      usedFallback && UNSUPPORTED_RECIPE_LANGUAGE_FALLBACKS.has(normalizedBaseLanguage),
    fallbackLanguage: "en",
  };
}
