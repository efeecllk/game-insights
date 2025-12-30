/**
 * GameAnalytics-style Sidebar with Dynamic Prioritization
 * Menu items reorder based on selected game type
 *
 * Accessibility Features (Phase 8):
 * - Semantic nav landmark with aria-label
 * - aria-current="page" on active navigation items
 * - Proper focus indicators
 * - Accessible theme toggle button
 * - Screen reader friendly external link indicators
 *
 * i18n Features (Phase 8):
 * - All navigation labels are translatable
 * - Sidebar labels use translation keys
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { sidebarPriorities } from '../lib/gamePriorities';
import { DataModeIndicator } from './ui/DataModeIndicator';

interface NavItemType {
    icon: LucideIcon;
    labelKey: string; // i18n translation key
    label: string; // fallback for priority sorting
    path: string;
    badge?: string;
    external?: boolean;
}

const allNavItems: NavItemType[] = [
    { icon: Home, labelKey: 'navigation.overview', label: 'Overview', path: '/' },
    { icon: Gamepad2, labelKey: 'navigation.games', label: 'Games', path: '/games' },
    { icon: Database, labelKey: 'navigation.dataSources', label: 'Data Sources', path: '/data-sources' },
    { icon: Package, labelKey: 'navigation.templates', label: 'Templates', path: '/templates', badge: 'New' },
    { icon: Brain, labelKey: 'navigation.predictions', label: 'Predictions', path: '/predictions', badge: 'New' },
    { icon: Sparkles, labelKey: 'navigation.aiAnalytics', label: 'AI Analytics', path: '/analytics' },
    { icon: BarChart2, labelKey: 'navigation.realtime', label: 'Realtime', path: '/realtime' },
    { icon: LayoutGrid, labelKey: 'navigation.dashboards', label: 'Dashboards', path: '/dashboards' },
    { icon: Compass, labelKey: 'navigation.explore', label: 'Explore', path: '/explore' },
    { icon: Filter, labelKey: 'navigation.funnels', label: 'Funnels', path: '/funnels' },
    { icon: Plus, labelKey: 'navigation.funnelBuilder', label: 'Funnel Builder', path: '/funnel-builder' },
    { icon: TrendingUp, labelKey: 'navigation.engagement', label: 'Engagement', path: '/engagement' },
    { icon: BarChart, labelKey: 'navigation.distributions', label: 'Distributions', path: '/distributions', badge: 'B' },
    { icon: Heart, labelKey: 'navigation.health', label: 'Health', path: '/health' },
    { icon: DollarSign, labelKey: 'navigation.monetization', label: 'Monetization', path: '/monetization' },
    { icon: Users, labelKey: 'navigation.userAnalysis', label: 'User Analysis', path: '/user-analysis', external: true },
    { icon: Wrench, labelKey: 'navigation.remoteConfigs', label: 'Remote Configs', path: '/remote-configs' },
    { icon: Zap, labelKey: 'navigation.abTesting', label: 'A/B Testing', path: '/ab-testing' },
    { icon: Target, labelKey: 'navigation.attribution', label: 'Attribution', path: '/attribution', badge: 'New' },
    { icon: Lightbulb, labelKey: 'navigation.whatIf', label: 'What-If Analysis', path: '/what-if', badge: 'New' },
    { icon: FlaskConical, labelKey: 'navigation.mlStudio', label: 'ML Studio', path: '/ml-studio', badge: 'New' },
    { icon: Settings, labelKey: 'navigation.settings', label: 'Game Settings', path: '/settings' },
];

export function Sidebar() {
    const { selectedGame } = useGame();
    const { resolvedTheme, toggleTheme } = useTheme();
    const location = useLocation();
    const { t } = useTranslation();

    // Sort nav items based on game type priority
    const priorities = sidebarPriorities[selectedGame];
    const sortedNavItems = [...allNavItems].sort((a, b) => {
        const priorityA = priorities[a.label] ?? 99;
        const priorityB = priorities[b.label] ?? 99;
        return priorityA - priorityB;
    });

    return (
        <aside
            className="w-[200px] h-screen bg-th-bg-subtle border-r border-th-border flex flex-col fixed left-0 top-0 z-50"
            aria-label="Main navigation"
        >
            {/* Logo Section */}
            <div className="h-14 flex items-center px-4 border-b border-th-border-subtle">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center" aria-hidden="true">
                        <Gamepad2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-th-text-primary text-sm">
                        Game Insights
                    </span>
                </div>
            </div>

            {/* Data Mode Indicator */}
            <div className="px-2 py-2 border-b border-th-border-subtle">
                <DataModeIndicator />
            </div>

            {/* Navigation - dynamically sorted */}
            <nav className="flex-1 py-2 px-2 overflow-y-auto" aria-label="Primary">
                <ul role="list">
                    {sortedNavItems.map((item, index) => (
                        <NavItemComponent
                            key={item.path}
                            item={item}
                            isTop={index < 5}
                            isActive={location.pathname === item.path}
                            translatedLabel={t(item.labelKey)}
                        />
                    ))}
                </ul>
            </nav>

            {/* Theme toggle and game type indicator */}
            <div className="p-3 border-t border-th-border-subtle">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-th-text-muted uppercase tracking-wider">{t('sidebar.theme')}</div>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg bg-th-bg-surface hover:bg-th-bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-th-accent-primary focus:ring-offset-2 focus:ring-offset-th-bg-subtle"
                        aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                        {resolvedTheme === 'dark' ? (
                            <Sun className="w-4 h-4 text-th-text-secondary" aria-hidden="true" />
                        ) : (
                            <Moon className="w-4 h-4 text-th-text-secondary" aria-hidden="true" />
                        )}
                    </button>
                </div>
                <div className="text-xs text-th-text-muted uppercase tracking-wider mb-1">{t('sidebar.activeGame')}</div>
                <div className="text-sm font-medium text-th-text-secondary capitalize">
                    {selectedGame.replace('_', ' ')}
                </div>
            </div>
        </aside>
    );
}

function NavItemComponent({ item, isTop, isActive, translatedLabel }: { item: NavItemType; isTop: boolean; isActive: boolean; translatedLabel: string }) {
    const Icon = item.icon;

    return (
        <li>
            <NavLink
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={({ isActive: linkActive }) =>
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group mb-0.5 focus:outline-none focus:ring-2 focus:ring-th-accent-primary focus:ring-offset-1 focus:ring-offset-th-bg-subtle ' +
                    (linkActive
                        ? 'bg-th-accent-primary-muted text-th-accent-primary'
                        : isTop
                            ? 'text-th-text-secondary hover:bg-th-interactive-hover hover:text-th-text-primary'
                            : 'text-th-text-muted hover:bg-th-interactive-hover hover:text-th-text-secondary')
                }
            >
                {({ isActive: linkActive }) => (
                    <>
                        <Icon
                            className={'w-4 h-4 flex-shrink-0 ' + (linkActive
                                ? 'text-th-accent-primary'
                                : isTop
                                    ? 'text-th-text-muted group-hover:text-th-text-secondary'
                                    : 'text-th-text-disabled group-hover:text-th-text-muted'
                                )}
                            aria-hidden="true"
                        />
                        <span className="flex-1">{translatedLabel}</span>

                        {/* Badge */}
                        {item.badge && (
                            <span className="text-[10px] font-semibold text-th-accent-primary bg-th-accent-primary-muted px-1.5 py-0.5 rounded">
                                {item.badge}
                            </span>
                        )}

                        {/* External link icon */}
                        {item.external && (
                            <>
                                <ExternalLink className="w-3 h-3 text-th-text-disabled" aria-hidden="true" />
                                <span className="sr-only">(opens in new tab)</span>
                            </>
                        )}
                    </>
                )}
            </NavLink>
        </li>
    );
}

export default Sidebar;
