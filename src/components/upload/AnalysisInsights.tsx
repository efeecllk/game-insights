/**
 * Analysis Insights Component
 *
 * Rich AI insights display with:
 * - Game type detection with confidence
 * - Key metrics discovered
 * - Data quality breakdown
 * - Actionable recommendations
 * - Visual stats and charts
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Gamepad2,
    Target,
    BarChart3,
    Users,
    Clock,
    DollarSign,
    AlertTriangle,
    Lightbulb,
    CheckCircle2,
    Gauge,
    Columns,
    Tag,
    Zap,
} from 'lucide-react';
import type { SchemaAnalysisResult } from '../../lib/columnAnalyzer';

interface AnalysisInsightsProps {
    analysis: SchemaAnalysisResult;
    rowCount: number;
}

// Game type configurations
const GAME_TYPE_CONFIG: Record<
    string,
    { name: string; description: string; icon: typeof Gamepad2; color: string; metrics: string[] }
> = {
    puzzle: {
        name: 'Puzzle Game',
        description: 'Level progression, booster usage, and difficulty analytics',
        icon: Target,
        color: 'text-th-accent-primary',
        metrics: ['Level completion', 'Booster usage', 'Move efficiency'],
    },
    idle: {
        name: 'Idle / Clicker',
        description: 'Prestige mechanics, offline earnings, and session patterns',
        icon: Clock,
        color: 'text-th-accent-secondary',
        metrics: ['Prestige count', 'Offline earnings', 'Active time'],
    },
    battle_royale: {
        name: 'Battle Royale',
        description: 'Match rankings, weapon meta, and competitive metrics',
        icon: Zap,
        color: 'text-th-error',
        metrics: ['Kill ratio', 'Survival time', 'Weapon usage'],
    },
    match3_meta: {
        name: 'Match-3 + Meta',
        description: 'Story progression, decoration choices, and engagement loops',
        icon: Sparkles,
        color: 'text-th-chart-3',
        metrics: ['Story progress', 'Decoration rate', 'Match combos'],
    },
    gacha_rpg: {
        name: 'Gacha RPG',
        description: 'Banner performance, spender tiers, and hero collection metrics',
        icon: DollarSign,
        color: 'text-th-warning',
        metrics: ['Pull count', 'Spender tier', 'Character roster'],
    },
    other: {
        name: 'Custom Game',
        description: 'Generic analytics with retention, revenue, and funnel metrics',
        icon: Gamepad2,
        color: 'text-th-text-secondary',
        metrics: ['Retention', 'Revenue', 'Engagement'],
    },
};

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AnalysisInsights({ analysis, rowCount }: AnalysisInsightsProps) {
    const gameConfig = GAME_TYPE_CONFIG[analysis.gameType] || GAME_TYPE_CONFIG.other;

    // Calculate role distribution
    const roleStats = useMemo(() => {
        const stats = {
            identifiers: 0,
            timestamps: 0,
            metrics: 0,
            dimensions: 0,
            unknown: 0,
        };
        analysis.columns.forEach((col) => {
            if (col.role === 'identifier') stats.identifiers++;
            else if (col.role === 'timestamp') stats.timestamps++;
            else if (col.role === 'metric') stats.metrics++;
            else if (col.role === 'dimension') stats.dimensions++;
            else stats.unknown++;
        });
        return stats;
    }, [analysis.columns]);

    // Get key columns
    const keyColumns = useMemo(() => {
        const userId = analysis.columns.find((c) => c.canonical === 'user_id' || c.original.toLowerCase().includes('user'));
        const timestamp = analysis.columns.find((c) => c.role === 'timestamp');
        const revenue = analysis.columns.find((c) => c.canonical === 'revenue' || c.original.toLowerCase().includes('revenue'));
        const level = analysis.columns.find((c) => c.canonical === 'level' || c.original.toLowerCase().includes('level'));

        return { userId, timestamp, revenue, level };
    }, [analysis.columns]);

    // Generate recommendations
    const recommendations = useMemo(() => {
        const recs: Array<{ type: 'success' | 'warning' | 'tip'; message: string }> = [];

        // Check for key columns
        if (keyColumns.userId) {
            recs.push({ type: 'success', message: `User identifier found: "${keyColumns.userId.original}"` });
        } else {
            recs.push({ type: 'warning', message: 'No user identifier detected - retention analysis may be limited' });
        }

        if (keyColumns.timestamp) {
            recs.push({ type: 'success', message: `Timestamp column found: "${keyColumns.timestamp.original}"` });
        } else {
            recs.push({ type: 'warning', message: 'No timestamp column - time-based analysis unavailable' });
        }

        if (keyColumns.revenue) {
            recs.push({ type: 'tip', message: `Revenue data available - monetization dashboards enabled` });
        }

        if (analysis.dataQuality >= 0.8) {
            recs.push({ type: 'success', message: 'Excellent data quality - all visualizations available' });
        } else if (analysis.dataQuality >= 0.6) {
            recs.push({ type: 'tip', message: 'Good data quality - consider reviewing columns with low confidence' });
        } else {
            recs.push({ type: 'warning', message: 'Data quality issues detected - some analyses may be inaccurate' });
        }

        return recs;
    }, [keyColumns, analysis.dataQuality]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Game Type Detection Card */}
            <motion.div
                variants={itemVariants}
                className="relative bg-gradient-to-br from-th-bg-surface to-th-bg-surface/50 rounded-2xl border border-th-border-subtle overflow-hidden"
            >
                {/* Decorative gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-th-accent-primary`} />

                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Game Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className={`w-14 h-14 rounded-2xl bg-th-accent-primary/10 border border-th-accent-primary/20 flex items-center justify-center`}
                        >
                            <gameConfig.icon className={`w-7 h-7 ${gameConfig.color}`} />
                        </motion.div>

                        {/* Game Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-th-text-primary">{gameConfig.name}</h3>
                                <span className="px-2 py-0.5 bg-th-accent-primary/10 text-th-accent-primary text-xs font-medium rounded-full border border-th-accent-primary/20">
                                    Detected
                                </span>
                            </div>
                            <p className="text-sm text-th-text-secondary">{gameConfig.description}</p>

                            {/* Expected Metrics */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {gameConfig.metrics.map((metric) => (
                                    <span
                                        key={metric}
                                        className="px-2.5 py-1 bg-th-bg-subtle/50 text-th-text-secondary text-xs rounded-lg border border-th-border"
                                    >
                                        {metric}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quality Score */}
                        <div className="text-center">
                            <div className="relative w-20 h-20">
                                <svg className="w-20 h-20 transform -rotate-90">
                                    <circle
                                        className="text-th-border-subtle"
                                        strokeWidth="6"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="32"
                                        cx="40"
                                        cy="40"
                                    />
                                    <motion.circle
                                        className={
                                            analysis.dataQuality >= 0.8
                                                ? 'text-th-success'
                                                : analysis.dataQuality >= 0.6
                                                  ? 'text-th-warning'
                                                  : 'text-th-error'
                                        }
                                        strokeWidth="6"
                                        strokeDasharray={32 * 2 * Math.PI}
                                        initial={{ strokeDashoffset: 32 * 2 * Math.PI }}
                                        animate={{ strokeDashoffset: 32 * 2 * Math.PI * (1 - analysis.dataQuality) }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="32"
                                        cx="40"
                                        cy="40"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-th-text-primary">
                                        {Math.round(analysis.dataQuality * 100)}%
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-th-text-muted">Quality</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={Columns}
                    label="Total Columns"
                    value={analysis.columns.length.toString()}
                    color="text-th-accent-primary"
                />
                <StatCard
                    icon={BarChart3}
                    label="Metrics Found"
                    value={roleStats.metrics.toString()}
                    color="text-th-success"
                />
                <StatCard
                    icon={Tag}
                    label="Dimensions"
                    value={roleStats.dimensions.toString()}
                    color="text-th-warning"
                />
                <StatCard
                    icon={Users}
                    label="Data Rows"
                    value={rowCount.toLocaleString()}
                    color="text-th-accent-secondary"
                />
            </motion.div>

            {/* Column Role Distribution */}
            <motion.div variants={itemVariants} className="bg-th-bg-surface rounded-2xl border border-th-border-subtle p-4">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-th-accent-primary" />
                    Column Role Distribution
                </h4>
                <div className="space-y-2">
                    <RoleBar label="Identifiers" value={roleStats.identifiers} total={analysis.columns.length} color="bg-th-accent-primary" />
                    <RoleBar label="Timestamps" value={roleStats.timestamps} total={analysis.columns.length} color="bg-th-accent-secondary" />
                    <RoleBar label="Metrics" value={roleStats.metrics} total={analysis.columns.length} color="bg-th-success" />
                    <RoleBar label="Dimensions" value={roleStats.dimensions} total={analysis.columns.length} color="bg-th-warning" />
                    {roleStats.unknown > 0 && (
                        <RoleBar label="Unknown" value={roleStats.unknown} total={analysis.columns.length} color="bg-th-chart-5" />
                    )}
                </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div variants={itemVariants} className="bg-th-bg-surface rounded-2xl border border-th-border-subtle p-4">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-th-accent-primary" />
                    Analysis Summary
                </h4>
                <div className="space-y-2">
                    {recommendations.map((rec, i) => (
                        <RecommendationItem key={i} type={rec.type} message={rec.message} />
                    ))}
                </div>
            </motion.div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
                <motion.div variants={itemVariants} className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-4">
                    <h4 className="text-sm font-medium text-amber-500 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Warnings ({analysis.warnings.length})
                    </h4>
                    <div className="space-y-1">
                        {analysis.warnings.map((warning, i) => (
                            <p key={i} className="text-sm text-amber-400/80">
                                {warning}
                            </p>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: typeof Columns;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border-subtle p-3">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-th-text-muted">{label}</span>
            </div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

// Role Bar Component
function RoleBar({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-th-text-muted w-20">{label}</span>
            <div className="flex-1 h-2 bg-th-bg-subtle rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            <span className="text-xs text-th-text-secondary w-8 text-right">{value}</span>
        </div>
    );
}

// Recommendation Item Component
function RecommendationItem({ type, message }: { type: 'success' | 'warning' | 'tip'; message: string }) {
    const config = {
        success: { icon: CheckCircle2, color: 'text-th-success', bg: 'bg-th-success/10' },
        warning: { icon: AlertTriangle, color: 'text-th-warning', bg: 'bg-th-warning/10' },
        tip: { icon: Lightbulb, color: 'text-th-accent-primary', bg: 'bg-th-accent-primary/10' },
    };
    const { icon: Icon, color, bg } = config[type];

    return (
        <div className={`flex items-start gap-2 p-2 rounded-lg ${bg}`}>
            <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
            <span className="text-sm text-th-text-secondary">{message}</span>
        </div>
    );
}

export default AnalysisInsights;
