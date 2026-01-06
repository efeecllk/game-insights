/**
 * Game Type Selector - Obsidian Analytics Design
 *
 * Premium selector with:
 * - Glassmorphism container
 * - Animated selection indicator
 * - Elegant hover states
 * - Smooth transitions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { GameCategory } from '../../types';
import { gameCategories } from '../../lib/dataProviders';

interface GameSelectorProps {
    selected: GameCategory;
    onChange: (category: GameCategory) => void;
}

export function GameSelector({ selected, onChange }: GameSelectorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="relative"
        >
            {/* Container with glassmorphism */}
            <div className="relative bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80  rounded-2xl p-4 border border-white/[0.05] overflow-hidden">
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNCIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                {/* Label */}
                <p className="relative text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DA7756]/60" />
                    Demo Game Type
                </p>

                {/* Button grid */}
                <div className="relative flex flex-wrap gap-2">
                    {gameCategories.map((game, index) => {
                        const isSelected = selected === game.id;
                        return (
                            <motion.button
                                key={game.id}
                                onClick={() => onChange(game.id)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.3, type: 'spring' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    isSelected
                                        ? 'text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {/* Selection background */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            layoutId="gameSelector"
                                            className="absolute inset-0 bg-gradient-to-r from-[#DA7756]/20 via-[#DA7756]/15 to-[#C15F3C]/20 rounded-xl border border-[#DA7756]/30"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        >
                                            {/* Glow effect */}
                                            <div className="absolute inset-0 bg-[#DA7756]/10 rounded-xl blur-md" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Hover background for unselected */}
                                {!isSelected && (
                                    <div className="absolute inset-0 bg-white/[0.03] rounded-xl border border-slate-800 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                                )}

                                {/* Content */}
                                <span className="relative flex items-center gap-2">
                                    <span className="text-base">{game.icon}</span>
                                    <span>{game.name}</span>
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Decorative gradient line */}
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#DA7756]/10 to-transparent" />
            </div>
        </motion.div>
    );
}

export default GameSelector;
