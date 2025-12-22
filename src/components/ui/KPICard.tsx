/**
 * Reusable KPI Card Component
 * Single Responsibility Principle - only handles KPI display
 */

import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    change?: number;
    changeType: 'up' | 'down' | 'neutral';
}

export function KPICard({
    icon: Icon,
    label,
    value,
    change,
    changeType
}: KPICardProps) {
    return (
        <div className="bg-bg-card rounded-card p-5 border border-white/[0.06] hover:border-accent-primary/20 transition-colors group">
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                {change !== undefined && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${changeType === 'up' ? 'bg-green-500/10 text-green-500' :
                            changeType === 'down' ? 'bg-red-500/10 text-red-500' :
                                'bg-zinc-500/10 text-zinc-500'
                        }`}>
                        {changeType === 'up' ? '+' : changeType === 'down' ? '' : ''}{change}%
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-zinc-500">{label}</p>
                <p className="text-2xl font-semibold text-white mt-1">{value}</p>
            </div>
        </div>
    );
}

export default KPICard;
