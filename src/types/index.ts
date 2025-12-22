/**
 * Core type definitions for Game Insights Dashboard
 * Following Interface Segregation Principle (ISP)
 */

// ============ DATA TYPES ============

/**
 * Base interface for all analytics data points
 */
export interface DataPoint {
    timestamp: string | number;
    value: number;
    label?: string;
}

/**
 * Time series data for charts
 */
export interface TimeSeriesData {
    name: string;
    data: DataPoint[];
    color?: string;
}

/**
 * Retention data structure
 */
export interface RetentionData {
    days: string[];
    values: number[];
    benchmark?: number[];
}

/**
 * Funnel step data
 */
export interface FunnelStep {
    name: string;
    value: number;
    percentage: number;
    dropOff?: number;
}

/**
 * KPI card data
 */
export interface KPIData {
    label: string;
    value: string | number;
    change?: number;
    changeType: 'up' | 'down' | 'neutral';
    icon?: string;
}

/**
 * Segment/category data
 */
export interface SegmentData {
    name: string;
    value: number;
    percentage: number;
    color?: string;
}

// ============ CHART TYPES ============

/**
 * Supported chart types
 */
export type ChartType =
    | 'retention_curve'
    | 'level_funnel'
    | 'revenue_timeline'
    | 'session_pattern'
    | 'spender_segments'
    | 'difficulty_heatmap'
    | 'weapon_meta'
    | 'prestige_funnel'
    | 'banner_performance'
    | 'custom';

/**
 * Chart configuration interface
 */
export interface ChartConfig {
    type: ChartType;
    title: string;
    subtitle?: string;
    height?: number;
    interactive?: boolean;
    showLegend?: boolean;
    colors?: string[];
}

// ============ GAME TYPES ============

/**
 * Supported game categories
 */
export type GameCategory =
    | 'puzzle'
    | 'idle'
    | 'battle_royale'
    | 'match3_meta'
    | 'gacha_rpg'
    | 'custom';

/**
 * Game profile configuration
 */
export interface GameProfile {
    id: string;
    name: string;
    category: GameCategory;
    icon?: string;
    description?: string;
    createdAt: string;
}

// ============ DASHBOARD TYPES ============

/**
 * Dashboard layout item
 */
export interface DashboardItem {
    id: string;
    chartType: ChartType;
    config: ChartConfig;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Complete dashboard configuration
 */
export interface DashboardConfig {
    id: string;
    name: string;
    gameProfile: GameProfile;
    items: DashboardItem[];
    createdAt: string;
    updatedAt: string;
}

// ============ INSIGHT TYPES ============

/**
 * AI-generated insight
 */
export interface Insight {
    id: string;
    type: 'warning' | 'opportunity' | 'info' | 'critical';
    title: string;
    message: string;
    metric?: string;
    value?: number;
    recommendation?: string;
    confidence?: number;
}

// ============ EVENT TYPES ============

/**
 * Base game event interface
 */
export interface GameEvent {
    event_type: string;
    user_id: string;
    session_id: string;
    timestamp: number;
    platform?: string;
    app_version?: string;
    properties?: Record<string, unknown>;
}

/**
 * Level event (puzzle, progression games)
 */
export interface LevelEvent extends GameEvent {
    event_type: 'level_start' | 'level_complete' | 'level_fail';
    properties: {
        level_id: string | number;
        score?: number;
        time_spent?: number;
        attempts?: number;
    };
}

/**
 * Purchase event
 */
export interface PurchaseEvent extends GameEvent {
    event_type: 'purchase';
    properties: {
        product_id: string;
        amount: number;
        currency: string;
        payment_method?: string;
    };
}

/**
 * Session event
 */
export interface SessionEvent extends GameEvent {
    event_type: 'session_start' | 'session_end';
    properties: {
        duration?: number;
        source?: string;
    };
}
