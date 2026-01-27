/**
 * Translation and language utilities for food library and recipes
 */

import type { SupportedLanguage } from "@/types/food";
import type { SupportedRecipeLanguage } from "@/types/recipe";

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

/**
 * Maps i18n language codes (e.g., "fr-FR", "en-US") to recipe language codes (e.g., "fr", "en")
 * @param i18nLanguage - The i18n language code (can be "fr-FR", "en-US", "fr", etc.)
 * @returns A SupportedRecipeLanguage code (2-letter format)
 */
export function getRecipeLanguage(i18nLanguage: string): SupportedRecipeLanguage {
  // Extract base language code (e.g., "fr" from "fr-FR")
  const code = i18nLanguage.split('-')[0].toLowerCase();

  const map: Record<string, SupportedRecipeLanguage> = {
    en: 'en',
    es: 'es',
    zh: 'zh',
    fr: 'fr',
    tl: 'tl',
    vi: 'vi',
    ar: 'ar',
    ja: 'ja',
  };

  return map[code] || 'en';
}
