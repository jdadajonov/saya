import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { InitOptions } from 'i18next';

import ru from './locales/ru.json';
import uz from './locales/uz.json';
import en from './locales/en.json';

export type Locale = 'ru' | 'uz' | 'en';
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz', 'en'];

export function initI18n(defaultLocale: Locale = 'ru'): typeof i18n {
  if (!i18n.isInitialized) {
    const options: InitOptions = {
      resources: {
        ru: { translation: ru as Record<string, unknown> },
        uz: { translation: uz as Record<string, unknown> },
        en: { translation: en as Record<string, unknown> },
      },
      lng: defaultLocale,
      fallbackLng: 'ru',
      interpolation: { escapeValue: false },
    };
    void i18n.use(initReactI18next).init(options);
  }
  return i18n;
}

export default i18n;
