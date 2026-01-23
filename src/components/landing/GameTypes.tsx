/**
 * Game Types Section - Shows supported game categories with their metrics
 */

import { motion } from 'framer-motion';
import {
    Target,
    Clock,
    Zap,
    Sparkles,
    DollarSign,
    Gamepad2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GameType {
    icon: LucideIcon;
    title: string;
    description: string;
    metrics: string[];
    exampleColumns: string[];
}

const gameTypes: GameType[] = [
    {
        icon: Target,
        title: 'Puzzle Games',
        description: 'Track level progression, difficulty curves, and player engagement patterns.',
        metrics: ['Level progression', 'Booster usage', 'Fail rates'],
        exampleColumns: ['level_id', 'moves_used', 'boosters_spent', 'completion_time'],
    },
    {
        icon: Clock,
        title: 'Idle/Clicker Games',
        description: 'Analyze prestige cycles, offline earnings, and long-term retention.',
        metrics: ['Prestige rate', 'Offline earnings', 'Session patterns'],
        exampleColumns: ['prestige_count', 'offline_time', 'currency_earned', 'upgrades_purchased'],
    },
    {
        icon: Zap,
        title: 'Battle Royale',
        description: 'Monitor competitive rankings, weapon balance, and match outcomes.',
        metrics: ['Rank distribution', 'Weapon meta', 'Kill/death ratios'],
        exampleColumns: ['player_rank', 'kills', 'weapon_used', 'placement', 'match_duration'],
    },
    {
        icon: Sparkles,
        title: 'Match-3 + Meta',
        description: 'Combine puzzle metrics with story progression and decoration systems.',
        metrics: ['Story progression', 'Decoration completion', 'Engagement loops'],
        exampleColumns: ['chapter_id', 'stars_earned', 'decoration_level', 'energy_spent'],
    },
    {
        icon: DollarSign,
        title: 'Gacha RPG',
        description: 'Optimize banner performance, hero collection, and spending behavior.',
        metrics: ['Banner performance', 'Spender tiers', 'Hero collection'],
        exampleColumns: ['banner_id', 'pulls', 'hero_obtained', 'rarity', 'spend_amount'],
    },
    {
        icon: Gamepad2,
        title: 'Custom/Other',
        description: 'Generic analytics for any game type with automatic column detection.',
        metrics: ['Auto-detected KPIs', 'Custom metrics', 'Flexible analysis'],
        exampleColumns: ['user_id', 'event_type', 'timestamp', 'value'],
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },
};

export function GameTypes() {
    return (
        <section className="py-20 md:py-28 bg-th-bg-subtle">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-th-text-primary mb-4">
                        Supported Game Types
                    </h2>
                    <p className="text-lg text-th-text-secondary max-w-2xl mx-auto">
                        Optimized analytics for every mobile game genre. Our AI automatically detects your game type and configures the perfect dashboard.
                    </p>
                </motion.div>

                {/* Game types grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {gameTypes.map((gameType) => (
                        <motion.div
                            key={gameType.title}
                            variants={cardVariants}
                            className="group relative p-6 rounded-2xl bg-th-bg-surface border border-th-border-subtle transition-all duration-300 hover:border-th-border hover:bg-th-bg-surface-hover"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                                <gameType.icon className="w-6 h-6 text-th-accent-primary" />
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                                {gameType.title}
                            </h3>
                            <p className="text-sm text-th-text-muted leading-relaxed mb-4">
                                {gameType.description}
                            </p>

                            {/* Metrics tracked */}
                            <div className="mb-4">
                                <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wider mb-2">
                                    Key Metrics
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {gameType.metrics.map((metric) => (
                                        <span
                                            key={metric}
                                            className="inline-flex px-2.5 py-1 text-xs font-medium rounded-md bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/20"
                                        >
                                            {metric}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Example columns */}
                            <div>
                                <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wider mb-2">
                                    Example Columns
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {gameType.exampleColumns.map((column) => (
                                        <code
                                            key={column}
                                            className="inline-flex px-2 py-0.5 text-xs font-mono rounded bg-th-bg-elevated text-th-text-muted border border-th-border-subtle"
                                        >
                                            {column}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
