import { createElement, type ReactNode } from "react";
import { I18nextProvider, useTranslation as useI18nextTranslation } from "react-i18next";
import i18n from "./config";

/**
 * Hook to access translations in components
 *
 * @example
 * const { t } = useTranslation();
 * return <Text>{t('auth.signInTitle')}</Text>;
 *
 * @example With interpolation
 * const { t } = useTranslation();
 * return <Text>{t('auth.codeSentTo', { email: 'user@example.com' })}</Text>;
 */
export function useTranslation() {
  return useI18nextTranslation();
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  return createElement(I18nextProvider, { i18n }, children);
}

/**
 * Get the current language code
 *
 * @returns Current language code (e.g., 'en', 'es', 'zh')
 */
export function getCurrentLanguage(): string {
  return i18n.language;
}

/**
 * Change the app language
 *
 * @param languageCode - Language code to change to (e.g., 'en', 'es', 'zh', 'fr', 'tl', 'vi', 'ar', 'hi', 'ur')
 */
export async function changeLanguage(languageCode: string): Promise<void> {
  await i18n.changeLanguage(languageCode);
}

/**
 * Get multilingual text from Convex data based on current language
 *
 * @param data - Object containing multilingual fields
 * @param fieldPrefix - Prefix of the field (e.g., 'displayText', 'category')
 * @param fallback - Fallback text if no translation is found
 * @returns Translated text based on current language
 *
 * @example
 * const item = {
 *   displayTextEnglish: 'Apple',
 *   displayTextSpanish: 'Manzana',
 *   displayTextFrench: 'Pomme',
 * };
 * const text = getMultilingualText(item, 'displayText', 'Unknown');
 */
export function getMultilingualText(
  data: Record<string, any>,
  fieldPrefix: string,
  fallback: string = ""
): string {
  const lang = getCurrentLanguage();
  const languageMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    zh: "Chinese",
    fr: "French",
    tl: "Tagalog",
    vi: "Vietnamese",
    ar: "Arabic",
    hi: "Hindi",
    ur: "Urdu",
  };

  const fieldSuffix = languageMap[lang] || "English";
  const fieldName = `${fieldPrefix}${fieldSuffix}`;

  return data[fieldName] || data[`${fieldPrefix}English`] || fallback;
}

/**
 * Type for supported language codes
 */
export type SupportedLanguage = "en" | "es" | "zh" | "fr" | "tl" | "vi" | "ar" | "hi" | "ur";

/**
 * List of all supported languages with their native names
 */
export const SUPPORTED_LANGUAGES: Array<{
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}> = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
];
