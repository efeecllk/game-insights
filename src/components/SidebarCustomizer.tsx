/**
 * Sidebar Customizer - Obsidian Analytics Design System
 *
 * Modal component for customizing sidebar navigation order with:
 * - True drag-and-drop reordering
 * - Up/down arrow buttons for fine control
 * - Toggle between custom and game-type default order
 * - Reset to default functionality
 * - Glassmorphism modal design
 */

import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
        reorderItems,
        resetToDefault,
    } = useSidebarSettings();

    // Local state for drag-and-drop (to allow smooth animations before persisting)
    const [localOrder, setLocalOrder] = useState<string[]>(customOrder);
    const isDragging = useRef(false);

    // Sync local order with store when customOrder changes (and not dragging)
    // This ensures the local state stays in sync when using arrow buttons
    if (!isDragging.current && JSON.stringify(localOrder) !== JSON.stringify(customOrder)) {
        setLocalOrder(customOrder);
    }

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
        setLocalOrder(DEFAULT_SIDEBAR_ORDER);
    }, [resetToDefault]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    // Handle reorder from drag-and-drop
    const handleReorder = useCallback((newOrder: string[]) => {
        setLocalOrder(newOrder);
        isDragging.current = true;
    }, []);

    // Persist the order when drag ends
    const handleDragEnd = useCallback(() => {
        if (isDragging.current) {
            reorderItems(localOrder);
            isDragging.current = false;
        }
    }, [localOrder, reorderItems]);

    // Get the display order based on current settings
    const displayOrder = useCustomOrder ? (isDragging.current ? localOrder : customOrder) : DEFAULT_SIDEBAR_ORDER;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={handleOverlayClick}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 "
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-md mx-4 max-h-[85vh] flex flex-col"
                    >
                        {/* Modal container */}
                        <div className="relative rounded-2xl overflow-hidden bg-th-bg-surface border border-th-border shadow-theme-lg">
                            {/* Header */}
                            <div className="relative flex items-center justify-between p-5 border-b border-th-border">
                                <div>
                                    <h2 className="text-lg font-semibold text-th-text-primary">
                                        Customize Sidebar
                                    </h2>
                                    <p className="text-sm text-th-text-muted mt-0.5">
                                        Reorder navigation items
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-th-bg-elevated hover:bg-th-bg-surface-hover border border-th-border text-th-text-muted hover:text-th-text-primary transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Toggle section */}
                            <div className="relative p-4 border-b border-th-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-th-text-primary">
                                            Use custom order
                                        </span>
                                        <p className="text-xs text-th-text-muted mt-0.5">
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
                                                ? 'text-th-accent-primary'
                                                : 'text-th-text-muted hover:text-th-text-secondary'}
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
                            <div className="relative overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-th-border scrollbar-track-transparent">
                                {loading ? (
                                    <div className="p-8 text-center text-th-text-muted">
                                        Loading...
                                    </div>
                                ) : useCustomOrder ? (
                                    // Draggable list when custom order is enabled
                                    <Reorder.Group
                                        axis="y"
                                        values={localOrder}
                                        onReorder={handleReorder}
                                        className="p-3 space-y-1"
                                    >
                                        {localOrder.map((label, index) => (
                                            <DraggableSidebarItem
                                                key={label}
                                                label={label}
                                                index={index}
                                                isFirst={index === 0}
                                                isLast={index === localOrder.length - 1}
                                                onMoveUp={() => handleMoveUp(index)}
                                                onMoveDown={() => handleMoveDown(index)}
                                                onDragEnd={handleDragEnd}
                                            />
                                        ))}
                                    </Reorder.Group>
                                ) : (
                                    // Static list when using default order
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
                                                disabled={true}
                                            />
                                        ))}
                                    </motion.ul>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="relative p-4 border-t border-th-border flex items-center justify-between">
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
                bg-th-bg-elevated border border-th-border
                ${disabled ? 'opacity-50' : 'hover:bg-th-bg-surface-hover hover:border-th-border-strong'}
                transition-colors
            `}
        >
            {/* Drag handle indicator */}
            <GripVertical
                className={`w-4 h-4 flex-shrink-0 ${
                    disabled ? 'text-th-text-disabled' : 'text-th-text-muted'
                }`}
            />

            {/* Index badge */}
            <span
                className={`
                    w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium flex-shrink-0
                    ${index < 6
                        ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/20'
                        : 'bg-th-bg-elevated text-th-text-muted border border-th-border'}
                `}
            >
                {index + 1}
            </span>

            {/* Label */}
            <span className="flex-1 text-sm text-th-text-secondary truncate">{label}</span>

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
                            ? 'text-th-text-disabled cursor-not-allowed'
                            : 'text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover'}
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
                            ? 'text-th-text-disabled cursor-not-allowed'
                            : 'text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover'}
                    `}
                    aria-label={`Move ${label} down`}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.li>
    );
}

// ============================================================================
// Draggable Item (uses Framer Motion Reorder)
// ============================================================================

interface DraggableSidebarItemProps {
    label: string;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDragEnd: () => void;
}

function DraggableSidebarItem({
    label,
    index,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onDragEnd,
}: DraggableSidebarItemProps) {
    return (
        <Reorder.Item
            value={label}
            onDragEnd={onDragEnd}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                bg-th-bg-elevated border border-th-border
                hover:bg-th-bg-surface-hover hover:border-th-border-strong
                transition-colors cursor-grab active:cursor-grabbing
                select-none
            `}
            whileDrag={{
                scale: 1.02,
                boxShadow: '0 8px 20px var(--shadow-color)',
            }}
        >
            {/* Drag handle indicator */}
            <GripVertical
                className="w-4 h-4 flex-shrink-0 text-th-text-muted cursor-grab active:cursor-grabbing"
            />

            {/* Index badge */}
            <span
                className={`
                    w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium flex-shrink-0
                    ${index < 6
                        ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/20'
                        : 'bg-th-bg-elevated text-th-text-muted border border-th-border'}
                `}
            >
                {index + 1}
            </span>

            {/* Label */}
            <span className="flex-1 text-sm text-th-text-secondary truncate">{label}</span>

            {/* Move buttons */}
            <div className="flex items-center gap-1">
                <motion.button
                    whileHover={isFirst ? undefined : { scale: 1.1 }}
                    whileTap={isFirst ? undefined : { scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveUp();
                    }}
                    disabled={isFirst}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${isFirst
                            ? 'text-th-text-disabled cursor-not-allowed'
                            : 'text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover'}
                    `}
                    aria-label={`Move ${label} up`}
                >
                    <ChevronUp className="w-4 h-4" />
                </motion.button>
                <motion.button
                    whileHover={isLast ? undefined : { scale: 1.1 }}
                    whileTap={isLast ? undefined : { scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveDown();
                    }}
                    disabled={isLast}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${isLast
                            ? 'text-th-text-disabled cursor-not-allowed'
                            : 'text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover'}
                    `}
                    aria-label={`Move ${label} down`}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.button>
            </div>
        </Reorder.Item>
    );
}

export default SidebarCustomizer;
