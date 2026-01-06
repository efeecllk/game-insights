/**
 * Sidebar Customizer - Obsidian Analytics Design System
 *
 * Modal component for customizing sidebar navigation order with:
 * - Drag-and-drop reordering via up/down arrow buttons
 * - Toggle between custom and game-type default order
 * - Reset to default functionality
 * - Glassmorphism modal design
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronUp,
    ChevronDown,
    RotateCcw,
    GripVertical,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { useSidebarSettings, DEFAULT_SIDEBAR_ORDER } from '../lib/sidebarStore';
import { Button } from './ui/Button';

interface SidebarCustomizerProps {
    isOpen: boolean;
    onClose: () => void;
}

// Animation variants for modal
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: 0.15 },
    },
};

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.02,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
};

export function SidebarCustomizer({ isOpen, onClose }: SidebarCustomizerProps) {
    const {
        loading,
        useCustomOrder,
        customOrder,
        setUseCustomOrder,
        moveItem,
        resetToDefault,
    } = useSidebarSettings();

    const handleMoveUp = useCallback(
        (index: number) => {
            if (index > 0) {
                moveItem(index, index - 1);
            }
        },
        [moveItem]
    );

    const handleMoveDown = useCallback(
        (index: number) => {
            if (index < customOrder.length - 1) {
                moveItem(index, index + 1);
            }
        },
        [moveItem, customOrder.length]
    );

    const handleToggleCustomOrder = useCallback(() => {
        setUseCustomOrder(!useCustomOrder);
    }, [useCustomOrder, setUseCustomOrder]);

    const handleReset = useCallback(async () => {
        await resetToDefault();
    }, [resetToDefault]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    // Get the display order based on current settings
    const displayOrder = useCustomOrder ? customOrder : DEFAULT_SIDEBAR_ORDER;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={handleOverlayClick}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-md mx-4 max-h-[85vh] flex flex-col"
                    >
                        {/* Modal container */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40">
                            {/* Noise texture */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                            {/* Header */}
                            <div className="relative flex items-center justify-between p-5 border-b border-white/[0.06]">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        Customize Sidebar
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-0.5">
                                        Reorder navigation items
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.05] text-slate-400 hover:text-white transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Toggle section */}
                            <div className="relative p-4 border-b border-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-white">
                                            Use custom order
                                        </span>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {useCustomOrder
                                                ? 'Using your custom order'
                                                : 'Using game-type default order'}
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleToggleCustomOrder}
                                        disabled={loading}
                                        className={`
                                            p-1 rounded-lg transition-colors
                                            ${useCustomOrder
                                                ? 'text-[#DA7756]'
                                                : 'text-slate-500 hover:text-slate-400'}
                                        `}
                                        aria-label={useCustomOrder ? 'Disable custom order' : 'Enable custom order'}
                                    >
                                        {useCustomOrder ? (
                                            <ToggleRight className="w-8 h-8" />
                                        ) : (
                                            <ToggleLeft className="w-8 h-8" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Item list */}
                            <div className="relative overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-500">
                                        Loading...
                                    </div>
                                ) : (
                                    <motion.ul
                                        variants={listVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="p-3 space-y-1"
                                    >
                                        {displayOrder.map((label, index) => (
                                            <SidebarItem
                                                key={label}
                                                label={label}
                                                index={index}
                                                isFirst={index === 0}
                                                isLast={index === displayOrder.length - 1}
                                                onMoveUp={() => handleMoveUp(index)}
                                                onMoveDown={() => handleMoveDown(index)}
                                                disabled={!useCustomOrder}
                                            />
                                        ))}
                                    </motion.ul>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="relative p-4 border-t border-white/[0.06] flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<RotateCcw className="w-4 h-4" />}
                                    onClick={handleReset}
                                    disabled={loading}
                                >
                                    Reset to default
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={onClose}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

interface SidebarItemProps {
    label: string;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    disabled: boolean;
}

function SidebarItem({
    label,
    index,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    disabled,
}: SidebarItemProps) {
    return (
        <motion.li
            variants={itemVariants}
            layout
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                bg-white/[0.02] border border-white/[0.04]
                ${disabled ? 'opacity-50' : 'hover:bg-white/[0.04] hover:border-white/[0.08]'}
                transition-colors
            `}
        >
            {/* Drag handle indicator */}
            <GripVertical
                className={`w-4 h-4 flex-shrink-0 ${
                    disabled ? 'text-slate-700' : 'text-slate-500'
                }`}
            />

            {/* Index badge */}
            <span
                className={`
                    w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium flex-shrink-0
                    ${index < 6
                        ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/20'
                        : 'bg-white/[0.05] text-slate-500 border border-white/[0.05]'}
                `}
            >
                {index + 1}
            </span>

            {/* Label */}
            <span className="flex-1 text-sm text-slate-300 truncate">{label}</span>

            {/* Move buttons */}
            <div className="flex items-center gap-1">
                <motion.button
                    whileHover={disabled || isFirst ? undefined : { scale: 1.1 }}
                    whileTap={disabled || isFirst ? undefined : { scale: 0.9 }}
                    onClick={onMoveUp}
                    disabled={disabled || isFirst}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${disabled || isFirst
                            ? 'text-slate-700 cursor-not-allowed'
                            : 'text-slate-500 hover:text-white hover:bg-white/[0.08]'}
                    `}
                    aria-label={`Move ${label} up`}
                >
                    <ChevronUp className="w-4 h-4" />
                </motion.button>
                <motion.button
                    whileHover={disabled || isLast ? undefined : { scale: 1.1 }}
                    whileTap={disabled || isLast ? undefined : { scale: 0.9 }}
                    onClick={onMoveDown}
                    disabled={disabled || isLast}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${disabled || isLast
                            ? 'text-slate-700 cursor-not-allowed'
                            : 'text-slate-500 hover:text-white hover:bg-white/[0.08]'}
                    `}
                    aria-label={`Move ${label} down`}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.li>
    );
}

export default SidebarCustomizer;
