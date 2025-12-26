/**
 * Alert Store
 * Intelligent alerting system for predictive analytics
 * Phase 5: Advanced AI & Automation
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';

// ============================================================================
// Types
// ============================================================================

export type AlertType = 'threshold' | 'anomaly' | 'prediction' | 'opportunity';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';
export type AlertChannel = 'in_app' | 'email' | 'slack' | 'discord' | 'webhook';

export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    status: AlertStatus;

    // Content
    title: string;
    message: string;
    metric?: string;
    value?: number;
    expectedValue?: number;
    expectedRange?: [number, number];

    // Actions
    recommendations: string[];
    actionTaken?: string;

    // Metadata
    source: string; // Which model/system generated it
    data?: Record<string, unknown>;

    // Timestamps
    createdAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    snoozedUntil?: string;

    // Delivery
    channels: AlertChannel[];
    delivered: Record<AlertChannel, boolean>;
}

export interface AlertRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;

    // Conditions
    metric: string;
    condition: 'gt' | 'lt' | 'eq' | 'change_gt' | 'change_lt';
    threshold: number;
    timeWindow?: number; // minutes

    // Alert config
    severity: AlertSeverity;
    channels: AlertChannel[];

    // Smart features
    autoAdjust: boolean; // Auto-adjust threshold based on history
    dayOfWeekAware: boolean;
    cooldownMinutes: number; // Don't re-alert within this period

    // Metadata
    createdAt: string;
    updatedAt: string;
    lastTriggeredAt?: string;
}

export interface AlertPreferences {
    // Global settings
    enabled: boolean;
    quietHoursStart?: number; // 0-23
    quietHoursEnd?: number;
    digestMode: boolean; // Bundle low-priority alerts
    digestFrequency: 'hourly' | 'daily';

    // Severity filters
    minSeverityInApp: AlertSeverity;
    minSeverityEmail: AlertSeverity;

    // Channel configs
    emailAddress?: string;
    slackWebhook?: string;
    discordWebhook?: string;
    customWebhook?: string;
}

// ============================================================================
// Default Alert Rules
// ============================================================================

const DEFAULT_RULES: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'DAU Drop',
        description: 'Alert when daily active users drops significantly',
        enabled: true,
        metric: 'dau',
        condition: 'change_lt',
        threshold: -20, // 20% drop
        timeWindow: 1440, // 1 day
        severity: 'high',
        channels: ['in_app', 'email'],
        autoAdjust: true,
        dayOfWeekAware: true,
        cooldownMinutes: 60,
    },
    {
        name: 'Revenue Anomaly',
        description: 'Alert on unusual revenue patterns',
        enabled: true,
        metric: 'revenue',
        condition: 'change_lt',
        threshold: -30,
        timeWindow: 1440,
        severity: 'critical',
        channels: ['in_app', 'email', 'slack'],
        autoAdjust: false,
        dayOfWeekAware: true,
        cooldownMinutes: 120,
    },
    {
        name: 'High Churn Risk',
        description: 'Alert when many users are at risk of churning',
        enabled: true,
        metric: 'churn_risk_users',
        condition: 'gt',
        threshold: 100,
        severity: 'high',
        channels: ['in_app'],
        autoAdjust: true,
        dayOfWeekAware: false,
        cooldownMinutes: 1440, // Once per day
    },
    {
        name: 'Retention Drop',
        description: 'Alert when D7 retention falls below threshold',
        enabled: true,
        metric: 'd7_retention',
        condition: 'lt',
        threshold: 0.10, // 10%
        severity: 'high',
        channels: ['in_app', 'email'],
        autoAdjust: true,
        dayOfWeekAware: false,
        cooldownMinutes: 1440,
    },
    {
        name: 'Conversion Opportunity',
        description: 'Alert when conversion conditions are optimal',
        enabled: true,
        metric: 'high_intent_non_payers',
        condition: 'gt',
        threshold: 50,
        severity: 'low',
        channels: ['in_app'],
        autoAdjust: false,
        dayOfWeekAware: false,
        cooldownMinutes: 2880, // Every 2 days
    },
];

// ============================================================================
// Store Operations
// ============================================================================

const ALERTS_STORE = 'alerts';
const RULES_STORE = 'alertRules';
const PREFS_KEY = 'alert_preferences';

// Alerts
export async function saveAlert(alert: Alert): Promise<void> {
    return dbPut(ALERTS_STORE, alert);
}

export async function getAlert(id: string): Promise<Alert | undefined> {
    return dbGet(ALERTS_STORE, id);
}

export async function getAllAlerts(): Promise<Alert[]> {
    return dbGetAll(ALERTS_STORE);
}

export async function getActiveAlerts(): Promise<Alert[]> {
    const all = await getAllAlerts();
    return all.filter(a => a.status === 'active');
}

export async function getAlertsByType(type: AlertType): Promise<Alert[]> {
    const all = await getAllAlerts();
    return all.filter(a => a.type === type);
}

export async function getAlertsBySeverity(severity: AlertSeverity): Promise<Alert[]> {
    const all = await getAllAlerts();
    return all.filter(a => a.severity === severity);
}

export async function deleteAlert(id: string): Promise<void> {
    return dbDelete(ALERTS_STORE, id);
}

// Alert Rules
export async function saveRule(rule: AlertRule): Promise<void> {
    return dbPut(RULES_STORE, rule);
}

export async function getRule(id: string): Promise<AlertRule | undefined> {
    return dbGet(RULES_STORE, id);
}

export async function getAllRules(): Promise<AlertRule[]> {
    return dbGetAll(RULES_STORE);
}

export async function deleteRule(id: string): Promise<void> {
    return dbDelete(RULES_STORE, id);
}

// Preferences
export function getPreferences(): AlertPreferences {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        enabled: true,
        digestMode: true,
        digestFrequency: 'daily',
        minSeverityInApp: 'low',
        minSeverityEmail: 'high',
    };
}

export function savePreferences(prefs: AlertPreferences): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ============================================================================
// Alert Creation
// ============================================================================

export function createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    options: {
        metric?: string;
        value?: number;
        expectedValue?: number;
        expectedRange?: [number, number];
        recommendations?: string[];
        source?: string;
        data?: Record<string, unknown>;
        channels?: AlertChannel[];
    } = {}
): Alert {
    return {
        id: generateId(),
        type,
        severity,
        status: 'active',
        title,
        message,
        metric: options.metric,
        value: options.value,
        expectedValue: options.expectedValue,
        expectedRange: options.expectedRange,
        recommendations: options.recommendations || [],
        source: options.source || 'system',
        data: options.data,
        createdAt: new Date().toISOString(),
        channels: options.channels || ['in_app'],
        delivered: { in_app: false, email: false, slack: false, discord: false, webhook: false },
    };
}

export function createRule(
    name: string,
    description: string,
    metric: string,
    condition: AlertRule['condition'],
    threshold: number,
    options: Partial<AlertRule> = {}
): AlertRule {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        name,
        description,
        enabled: true,
        metric,
        condition,
        threshold,
        severity: options.severity || 'medium',
        channels: options.channels || ['in_app'],
        autoAdjust: options.autoAdjust ?? false,
        dayOfWeekAware: options.dayOfWeekAware ?? false,
        cooldownMinutes: options.cooldownMinutes || 60,
        timeWindow: options.timeWindow,
        createdAt: now,
        updatedAt: now,
    };
}

// ============================================================================
// Alert Actions
// ============================================================================

export async function acknowledgeAlert(id: string): Promise<void> {
    const alert = await getAlert(id);
    if (alert) {
        alert.status = 'acknowledged';
        alert.acknowledgedAt = new Date().toISOString();
        await saveAlert(alert);
    }
}

export async function resolveAlert(id: string, actionTaken?: string): Promise<void> {
    const alert = await getAlert(id);
    if (alert) {
        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        if (actionTaken) alert.actionTaken = actionTaken;
        await saveAlert(alert);
    }
}

export async function snoozeAlert(id: string, hours: number): Promise<void> {
    const alert = await getAlert(id);
    if (alert) {
        alert.status = 'snoozed';
        alert.snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        await saveAlert(alert);
    }
}

// ============================================================================
// Rule Evaluation
// ============================================================================

export function evaluateRule(
    rule: AlertRule,
    currentValue: number,
    previousValue?: number
): { triggered: boolean; alert?: Omit<Alert, 'id' | 'createdAt'> } {
    if (!rule.enabled) {
        return { triggered: false };
    }

    let triggered = false;

    switch (rule.condition) {
        case 'gt':
            triggered = currentValue > rule.threshold;
            break;
        case 'lt':
            triggered = currentValue < rule.threshold;
            break;
        case 'eq':
            triggered = currentValue === rule.threshold;
            break;
        case 'change_gt':
            if (previousValue !== undefined && previousValue !== 0) {
                const changePercent = ((currentValue - previousValue) / previousValue) * 100;
                triggered = changePercent > rule.threshold;
            }
            break;
        case 'change_lt':
            if (previousValue !== undefined && previousValue !== 0) {
                const changePercent = ((currentValue - previousValue) / previousValue) * 100;
                triggered = changePercent < rule.threshold;
            }
            break;
    }

    if (!triggered) {
        return { triggered: false };
    }

    // Check cooldown
    if (rule.lastTriggeredAt) {
        const lastTriggered = new Date(rule.lastTriggeredAt).getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastTriggered < cooldownMs) {
            return { triggered: false };
        }
    }

    return {
        triggered: true,
        alert: {
            type: 'threshold',
            severity: rule.severity,
            status: 'active',
            title: `${rule.name} Alert`,
            message: `${rule.metric} is ${currentValue} (threshold: ${rule.threshold})`,
            metric: rule.metric,
            value: currentValue,
            expectedValue: previousValue,
            recommendations: generateRecommendations(rule.metric, currentValue, rule.threshold),
            source: 'alert_rule',
            data: { ruleId: rule.id },
            channels: rule.channels,
            delivered: { in_app: false, email: false, slack: false, discord: false, webhook: false },
        },
    };
}

function generateRecommendations(metric: string, _value: number, _threshold: number): string[] {
    const recommendations: string[] = [];

    if (metric.includes('dau') || metric.includes('user')) {
        recommendations.push('Check for technical issues or outages');
        recommendations.push('Review recent app updates or changes');
        recommendations.push('Analyze user acquisition channels');
    } else if (metric.includes('revenue')) {
        recommendations.push('Review pricing and offers');
        recommendations.push('Check payment system status');
        recommendations.push('Analyze top spender activity');
    } else if (metric.includes('retention')) {
        recommendations.push('Review onboarding experience');
        recommendations.push('Analyze level/content difficulty');
        recommendations.push('Check for engagement blockers');
    } else if (metric.includes('churn')) {
        recommendations.push('Launch re-engagement campaign');
        recommendations.push('Offer incentives to at-risk users');
        recommendations.push('Gather feedback from churning users');
    }

    return recommendations.slice(0, 3);
}

// ============================================================================
// Alert Statistics
// ============================================================================

export async function getAlertStats(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
    last24h: number;
    last7d: number;
}> {
    const alerts = await getAllAlerts();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const bySeverity: Record<AlertSeverity, number> = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
    };

    const byType: Record<AlertType, number> = {
        threshold: 0,
        anomaly: 0,
        prediction: 0,
        opportunity: 0,
    };

    let active = 0;
    let acknowledged = 0;
    let resolved = 0;
    let last24h = 0;
    let last7d = 0;

    for (const alert of alerts) {
        bySeverity[alert.severity]++;
        byType[alert.type]++;

        if (alert.status === 'active') active++;
        else if (alert.status === 'acknowledged') acknowledged++;
        else if (alert.status === 'resolved') resolved++;

        const createdAt = new Date(alert.createdAt).getTime();
        if (now - createdAt < day) last24h++;
        if (now - createdAt < 7 * day) last7d++;
    }

    return {
        total: alerts.length,
        active,
        acknowledged,
        resolved,
        bySeverity,
        byType,
        last24h,
        last7d,
    };
}

// ============================================================================
// Initialize Default Rules
// ============================================================================

export async function initializeDefaultRules(): Promise<void> {
    const existingRules = await getAllRules();
    if (existingRules.length > 0) return;

    const now = new Date().toISOString();

    for (const ruleDef of DEFAULT_RULES) {
        const rule: AlertRule = {
            id: generateId(),
            ...ruleDef,
            createdAt: now,
            updatedAt: now,
        };
        await saveRule(rule);
    }
}
