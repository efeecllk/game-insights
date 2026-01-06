/**
 * Event Stream Viewer - Obsidian Analytics Design
 *
 * Real-time event feed with:
 * - Glassmorphism containers
 * - Animated event entries
 * - Color-coded event types
 *
 * Performance Optimizations:
 * - Uses cleanup utilities for proper interval management
 * - Automatic cleanup on unmount to prevent zombie processes
 */

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Play,
    Pause,
    Download,
    RefreshCw,
    ChevronRight,
    User,
    DollarSign,
    Gamepad2,
    Zap,
    Search,
    X,
} from 'lucide-react';
import { useTimers } from '../../lib/cleanupUtils';
import { useFeatureTracking, usePerformanceStore } from '../../lib/performanceStore';

// ============================================================================
// Types
// ============================================================================

export type EventType =
    | 'session_start'
    | 'session_end'
    | 'level_start'
    | 'level_complete'
    | 'level_fail'
    | 'purchase'
    | 'ad_view'
    | 'achievement'
    | 'tutorial_step'
    | 'custom';

export interface GameEvent {
    id: string;
    type: EventType;
    timestamp: string;
    userId: string;
    sessionId: string;
    properties: Record<string, unknown>;
    platform?: string;
    country?: string;
    appVersion?: string;
}

interface EventStreamProps {
    maxEvents?: number;
    autoScroll?: boolean;
}

// ============================================================================
// Mock Event Generator
// ============================================================================

const EVENT_TYPES: EventType[] = [
    'session_start', 'session_end', 'level_start', 'level_complete',
    'level_fail', 'purchase', 'ad_view', 'achievement', 'tutorial_step'
];

const COUNTRIES = ['US', 'GB', 'DE', 'JP', 'KR', 'BR', 'FR', 'CA'];
const PLATFORMS = ['iOS', 'Android'];

function generateMockEvent(): GameEvent {
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const userId = `user_${Math.floor(Math.random() * 10000)}`;
    const sessionId = `session_${Math.floor(Math.random() * 1000)}`;

    const properties: Record<string, unknown> = {};

    switch (type) {
        case 'level_start':
        case 'level_complete':
        case 'level_fail':
            properties.level = Math.floor(Math.random() * 100) + 1;
            properties.attempts = Math.floor(Math.random() * 5) + 1;
            break;
        case 'purchase':
            properties.product_id = `pack_${Math.floor(Math.random() * 10) + 1}`;
            properties.price = [0.99, 2.99, 4.99, 9.99, 19.99][Math.floor(Math.random() * 5)];
            properties.currency = 'USD';
            break;
        case 'ad_view':
            properties.ad_type = ['rewarded', 'interstitial', 'banner'][Math.floor(Math.random() * 3)];
            properties.completed = Math.random() > 0.2;
            break;
        case 'achievement':
            properties.achievement_id = `ach_${Math.floor(Math.random() * 50) + 1}`;
            properties.name = ['First Win', 'Level Master', 'Big Spender', 'Social Star'][Math.floor(Math.random() * 4)];
            break;
        case 'tutorial_step':
            properties.step = Math.floor(Math.random() * 10) + 1;
            properties.skipped = Math.random() > 0.8;
            break;
    }

    return {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        timestamp: new Date().toISOString(),
        userId,
        sessionId,
        properties,
        platform: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
        country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        appVersion: `1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
    };
}

// ============================================================================
// Event Type Styling
// ============================================================================

const EVENT_STYLES: Record<EventType, { icon: typeof Activity; color: string; bg: string }> = {
    session_start: { icon: Play, color: 'text-[#DA7756]', bg: 'bg-[#DA7756]/10' },
    session_end: { icon: Pause, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    level_start: { icon: Gamepad2, color: 'text-[#8F8B82]', bg: 'bg-[#8F8B82]/10' },
    level_complete: { icon: Zap, color: 'text-[#E5A84B]', bg: 'bg-[#E5A84B]/10' },
    level_fail: { icon: X, color: 'text-[#E25C5C]', bg: 'bg-[#E25C5C]/10' },
    purchase: { icon: DollarSign, color: 'text-[#DA7756]', bg: 'bg-[#DA7756]/10' },
    ad_view: { icon: Activity, color: 'text-[#C15F3C]', bg: 'bg-[#C15F3C]/10' },
    achievement: { icon: Zap, color: 'text-[#E5A84B]', bg: 'bg-[#E5A84B]/10' },
    tutorial_step: { icon: User, color: 'text-[#A68B5B]', bg: 'bg-[#A68B5B]/10' },
    custom: { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

// ============================================================================
// Event Stream Component
// ============================================================================

export function EventStream({ maxEvents = 100, autoScroll = true }: EventStreamProps) {
    const [events, setEvents] = useState<GameEvent[]>([]);
    const [isStreaming, setIsStreaming] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
    const [filter, setFilter] = useState<EventType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef<HTMLDivElement>(null);

    // Cleanup utilities for proper resource management
    const timers = useTimers();
    const { shouldEnableLiveUpdates } = usePerformanceStore();

    // Track this as an expensive feature
    useFeatureTracking('event-stream', 'Event Stream', {
        priority: 'medium',
        isExpensive: true,
    });

    // Memoized event generator
    const addNewEvent = useCallback(() => {
        const newEvent = generateMockEvent();
        setEvents(prev => {
            const updated = [newEvent, ...prev];
            return updated.slice(0, maxEvents);
        });
    }, [maxEvents]);

    // Generate mock events when streaming using managed timers
    useEffect(() => {
        if (!isStreaming || !shouldEnableLiveUpdates) return;

        // Use managed interval that auto-cleans on unmount
        // Use a fixed interval for better predictability
        const handle = timers.setInterval(addNewEvent, 1500, 'event-stream-update');

        return () => handle.clear();
    }, [isStreaming, shouldEnableLiveUpdates, addNewEvent, timers]);

    // Auto-scroll to top on new events
    useEffect(() => {
        if (autoScroll && listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [events, autoScroll]);

    // Filter events
    const filteredEvents = useMemo(() => {
        return events.filter(evt => {
            if (filter !== 'all' && evt.type !== filter) return false;
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                return (
                    evt.userId.toLowerCase().includes(searchLower) ||
                    evt.type.toLowerCase().includes(searchLower) ||
                    JSON.stringify(evt.properties).toLowerCase().includes(searchLower)
                );
            }
            return true;
        });
    }, [events, filter, searchQuery]);

    // Export events
    const handleExport = () => {
        const data = JSON.stringify(filteredEvents, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-slate-900  rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${isStreaming ? 'bg-[#DA7756]/20' : 'bg-white/[0.03]'} flex items-center justify-center`}>
                        <Activity className={`w-4 h-4 ${isStreaming ? 'text-[#DA7756]' : 'text-slate-400'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Event Stream</h3>
                        <p className="text-xs text-slate-400">
                            {filteredEvents.length} events {isStreaming && '• Live'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="pl-8 pr-3 py-1.5 w-40 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 transition-all"
                        />
                    </div>

                    {/* Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as EventType | 'all')}
                        className="px-3 py-1.5 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                    >
                        <option value="all">All Events</option>
                        {EVENT_TYPES.map(type => (
                            <option key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>

                    {/* Controls */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsStreaming(!isStreaming)}
                        className={`p-2 rounded-lg transition-colors ${
                            isStreaming ? 'bg-[#DA7756]/20 text-[#DA7756]' : 'bg-white/[0.03] text-slate-400 hover:text-white'
                        }`}
                        title={isStreaming ? 'Pause stream' : 'Resume stream'}
                    >
                        {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEvents([])}
                        className="p-2 bg-white/[0.03] text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Clear events"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExport}
                        className="p-2 bg-white/[0.03] text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Export events"
                    >
                        <Download className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Event List */}
            <div ref={listRef} className="h-96 overflow-y-auto">
                {filteredEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        <p>No events yet. {isStreaming ? 'Waiting for events...' : 'Start streaming to see events.'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        <AnimatePresence initial={false}>
                            {filteredEvents.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    isSelected={selectedEvent?.id === event.id}
                                    onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Event Detail Panel */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-800 p-4 bg-white/[0.02]"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white">Event Details</h4>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedEvent(null)}
                                className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </motion.button>
                        </div>
                        <pre className="text-xs text-slate-400 bg-white/[0.02] border border-slate-800 rounded-xl p-3 overflow-x-auto">
                            {JSON.stringify(selectedEvent, null, 2)}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Event Row Component - Memoized for performance
// ============================================================================

interface EventRowProps {
    event: GameEvent;
    isSelected: boolean;
    onClick: () => void;
}

// Memoized EventRow to prevent re-renders when other events change
const EventRow = memo(function EventRow({ event, isSelected, onClick }: EventRowProps) {
    const style = EVENT_STYLES[event.type] || EVENT_STYLES.custom;
    const Icon = style.icon;
    const time = new Date(event.timestamp);

    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                isSelected ? 'bg-[#DA7756]/10' : 'hover:bg-white/[0.02]'
            }`}
        >
            <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">
                        {event.type.replace(/_/g, ' ')}
                    </span>
                    {event.type === 'purchase' && (
                        <span className="text-xs text-[#DA7756] font-medium">
                            ${String(event.properties.price)}
                        </span>
                    )}
                    {(event.type === 'level_complete' || event.type === 'level_fail') && (
                        <span className="text-xs text-slate-400">
                            Level {String(event.properties.level)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{event.userId}</span>
                    <span>•</span>
                    <span>{event.platform}</span>
                    <span>•</span>
                    <span>{event.country}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-500">
                    {time.toLocaleTimeString()}
                </span>
                <motion.div animate={{ rotate: isSelected ? 90 : 0 }}>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </motion.div>
            </div>
        </motion.button>
    );
});

export default EventStream;
