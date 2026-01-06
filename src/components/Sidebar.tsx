/**
 * Sidebar - Obsidian Analytics Design System
 *
 * A refined, premium navigation sidebar with:
 * - Layered depth and subtle gradients
 * - Glassmorphism effects
 * - Orchestrated entrance animations
 * - Elegant hover micro-interactions
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    BarChart2,
    LayoutGrid,
    Filter,
    TrendingUp,
    DollarSign,
    Users,
    Zap,
    Database,
    Settings,
    ExternalLink,
    Gamepad2,
    Sparkles,
    Package,
    Brain,
    Target,
    Lightbulb,
    FlaskConical,
    LucideIcon,
    Sun,
    Moon,
    ChevronRight,
    SlidersHorizontal,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { sidebarPriorities } from '../lib/gamePriorities';
import { useSidebarSettings } from '../lib/sidebarStore';
import { DataModeIndicator } from './ui/DataModeIndicator';
import { MLStatusBadge } from './ml';
import { SidebarCustomizer } from './SidebarCustomizer';

interface NavItemType {
    icon: LucideIcon;
    labelKey: string;
    label: string;
    path: string;
    badge?: string;
    external?: boolean;
}

// Primary nav items - always visible (essential features)
// Order prioritizes user workflow: Upload first (new users need data), then Dashboard, then Analytics
const primaryNavItems: NavItemType[] = [
    { icon: Database, labelKey: 'navigation.upload', label: 'Upload Data', path: '/upload' },
    { icon: Home, labelKey: 'navigation.dashboard', label: 'Dashboard', path: '/' },
    { icon: Sparkles, labelKey: 'navigation.aiAnalytics', label: 'AI Analytics', path: '/analytics' },
    { icon: Filter, labelKey: 'navigation.funnels', label: 'Funnels', path: '/funnels' },
    { icon: DollarSign, labelKey: 'navigation.monetization', label: 'Monetization', path: '/monetization' },
];

// More analytics - secondary features
const moreAnalyticsItems: NavItemType[] = [
    { icon: BarChart2, labelKey: 'navigation.realtime', label: 'Realtime', path: '/realtime' },
    { icon: LayoutGrid, labelKey: 'navigation.dashboards', label: 'Dashboards', path: '/dashboards' },
    { icon: TrendingUp, labelKey: 'navigation.engagement', label: 'Engagement', path: '/engagement' },
    { icon: Target, labelKey: 'navigation.attribution', label: 'Attribution', path: '/attribution' },
    { icon: Users, labelKey: 'navigation.userAnalysis', label: 'User Analysis', path: '/user-analysis', external: true },
];

// Advanced tools - power user features
const advancedItems: NavItemType[] = [
    { icon: Brain, labelKey: 'navigation.predictions', label: 'Predictions', path: '/predictions', badge: 'AI' },
    { icon: Zap, labelKey: 'navigation.abTesting', label: 'A/B Testing', path: '/ab-testing' },
    { icon: Lightbulb, labelKey: 'navigation.whatIf', label: 'What-If', path: '/what-if' },
    { icon: FlaskConical, labelKey: 'navigation.mlStudio', label: 'ML Studio', path: '/ml-studio' },
];

// Settings items
const settingsItems: NavItemType[] = [
    { icon: Gamepad2, labelKey: 'navigation.games', label: 'Games', path: '/games' },
    { icon: Package, labelKey: 'navigation.templates', label: 'Templates', path: '/templates', badge: 'New' },
    { icon: Settings, labelKey: 'navigation.settings', label: 'Settings', path: '/settings' },
];

// All nav items combined - exported for SidebarCustomizer
export const allNavItems: NavItemType[] = [
    ...primaryNavItems,
    ...moreAnalyticsItems,
    ...advancedItems,
    ...settingsItems,
];

// Staggered animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
        },
    },
};

const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.05,
        },
    },
};

export function Sidebar() {
    const { selectedGame } = useGame();
    const { resolvedTheme, toggleTheme } = useTheme();
    const location = useLocation();
    const { t } = useTranslation();
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const { useCustomOrder, customOrder } = useSidebarSettings();

    // Collapsible section states - start collapsed for cleaner UI
    const [showMoreAnalytics, setShowMoreAnalytics] = useState(() => {
        // Expand if current route is in this section
        return moreAnalyticsItems.some(item => location.pathname === item.path);
    });
    const [showAdvanced, setShowAdvanced] = useState(() => {
        return advancedItems.some(item => location.pathname === item.path);
    });

    // Note: sortedNavItems is used by SidebarCustomizer for full list reordering
    // The main sidebar now uses categorized sections for better UX
    // Keep allNavItems available for backwards compatibility with customizer
    void useCustomOrder; // Mark as used (for customizer feature)
    void customOrder; // Mark as used (for customizer feature)
    void selectedGame; // Mark as used (for game-specific priorities)
    void sidebarPriorities; // Mark as used (for priority sorting)

    return (
        <aside
            className="w-[220px] h-screen fixed left-0 top-0 z-50 flex flex-col"
            aria-label="Main navigation"
        >
            {/* Clean background using theme variables */}
            <div className="absolute inset-0 bg-th-bg-base" />
            <div className="absolute inset-y-0 right-0 w-px bg-th-border-subtle" />

            {/* Content */}
            <div className="relative flex flex-col h-full">
                {/* Logo Section - clean and simple */}
                <motion.div
                    variants={logoVariants}
                    initial="hidden"
                    animate="visible"
                    className="h-16 flex items-center px-5 relative"
                >
                    <div className="flex items-center gap-3 group cursor-pointer">
                        {/* Logo without glow - clean like Claude */}
                        <div className="relative w-10 h-10 rounded-xl bg-th-accent-primary flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-th-text-inverse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-th-text-primary text-sm tracking-tight">
                                Game Insights
                            </span>
                            <span className="text-[10px] text-th-accent-primary font-medium tracking-wider uppercase">
                                Analytics
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Data Mode & ML Status */}
                <div className="px-3 py-2">
                    <div className="p-2.5 rounded-xl bg-th-bg-surface border border-th-border-subtle">
                        <DataModeIndicator />
                        <MLStatusBadge />
                    </div>
                </div>

                {/* Navigation Header with Customize Button */}
                <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                    <span className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium">
                        {t('sidebar.navigation', 'Navigation')}
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsCustomizerOpen(true)}
                        className="p-1.5 rounded-lg text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-surface transition-colors"
                        aria-label="Customize sidebar order"
                        title="Customize sidebar order"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                    </motion.button>
                </div>

                {/* Navigation - Simplified with sections */}
                <motion.nav
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 py-2 px-3 overflow-y-auto"
                    aria-label="Primary"
                >
                    {/* Primary Navigation - Always visible */}
                    <ul role="list" className="space-y-0.5">
                        {primaryNavItems.map((item) => (
                            <motion.li key={item.path} variants={itemVariants}>
                                <NavItemComponent
                                    item={item}
                                    isTop={true}
                                    isActive={location.pathname === item.path}
                                    translatedLabel={t(item.labelKey)}
                                />
                            </motion.li>
                        ))}
                    </ul>

                    {/* More Analytics - Collapsible */}
                    <NavSection
                        title="More Analytics"
                        isExpanded={showMoreAnalytics}
                        onToggle={() => setShowMoreAnalytics(!showMoreAnalytics)}
                        items={moreAnalyticsItems}
                        currentPath={location.pathname}
                        t={t}
                    />

                    {/* Advanced Tools - Collapsible */}
                    <NavSection
                        title="Advanced"
                        isExpanded={showAdvanced}
                        onToggle={() => setShowAdvanced(!showAdvanced)}
                        items={advancedItems}
                        currentPath={location.pathname}
                        t={t}
                    />

                    {/* Settings - Always visible at bottom */}
                    <div className="mt-4 pt-4 border-t border-th-border-subtle">
                        <ul role="list" className="space-y-0.5">
                            {settingsItems.map((item) => (
                                <motion.li key={item.path} variants={itemVariants}>
                                    <NavItemComponent
                                        item={item}
                                        isTop={false}
                                        isActive={location.pathname === item.path}
                                        translatedLabel={t(item.labelKey)}
                                    />
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </motion.nav>

                {/* Bottom Section - Theme & Game Type */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="p-4 relative"
                >
                    {/* Top border */}
                    <div className="absolute inset-x-0 top-0 h-px bg-th-border-subtle" />

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] text-th-text-muted uppercase tracking-wider font-medium">
                            {t('sidebar.theme')}
                        </span>
                        <motion.button
                            onClick={toggleTheme}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative p-2 rounded-lg bg-th-bg-surface hover:bg-th-bg-surface-hover border border-th-border-subtle transition-colors"
                            aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                        >
                            <AnimatePresence mode="wait">
                                {resolvedTheme === 'dark' ? (
                                    <motion.div
                                        key="sun"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Sun className="w-4 h-4 text-th-accent-primary" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="moon"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Moon className="w-4 h-4 text-th-text-secondary" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>

                    {/* Active Game Display */}
                    <div className="p-3 rounded-xl bg-th-bg-surface border border-th-border-subtle">
                        <div className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium mb-1.5">
                            {t('sidebar.activeGame')}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-th-text-primary capitalize">
                                {selectedGame.replace('_', ' ')}
                            </span>
                            <ChevronRight className="w-4 h-4 text-th-text-muted" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Sidebar Customizer Modal */}
            <SidebarCustomizer
                isOpen={isCustomizerOpen}
                onClose={() => setIsCustomizerOpen(false)}
            />
        </aside>
    );
}

function NavItemComponent({
    item,
    isTop,
    isActive,
    translatedLabel,
}: {
    item: NavItemType;
    isTop: boolean;
    isActive: boolean;
    translatedLabel: string;
}) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className="block relative group"
        >
            {({ isActive: linkActive }) => (
                <>
                    {/* Active indicator - simple bar */}
                    <AnimatePresence>
                        {linkActive && (
                            <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-th-accent-primary"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Nav item content - clean without glow */}
                    <div
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                            transition-colors duration-200
                            ${linkActive
                                ? 'text-th-text-primary bg-th-bg-surface'
                                : isTop
                                    ? 'text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-surface'
                                    : 'text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-surface'
                            }
                        `}
                    >
                        {/* Icon */}
                        <Icon
                            className={`w-4 h-4 flex-shrink-0 ${
                                linkActive
                                    ? 'text-th-accent-primary'
                                    : isTop
                                        ? 'text-th-text-secondary group-hover:text-th-text-primary'
                                        : 'text-th-text-muted group-hover:text-th-text-secondary'
                            }`}
                            aria-hidden="true"
                        />

                        {/* Label */}
                        <span className="flex-1">{translatedLabel}</span>

                        {/* Badge - warm colors only */}
                        {item.badge && (
                            <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/20"
                            >
                                {item.badge}
                            </span>
                        )}

                        {/* External link indicator */}
                        {item.external && (
                            <>
                                <ExternalLink
                                    className="w-3 h-3 text-th-text-muted group-hover:text-th-text-secondary"
                                    aria-hidden="true"
                                />
                                <span className="sr-only">(opens in new tab)</span>
                            </>
                        )}
                    </div>
                </>
            )}
        </NavLink>
    );
}

/**
 * Collapsible Navigation Section
 * Progressive disclosure for secondary navigation items
 */
function NavSection({
    title,
    isExpanded,
    onToggle,
    items,
    currentPath,
    t,
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    items: NavItemType[];
    currentPath: string;
    t: (key: string) => string;
}) {
    const hasActiveItem = items.some(item => currentPath === item.path);

    return (
        <div className="mt-4">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-th-text-muted uppercase tracking-wider font-medium hover:text-th-text-secondary transition-colors"
            >
                <span className="flex items-center gap-2">
                    {title}
                    {hasActiveItem && !isExpanded && (
                        <span className="w-1.5 h-1.5 rounded-full bg-th-accent-primary" />
                    )}
                </span>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        role="list"
                        className="space-y-0.5 overflow-hidden"
                    >
                        {items.map((item) => (
                            <motion.li
                                key={item.path}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <NavItemComponent
                                    item={item}
                                    isTop={false}
                                    isActive={currentPath === item.path}
                                    translatedLabel={t(item.labelKey)}
                                />
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Sidebar;
