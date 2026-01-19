/**
 * Sidebar - Obsidian Analytics Design System
 *
 * A refined, premium navigation sidebar with:
 * - Layered depth and subtle gradients
 * - Glassmorphism effects
 * - Orchestrated entrance animations
 * - Elegant hover micro-interactions
 * - Customizable order via drag-and-drop
 * - Collapsible state for more screen space
 */

import { useState, useMemo, memo, lazy, Suspense } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    BarChart2,
    LayoutGrid,
    Filter,
    DollarSign,
    Zap,
    Database,
    Settings,
    ExternalLink,
    Package,
    Brain,
    Target,
    Lightbulb,
    FlaskConical,
    LucideIcon,
    Sun,
    Moon,
    ChevronRight,
    ChevronLeft,
    SlidersHorizontal,
    Pin,
    Plus,
    Loader2,
    Bot,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebarSettings, DEFAULT_SIDEBAR_ORDER } from '../lib/sidebarStore';
import { DataModeIndicator } from './ui/DataModeIndicator';
import { MLStatusBadge } from './ml';
import { useDashboards } from '../hooks/useDashboards';
import type { Dashboard } from '../lib/dashboardStore';

// Lazy load SidebarCustomizer modal (only shown when customize button clicked)
const SidebarCustomizer = lazy(() => import('./SidebarCustomizer').then(m => ({ default: m.SidebarCustomizer })));

interface NavItemType {
    icon: LucideIcon;
    labelKey: string;
    label: string;
    path: string;
    badge?: string;
    external?: boolean;
}

// Primary nav items - always visible (essential features)
// Simplified: Only 4 core items for cleaner UX
const primaryNavItems: NavItemType[] = [
    { icon: Database, labelKey: 'navigation.upload', label: 'Upload Data', path: '/upload' },
    { icon: Home, labelKey: 'navigation.dashboard', label: 'Dashboard', path: '/' },
    { icon: Bot, labelKey: 'navigation.aiAnalytics', label: 'Analytics', path: '/analytics', badge: 'AI' },
    { icon: DollarSign, labelKey: 'navigation.monetization', label: 'Revenue', path: '/monetization' },
];

// More analytics - shown after user has data
const moreAnalyticsItems: NavItemType[] = [
    { icon: Filter, labelKey: 'navigation.funnels', label: 'Funnels', path: '/funnels' },
    { icon: BarChart2, labelKey: 'navigation.realtime', label: 'Realtime', path: '/realtime' },
    { icon: LayoutGrid, labelKey: 'navigation.dashboards', label: 'Dashboards', path: '/dashboards' },
    { icon: Target, labelKey: 'navigation.attribution', label: 'Attribution', path: '/attribution' },
];

// Advanced tools - power user features (collapsed by default)
const advancedItems: NavItemType[] = [
    { icon: Brain, labelKey: 'navigation.predictions', label: 'Predictions', path: '/predictions', badge: 'AI' },
    { icon: Zap, labelKey: 'navigation.abTesting', label: 'A/B Testing', path: '/ab-testing' },
    { icon: Lightbulb, labelKey: 'navigation.whatIf', label: 'What-If', path: '/what-if' },
    { icon: FlaskConical, labelKey: 'navigation.mlStudio', label: 'ML Studio', path: '/ml-studio' },
];

// Settings items - minimal
const settingsItems: NavItemType[] = [
    { icon: Package, labelKey: 'navigation.templates', label: 'Templates', path: '/templates' },
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

// Create a map from label to nav item for quick lookup
const navItemMap = new Map<string, NavItemType>(
    allNavItems.map(item => [item.label, item])
);

// Define section boundaries based on default order
const primaryLabels = new Set(['Upload Data', 'Dashboard', 'Analytics', 'Revenue']);
const moreAnalyticsLabels = new Set(['Funnels', 'Realtime', 'Dashboards', 'Attribution']);
const advancedLabels = new Set(['Predictions', 'A/B Testing', 'What-If', 'ML Studio']);
const settingsLabels = new Set(['Templates', 'Settings']);

export function Sidebar() {
    const { selectedGame } = useGame();
    const { resolvedTheme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const {
        useCustomOrder,
        customOrder,
        collapsed,
        toggleCollapsed,
        isPinned,
        togglePinned
    } = useSidebarSettings();

    // Dashboard data for sidebar
    const { dashboards, loading: dashboardsLoading, createNew: createNewDashboard } = useDashboards();

    // Collapsible section states - start collapsed for cleaner UI
    const [showMoreAnalytics, setShowMoreAnalytics] = useState(() => {
        // Expand if current route is in this section
        return moreAnalyticsItems.some(item => location.pathname === item.path);
    });
    const [showAdvanced, setShowAdvanced] = useState(() => {
        return advancedItems.some(item => location.pathname === item.path);
    });
    const [showMyDashboards, setShowMyDashboards] = useState(() => {
        // Expand if current route is a dashboard view
        return location.pathname.startsWith('/dashboards/');
    });

    // Get the effective order - use custom order when enabled, otherwise default
    const effectiveOrder = useCustomOrder ? customOrder : DEFAULT_SIDEBAR_ORDER;

    // Sort items according to the effective order, maintaining section groupings
    const sortedItems = useMemo(() => {
        // Get items for each section, sorted by effective order
        const sortSection = (labels: Set<string>) => {
            return effectiveOrder
                .filter(label => labels.has(label))
                .map(label => navItemMap.get(label))
                .filter((item): item is NavItemType => item !== undefined);
        };

        return {
            primary: sortSection(primaryLabels),
            moreAnalytics: sortSection(moreAnalyticsLabels),
            advanced: sortSection(advancedLabels),
            settings: sortSection(settingsLabels),
        };
    }, [effectiveOrder]);

    // Get pinned items that should appear at top
    const pinnedItems = useMemo(() => {
        return effectiveOrder
            .filter(label => isPinned(label))
            .map(label => navItemMap.get(label))
            .filter((item): item is NavItemType => item !== undefined);
    }, [effectiveOrder, isPinned]);

    void selectedGame; // Mark as used (for game-specific priorities)

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 64 : 220 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen fixed left-0 top-0 z-50 flex flex-col"
            aria-label="Main navigation"
        >
            {/* Clean background using theme variables */}
            <div className="absolute inset-0 bg-th-bg-base" />
            <div className="absolute inset-y-0 right-0 w-px bg-th-border-subtle" />

            {/* Content */}
            <div className="relative flex flex-col h-full overflow-hidden">
                {/* Logo Section - clean and simple */}
                <motion.div
                    variants={logoVariants}
                    initial="hidden"
                    animate="visible"
                    className="h-16 flex items-center px-3 relative"
                >
                    <div className="flex items-center gap-3 group cursor-pointer">
                        {/* Logo - clean like Claude */}
                        <div className="relative w-10 h-10 rounded-xl bg-th-accent-primary flex items-center justify-center flex-shrink-0">
                            <BarChart2 className="w-5 h-5 text-th-text-inverse" />
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col overflow-hidden"
                                >
                                    <span className="font-display font-bold text-th-text-primary text-sm tracking-tight whitespace-nowrap">
                                        Insights
                                    </span>
                                    <span className="text-[10px] text-th-text-muted font-medium tracking-wider uppercase whitespace-nowrap">
                                        Analytics Studio
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Data Mode & ML Status - only in expanded mode */}
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-3 py-2"
                        >
                            <div className="p-2.5 rounded-xl bg-th-bg-surface border border-th-border-subtle">
                                <DataModeIndicator />
                                <MLStatusBadge />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Header with Customize Button */}
                <div className={`px-3 pt-3 pb-1 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <span className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium">
                            {t('sidebar.navigation', 'Navigation')}
                        </span>
                    )}
                    {!collapsed && (
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
                    )}
                </div>

                {/* Navigation - Uses custom order when enabled */}
                <motion.nav
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 py-2 px-3 overflow-y-auto"
                    aria-label="Primary"
                >
                    {/* Pinned Items - Show at top if any */}
                    {pinnedItems.length > 0 && (
                        <>
                            {!collapsed && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 mb-1">
                                    <Pin className="w-3 h-3 text-th-accent-primary" />
                                    <span className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium">
                                        Pinned
                                    </span>
                                </div>
                            )}
                            <ul role="list" className="space-y-0.5 mb-3">
                                {pinnedItems.map((item) => (
                                    <motion.li key={`pinned-${item.path}`} variants={itemVariants}>
                                        <NavItemComponent
                                            item={item}
                                            isTop={true}
                                            isActive={location.pathname === item.path}
                                            translatedLabel={t(item.labelKey)}
                                            collapsed={collapsed}
                                            showPinButton={!collapsed}
                                            isPinned={true}
                                            onTogglePin={() => togglePinned(item.label)}
                                        />
                                    </motion.li>
                                ))}
                            </ul>
                            {!collapsed && <div className="border-t border-th-border-subtle mb-3" />}
                        </>
                    )}

                    {/* Primary Navigation - Always visible */}
                    <ul role="list" className="space-y-0.5">
                        {sortedItems.primary.map((item) => (
                            <motion.li key={item.path} variants={itemVariants}>
                                <NavItemComponent
                                    item={item}
                                    isTop={true}
                                    isActive={location.pathname === item.path}
                                    translatedLabel={t(item.labelKey)}
                                    collapsed={collapsed}
                                    showPinButton={!collapsed}
                                    isPinned={isPinned(item.label)}
                                    onTogglePin={() => togglePinned(item.label)}
                                />
                            </motion.li>
                        ))}
                    </ul>

                    {/* More Analytics - Collapsible (hidden in collapsed mode) */}
                    {!collapsed && (
                        <NavSection
                            title="More Analytics"
                            isExpanded={showMoreAnalytics}
                            onToggle={() => setShowMoreAnalytics(!showMoreAnalytics)}
                            items={sortedItems.moreAnalytics}
                            currentPath={location.pathname}
                            t={t}
                            isPinned={isPinned}
                            onTogglePin={togglePinned}
                        />
                    )}

                    {/* My Dashboards - Dynamic section showing user dashboards */}
                    {!collapsed && (
                        <MyDashboardsSection
                            dashboards={dashboards}
                            loading={dashboardsLoading}
                            isExpanded={showMyDashboards}
                            onToggle={() => setShowMyDashboards(!showMyDashboards)}
                            currentPath={location.pathname}
                            onCreateNew={async () => {
                                const dashboard = await createNewDashboard('New Dashboard');
                                navigate(`/dashboards/${dashboard.id}`);
                            }}
                        />
                    )}

                    {/* Advanced Tools - Collapsible (hidden in collapsed mode) */}
                    {!collapsed && (
                        <NavSection
                            title="Advanced"
                            isExpanded={showAdvanced}
                            onToggle={() => setShowAdvanced(!showAdvanced)}
                            items={sortedItems.advanced}
                            currentPath={location.pathname}
                            t={t}
                            isPinned={isPinned}
                            onTogglePin={togglePinned}
                        />
                    )}

                    {/* Settings - Always visible at bottom */}
                    <div className={`mt-4 pt-4 border-t border-th-border-subtle ${collapsed ? 'px-0' : ''}`}>
                        <ul role="list" className="space-y-0.5">
                            {sortedItems.settings.map((item) => (
                                <motion.li key={item.path} variants={itemVariants}>
                                    <NavItemComponent
                                        item={item}
                                        isTop={false}
                                        isActive={location.pathname === item.path}
                                        translatedLabel={t(item.labelKey)}
                                        collapsed={collapsed}
                                        showPinButton={false}
                                        isPinned={false}
                                        onTogglePin={() => {}}
                                    />
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </motion.nav>

                {/* Bottom Section - Theme, Collapse toggle & Game Type */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className={`p-3 relative ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}
                >
                    {/* Top border */}
                    <div className="absolute inset-x-0 top-0 h-px bg-th-border-subtle" />

                    {/* Collapse/Expand Toggle */}
                    <motion.button
                        onClick={toggleCollapsed}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            p-2 rounded-lg bg-th-bg-surface hover:bg-th-bg-surface-hover
                            border border-th-border-subtle transition-colors
                            ${collapsed ? 'mx-auto' : 'absolute right-3 top-3'}
                        `}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4 text-th-text-muted" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 text-th-text-muted" />
                        )}
                    </motion.button>

                    {/* Theme Toggle */}
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? '' : 'mb-4 mt-8'}`}>
                        {!collapsed && (
                            <span className="text-[11px] text-th-text-muted uppercase tracking-wider font-medium">
                                {t('sidebar.theme')}
                            </span>
                        )}
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

                </motion.div>
            </div>

            {/* Sidebar Customizer Modal (lazy-loaded) */}
            {isCustomizerOpen && (
                <Suspense fallback={null}>
                    <SidebarCustomizer
                        isOpen={isCustomizerOpen}
                        onClose={() => setIsCustomizerOpen(false)}
                    />
                </Suspense>
            )}
        </motion.aside>
    );
}

const NavItemComponent = memo(function NavItemComponent({
    item,
    isTop,
    isActive,
    translatedLabel,
    collapsed = false,
    showPinButton = false,
    isPinned = false,
    onTogglePin,
}: {
    item: NavItemType;
    isTop: boolean;
    isActive: boolean;
    translatedLabel: string;
    collapsed?: boolean;
    showPinButton?: boolean;
    isPinned?: boolean;
    onTogglePin?: () => void;
}) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className="block relative group"
            title={collapsed ? translatedLabel : undefined}
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

                    {/* Nav item content - adapts to collapsed state */}
                    <div
                        className={`
                            flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-[13px] font-medium
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

                        {/* Label - hidden when collapsed */}
                        {!collapsed && (
                            <span className="flex-1">{translatedLabel}</span>
                        )}

                        {/* Badge - warm colors only (hidden when collapsed) */}
                        {!collapsed && item.badge && (
                            <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/20"
                            >
                                {item.badge}
                            </span>
                        )}

                        {/* Pin button - shown on hover when showPinButton is true */}
                        {!collapsed && showPinButton && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onTogglePin?.();
                                }}
                                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                                    isPinned ? 'text-th-accent-primary' : 'text-th-text-muted hover:text-th-text-secondary'
                                }`}
                                title={isPinned ? 'Unpin from top' : 'Pin to top'}
                            >
                                <Pin className="w-3 h-3" />
                            </button>
                        )}

                        {/* External link indicator (hidden when collapsed) */}
                        {!collapsed && item.external && (
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
});

/**
 * Collapsible Navigation Section
 * Progressive disclosure for secondary navigation items
 */
const NavSection = memo(function NavSection({
    title,
    isExpanded,
    onToggle,
    items,
    currentPath,
    t,
    isPinned,
    onTogglePin,
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    items: NavItemType[];
    currentPath: string;
    t: (key: string) => string;
    isPinned: (label: string) => boolean;
    onTogglePin: (label: string) => void;
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
                                    showPinButton={true}
                                    isPinned={isPinned(item.label)}
                                    onTogglePin={() => onTogglePin(item.label)}
                                />
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
});

/**
 * My Dashboards Section
 * Shows user-created dashboards with quick navigation
 */
const MyDashboardsSection = memo(function MyDashboardsSection({
    dashboards,
    loading,
    isExpanded,
    onToggle,
    currentPath,
    onCreateNew,
}: {
    dashboards: Dashboard[];
    loading: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    currentPath: string;
    onCreateNew: () => void;
}) {
    // Check if we're viewing a specific dashboard
    const activeDashboardId = currentPath.startsWith('/dashboards/')
        ? currentPath.split('/dashboards/')[1]
        : null;
    const hasActiveItem = activeDashboardId !== null;

    // Filter out non-user dashboards (keep all for now, but could filter if needed)
    const userDashboards = dashboards;

    return (
        <div className="mt-4">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-th-text-muted uppercase tracking-wider font-medium hover:text-th-text-secondary transition-colors"
            >
                <span className="flex items-center gap-2">
                    My Dashboards
                    {hasActiveItem && !isExpanded && (
                        <span className="w-1.5 h-1.5 rounded-full bg-th-accent-primary" />
                    )}
                    {!loading && userDashboards.length > 0 && (
                        <span className="text-[10px] text-th-text-muted font-normal">
                            ({userDashboards.length})
                        </span>
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
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {/* Loading state */}
                        {loading && (
                            <div className="px-3 py-4 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-th-text-muted animate-spin" />
                            </div>
                        )}

                        {/* Dashboard list */}
                        {!loading && (
                            <ul role="list" className="space-y-0.5">
                                {userDashboards.map((dashboard) => (
                                    <motion.li
                                        key={dashboard.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <DashboardNavItem
                                            dashboard={dashboard}
                                            isActive={activeDashboardId === dashboard.id}
                                        />
                                    </motion.li>
                                ))}

                                {/* Create New Dashboard button */}
                                <motion.li
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.15, delay: userDashboards.length * 0.03 }}
                                >
                                    <button
                                        onClick={onCreateNew}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-surface transition-colors group"
                                    >
                                        <div className="w-4 h-4 rounded flex items-center justify-center border border-dashed border-th-border-subtle group-hover:border-th-accent-primary/50 transition-colors">
                                            <Plus className="w-3 h-3" />
                                        </div>
                                        <span>New Dashboard</span>
                                    </button>
                                </motion.li>
                            </ul>
                        )}

                        {/* Empty state */}
                        {!loading && userDashboards.length === 0 && (
                            <div className="px-3 py-4 text-center">
                                <p className="text-xs text-th-text-muted mb-2">No dashboards yet</p>
                                <button
                                    onClick={onCreateNew}
                                    className="text-xs text-th-accent-primary hover:text-th-accent-primary-hover transition-colors"
                                >
                                    Create your first dashboard
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/**
 * Dashboard Nav Item
 * Individual dashboard link in the sidebar
 */
const DashboardNavItem = memo(function DashboardNavItem({
    dashboard,
    isActive,
}: {
    dashboard: Dashboard;
    isActive: boolean;
}) {
    return (
        <NavLink
            to={`/dashboards/${dashboard.id}`}
            aria-current={isActive ? 'page' : undefined}
            className="block relative group"
        >
            {() => (
                <>
                    {/* Active indicator */}
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-th-accent-primary"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Nav item content */}
                    <div
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                            transition-colors duration-200
                            ${isActive
                                ? 'text-th-text-primary bg-th-bg-surface'
                                : 'text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-surface'
                            }
                        `}
                    >
                        {/* Dashboard icon */}
                        <span className="text-sm flex-shrink-0" aria-hidden="true">
                            {dashboard.icon || '📊'}
                        </span>

                        {/* Dashboard name */}
                        <span className="flex-1 truncate">{dashboard.name}</span>

                        {/* Default badge */}
                        {dashboard.isDefault && (
                            <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-th-bg-elevated text-th-text-muted">
                                Default
                            </span>
                        )}
                    </div>
                </>
            )}
        </NavLink>
    );
});

export default Sidebar;
