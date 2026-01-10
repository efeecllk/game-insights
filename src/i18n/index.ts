/**
 * i18n Configuration - Internationalization Setup
 * Phase 8: Usability & Accessibility
 *
 * Optimized for bundle size:
 * - Only English is loaded initially (fallback language)
 * - Other languages are loaded on-demand when selected
 * - Uses dynamic imports for lazy loading translations
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Only import English by default - other languages loaded on demand
import en from './locales/en.json';

// Available languages configuration
export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

// Lazy load translation files
const loadTranslation = async (lang: LanguageCode): Promise<Record<string, unknown>> => {
    switch (lang) {
        case 'es':
            return (await import('./locales/es.json')).default;
        case 'de':
            return (await import('./locales/de.json')).default;
        case 'en':
        default:
            return en;
    }
};

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

const initialLang = getInitialLanguage();

// Initialize i18next with only English loaded
i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React already escapes values
    },
    react: {
        useSuspense: false, // Disable suspense for SSR compatibility
    },
});

// Load initial language if not English
if (initialLang !== 'en') {
    loadTranslation(initialLang).then((translations) => {
        i18n.addResourceBundle(initialLang, 'translation', translations, true, true);
    });
}

// Helper to change language and persist choice
export const changeLanguage = async (code: LanguageCode): Promise<void> => {
    // Load translations if not already loaded
    if (!i18n.hasResourceBundle(code, 'translation')) {
        const translations = await loadTranslation(code);
        i18n.addResourceBundle(code, 'translation', translations, true, true);
    }
    await i18n.changeLanguage(code);
    localStorage.setItem('game-insights-language', code);
};

export default i18n;
