import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    Wallet,
    Lightbulb,
    FileText,
    Settings,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Gamepad2,
} from 'lucide-react'

interface NavItem {
    icon: React.ElementType
    label: string
    path: string
}

const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Users, label: 'User Behavior', path: '/behavior' },
    { icon: TrendingUp, label: 'Retention', path: '/retention' },
    { icon: Wallet, label: 'Monetization', path: '/monetization' },
    { icon: Lightbulb, label: 'Insights', path: '/insights' },
    { icon: FileText, label: 'Reports', path: '/reports' },
]

const bottomNavItems: NavItem[] = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
]

export function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(true)

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 240 : 72 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-screen bg-bg-dark border-r border-white/[0.06] flex flex-col fixed left-0 top-0 z-50"
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-semibold text-lg whitespace-nowrap overflow-hidden"
                            >
                                Game Insights
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {mainNavItems.map((item) => (
                    <NavItem key={item.path} item={item} isExpanded={isExpanded} />
                ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="py-4 px-3 border-t border-white/[0.06] space-y-1">
                {bottomNavItems.map((item) => (
                    <NavItem key={item.path} item={item} isExpanded={isExpanded} />
                ))}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-elevated border border-white/[0.1] flex items-center justify-center hover:bg-accent-primary/20 hover:border-accent-primary/50 transition-colors"
            >
                {isExpanded ? (
                    <ChevronLeft className="w-3 h-3 text-zinc-400" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-zinc-400" />
                )}
            </button>
        </motion.aside>
    )
}

function NavItem({ item, isExpanded }: { item: NavItem; isExpanded: boolean }) {
    const Icon = item.icon

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-accent-primary/15 text-accent-primary'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <div
                        className={`w-6 h-6 flex items-center justify-center ${isActive ? 'text-accent-primary' : 'text-zinc-400 group-hover:text-zinc-200'
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </>
            )}
        </NavLink>
    )
}

export default Sidebar
