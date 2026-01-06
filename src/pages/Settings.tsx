/**
 * Settings Page - Obsidian Analytics Design
 *
 * Premium settings page with:
 * - Glassmorphism cards
 * - Animated section reveals
 * - Refined form inputs
 * - Status indicators with warm orange theme
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Key, Check, AlertCircle, Loader2, Eye, EyeOff, Globe, Settings, Shield, Zap, Gauge } from 'lucide-react';
import { usePerformance } from '../context/PerformanceContext';
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

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

export function SettingsPage() {
    const { t, i18n } = useTranslation();
    const { mode, setMode, fps, isLowEndDevice, enableBlur, enableAnimations } = usePerformance();
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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-2xl"
        >
            {/* Page Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl blur-xl" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        <Settings className="w-6 h-6 text-[#DA7756]" />
                    </div>
                </motion.div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-white">
                        {t('pages.settings.title')}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">{t('pages.settings.subtitle')}</p>
                </div>
            </motion.div>

            {/* Language Selection Section */}
            <motion.div variants={itemVariants}>
                <SettingsCard
                    icon={Globe}
                    iconColor="blue"
                    title={t('common.language')}
                    description={t('common.languageSelector')}
                >
                    <div className="flex gap-2 flex-wrap">
                        {languages.map((lang, index) => {
                            const isSelected = i18n.language === lang.code;
                            return (
                                <motion.button
                                    key={lang.code}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 + 0.3, type: 'spring' }}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                        isSelected
                                            ? 'text-white bg-[#DA7756]/20 border border-[#DA7756]/30'
                                            : 'text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:text-slate-200'
                                    }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="langSelector"
                                            className="absolute inset-0 bg-[#DA7756]/10 rounded-xl"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative">{lang.nativeName}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </SettingsCard>
            </motion.div>

            {/* Performance Mode Section */}
            <motion.div variants={itemVariants}>
                <SettingsCard
                    icon={Gauge}
                    iconColor="amber"
                    title="Performance Mode"
                    description="Optimize visual effects for better performance"
                >
                    <div className="space-y-4">
                        {/* FPS & Device Info */}
                        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <Zap className={`w-4 h-4 ${fps >= 45 ? 'text-[#DA7756]' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`} />
                                <span className="text-sm text-slate-400">Current FPS</span>
                            </div>
                            <span className={`font-mono text-sm font-semibold ${fps >= 45 ? 'text-[#DA7756]' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {fps}
                            </span>
                        </div>

                        {isLowEndDevice && (
                            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span className="text-xs text-amber-300">Low-end device detected. Consider using Lite mode.</span>
                            </div>
                        )}

                        {/* Mode Selector */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'auto', label: 'Auto', desc: 'Adapts to your device' },
                                { value: 'full', label: 'Full', desc: 'All visual effects' },
                                { value: 'balanced', label: 'Balanced', desc: 'No blur effects' },
                                { value: 'lite', label: 'Lite', desc: 'Minimal animations' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setMode(option.value as 'auto' | 'full' | 'balanced' | 'lite')}
                                    className={`relative p-3 rounded-xl text-left transition-all duration-200 ${
                                        mode === option.value
                                            ? 'bg-[#DA7756]/20 border border-[#DA7756]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className={`text-sm font-medium ${mode === option.value ? 'text-[#DA7756]' : 'text-slate-300'}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{option.desc}</div>
                                    {mode === option.value && (
                                        <Check className="absolute top-2 right-2 w-3 h-3 text-[#DA7756]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Current Status */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/[0.04]">
                            <span>Blur effects: <span className={enableBlur ? 'text-[#DA7756]' : 'text-slate-400'}>{enableBlur ? 'On' : 'Off'}</span></span>
                            <span>Animations: <span className={enableAnimations ? 'text-[#DA7756]' : 'text-slate-400'}>{enableAnimations ? 'On' : 'Off'}</span></span>
                        </div>
                    </div>
                </SettingsCard>
            </motion.div>

            {/* OpenAI API Key Section */}
            <motion.div variants={itemVariants}>
                <SettingsCard
                    icon={Key}
                    iconColor="violet"
                    title={t('pages.settings.openai.title')}
                    description={t('pages.settings.openai.subtitle')}
                >
                    <div className="space-y-4">
                        {/* API Key Input */}
                        <div className="relative group">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setStatus('idle');
                                }}
                                placeholder={t('pages.settings.openai.placeholder')}
                                className="w-full px-4 py-3 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#DA7756]/50 focus:bg-white/[0.05] transition-all font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Status Indicator */}
                        {status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                                    status === 'valid'
                                        ? 'bg-[#DA7756]/10 text-[#DA7756]'
                                        : status === 'invalid'
                                        ? 'bg-rose-500/10 text-rose-400'
                                        : 'bg-white/[0.03] text-slate-400'
                                }`}
                            >
                                {status === 'validating' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {status === 'valid' && <Check className="w-4 h-4" />}
                                {status === 'invalid' && <AlertCircle className="w-4 h-4" />}
                                <span className="font-medium">
                                    {status === 'validating' && t('pages.settings.openai.status.validating')}
                                    {status === 'valid' && t('pages.settings.openai.status.valid')}
                                    {status === 'invalid' && t('pages.settings.openai.status.invalid')}
                                </span>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleValidate}
                                disabled={!apiKey || status === 'validating'}
                                className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                            >
                                {t('actions.validate')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={status !== 'valid'}
                                className="px-4 py-2.5 bg-[#DA7756]/20 border border-[#DA7756]/30 text-[#DA7756] hover:bg-[#DA7756]/30 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                            >
                                {saved ? t('actions.saved') : t('actions.saveKey')}
                            </motion.button>
                            {apiKey && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleClear}
                                    className="px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-sm font-medium"
                                >
                                    {t('actions.clear')}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-start gap-3">
                            <Shield className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-slate-400">
                                    <span className="text-slate-300 font-medium">{t('pages.settings.openai.info.title')}</span>{' '}
                                    {t('pages.settings.openai.info.description')}
                                </p>
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-sm text-[#DA7756] hover:text-[#C15F3C] transition-colors"
                                >
                                    {t('pages.settings.openai.info.link')}
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </SettingsCard>
            </motion.div>

            {/* Anomaly Detection Configuration */}
            <motion.div variants={itemVariants}>
                <AnomalyConfigPanel />
            </motion.div>
        </motion.div>
    );
}

/**
 * Reusable Settings Card with glassmorphism
 */
function SettingsCard({
    icon: Icon,
    iconColor,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    iconColor: 'orange' | 'blue' | 'violet' | 'amber';
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    const colorClasses = {
        orange: 'bg-[#DA7756]/10 text-[#DA7756] border-[#DA7756]/20',
        blue: 'bg-[#8F8B82]/10 text-[#8F8B82] border-[#8F8B82]/20',
        violet: 'bg-[#C15F3C]/10 text-[#C15F3C] border-[#C15F3C]/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    return (
        <div className="relative group">
            {/* Subtle glow on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/5 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] overflow-hidden">
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-xl ${colorClasses[iconColor]} border flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">{title}</h3>
                            <p className="text-xs text-slate-500">{description}</p>
                        </div>
                    </div>

                    {/* Content */}
                    {children}
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
