/**
 * Settings Page - API key and analytics configuration
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Check, AlertCircle, Loader2, Eye, EyeOff, Globe } from 'lucide-react';
import { validateApiKey } from '../services/openai';
import { AnomalyConfigPanel } from '../components/settings';
import { languages, changeLanguage, type LanguageCode } from '../i18n';

// Simple local storage for API key (in production, use secure storage)
const API_KEY_STORAGE = 'game_insights_openai_key';

export function getStoredApiKey(): string {
    return localStorage.getItem(API_KEY_STORAGE) || '';
}

function setStoredApiKey(key: string): void {
    if (key) {
        localStorage.setItem(API_KEY_STORAGE, key);
    } else {
        localStorage.removeItem(API_KEY_STORAGE);
    }
}

export function SettingsPage() {
    const { t, i18n } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = getStoredApiKey();
        if (stored) {
            setApiKey(stored);
            setStatus('valid');
        }
    }, []);

    const handleLanguageChange = (code: LanguageCode) => {
        changeLanguage(code);
    };

    const handleValidate = async () => {
        if (!apiKey.startsWith('sk-')) {
            setStatus('invalid');
            return;
        }

        setStatus('validating');
        const isValid = await validateApiKey(apiKey);
        setStatus(isValid ? 'valid' : 'invalid');
    };

    const handleSave = () => {
        if (status === 'valid') {
            setStoredApiKey(apiKey);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleClear = () => {
        setApiKey('');
        setStoredApiKey('');
        setStatus('idle');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-th-text-primary">{t('pages.settings.title')}</h1>
                <p className="text-th-text-muted mt-1">{t('pages.settings.subtitle')}</p>
            </div>

            {/* Language Selection Section */}
            <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('common.language')}</h3>
                        <p className="text-sm text-zinc-500">{t('common.languageSelector')}</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`px-4 py-2 rounded-xl border transition-colors ${
                                i18n.language === lang.code
                                    ? 'bg-accent-primary text-white border-accent-primary'
                                    : 'bg-bg-elevated border-white/[0.1] text-zinc-300 hover:bg-bg-card-hover'
                            }`}
                        >
                            {lang.nativeName}
                        </button>
                    ))}
                </div>
            </div>

            {/* OpenAI API Key Section */}
            <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                        <Key className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('pages.settings.openai.title')}</h3>
                        <p className="text-sm text-zinc-500">{t('pages.settings.openai.subtitle')}</p>
                    </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setStatus('idle');
                            }}
                            placeholder={t('pages.settings.openai.placeholder')}
                            className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-white/[0.1] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-accent-primary transition-colors"
                        />
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Status Indicator */}
                    {status !== 'idle' && (
                        <div className={`flex items-center gap-2 text-sm ${status === 'valid' ? 'text-green-500' :
                            status === 'invalid' ? 'text-red-500' :
                                'text-zinc-400'
                            }`}>
                            {status === 'validating' && <Loader2 className="w-4 h-4 animate-spin" />}
                            {status === 'valid' && <Check className="w-4 h-4" />}
                            {status === 'invalid' && <AlertCircle className="w-4 h-4" />}
                            <span>
                                {status === 'validating' && t('pages.settings.openai.status.validating')}
                                {status === 'valid' && t('pages.settings.openai.status.valid')}
                                {status === 'invalid' && t('pages.settings.openai.status.invalid')}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleValidate}
                            disabled={!apiKey || status === 'validating'}
                            className="px-4 py-2 bg-bg-elevated border border-white/[0.1] rounded-xl text-zinc-300 hover:bg-bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('actions.validate')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={status !== 'valid'}
                            className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saved ? t('actions.saved') : t('actions.saveKey')}
                        </button>
                        {apiKey && (
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                {t('actions.clear')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-bg-elevated rounded-xl">
                    <p className="text-sm text-zinc-400">
                        <span className="text-zinc-300 font-medium">{t('pages.settings.openai.info.title')}</span> {t('pages.settings.openai.info.description')}
                    </p>
                    <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-accent-primary hover:underline"
                    >
                        {t('pages.settings.openai.info.link')} -&gt;
                    </a>
                </div>
            </div>

            {/* Anomaly Detection Configuration */}
            <AnomalyConfigPanel />
        </div>
    );
}

export default SettingsPage;
