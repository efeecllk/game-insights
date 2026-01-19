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
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Check, AlertCircle, Loader2, Eye, EyeOff, Globe, Settings, Shield, Zap, Gauge, Sun, Moon, Monitor } from 'lucide-react';
import { usePerformance } from '../context/PerformanceContext';
import { useTheme } from '../context/ThemeContext';
import { validateApiKey } from '../services/openai';
import { AnomalyConfigPanel, AISettingsPanel } from '../components/settings';
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
    const { theme, setTheme, resolvedTheme } = useTheme();
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
                    <div className="absolute inset-0 bg-th-accent-primary/20 rounded-2xl" />
                    <div className="relative w-14 h-14 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                        <Settings className="w-6 h-6 text-th-accent-primary" />
                    </div>
                </motion.div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-th-text-primary">
                        {t('pages.settings.title')}
                    </h1>
                    <p className="text-sm text-th-text-muted mt-0.5">{t('pages.settings.subtitle')}</p>
                </div>
            </motion.div>

            {/* Appearance Section - Theme Toggle */}
            <motion.div variants={itemVariants}>
                <SettingsCard
                    icon={Sun}
                    iconColor="orange"
                    title="Appearance"
                    description="Choose your preferred color theme"
                >
                    <div className="space-y-4">
                        {/* Theme Mode Selector */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'light', label: 'Light', icon: Sun, desc: 'Cream backgrounds' },
                                { value: 'dark', label: 'Dark', icon: Moon, desc: 'Slate backgrounds' },
                                { value: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
                            ].map((option) => {
                                const isSelected = theme === option.value;
                                const IconComponent = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                                        className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-th-accent-primary-muted border border-th-accent-primary/30'
                                                : 'bg-th-bg-elevated border border-th-border hover:bg-th-bg-surface-hover'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-th-accent-primary/20' : 'bg-th-bg-surface'}`}>
                                                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-th-accent-primary' : 'text-th-text-muted'}`} />
                                            </div>
                                            <div className={`text-sm font-medium ${isSelected ? 'text-th-accent-primary' : 'text-th-text-secondary'}`}>
                                                {option.label}
                                            </div>
                                            <div className="text-[10px] text-th-text-muted text-center">{option.desc}</div>
                                        </div>
                                        {isSelected && (
                                            <Check className="absolute top-2 right-2 w-4 h-4 text-th-accent-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Current Theme Preview */}
                        <div className="flex items-center justify-between p-3 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                            <div className="flex items-center gap-3">
                                <AnimatePresence mode="wait">
                                    {resolvedTheme === 'dark' ? (
                                        <motion.div
                                            key="moon-icon"
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Moon className="w-4 h-4 text-th-text-secondary" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="sun-icon"
                                            initial={{ rotate: 90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: -90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Sun className="w-4 h-4 text-th-accent-primary" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className="text-sm text-th-text-secondary">Current theme</span>
                            </div>
                            <span className="text-sm font-medium text-th-text-primary capitalize">{resolvedTheme}</span>
                        </div>
                    </div>
                </SettingsCard>
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
                                            ? 'text-th-text-primary bg-th-accent-primary-muted border border-th-accent-primary/30'
                                            : 'text-th-text-secondary bg-th-bg-elevated border border-th-border hover:bg-th-bg-surface-hover hover:text-th-text-primary'
                                    }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="langSelector"
                                            className="absolute inset-0 bg-th-accent-primary/10 rounded-xl"
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
                        <div className="flex items-center justify-between p-3 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                            <div className="flex items-center gap-3">
                                <Zap className={`w-4 h-4 ${fps >= 45 ? 'text-th-success' : fps >= 30 ? 'text-th-warning' : 'text-th-error'}`} />
                                <span className="text-sm text-th-text-secondary">Current FPS</span>
                            </div>
                            <span className={`font-mono text-sm font-semibold ${fps >= 45 ? 'text-th-success' : fps >= 30 ? 'text-th-warning' : 'text-th-error'}`}>
                                {fps}
                            </span>
                        </div>

                        {isLowEndDevice && (
                            <div className="flex items-center gap-2 p-3 bg-th-warning-muted border border-th-warning/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-th-warning flex-shrink-0" />
                                <span className="text-xs text-th-warning">Low-end device detected. Consider using Lite mode.</span>
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
                                            ? 'bg-th-accent-primary-muted border border-th-accent-primary/30'
                                            : 'bg-th-bg-elevated border border-th-border hover:bg-th-bg-surface-hover'
                                    }`}
                                >
                                    <div className={`text-sm font-medium ${mode === option.value ? 'text-th-accent-primary' : 'text-th-text-secondary'}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-[10px] text-th-text-muted mt-0.5">{option.desc}</div>
                                    {mode === option.value && (
                                        <Check className="absolute top-2 right-2 w-3 h-3 text-th-accent-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Current Status */}
                        <div className="flex items-center justify-between text-xs text-th-text-muted pt-2 border-t border-th-border-subtle">
                            <span>Blur effects: <span className={enableBlur ? 'text-th-accent-primary' : 'text-th-text-secondary'}>{enableBlur ? 'On' : 'Off'}</span></span>
                            <span>Animations: <span className={enableAnimations ? 'text-th-accent-primary' : 'text-th-text-secondary'}>{enableAnimations ? 'On' : 'Off'}</span></span>
                        </div>
                    </div>
                </SettingsCard>
            </motion.div>

            {/* AI Configuration Section */}
            <motion.div variants={itemVariants}>
                <AISettingsPanel />
            </motion.div>

            {/* OpenAI API Key Section (Legacy) */}
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
                                className="w-full px-4 py-3 pr-12 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-disabled focus:outline-none focus:border-th-accent-primary/50 focus:bg-th-bg-surface-hover transition-all font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary transition-colors"
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
                                        ? 'bg-th-success-muted text-th-success'
                                        : status === 'invalid'
                                        ? 'bg-th-error-muted text-th-error'
                                        : 'bg-th-bg-elevated text-th-text-muted'
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
                                className="px-4 py-2.5 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-secondary hover:bg-th-bg-surface-hover hover:text-th-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                            >
                                {t('actions.validate')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={status !== 'valid'}
                                className="px-4 py-2.5 bg-th-accent-primary-muted border border-th-accent-primary/30 text-th-accent-primary hover:bg-th-accent-primary/30 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                            >
                                {saved ? t('actions.saved') : t('actions.saveKey')}
                            </motion.button>
                            {apiKey && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleClear}
                                    className="px-4 py-2.5 text-th-error hover:bg-th-error-muted rounded-xl transition-all text-sm font-medium"
                                >
                                    {t('actions.clear')}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 rounded-xl bg-th-bg-elevated border border-th-border">
                        <div className="flex items-start gap-3">
                            <Shield className="w-4 h-4 text-th-text-muted mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-th-text-muted">
                                    <span className="text-th-text-secondary font-medium">{t('pages.settings.openai.info.title')}</span>{' '}
                                    {t('pages.settings.openai.info.description')}
                                </p>
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-sm text-th-accent-primary hover:text-th-accent-primary-hover transition-colors"
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
        orange: 'bg-th-accent-primary-muted text-th-accent-primary border-th-accent-primary/20',
        blue: 'bg-[#A68B5B]/15 text-[#A68B5B] border-[#A68B5B]/20',
        violet: 'bg-[#C15F3C]/15 text-[#C15F3C] border-[#C15F3C]/20',
        amber: 'bg-th-warning-muted text-th-warning border-th-warning/20',
    };

    return (
        <div className="relative group">
            <div className="bg-th-bg-surface rounded-2xl p-6 border border-th-border group-hover:border-th-border-strong transition-colors duration-200 overflow-hidden">
                <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-xl ${colorClasses[iconColor]} border flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-th-text-primary">{title}</h3>
                            <p className="text-xs text-th-text-muted">{description}</p>
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
