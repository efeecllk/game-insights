/**
 * How It Works Section - 3-step visual process
 */

import { motion } from 'framer-motion';
import { Upload, Cpu, BarChart3, ArrowRight } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Upload,
        title: 'Upload',
        description: 'Drag & drop your game data file. We support CSV, Excel, JSON, and SQLite formats.',
    },
    {
        number: '02',
        icon: Cpu,
        title: 'AI Analyzes',
        description: 'Our AI detects your game type, maps columns semantically, and identifies key metrics.',
    },
    {
        number: '03',
        icon: BarChart3,
        title: 'Explore Insights',
        description: 'Get retention curves, funnel analysis, revenue breakdowns, and actionable recommendations.',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const stepVariants = {
    hidden: { opacity: 0, y: 30 },
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

export function HowItWorks() {
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
                        How It Works
                    </h2>
                    <p className="text-lg text-th-text-secondary max-w-2xl mx-auto">
                        From raw data to actionable insights in under a minute
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            variants={stepVariants}
                            className="relative flex flex-col items-center text-center"
                        >
                            {/* Connector arrow (hidden on mobile, shown between steps) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-16 -right-4 z-10">
                                    <ArrowRight className="w-8 h-8 text-th-border" />
                                </div>
                            )}

                            {/* Step number badge */}
                            <div className="absolute -top-3 -left-3 md:left-auto md:-top-2 md:right-4 w-8 h-8 rounded-full bg-th-accent-primary flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{step.number}</span>
                            </div>

                            {/* Icon container */}
                            <div className="w-32 h-32 rounded-2xl bg-th-bg-surface border border-th-border-subtle flex items-center justify-center mb-6 transition-all duration-300 hover:border-th-accent-primary/30 hover:bg-th-bg-surface-hover">
                                <step.icon className="w-12 h-12 text-th-accent-primary" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-th-text-primary mb-2">
                                {step.title}
                            </h3>
                            <p className="text-sm text-th-text-muted leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
