/**
 * Footer Section - Links and privacy note
 */

import { motion } from 'framer-motion';
import { Github, Shield, Gamepad2 } from 'lucide-react';

const footerLinks = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features' },
            { label: 'How it Works', href: '#how-it-works' },
            { label: 'Upload Data', href: '/upload' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Documentation', href: 'https://github.com/efecelik/game-insights#readme', external: true },
            { label: 'GitHub', href: 'https://github.com/efecelik/game-insights', external: true },
            { label: 'Changelog', href: 'https://github.com/efecelik/game-insights/releases', external: true },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'MIT License', href: 'https://github.com/efecelik/game-insights/blob/main/LICENSE', external: true },
            { label: 'Privacy', href: '#privacy' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="bg-th-bg-surface border-t border-th-border-subtle">
            <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                    {/* Brand column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="md:col-span-1"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-th-accent-primary flex items-center justify-center">
                                <Gamepad2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-display font-bold text-th-text-primary">
                                Game Insights
                            </span>
                        </div>
                        <p className="text-sm text-th-text-muted mb-4">
                            Zero-config analytics for mobile games. Open source and privacy-first.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/efecelik/game-insights"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-th-bg-elevated border border-th-border flex items-center justify-center text-th-text-muted transition-colors hover:text-th-text-primary hover:border-th-border-strong"
                                aria-label="GitHub"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Link columns */}
                    {footerLinks.map((group, groupIndex) => (
                        <motion.div
                            key={group.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: groupIndex * 0.1 }}
                        >
                            <h3 className="text-sm font-semibold text-th-text-primary mb-4">
                                {group.title}
                            </h3>
                            <ul className="space-y-3">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        {link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <a
                                                href={link.href}
                                                className="text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-th-border-subtle">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Privacy note */}
                        <div className="flex items-center gap-2 text-sm text-th-text-muted">
                            <Shield className="w-4 h-4" />
                            <span>Your data never leaves your browser. 100% local processing.</span>
                        </div>

                        {/* Copyright */}
                        <p className="text-sm text-th-text-muted">
                            {new Date().getFullYear()} Game Insights. MIT License.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
