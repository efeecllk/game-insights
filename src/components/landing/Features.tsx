/**
 * Features Section - Organized into Getting Started and Power Features categories
 */

import { motion } from 'framer-motion';
import {
    Upload,
    Brain,
    Code2,
    FileJson,
    Shield,
    LayoutDashboard,
    Lock,
    CheckCircle2
} from 'lucide-react';

interface Feature {
    icon: typeof Upload;
    title: string;
    description: string;
}

const gettingStartedFeatures: Feature[] = [
    {
        icon: Upload,
        title: 'Drag & Drop Simplicity',
        description: 'Just drop your CSV, Excel, or JSON file. No configuration needed. Your dashboard appears instantly.',
    },
    {
        icon: Brain,
        title: 'AI-Powered Analysis',
        description: 'Automatically detects your game type, maps columns semantically, and generates actionable insights.',
    },
    {
        icon: FileJson,
        title: 'Multi-Format Support',
        description: 'Works with CSV, Excel, JSON, and SQLite. Streaming support for files over 50MB.',
    },
];

const powerFeatures: Feature[] = [
    {
        icon: LayoutDashboard,
        title: 'Custom Dashboards',
        description: 'Build and customize dashboards for your specific needs. Save and share configurations.',
    },
    {
        icon: Shield,
        title: 'Local-First Privacy',
        description: 'Your data never leaves your browser. Stored in IndexedDB locally. No cloud uploads required.',
    },
    {
        icon: Code2,
        title: 'Open Source',
        description: 'MIT licensed. Fully auditable code. No vendor lock-in. Self-host or run locally as you prefer.',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
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

interface FeatureCardProps {
    feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps) {
    return (
        <motion.div
            variants={cardVariants}
            className="group relative p-6 rounded-2xl bg-th-bg-surface border border-th-border-subtle transition-all duration-300 hover:border-th-border hover:bg-th-bg-elevated hover:shadow-lg overflow-hidden"
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-th-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Icon */}
            <div className="relative w-14 h-14 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-th-accent-primary/40">
                <feature.icon className="w-7 h-7 text-th-accent-primary" />
            </div>

            {/* Content */}
            <h3 className="relative text-lg font-semibold text-th-text-primary mb-2">
                {feature.title}
            </h3>
            <p className="relative text-sm text-th-text-muted leading-relaxed">
                {feature.description}
            </p>
        </motion.div>
    );
}

interface CategoryLabelProps {
    label: string;
    sublabel: string;
}

function CategoryLabel({ label, sublabel }: CategoryLabelProps) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-th-border-subtle to-transparent" />
            <div className="text-center">
                <span className="text-xs font-medium uppercase tracking-wider text-th-accent-primary">
                    {label}
                </span>
                <p className="text-sm text-th-text-muted mt-0.5">{sublabel}</p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-th-border-subtle to-transparent" />
        </div>
    );
}

export function Features() {
    return (
        <section className="py-20 md:py-28">
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
                        Everything You Need
                    </h2>
                    <p className="text-lg text-th-text-secondary max-w-2xl mx-auto">
                        Purpose-built for mobile game analytics. No learning curve, no complex setup.
                    </p>
                </motion.div>

                {/* Getting Started Features */}
                <div className="mb-12">
                    <CategoryLabel
                        label="Getting Started"
                        sublabel="Start in seconds"
                    />
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {gettingStartedFeatures.map((feature) => (
                            <FeatureCard key={feature.title} feature={feature} />
                        ))}
                    </motion.div>
                </div>

                {/* Power Features */}
                <div className="mb-16">
                    <CategoryLabel
                        label="Power Features"
                        sublabel="Built for power users"
                    />
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {powerFeatures.map((feature) => (
                            <FeatureCard key={feature.title} feature={feature} />
                        ))}
                    </motion.div>
                </div>

                {/* Privacy Callout Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative rounded-2xl bg-th-success-muted/30 border border-th-success/30 p-8 overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-th-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Shield icon with lock */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-th-success-muted border border-th-success/30 flex items-center justify-center">
                                    <Shield className="w-8 h-8 text-th-success" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-th-bg-surface border-2 border-th-success/40 flex items-center justify-center">
                                    <Lock className="w-3.5 h-3.5 text-th-success" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="text-xl font-display font-bold text-th-text-primary mb-2">
                                Your Data, Your Control
                            </h3>
                            <p className="text-th-text-secondary leading-relaxed">
                                All processing happens in your browser. Your game data never leaves your device.
                                No cloud uploads, no tracking, no data collection.
                            </p>
                        </div>

                        {/* Privacy badges */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            <div className="flex items-center gap-2 text-sm text-th-success">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>100% Client-side</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-th-success">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Zero Data Collection</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-th-success">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Offline Capable</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
