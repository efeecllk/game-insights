/**
 * Welcome Flow
 * Onboarding experience for new users
 * Phase 8: Usability & Accessibility
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-th-bg-darkest">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-indigo-900/20" />

            {/* Animated background shapes */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content */}
            <div className="relative w-full max-w-2xl mx-4">
                {step === 'welcome' && (
                    <WelcomeStep onNext={() => setStep('choose-path')} onSkip={onSkip} />
                )}
                {step === 'choose-path' && (
                    <ChoosePathStep onUpload={handleUploadPath} onDemo={handleDemoPath} onBack={() => setStep('welcome')} />
                )}
                {step === 'game-type' && (
                    <GameTypeStep onSelect={handleGameTypeSelect} onBack={() => setStep('choose-path')} />
                )}
                {step === 'complete' && (
                    <CompleteStep
                        path={selectedPath}
                        gameType={selectedGameType}
                        onComplete={handleComplete}
                    />
                )}
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
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                    <Gamepad2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                    Welcome to Game Insights
                </h1>
                <p className="text-lg text-th-text-secondary max-w-lg mx-auto">
                    Zero-config analytics for indie game developers.
                    Understand your players, improve retention, and grow revenue.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 transition-all"
                >
                    Get Started
                    <ChevronRight className="w-5 h-5" />
                </button>
                <button
                    onClick={onSkip}
                    className="px-8 py-3 text-th-text-secondary hover:text-white transition-colors"
                >
                    Skip for now
                </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                <Feature icon={Zap} label="Zero Config" />
                <Feature icon={BarChart3} label="AI Analytics" />
                <Feature icon={Sparkles} label="Instant Insights" />
            </div>
        </div>
    );
}

function Feature({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-xl bg-white/5 border border-white/10">
                <Icon className="w-6 h-6 text-violet-400" />
            </div>
            <div className="text-sm text-th-text-secondary">{label}</div>
        </div>
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
                <p className="text-th-text-secondary">Choose your path to get the most out of Game Insights</p>
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
                <button
                    onClick={onBack}
                    className="text-sm text-th-text-secondary hover:text-white transition-colors"
                >
                    ← Back
                </button>
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
        <button
            onClick={onClick}
            className={`group p-6 rounded-xl border text-left transition-all ${
                primary
                    ? 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/30 hover:border-violet-400/50'
                    : 'bg-th-bg-card border-th-border hover:border-th-border-hover'
            }`}
        >
            <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${
                primary ? 'bg-violet-500/20' : 'bg-th-bg-elevated'
            }`}>
                <Icon className={`w-6 h-6 ${primary ? 'text-violet-400' : 'text-th-text-secondary'}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-th-text-secondary">{description}</p>
            <div className={`mt-4 text-sm font-medium ${primary ? 'text-violet-400' : 'text-th-text-secondary'} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                Get started <ChevronRight className="w-4 h-4" />
            </div>
        </button>
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
                <p className="text-th-text-secondary">We'll customize the demo data and insights for your genre</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {gameTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onSelect(type.id)}
                        className="p-4 bg-th-bg-card border border-th-border hover:border-violet-500/50 rounded-xl text-center transition-all group"
                    >
                        <span className="text-3xl mb-2 block">{type.emoji}</span>
                        <span className="text-sm text-white group-hover:text-violet-400 transition-colors">{type.name}</span>
                    </button>
                ))}
            </div>

            <div className="text-center">
                <button
                    onClick={onBack}
                    className="text-sm text-th-text-secondary hover:text-white transition-colors"
                >
                    ← Back
                </button>
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
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-500/20 border-2 border-green-500/50">
                <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
            <p className="text-th-text-secondary mb-8">
                {path === 'upload'
                    ? "Let's upload your game data and start analyzing."
                    : `Explore Game Insights with our ${gameType || 'sample'} demo data.`}
            </p>

            <button
                onClick={onComplete}
                className="flex items-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 transition-all"
            >
                {path === 'upload' ? 'Upload Data' : 'Start Exploring'}
                <ChevronRight className="w-5 h-5" />
            </button>

            <StepIndicator current={3} total={3} />
        </div>
    );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mt-12">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                        i + 1 === current
                            ? 'bg-violet-400'
                            : i + 1 < current
                            ? 'bg-violet-400/50'
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
