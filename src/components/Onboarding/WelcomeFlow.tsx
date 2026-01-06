/**
 * Welcome Flow - Obsidian Analytics Design
 *
 * Premium onboarding experience with:
 * - Glassmorphism containers
 * - Animated transitions
 * - Warm orange accent theme
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Play,
    Gamepad2,
    BarChart3,
    Zap,
    Check,
    ChevronRight,
    Sparkles,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WelcomeFlowProps {
    onComplete: () => void;
    onSkip: () => void;
}

type Step = 'welcome' | 'choose-path' | 'game-type' | 'complete';

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

// ============================================================================
// Welcome Flow Component
// ============================================================================

export function WelcomeFlow({ onComplete, onSkip }: WelcomeFlowProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('welcome');
    const [selectedPath, setSelectedPath] = useState<'upload' | 'demo' | null>(null);
    const [selectedGameType, setSelectedGameType] = useState<string | null>(null);

    const handleUploadPath = () => {
        setSelectedPath('upload');
        setStep('complete');
    };

    const handleDemoPath = () => {
        setSelectedPath('demo');
        setStep('game-type');
    };

    const handleGameTypeSelect = (type: string) => {
        setSelectedGameType(type);
        setStep('complete');
    };

    const handleComplete = () => {
        // Store onboarding completion
        localStorage.setItem('game-insights-onboarded', 'true');
        localStorage.setItem('game-insights-onboarding-path', selectedPath || 'skip');
        if (selectedGameType) {
            localStorage.setItem('game-insights-demo-type', selectedGameType);
        }
        onComplete();

        // Navigate based on path
        if (selectedPath === 'upload') {
            navigate('/upload');
        } else if (selectedPath === 'demo') {
            navigate('/');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/20 via-transparent to-[#C15F3C]/20" />

            {/* Animated background shapes */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#DA7756]/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, delay: 4 }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C15F3C]/10 rounded-full blur-3xl"
                />
            </div>

            {/* Content */}
            <div className="relative w-full max-w-2xl mx-4">
                <AnimatePresence mode="wait">
                    {step === 'welcome' && (
                        <motion.div
                            key="welcome"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <WelcomeStep onNext={() => setStep('choose-path')} onSkip={onSkip} />
                        </motion.div>
                    )}
                    {step === 'choose-path' && (
                        <motion.div
                            key="choose-path"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <ChoosePathStep onUpload={handleUploadPath} onDemo={handleDemoPath} onBack={() => setStep('welcome')} />
                        </motion.div>
                    )}
                    {step === 'game-type' && (
                        <motion.div
                            key="game-type"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <GameTypeStep onSelect={handleGameTypeSelect} onBack={() => setStep('choose-path')} />
                        </motion.div>
                    )}
                    {step === 'complete' && (
                        <motion.div
                            key="complete"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <CompleteStep
                                path={selectedPath}
                                gameType={selectedGameType}
                                onComplete={handleComplete}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ============================================================================
// Step Components
// ============================================================================

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    return (
        <div className="text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mb-8"
            >
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl blur-xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#DA7756] to-[#C15F3C] shadow-lg shadow-[#DA7756]/25 flex items-center justify-center">
                        <Gamepad2 className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                    Welcome to Game Insights
                </h1>
                <p className="text-lg text-slate-300 max-w-lg mx-auto mb-6">
                    Turn your game data into actionable insights in 3 simple steps:
                </p>

                {/* Simple 3-step overview */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 text-left max-w-2xl mx-auto">
                    <StepPreview number={1} title="Upload" description="Drop in your CSV or connect a data source" />
                    <div className="hidden sm:block text-slate-700">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                    <StepPreview number={2} title="Analyze" description="AI auto-detects your game type and metrics" />
                    <div className="hidden sm:block text-slate-700">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                    <StepPreview number={3} title="Explore" description="Get retention, funnel, and revenue insights" />
                </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#DA7756] to-[#C15F3C] hover:from-[#E88A6A] hover:to-[#DA7756] text-white font-medium rounded-xl shadow-lg shadow-[#DA7756]/25 transition-all"
                >
                    Get Started
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSkip}
                    className="px-8 py-3 text-slate-400 hover:text-white transition-colors"
                >
                    Skip for now
                </motion.button>
            </div>

            <motion.div
                variants={{
                    visible: { transition: { staggerChildren: 0.1 } },
                }}
                initial="hidden"
                animate="visible"
                className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto"
            >
                <Feature icon={Zap} label="Zero Config" />
                <Feature icon={BarChart3} label="AI Analytics" />
                <Feature icon={Sparkles} label="Instant Insights" />
            </motion.div>

            {/* Privacy note */}
            <p className="mt-8 text-xs text-slate-500">
                Your data stays 100% private - everything runs locally in your browser.
            </p>
        </div>
    );
}

function StepPreview({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: number * 0.1 }}
            className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
        >
            <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#DA7756]/20 text-[#DA7756] text-xs font-bold flex items-center justify-center">
                    {number}
                </span>
                <span className="font-medium text-white">{title}</span>
            </div>
            <p className="text-xs text-slate-400">{description}</p>
        </motion.div>
    );
}

function Feature({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <motion.div
            variants={itemVariants}
            className="text-center"
        >
            <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Icon className="w-6 h-6 text-[#DA7756]" />
            </div>
            <div className="text-sm text-slate-400">{label}</div>
        </motion.div>
    );
}

function ChoosePathStep({
    onUpload,
    onDemo,
    onBack,
}: {
    onUpload: () => void;
    onDemo: () => void;
    onBack: () => void;
}) {
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">How would you like to start?</h2>
                <p className="text-slate-400">Choose your path to get the most out of Game Insights</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <PathOption
                    icon={Upload}
                    title="Upload Your Data"
                    description="Start analyzing your own game data right away"
                    onClick={onUpload}
                    primary
                />
                <PathOption
                    icon={Play}
                    title="Explore Demo"
                    description="See how it works with sample data"
                    onClick={onDemo}
                />
            </div>

            <div className="text-center">
                <motion.button
                    whileHover={{ x: -4 }}
                    onClick={onBack}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    ← Back
                </motion.button>
            </div>

            <StepIndicator current={1} total={3} />
        </div>
    );
}

function PathOption({
    icon: Icon,
    title,
    description,
    onClick,
    primary,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
    primary?: boolean;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`group p-6 rounded-xl border text-left transition-all ${
                primary
                    ? 'bg-gradient-to-br from-[#DA7756]/10 to-[#C15F3C]/10 border-[#DA7756]/30 hover:border-[#DA7756]/50'
                    : 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border-white/[0.08] hover:border-white/[0.15]'
            }`}
        >
            <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${
                primary ? 'bg-[#DA7756]/20' : 'bg-white/[0.03]'
            }`}>
                <Icon className={`w-6 h-6 ${primary ? 'text-[#DA7756]' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
            <div className={`mt-4 text-sm font-medium ${primary ? 'text-[#DA7756]' : 'text-slate-400'} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                Get started <ChevronRight className="w-4 h-4" />
            </div>
        </motion.button>
    );
}

function GameTypeStep({
    onSelect,
    onBack,
}: {
    onSelect: (type: string) => void;
    onBack: () => void;
}) {
    const gameTypes = [
        { id: 'puzzle', name: 'Puzzle Game', emoji: '🧩' },
        { id: 'idle', name: 'Idle / Clicker', emoji: '⏰' },
        { id: 'battle_royale', name: 'Battle Royale', emoji: '🎯' },
        { id: 'match3_meta', name: 'Match-3 Meta', emoji: '💎' },
        { id: 'gacha_rpg', name: 'Gacha RPG', emoji: '⚔️' },
        { id: 'custom', name: 'Other', emoji: '🎮' },
    ];

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">What type of game are you making?</h2>
                <p className="text-slate-400">We'll customize the demo data and insights for your genre</p>
            </div>

            <motion.div
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
            >
                {gameTypes.map((type) => (
                    <motion.button
                        key={type.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(type.id)}
                        className="p-4 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-white/[0.08] hover:border-[#DA7756]/50 rounded-xl text-center transition-all group"
                    >
                        <span className="text-3xl mb-2 block">{type.emoji}</span>
                        <span className="text-sm text-white group-hover:text-[#DA7756] transition-colors">{type.name}</span>
                    </motion.button>
                ))}
            </motion.div>

            <div className="text-center">
                <motion.button
                    whileHover={{ x: -4 }}
                    onClick={onBack}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    ← Back
                </motion.button>
            </div>

            <StepIndicator current={2} total={3} />
        </div>
    );
}

function CompleteStep({
    path,
    gameType,
    onComplete,
}: {
    path: 'upload' | 'demo' | null;
    gameType: string | null;
    onComplete: () => void;
}) {
    return (
        <div className="text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative inline-flex items-center justify-center w-16 h-16 mb-6"
            >
                <div className="absolute inset-0 bg-[#DA7756]/20 rounded-full blur-xl" />
                <div className="relative w-16 h-16 rounded-full bg-[#DA7756]/20 border-2 border-[#DA7756]/50 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#DA7756]" />
                </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
            <p className="text-slate-400 mb-8">
                {path === 'upload'
                    ? "Let's upload your game data and start analyzing."
                    : `Explore Game Insights with our ${gameType || 'sample'} demo data.`}
            </p>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onComplete}
                className="flex items-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-[#DA7756] to-[#C15F3C] hover:from-[#E88A6A] hover:to-[#DA7756] text-white font-medium rounded-xl shadow-lg shadow-[#DA7756]/25 transition-all"
            >
                {path === 'upload' ? 'Upload Data' : 'Start Exploring'}
                <ChevronRight className="w-5 h-5" />
            </motion.button>

            <StepIndicator current={3} total={3} />
        </div>
    );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mt-12">
            {Array.from({ length: total }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                        i + 1 === current
                            ? 'bg-[#DA7756]'
                            : i + 1 < current
                            ? 'bg-[#DA7756]/50'
                            : 'bg-white/20'
                    }`}
                />
            ))}
        </div>
    );
}

// ============================================================================
// Hook to check onboarding status
// ============================================================================

export function useOnboarding() {
    const hasCompleted = localStorage.getItem('game-insights-onboarded') === 'true';

    const reset = () => {
        localStorage.removeItem('game-insights-onboarded');
        localStorage.removeItem('game-insights-onboarding-path');
        localStorage.removeItem('game-insights-demo-type');
    };

    return {
        hasCompleted,
        reset,
    };
}

export default WelcomeFlow;
