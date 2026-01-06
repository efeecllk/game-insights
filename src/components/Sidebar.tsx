/**
 * Sidebar - Obsidian Analytics Design System
 *
 * A refined, premium navigation sidebar with:
 * - Layered depth and subtle gradients
 * - Glassmorphism effects
 * - Orchestrated entrance animations
 * - Elegant hover micro-interactions
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    BarChart2,
    LayoutGrid,
    Compass,
    Filter,
    TrendingUp,
    BarChart,
    Heart,
    DollarSign,
    Users,
    Wrench,
    Zap,
    Database,
    Settings,
    ExternalLink,
    Gamepad2,
    Sparkles,
    Package,
    Brain,
    Plus,
    Target,
    Lightbulb,
    FlaskConical,
    LucideIcon,
    Sun,
    Moon,
    ChevronRight,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { sidebarPriorities } from '../lib/gamePriorities';
import { DataModeIndicator } from './ui/DataModeIndicator';
import { MLStatusBadge } from './ml';

interface NavItemType {
    icon: LucideIcon;
    labelKey: string;
    label: string;
    path: string;
    badge?: string;
    external?: boolean;
}

const allNavItems: NavItemType[] = [
    { icon: Home, labelKey: 'navigation.overview', label: 'Overview', path: '/' },
    { icon: Gamepad2, labelKey: 'navigation.games', label: 'Games', path: '/games' },
    { icon: Database, labelKey: 'navigation.dataSources', label: 'Data Sources', path: '/data-sources' },
    { icon: Package, labelKey: 'navigation.templates', label: 'Templates', path: '/templates', badge: 'New' },
    { icon: Brain, labelKey: 'navigation.predictions', label: 'Predictions', path: '/predictions', badge: 'AI' },
    { icon: Sparkles, labelKey: 'navigation.aiAnalytics', label: 'AI Analytics', path: '/analytics' },
    { icon: BarChart2, labelKey: 'navigation.realtime', label: 'Realtime', path: '/realtime' },
    { icon: LayoutGrid, labelKey: 'navigation.dashboards', label: 'Dashboards', path: '/dashboards' },
    { icon: Compass, labelKey: 'navigation.explore', label: 'Explore', path: '/explore' },
    { icon: Filter, labelKey: 'navigation.funnels', label: 'Funnels', path: '/funnels' },
    { icon: Plus, labelKey: 'navigation.funnelBuilder', label: 'Funnel Builder', path: '/funnel-builder' },
    { icon: TrendingUp, labelKey: 'navigation.engagement', label: 'Engagement', path: '/engagement' },
    { icon: BarChart, labelKey: 'navigation.distributions', label: 'Distributions', path: '/distributions' },
    { icon: Heart, labelKey: 'navigation.health', label: 'Health', path: '/health' },
    { icon: DollarSign, labelKey: 'navigation.monetization', label: 'Monetization', path: '/monetization' },
    { icon: Users, labelKey: 'navigation.userAnalysis', label: 'User Analysis', path: '/user-analysis', external: true },
    { icon: Wrench, labelKey: 'navigation.remoteConfigs', label: 'Remote Configs', path: '/remote-configs' },
    { icon: Zap, labelKey: 'navigation.abTesting', label: 'A/B Testing', path: '/ab-testing' },
    { icon: Target, labelKey: 'navigation.attribution', label: 'Attribution', path: '/attribution' },
    { icon: Lightbulb, labelKey: 'navigation.whatIf', label: 'What-If Analysis', path: '/what-if' },
    { icon: FlaskConical, labelKey: 'navigation.mlStudio', label: 'ML Studio', path: '/ml-studio' },
    { icon: Settings, labelKey: 'navigation.settings', label: 'Game Settings', path: '/settings' },
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

    const priorities = sidebarPriorities[selectedGame] ?? sidebarPriorities['custom'];
    const sortedNavItems = [...allNavItems].sort((a, b) => {
        const priorityA = priorities?.[a.label] ?? 99;
        const priorityB = priorities?.[b.label] ?? 99;
        return priorityA - priorityB;
    });

    return (
        <aside
            className="w-[220px] h-screen fixed left-0 top-0 z-50 flex flex-col"
            aria-label="Main navigation"
        >
            {/* Layered background with depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#DA7756]/20 to-transparent" />

            {/* Content */}
            <div className="relative flex flex-col h-full">
                {/* Logo Section with floating effect */}
                <motion.div
                    variants={logoVariants}
                    initial="hidden"
                    animate="visible"
                    className="h-16 flex items-center px-5 relative"
                >
                    <div className="flex items-center gap-3 group cursor-pointer">
                        {/* Logo with glow effect */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#DA7756]/30 rounded-xl blur-xl group-hover:bg-[#DA7756]/40 transition-colors duration-500" />
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#DA7756] via-[#DA7756] to-[#C15F3C] flex items-center justify-center shadow-lg shadow-[#DA7756]/25 group-hover:shadow-[#DA7756]/30 transition-shadow duration-300">
                                <Gamepad2 className="w-5 h-5 text-white drop-shadow-sm" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-white text-sm tracking-tight">
                                Game Insights
                            </span>
                            <span className="text-[10px] text-[#DA7756]/80 font-medium tracking-wider uppercase">
                                Analytics
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Data Mode & ML Status - Glass card */}
                <div className="px-3 py-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.05]">
                        <DataModeIndicator />
                        <MLStatusBadge />
                    </div>
                </div>

                {/* Navigation */}
                <motion.nav
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 py-3 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    aria-label="Primary"
                >
                    <ul role="list" className="space-y-0.5">
                        {sortedNavItems.map((item, index) => (
                            <motion.li key={item.path} variants={itemVariants}>
                                <NavItemComponent
                                    item={item}
                                    isTop={index < 6}
                                    isActive={location.pathname === item.path}
                                    translatedLabel={t(item.labelKey)}
                                />
                            </motion.li>
                        ))}
                    </ul>
                </motion.nav>

                {/* Bottom Section - Theme & Game Type */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="p-4 relative"
                >
                    {/* Top fade gradient */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                            {t('sidebar.theme')}
                        </span>
                        <motion.button
                            onClick={toggleTheme}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.05] transition-colors group"
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
                                        <Sun className="w-4 h-4 text-amber-400" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="moon"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Moon className="w-4 h-4 text-slate-400" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>

                    {/* Active Game Display */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05]">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">
                            {t('sidebar.activeGame')}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white capitalize">
                                {selectedGame.replace('_', ' ')}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                </motion.div>
            </div>
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
                    {/* Active indicator - glowing bar */}
                    <AnimatePresence>
                        {linkActive && (
                            <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-[#DA7756]"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <div className="absolute inset-0 bg-[#DA7756] blur-sm" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Nav item content */}
                    <div
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                            transition-all duration-200 relative overflow-hidden
                            ${linkActive
                                ? 'text-white bg-white/[0.08]'
                                : isTop
                                    ? 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                            }
                        `}
                    >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#DA7756]/[0.05] to-transparent" />

                        {/* Icon with subtle glow when active */}
                        <div className="relative">
                            {linkActive && (
                                <div className="absolute inset-0 bg-[#DA7756]/30 blur-md" />
                            )}
                            <Icon
                                className={`w-4 h-4 flex-shrink-0 relative ${
                                    linkActive
                                        ? 'text-[#DA7756]'
                                        : isTop
                                            ? 'text-slate-400 group-hover:text-slate-300'
                                            : 'text-slate-600 group-hover:text-slate-500'
                                }`}
                                aria-hidden="true"
                            />
                        </div>

                        {/* Label */}
                        <span className="flex-1 relative">{translatedLabel}</span>

                        {/* Badge - glassmorphism style */}
                        {item.badge && (
                            <span
                                className={`
                                    text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                                    ${item.badge === 'AI'
                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                        : 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                    }
                                `}
                            >
                                {item.badge}
                            </span>
                        )}

                        {/* External link indicator */}
                        {item.external && (
                            <>
                                <ExternalLink
                                    className="w-3 h-3 text-slate-600 group-hover:text-slate-500"
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

export default Sidebar;
