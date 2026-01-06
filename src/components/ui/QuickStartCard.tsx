/**
 * Quick Start Card - First-time User Experience
 *
 * A prominent card that appears when users have no data,
 * guiding them through the initial setup process.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    Sparkles,
    ArrowRight,
    Play,
    BarChart3,
    Zap,
    Shield,
} from 'lucide-react';
import { Button } from './Button';

interface QuickStartCardProps {
    onTryDemo?: () => void;
    compact?: boolean;
}

export function QuickStartCard({ onTryDemo, compact = false }: QuickStartCardProps) {
    const navigate = useNavigate();

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-slate-900  rounded-2xl p-6 border border-slate-700 overflow-hidden"
            >
                {/* Background texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                <div className="relative flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-[#DA7756]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Get Started</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Upload your data or explore with a demo
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Upload className="w-4 h-4" />}
                            onClick={() => navigate('/upload')}
                        >
                            Upload
                        </Button>
                        {onTryDemo && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<Play className="w-4 h-4" />}
                                onClick={onTryDemo}
                            >
                                Demo
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative bg-slate-900  rounded-2xl border border-slate-700 overflow-hidden"
        >
            {/* Background texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#DA7756]/10 rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#C15F3C]/10 rounded-full" />

            <div className="relative p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DA7756]/10 border border-[#DA7756]/20 mb-4"
                    >
                        <Zap className="w-4 h-4 text-[#DA7756]" />
                        <span className="text-sm font-medium text-[#DA7756]">Get Started in 30 Seconds</span>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Welcome to Game Insights
                    </h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Upload your game analytics data and get AI-powered insights instantly.
                        No configuration needed.
                    </p>
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Upload Option */}
                    <motion.button
                        whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
                        onClick={() => navigate('/upload')}
                        className="group relative text-left p-6 rounded-xl bg-gradient-to-br from-[#DA7756]/10 to-[#C15F3C]/5 border border-[#DA7756]/20 hover:border-[#DA7756]/40 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[#DA7756]/20 border border-[#DA7756]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-[#DA7756]" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Upload Your Data</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            CSV, JSON, Excel, or SQLite. We auto-detect columns and game type.
                        </p>
                        <span className="inline-flex items-center text-sm font-medium text-[#DA7756] group-hover:gap-2 transition-all">
                            Start uploading <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </motion.button>

                    {/* Demo Option */}
                    <motion.button
                        whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
                        onClick={onTryDemo}
                        className="group relative text-left p-6 rounded-xl bg-white/[0.02] border border-slate-700 hover:border-[#A68B5B]/30 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[#A68B5B]/10 border border-[#A68B5B]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6 text-[#A68B5B]" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Explore with Demo Data</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            See how it works with realistic sample data. No signup required.
                        </p>
                        <span className="inline-flex items-center text-sm font-medium text-[#A68B5B] group-hover:gap-2 transition-all">
                            Try demo <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </motion.button>
                </div>

                {/* Features */}
                <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-slate-800">
                    <Feature icon={BarChart3} label="Auto-detect game type" />
                    <Feature icon={Sparkles} label="AI-powered insights" />
                    <Feature icon={Shield} label="100% local - your data stays private" />
                </div>
            </div>
        </motion.div>
    );
}

function Feature({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
            <Icon className="w-4 h-4 text-slate-500" />
            <span>{label}</span>
        </div>
    );
}

export default QuickStartCard;
