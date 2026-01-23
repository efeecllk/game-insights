/**
 * Landing Page - Public marketing page for first-time visitors
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, ArrowRight, Menu, X } from 'lucide-react';
import { PublicLayout } from '../layouts/PublicLayout';
import { Hero, Features, GameTypes, HowItWorks, TechStack, FAQ, Footer } from '../components/landing';

/**
 * Mobile navigation menu with slide-out panel
 */
function MobileMenu({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Slide-out panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-th-bg-surface border-l border-th-border-subtle shadow-xl md:hidden"
                    >
                        {/* Header with close button */}
                        <div className="flex items-center justify-between p-4 border-b border-th-border-subtle">
                            <span className="text-lg font-display font-bold text-th-text-primary">
                                Menu
                            </span>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation links */}
                        <nav className="p-4 flex flex-col gap-2">
                            <a
                                href="#features"
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-elevated transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-elevated transition-colors"
                            >
                                How it Works
                            </a>
                            <a
                                href="https://github.com/efecelik/game-insights"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-elevated transition-colors"
                            >
                                GitHub
                            </a>

                            {/* Divider */}
                            <div className="my-2 border-t border-th-border-subtle" />

                            {/* CTA Button */}
                            <Link
                                to="/"
                                onClick={onClose}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-th-accent-primary text-white font-medium transition-all duration-200 hover:bg-th-accent-primary-hover"
                            >
                                Enter App
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Landing page header with navigation
 */
function LandingHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 right-0 z-50 bg-th-bg-base/80 backdrop-blur-md border-b border-th-border-subtle"
            >
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/landing" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-th-accent-primary flex items-center justify-center transition-transform group-hover:scale-105">
                            <Gamepad2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-display font-bold text-th-text-primary">
                            Game Insights
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a
                            href="#features"
                            className="text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
                        >
                            How it Works
                        </a>
                        <a
                            href="https://github.com/efecelik/game-insights"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
                        >
                            GitHub
                        </a>
                    </nav>

                    {/* Desktop CTA + Mobile Menu Button */}
                    <div className="flex items-center gap-3">
                        {/* Desktop CTA */}
                        <Link
                            to="/"
                            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-th-accent-primary-muted border border-th-accent-primary/30 text-th-accent-primary text-sm font-medium transition-all duration-200 hover:bg-th-accent-primary/20 hover:border-th-accent-primary/40"
                        >
                            Enter App
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        {/* Mobile hamburger button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-elevated transition-colors"
                            aria-label="Open menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
        </>
    );
}

/**
 * Main Landing Page Component
 */
export function LandingPage() {
    return (
        <PublicLayout>
            <LandingHeader />

            {/* Main content with padding for fixed header */}
            <main className="pt-16">
                <Hero />

                <div id="features">
                    <Features />
                </div>

                <div id="game-types">
                    <GameTypes />
                </div>

                <div id="how-it-works">
                    <HowItWorks />
                </div>

                <TechStack />

                <FAQ />

                <div id="privacy">
                    <Footer />
                </div>
            </main>
        </PublicLayout>
    );
}

export default LandingPage;
