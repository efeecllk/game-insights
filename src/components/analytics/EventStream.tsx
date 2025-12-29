/**
 * Event Stream Viewer
 * Real-time event feed with filtering
 * Phase 9: Advanced Features
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Activity,
    Play,
    Pause,
    Download,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    User,
    DollarSign,
    Gamepad2,
    Zap,
    Search,
    X,
} from 'lucide-react';

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
    session_start: { icon: Play, color: 'text-green-400', bg: 'bg-green-500/10' },
    session_end: { icon: Pause, color: 'text-gray-400', bg: 'bg-gray-500/10' },
    level_start: { icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    level_complete: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    level_fail: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
    purchase: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ad_view: { icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    achievement: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    tutorial_step: { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    custom: { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10' },
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

    // Generate mock events when streaming
    useEffect(() => {
        if (!isStreaming) return;

        const interval = setInterval(() => {
            const newEvent = generateMockEvent();
            setEvents(prev => {
                const updated = [newEvent, ...prev];
                return updated.slice(0, maxEvents);
            });
        }, Math.random() * 2000 + 500); // Random interval 500-2500ms

        return () => clearInterval(interval);
    }, [isStreaming, maxEvents]);

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
        <div className="bg-th-bg-card rounded-xl border border-th-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-th-border">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${isStreaming ? 'bg-green-500/20' : 'bg-th-bg-elevated'} flex items-center justify-center`}>
                        <Activity className={`w-4 h-4 ${isStreaming ? 'text-green-400 animate-pulse' : 'text-th-text-secondary'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-th-text-primary">Event Stream</h3>
                        <p className="text-xs text-th-text-secondary">
                            {filteredEvents.length} events {isStreaming && '• Live'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="pl-8 pr-3 py-1.5 w-40 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-primary placeholder:text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50"
                        />
                    </div>

                    {/* Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as EventType | 'all')}
                        className="px-3 py-1.5 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50"
                    >
                        <option value="all">All Events</option>
                        {EVENT_TYPES.map(type => (
                            <option key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>

                    {/* Controls */}
                    <button
                        onClick={() => setIsStreaming(!isStreaming)}
                        className={`p-2 rounded-lg transition-colors ${
                            isStreaming ? 'bg-green-500/20 text-green-400' : 'bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary'
                        }`}
                        title={isStreaming ? 'Pause stream' : 'Resume stream'}
                    >
                        {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setEvents([])}
                        className="p-2 bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary rounded-lg transition-colors"
                        title="Clear events"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-2 bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary rounded-lg transition-colors"
                        title="Export events"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div ref={listRef} className="h-96 overflow-y-auto">
                {filteredEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-th-text-secondary">
                        <p>No events yet. {isStreaming ? 'Waiting for events...' : 'Start streaming to see events.'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-th-border">
                        {filteredEvents.map((event) => (
                            <EventRow
                                key={event.id}
                                event={event}
                                isSelected={selectedEvent?.id === event.id}
                                onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Event Detail Panel */}
            {selectedEvent && (
                <div className="border-t border-th-border p-4 bg-th-bg-elevated">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-th-text-primary">Event Details</h4>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="p-1 hover:bg-th-bg-card rounded transition-colors"
                        >
                            <X className="w-4 h-4 text-th-text-secondary" />
                        </button>
                    </div>
                    <pre className="text-xs text-th-text-secondary bg-th-bg-card rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(selectedEvent, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Event Row Component
// ============================================================================

function EventRow({
    event,
    isSelected,
    onClick,
}: {
    event: GameEvent;
    isSelected: boolean;
    onClick: () => void;
}) {
    const style = EVENT_STYLES[event.type] || EVENT_STYLES.custom;
    const Icon = style.icon;
    const time = new Date(event.timestamp);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                isSelected ? 'bg-th-accent-primary/10' : 'hover:bg-th-bg-elevated'
            }`}
        >
            <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-th-text-primary text-sm">
                        {event.type.replace(/_/g, ' ')}
                    </span>
                    {event.type === 'purchase' && (
                        <span className="text-xs text-emerald-400 font-medium">
                            ${String(event.properties.price)}
                        </span>
                    )}
                    {(event.type === 'level_complete' || event.type === 'level_fail') && (
                        <span className="text-xs text-th-text-secondary">
                            Level {String(event.properties.level)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-th-text-secondary">
                    <span>{event.userId}</span>
                    <span>•</span>
                    <span>{event.platform}</span>
                    <span>•</span>
                    <span>{event.country}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-th-text-secondary">
                    {time.toLocaleTimeString()}
                </span>
                {isSelected ? (
                    <ChevronDown className="w-4 h-4 text-th-text-secondary" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-th-text-secondary" />
                )}
            </div>
        </button>
    );
}

export default EventStream;
