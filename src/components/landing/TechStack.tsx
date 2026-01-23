/**
 * Tech Stack / Open Source Section
 */

import { motion } from 'framer-motion';
import { Github, Star, GitFork, Heart } from 'lucide-react';

const technologies = [
    { name: 'React 18', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Vite', category: 'Build' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Framer Motion', category: 'Animation' },
    { name: 'ECharts', category: 'Charts' },
    { name: 'IndexedDB', category: 'Storage' },
    { name: 'Vitest', category: 'Testing' },
];

export function TechStack() {
    return (
        <section className="py-20 md:py-28">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Open source info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* MIT badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-th-success-muted border border-th-success/20 text-sm font-medium text-th-success mb-6">
                            <Heart className="w-4 h-4" />
                            MIT License
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold text-th-text-primary mb-4">
                            Open Source &<br />Community Driven
                        </h2>

                        <p className="text-lg text-th-text-secondary mb-8">
                            Built with modern technologies and best practices. The entire codebase is open for inspection,
                            contribution, and self-hosting. No hidden costs, no vendor lock-in.
                        </p>

                        {/* GitHub stats */}
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            <a
                                href="https://github.com/efecelik/game-insights"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-th-bg-elevated border border-th-border text-th-text-secondary transition-all duration-200 hover:bg-th-bg-surface-hover hover:text-th-text-primary hover:border-th-border-strong"
                            >
                                <Github className="w-5 h-5" />
                                View Repository
                            </a>

                            <a
                                href="https://github.com/efecelik/game-insights/stargazers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-th-bg-elevated border border-th-border text-th-text-muted transition-all duration-200 hover:bg-th-bg-surface-hover hover:text-th-text-secondary"
                            >
                                <Star className="w-4 h-4" />
                                Star
                            </a>

                            <a
                                href="https://github.com/efecelik/game-insights/fork"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-th-bg-elevated border border-th-border text-th-text-muted transition-all duration-200 hover:bg-th-bg-surface-hover hover:text-th-text-secondary"
                            >
                                <GitFork className="w-4 h-4" />
                                Fork
                            </a>
                        </div>

                        {/* Contribution note */}
                        <p className="text-sm text-th-text-muted">
                            Contributions welcome! Check out our contributing guide to get started.
                        </p>
                    </motion.div>

                    {/* Right: Tech stack grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            {technologies.map((tech, index) => (
                                <motion.div
                                    key={tech.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 rounded-xl bg-th-bg-surface border border-th-border-subtle transition-all duration-200 hover:border-th-border hover:bg-th-bg-surface-hover"
                                >
                                    <p className="text-xs text-th-text-muted mb-1">{tech.category}</p>
                                    <p className="font-semibold text-th-text-primary">{tech.name}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
