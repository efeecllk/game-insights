/**
 * Hero Section - Landing page hero with CTAs and dashboard preview
 */

import { motion } from 'framer-motion';
import { ArrowRight, Github, Upload, Sparkles, Play, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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

const previewVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 20,
            delay: 0.5,
        },
    },
};

const chartBarVariants = {
    hidden: { scaleY: 0 },
    visible: (i: number) => ({
        scaleY: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: 0.8 + i * 0.1,
        },
    }),
};

const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
            duration: 1.5,
            delay: 0.9,
            ease: 'easeInOut',
        },
    },
};

const pulseVariants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Mock metric card component
function MockMetricCard({ icon: Icon, label, value, trend, delay }: {
    icon: typeof TrendingUp;
    label: string;
    value: string;
    trend: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-th-bg-elevated/80 backdrop-blur-sm rounded-lg p-3 border border-th-border-subtle"
        >
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-th-accent-primary" />
                <span className="text-[10px] text-th-text-muted uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-th-text-primary font-mono">{value}</span>
                <span className="text-[10px] text-th-success">{trend}</span>
            </div>
        </motion.div>
    );
}

// Mock bar chart component
function MockBarChart() {
    const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45];

    return (
        <div className="flex items-end gap-1.5 h-20">
            {bars.map((height, i) => (
                <motion.div
                    key={i}
                    custom={i}
                    variants={chartBarVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ height: `${height * 100}%`, originY: 1 }}
                    className="flex-1 rounded-t bg-gradient-to-t from-th-accent-primary to-th-accent-primary/60"
                />
            ))}
        </div>
    );
}

// Mock line chart component
function MockLineChart() {
    return (
        <svg viewBox="0 0 200 60" className="w-full h-16">
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--color-accent-primary)" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Area fill */}
            <motion.path
                d="M0,50 Q25,45 50,35 T100,25 T150,30 T200,15 L200,60 L0,60 Z"
                fill="url(#areaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
            />
            {/* Line */}
            <motion.path
                d="M0,50 Q25,45 50,35 T100,25 T150,30 T200,15"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                variants={lineVariants}
                initial="hidden"
                animate="visible"
            />
            {/* Data points */}
            {[
                { x: 0, y: 50 },
                { x: 50, y: 35 },
                { x: 100, y: 25 },
                { x: 150, y: 30 },
                { x: 200, y: 15 },
            ].map((point, i) => (
                <motion.circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="var(--color-bg-surface)"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.4 + i * 0.1, type: 'spring' }}
                />
            ))}
        </svg>
    );
}

// Mock donut chart component
function MockDonutChart() {
    const segments = [
        { percent: 35, color: 'var(--color-accent-primary)' },
        { percent: 25, color: 'var(--color-chart-3)' },
        { percent: 20, color: 'var(--color-chart-4)' },
        { percent: 20, color: 'var(--color-chart-5)' },
    ];

    let cumulativePercent = 0;

    return (
        <svg viewBox="0 0 36 36" className="w-16 h-16">
            {segments.map((segment, i) => {
                const strokeDasharray = `${segment.percent} ${100 - segment.percent}`;
                const strokeDashoffset = 100 - cumulativePercent + 25;
                cumulativePercent += segment.percent;

                return (
                    <motion.circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="3"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + i * 0.15, duration: 0.4 }}
                    />
                );
            })}
        </svg>
    );
}

// Dashboard preview component
function DashboardPreview() {
    return (
        <motion.div
            variants={previewVariants}
            initial="hidden"
            animate="visible"
            className="relative mt-16 mx-auto max-w-4xl"
        >
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-th-accent-primary/20 via-th-accent-primary/10 to-th-accent-primary/20 rounded-3xl blur-2xl opacity-50" />

            {/* Main preview container */}
            <div className="relative bg-th-bg-surface rounded-2xl border border-th-border shadow-2xl shadow-black/20 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-th-bg-elevated border-b border-th-border-subtle">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="px-4 py-1 rounded-md bg-th-bg-base text-[10px] text-th-text-muted">
                            Game Insights Dashboard
                        </div>
                    </div>
                    <div className="w-16" />
                </div>

                {/* Dashboard content */}
                <div className="p-4 md:p-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <motion.div
                                variants={pulseVariants}
                                initial="initial"
                                animate="animate"
                                className="w-2 h-2 rounded-full bg-th-success"
                            />
                            <span className="text-xs text-th-text-secondary">Live Analytics</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-th-text-muted px-2 py-1 bg-th-bg-elevated rounded">
                                Puzzle Game
                            </span>
                            <span className="text-[10px] text-th-text-muted px-2 py-1 bg-th-bg-elevated rounded">
                                Last 7 days
                            </span>
                        </div>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <MockMetricCard
                            icon={Users}
                            label="DAU"
                            value="12.4K"
                            trend="+8.2%"
                            delay={0.6}
                        />
                        <MockMetricCard
                            icon={DollarSign}
                            label="Revenue"
                            value="$24.5K"
                            trend="+12.1%"
                            delay={0.7}
                        />
                        <MockMetricCard
                            icon={TrendingUp}
                            label="Retention"
                            value="42.3%"
                            trend="+3.4%"
                            delay={0.8}
                        />
                        <MockMetricCard
                            icon={BarChart3}
                            label="ARPU"
                            value="$1.98"
                            trend="+5.7%"
                            delay={0.9}
                        />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Revenue trend */}
                        <div className="md:col-span-2 bg-th-bg-elevated/50 rounded-lg p-4 border border-th-border-subtle">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-th-text-secondary">Revenue Trend</span>
                                <span className="text-[10px] text-th-success">+24% vs last week</span>
                            </div>
                            <MockLineChart />
                        </div>

                        {/* Session distribution */}
                        <div className="bg-th-bg-elevated/50 rounded-lg p-4 border border-th-border-subtle">
                            <span className="text-xs font-medium text-th-text-secondary block mb-3">
                                Player Segments
                            </span>
                            <div className="flex items-center justify-center gap-4">
                                <MockDonutChart />
                                <div className="space-y-1.5 text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-th-accent-primary" />
                                        <span className="text-th-text-muted">Whales 35%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-chart-3)' }} />
                                        <span className="text-th-text-muted">Dolphins 25%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-chart-4)' }} />
                                        <span className="text-th-text-muted">Minnows 20%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-chart-5)' }} />
                                        <span className="text-th-text-muted">F2P 20%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Daily engagement bar chart */}
                    <div className="mt-4 bg-th-bg-elevated/50 rounded-lg p-4 border border-th-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-th-text-secondary">Daily Engagement</span>
                            <div className="flex gap-2 text-[10px] text-th-text-muted">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </div>
                        <MockBarChart />
                    </div>
                </div>
            </div>

            {/* Floating badge */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute -right-2 md:-right-4 top-24 bg-th-bg-elevated rounded-lg px-3 py-2 border border-th-border shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-th-accent-primary" />
                    <span className="text-xs text-th-text-secondary">AI-Powered</span>
                </div>
            </motion.div>
        </motion.div>
    );
}

export function Hero() {
    return (
        <section className="relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-th-accent-primary/5 to-transparent pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24"
            >
                {/* Badge */}
                <motion.div variants={itemVariants} className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-th-accent-primary-muted border border-th-accent-primary/20">
                        <Sparkles className="w-4 h-4 text-th-accent-primary" />
                        <span className="text-sm font-medium text-th-accent-primary">
                            100% Free & Open Source
                        </span>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    variants={itemVariants}
                    className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-center text-th-text-primary mb-6 leading-tight"
                >
                    Game Analytics
                    <br />
                    <span className="text-th-accent-primary">Without the Setup</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-th-text-secondary text-center max-w-2xl mx-auto mb-10"
                >
                    Drag & drop your CSV. AI detects your game type, maps columns, and generates insights.
                    Open source, runs entirely in your browser.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-th-accent-primary text-white font-semibold text-lg transition-all duration-200 hover:bg-th-accent-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-th-accent-primary/25"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Your Data
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                        to="/upload?demo=true"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-th-bg-elevated border border-th-border text-th-text-secondary font-semibold text-lg transition-all duration-200 hover:bg-th-bg-surface-hover hover:text-th-text-primary hover:border-th-border-strong hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Play className="w-5 h-5" />
                        Try Demo
                    </Link>

                    <a
                        href="https://github.com/efecelik/game-insights"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-th-text-muted font-medium text-lg transition-all duration-200 hover:text-th-text-secondary hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Github className="w-5 h-5" />
                        GitHub
                    </a>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-th-text-muted"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-th-success" />
                        <span>No account required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-th-success" />
                        <span>Data stays in your browser</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-th-success" />
                        <span>MIT License</span>
                    </div>
                </motion.div>

                {/* Dashboard Preview */}
                <DashboardPreview />
            </motion.div>
        </section>
    );
}
