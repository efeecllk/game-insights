/**
 * GameAnalytics-style Sidebar with Dynamic Prioritization
 * Menu items reorder based on selected game type
 */

import { NavLink } from 'react-router-dom';
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
    LucideIcon,
    Sun,
    Moon,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { sidebarPriorities } from '../lib/gamePriorities';

interface NavItem {
    icon: LucideIcon;
    label: string;
    path: string;
    badge?: string;
    external?: boolean;
}

const allNavItems: NavItem[] = [
    { icon: Home, label: 'Overview', path: '/' },
    { icon: Gamepad2, label: 'Games', path: '/games' },
    { icon: Database, label: 'Data Sources', path: '/integrations' },
    { icon: Package, label: 'Templates', path: '/templates', badge: 'New' },
    { icon: Brain, label: 'Predictions', path: '/predictions', badge: 'New' },
    { icon: Sparkles, label: 'AI Analytics', path: '/analytics' },
    { icon: BarChart2, label: 'Realtime', path: '/realtime' },
    { icon: LayoutGrid, label: 'Dashboards', path: '/dashboards' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Filter, label: 'Funnels', path: '/funnels' },
    { icon: Plus, label: 'Funnel Builder', path: '/funnel-builder' },
    { icon: TrendingUp, label: 'Engagement', path: '/engagement' },
    { icon: BarChart, label: 'Distributions', path: '/distributions', badge: 'B' },
    { icon: Heart, label: 'Health', path: '/health' },
    { icon: DollarSign, label: 'Monetization', path: '/monetization' },
    { icon: Users, label: 'User Analysis', path: '/user-analysis', external: true },
    { icon: Wrench, label: 'Remote Configs', path: '/remote-configs' },
    { icon: Zap, label: 'A/B Testing', path: '/ab-testing' },
    { icon: Settings, label: 'Game Settings', path: '/settings' },
];

export function Sidebar() {
    const { selectedGame } = useGame();
    const { resolvedTheme, toggleTheme } = useTheme();

    // Sort nav items based on game type priority
    const priorities = sidebarPriorities[selectedGame];
    const sortedNavItems = [...allNavItems].sort((a, b) => {
        const priorityA = priorities[a.label] ?? 99;
        const priorityB = priorities[b.label] ?? 99;
        return priorityA - priorityB;
    });

    return (
        <aside className="w-[200px] h-screen bg-th-bg-subtle border-r border-th-border flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Section */}
            <div className="h-14 flex items-center px-4 border-b border-th-border-subtle">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-th-text-primary text-sm">
                        Game Insights
                    </span>
                </div>
            </div>

            {/* Navigation - dynamically sorted */}
            <nav className="flex-1 py-2 px-2 overflow-y-auto">
                {sortedNavItems.map((item, index) => (
                    <NavItem
                        key={item.path}
                        item={item}
                        isTop={index < 5}
                    />
                ))}
            </nav>

            {/* Theme toggle and game type indicator */}
            <div className="p-3 border-t border-th-border-subtle">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-th-text-muted uppercase tracking-wider">Theme</div>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg bg-th-bg-surface hover:bg-th-bg-surface-hover transition-colors"
                        aria-label="Toggle theme"
                    >
                        {resolvedTheme === 'dark' ? (
                            <Sun className="w-4 h-4 text-th-text-secondary" />
                        ) : (
                            <Moon className="w-4 h-4 text-th-text-secondary" />
                        )}
                    </button>
                </div>
                <div className="text-xs text-th-text-muted uppercase tracking-wider mb-1">Active Game</div>
                <div className="text-sm font-medium text-th-text-secondary capitalize">
                    {selectedGame.replace('_', ' ')}
                </div>
            </div>
        </aside>
    );
}

function NavItem({ item, isTop }: { item: NavItem; isTop: boolean }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group mb-0.5
                ${isActive
                    ? 'bg-th-accent-primary-muted text-th-accent-primary'
                    : isTop
                        ? 'text-th-text-secondary hover:bg-th-interactive-hover hover:text-th-text-primary'
                        : 'text-th-text-muted hover:bg-th-interactive-hover hover:text-th-text-secondary'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`w-4 h-4 flex-shrink-0 ${isActive
                            ? 'text-th-accent-primary'
                            : isTop
                                ? 'text-th-text-muted group-hover:text-th-text-secondary'
                                : 'text-th-text-disabled group-hover:text-th-text-muted'
                            }`}
                    />
                    <span className="flex-1">{item.label}</span>

                    {/* Badge */}
                    {item.badge && (
                        <span className="text-[10px] font-semibold text-th-accent-primary bg-th-accent-primary-muted px-1.5 py-0.5 rounded">
                            {item.badge}
                        </span>
                    )}

                    {/* External link icon */}
                    {item.external && (
                        <ExternalLink className="w-3 h-3 text-th-text-disabled" />
                    )}
                </>
            )}
        </NavLink>
    );
}

export default Sidebar;
