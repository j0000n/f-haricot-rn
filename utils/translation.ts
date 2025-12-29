/**
 * Translation and language utilities for food library and recipes
 */

import type { SupportedLanguage } from "@/types/food";

type FoodLanguage = SupportedLanguage | "ja" | "vi" | "tl";

export const SUPPORTED_LANGUAGES: FoodLanguage[] = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"];

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






