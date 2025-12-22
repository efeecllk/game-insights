/**
 * GameAnalytics-style Sidebar
 * Cloned from GameAnalytics dashboard screenshots
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
} from 'lucide-react';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    badge?: string;
    external?: boolean;
}

const navItems: NavItem[] = [
    { icon: Home, label: 'Overview', path: '/' },
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
    { icon: Database, label: 'DataSuite', path: '/datasuite' },
    { icon: Settings, label: 'Game Settings', path: '/settings' },
];

export function Sidebar() {
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

            {/* Navigation */}
            <nav className="flex-1 py-2 px-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}
            </nav>
        </aside>
    );
}

function NavItem({ item }: { item: NavItem }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group mb-0.5
        ${isActive
                    ? 'bg-violet-50 text-violet-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'
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
