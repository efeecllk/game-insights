/**
 * Sidebar - Main navigation
 *
 * 8 navigation items in 4 sections: Main, Data, Insights, Settings
 * Collapsible for more screen space, theme toggle, dashboard quick-nav
 */

import { useState, useMemo, memo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Bot,
    BarChart2,
    LayoutGrid,
    Filter,
    DollarSign,
    Database,
    Settings,
    LucideIcon,
    Sun,
    Moon,
    ChevronRight,
    ChevronLeft,
    Plus,
    Loader2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSidebarSettings } from '../lib/sidebarStore';
import { DataModeIndicator } from './ui/DataModeIndicator';
import { useDashboards } from '../hooks/useDashboards';
import type { Dashboard } from '../lib/dashboardStore';


interface NavItemType {
    icon: LucideIcon;
    labelKey: string;
    label: string;
    path: string;
    badge?: string;
}

// Main navigation items
const primaryNavItems: NavItemType[] = [
    { icon: Home, labelKey: 'navigation.dashboard', label: 'Overview', path: '/' },
    { icon: Bot, labelKey: 'navigation.aiAnalytics', label: 'Analytics', path: '/analytics', badge: 'AI' },
];

// Data management items
const dataItems: NavItemType[] = [
    { icon: Database, labelKey: 'navigation.upload', label: 'Upload', path: '/upload' },
    { icon: BarChart2, labelKey: 'navigation.games', label: 'My Datasets', path: '/games' },
];

// Insights items
const insightsItems: NavItemType[] = [
    { icon: Filter, labelKey: 'navigation.funnels', label: 'Funnels', path: '/funnels' },
    { icon: DollarSign, labelKey: 'navigation.monetization', label: 'Monetization', path: '/monetization' },
    { icon: LayoutGrid, labelKey: 'navigation.dashboards', label: 'Dashboards', path: '/dashboards' },
];

// Settings items
const settingsItems: NavItemType[] = [
    { icon: Settings, labelKey: 'navigation.settings', label: 'Settings', path: '/settings' },
];

// All nav items combined
export const allNavItems: NavItemType[] = [
    ...primaryNavItems,
    ...dataItems,
    ...insightsItems,
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
    const { resolvedTheme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        collapsed,
        toggleCollapsed,
    } = useSidebarSettings();

    // Dashboard data for sidebar
    const { dashboards, loading: dashboardsLoading, createNew: createNewDashboard } = useDashboards();

    const [showMyDashboards, setShowMyDashboards] = useState(() => {
        return location.pathname.startsWith('/dashboards/');
    });

    // Navigation sections (static)
    const sections = useMemo(() => ({
        primary: primaryNavItems,
        data: dataItems,
        insights: insightsItems,
        settings: settingsItems,
    }), []);

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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation */}
                <motion.nav
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 py-2 px-3 overflow-y-auto"
                    aria-label="Primary"
                >
                    {/* Main Navigation */}
                    {!collapsed && (
                        <div className="px-3 py-1">
                            <span className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium">Main</span>
                        </div>
                    )}
                    <ul role="list" className="space-y-0.5">
                        {sections.primary.map((item) => (
                            <motion.li key={item.path} variants={itemVariants}>
                                <NavItemComponent
                                    item={item}
                                    isTop={true}
                                    isActive={location.pathname === item.path}
                                    translatedLabel={t(item.labelKey)}
                                    collapsed={collapsed}
                                />
                            </motion.li>
                        ))}
                    </ul>

                    {/* Data Section */}
                    {!collapsed && (
                        <div className="px-3 py-1 mt-4">
                            <span className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium">Data</span>
                        </div>
                    )}
                    <ul role="list" className="space-y-0.5">
                        {sections.data.map((item) => (
                            <motion.li key={item.path} variants={itemVariants}>
                                <NavItemComponent
                                    item={item}
                                    isTop={true}
                                    isActive={location.pathname === item.path}
                                    translatedLabel={t(item.labelKey)}
                                    collapsed={collapsed}
                                />
                            </motion.li>
                        ))}
                    </ul>

                    {/* Insights Section */}
                    {!collapsed && (
                        <div className="px-3 py-1 mt-4">
                            <span className="text-[10px] text-th-text-muted uppercase tracking-wider font-medium">Insights</span>
                        </div>
                    )}
                    <ul role="list" className="space-y-0.5">
                        {sections.insights.map((item) => (
                            <motion.li key={item.path} variants={itemVariants}>
                                <NavItemComponent
                                    item={item}
                                    isTop={true}
                                    isActive={location.pathname === item.path}
                                    translatedLabel={t(item.labelKey)}
                                    collapsed={collapsed}
                                />
                            </motion.li>
                        ))}
                    </ul>

                    {/* My Dashboards - Dynamic section */}
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

                    {/* Settings */}
                    <div className={`mt-4 pt-4 border-t border-th-border-subtle ${collapsed ? 'px-0' : ''}`}>
                        <ul role="list" className="space-y-0.5">
                            {sections.settings.map((item) => (
                                <motion.li key={item.path} variants={itemVariants}>
                                    <NavItemComponent
                                        item={item}
                                        isTop={false}
                                        isActive={location.pathname === item.path}
                                        translatedLabel={t(item.labelKey)}
                                        collapsed={collapsed}
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

        </motion.aside>
    );
}

const NavItemComponent = memo(function NavItemComponent({
    item,
    isTop,
    isActive,
    translatedLabel,
    collapsed = false,
}: {
    item: NavItemType;
    isTop: boolean;
    isActive: boolean;
    translatedLabel: string;
    collapsed?: boolean;
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

                    </div>
                </>
            )}
        </NavLink>
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
