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
    LucideIcon,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
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
    { icon: Database, label: 'Data Sources', path: '/integrations' },
    { icon: Package, label: 'Templates', path: '/templates', badge: 'New' },
    { icon: Brain, label: 'Predictions', path: '/predictions', badge: 'New' },
    { icon: Sparkles, label: 'AI Analytics', path: '/analytics' },
    { icon: BarChart2, label: 'Realtime', path: '/realtime' },
    { icon: LayoutGrid, label: 'Dashboards', path: '/dashboards' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Filter, label: 'Funnels', path: '/funnels' },
    { icon: TrendingUp, label: 'Engagement', path: '/engagement' },
    { icon: BarChart, label: 'Distributions', path: '/distributions', badge: 'β' },
    { icon: Heart, label: 'Health', path: '/health' },
    { icon: DollarSign, label: 'Monetization', path: '/monetization' },
    { icon: Users, label: 'User Analysis', path: '/user-analysis', external: true },
    { icon: Wrench, label: 'Remote Configs', path: '/remote-configs' },
    { icon: Zap, label: 'A/B Testing', path: '/ab-testing' },
    { icon: Settings, label: 'Game Settings', path: '/settings' },
];

export function Sidebar() {
    const { selectedGame } = useGame();

    // Sort nav items based on game type priority
    const priorities = sidebarPriorities[selectedGame];
    const sortedNavItems = [...allNavItems].sort((a, b) => {
        const priorityA = priorities[a.label] ?? 99;
        const priorityB = priorities[b.label] ?? 99;
        return priorityA - priorityB;
    });

    return (
        <aside className="w-[200px] h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Section */}
            <div className="h-14 flex items-center px-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
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
                        isTop={index < 5}  // Highlight top 5 as important
                    />
                ))}
            </nav>

            {/* Game type indicator */}
            <div className="p-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Game</div>
                <div className="text-sm font-medium text-gray-700 capitalize">
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
                    ? 'bg-violet-50 text-violet-600'
                    : isTop
                        ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`w-4 h-4 flex-shrink-0 ${isActive
                            ? 'text-violet-600'
                            : isTop
                                ? 'text-gray-500 group-hover:text-gray-600'
                                : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                    />
                    <span className="flex-1">{item.label}</span>

                    {/* Beta badge */}
                    {item.badge && (
                        <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                            {item.badge}
                        </span>
                    )}

                    {/* External link icon */}
                    {item.external && (
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                    )}
                </>
            )}
        </NavLink>
    );
}

export default Sidebar;
