import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import tl from './locales/tl.json';
import vi from './locales/vi.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import ur from './locales/ur.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  zh: { translation: zh },
  fr: { translation: fr },
  tl: { translation: tl },
  vi: { translation: vi },
  ar: { translation: ar },
  hi: { translation: hi },
  ur: { translation: ur },
};

// Map common locale variants to our supported languages
const getLanguageCode = (locale: string): string => {
  const code = locale.split('-')[0].toLowerCase();
  const languageMap: Record<string, string> = {
    en: 'en',
    es: 'es',
    zh: 'zh',
    fr: 'fr',
    tl: 'tl',
    fil: 'tl', // Filipino -> Tagalog
    vi: 'vi',
    ar: 'ar',
    hi: 'hi',
    ur: 'ur',
  };
  return languageMap[code] || 'en';
};

// Get device locale
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
const languageCode = getLanguageCode(deviceLocale);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: languageCode,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v4', // Use i18next v4 format
  });

export default i18n;
