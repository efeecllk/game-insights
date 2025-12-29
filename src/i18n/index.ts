/**
 * i18n Configuration - Internationalization Setup
 * Phase 8: Usability & Accessibility
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';

// Available languages configuration
export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

// Get stored language or detect from browser
const getInitialLanguage = (): LanguageCode => {
    // Check localStorage first
    const stored = localStorage.getItem('game-insights-language');
    if (stored && languages.some((l) => l.code === stored)) {
        return stored as LanguageCode;
    }

    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    if (languages.some((l) => l.code === browserLang)) {
        return browserLang as LanguageCode;
    }

    // Default to English
    return 'en';
};

// Initialize i18next
i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        es: { translation: es },
        de: { translation: de },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React already escapes values
    },
    react: {
        useSuspense: false, // Disable suspense for SSR compatibility
    },
});

// Helper to change language and persist choice
export const changeLanguage = (code: LanguageCode): void => {
    i18n.changeLanguage(code);
    localStorage.setItem('game-insights-language', code);
};

export default i18n;
