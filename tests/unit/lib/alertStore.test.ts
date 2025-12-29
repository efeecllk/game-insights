/**
 * Alert Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    saveAlert,
    getAlert,
    getAllAlerts,
    getActiveAlerts,
    getAlertsByType,
    getAlertsBySeverity,
    deleteAlert,
    saveRule,
    getRule,
    getAllRules,
    deleteRule,
    getPreferences,
    savePreferences,
    createAlert,
    createRule,
    acknowledgeAlert,
    resolveAlert,
    snoozeAlert,
    evaluateRule,
    getAlertStats,
    initializeDefaultRules,
    type Alert,
    type AlertRule,
    type AlertPreferences,
} from '../../../src/lib/alertStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    generateId: vi.fn().mockReturnValue('alert-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete } from '../../../src/lib/db';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('alertStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    describe('Alert CRUD operations', () => {
        const mockAlert: Alert = {
            id: 'alert-1',
            type: 'threshold',
            severity: 'high',
            status: 'active',
            title: 'Test Alert',
            message: 'This is a test alert',
            recommendations: ['Fix something'],
            source: 'test',
            createdAt: '2024-01-01T00:00:00Z',
            channels: ['in_app'],
            delivered: { in_app: false, email: false, slack: false, discord: false, webhook: false },
        };

        it('should save alert to database', async () => {
            await saveAlert(mockAlert);
            expect(dbPut).toHaveBeenCalledWith('alerts', mockAlert);
        });

        it('should get alert by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockAlert);
            const alert = await getAlert('alert-1');
            expect(alert).toEqual(mockAlert);
            expect(dbGet).toHaveBeenCalledWith('alerts', 'alert-1');
        });

        it('should get all alerts', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockAlert]);
            const alerts = await getAllAlerts();
            expect(alerts).toEqual([mockAlert]);
            expect(dbGetAll).toHaveBeenCalledWith('alerts');
        });

        it('should get active alerts only', async () => {
            const alerts = [
                { ...mockAlert, id: '1', status: 'active' as const },
                { ...mockAlert, id: '2', status: 'resolved' as const },
                { ...mockAlert, id: '3', status: 'acknowledged' as const },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const active = await getActiveAlerts();
            expect(active.length).toBe(1);
            expect(active[0].id).toBe('1');
        });

        it('should get alerts by type', async () => {
            const alerts = [
                { ...mockAlert, id: '1', type: 'threshold' as const },
                { ...mockAlert, id: '2', type: 'anomaly' as const },
                { ...mockAlert, id: '3', type: 'threshold' as const },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const threshold = await getAlertsByType('threshold');
            expect(threshold.length).toBe(2);
        });

        it('should get alerts by severity', async () => {
            const alerts = [
                { ...mockAlert, id: '1', severity: 'high' as const },
                { ...mockAlert, id: '2', severity: 'low' as const },
                { ...mockAlert, id: '3', severity: 'critical' as const },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const high = await getAlertsBySeverity('high');
            expect(high.length).toBe(1);
            expect(high[0].id).toBe('1');
        });

        it('should delete alert', async () => {
            await deleteAlert('alert-1');
            expect(dbDelete).toHaveBeenCalledWith('alerts', 'alert-1');
        });
    });

    describe('Alert Rule CRUD operations', () => {
        const mockRule: AlertRule = {
            id: 'rule-1',
            name: 'Test Rule',
            description: 'A test rule',
            enabled: true,
            metric: 'dau',
            condition: 'lt',
            threshold: 1000,
            severity: 'high',
            channels: ['in_app'],
            autoAdjust: false,
            dayOfWeekAware: false,
            cooldownMinutes: 60,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        it('should save rule to database', async () => {
            await saveRule(mockRule);
            expect(dbPut).toHaveBeenCalledWith('alertRules', mockRule);
        });

        it('should get rule by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockRule);
            const rule = await getRule('rule-1');
            expect(rule).toEqual(mockRule);
            expect(dbGet).toHaveBeenCalledWith('alertRules', 'rule-1');
        });

        it('should get all rules', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockRule]);
            const rules = await getAllRules();
            expect(rules).toEqual([mockRule]);
            expect(dbGetAll).toHaveBeenCalledWith('alertRules');
        });

        it('should delete rule', async () => {
            await deleteRule('rule-1');
            expect(dbDelete).toHaveBeenCalledWith('alertRules', 'rule-1');
        });
    });

    describe('Alert Preferences', () => {
        it('should return default preferences when none saved', () => {
            const prefs = getPreferences();
            expect(prefs.enabled).toBe(true);
            expect(prefs.digestMode).toBe(true);
            expect(prefs.digestFrequency).toBe('daily');
            expect(prefs.minSeverityInApp).toBe('low');
            expect(prefs.minSeverityEmail).toBe('high');
        });

        it('should return saved preferences', () => {
            const savedPrefs: AlertPreferences = {
                enabled: false,
                digestMode: false,
                digestFrequency: 'hourly',
                minSeverityInApp: 'medium',
                minSeverityEmail: 'critical',
            };
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedPrefs));

            const prefs = getPreferences();
            expect(prefs).toEqual(savedPrefs);
        });

        it('should save preferences to localStorage', () => {
            const prefs: AlertPreferences = {
                enabled: true,
                digestMode: true,
                digestFrequency: 'daily',
                minSeverityInApp: 'low',
                minSeverityEmail: 'high',
            };

            savePreferences(prefs);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'alert_preferences',
                JSON.stringify(prefs)
            );
        });
    });

    describe('createAlert', () => {
        it('should create alert with required fields', () => {
            const alert = createAlert('threshold', 'high', 'Test Alert', 'Test message');

            expect(alert.id).toBe('alert-id-123');
            expect(alert.type).toBe('threshold');
            expect(alert.severity).toBe('high');
            expect(alert.status).toBe('active');
            expect(alert.title).toBe('Test Alert');
            expect(alert.message).toBe('Test message');
            expect(alert.createdAt).toBeDefined();
        });

        it('should set default source to system', () => {
            const alert = createAlert('threshold', 'high', 'Test', 'Test');
            expect(alert.source).toBe('system');
        });

        it('should set default channels to in_app', () => {
            const alert = createAlert('threshold', 'high', 'Test', 'Test');
            expect(alert.channels).toEqual(['in_app']);
        });

        it('should initialize all delivered flags to false', () => {
            const alert = createAlert('threshold', 'high', 'Test', 'Test');
            expect(alert.delivered.in_app).toBe(false);
            expect(alert.delivered.email).toBe(false);
            expect(alert.delivered.slack).toBe(false);
        });

        it('should allow custom options', () => {
            const alert = createAlert('anomaly', 'critical', 'Alert', 'Message', {
                metric: 'dau',
                value: 5000,
                expectedValue: 10000,
                expectedRange: [8000, 12000],
                recommendations: ['Check for issues', 'Review data'],
                source: 'anomaly_detector',
                channels: ['in_app', 'email', 'slack'],
            });

            expect(alert.metric).toBe('dau');
            expect(alert.value).toBe(5000);
            expect(alert.expectedValue).toBe(10000);
            expect(alert.expectedRange).toEqual([8000, 12000]);
            expect(alert.recommendations).toEqual(['Check for issues', 'Review data']);
            expect(alert.source).toBe('anomaly_detector');
            expect(alert.channels).toEqual(['in_app', 'email', 'slack']);
        });
    });

    describe('createRule', () => {
        it('should create rule with required fields', () => {
            const rule = createRule('DAU Drop', 'Alert on DAU drop', 'dau', 'lt', 1000);

            expect(rule.id).toBe('alert-id-123');
            expect(rule.name).toBe('DAU Drop');
            expect(rule.description).toBe('Alert on DAU drop');
            expect(rule.metric).toBe('dau');
            expect(rule.condition).toBe('lt');
            expect(rule.threshold).toBe(1000);
            expect(rule.enabled).toBe(true);
        });

        it('should set default severity to medium', () => {
            const rule = createRule('Test', 'Test', 'metric', 'gt', 100);
            expect(rule.severity).toBe('medium');
        });

        it('should set default channels to in_app', () => {
            const rule = createRule('Test', 'Test', 'metric', 'gt', 100);
            expect(rule.channels).toEqual(['in_app']);
        });

        it('should set default cooldown to 60 minutes', () => {
            const rule = createRule('Test', 'Test', 'metric', 'gt', 100);
            expect(rule.cooldownMinutes).toBe(60);
        });

        it('should allow custom options', () => {
            const rule = createRule('Test', 'Test', 'metric', 'gt', 100, {
                severity: 'critical',
                channels: ['in_app', 'email'],
                autoAdjust: true,
                dayOfWeekAware: true,
                cooldownMinutes: 120,
                timeWindow: 1440,
            });

            expect(rule.severity).toBe('critical');
            expect(rule.channels).toEqual(['in_app', 'email']);
            expect(rule.autoAdjust).toBe(true);
            expect(rule.dayOfWeekAware).toBe(true);
            expect(rule.cooldownMinutes).toBe(120);
            expect(rule.timeWindow).toBe(1440);
        });
    });

    describe('Alert Actions', () => {
        describe('acknowledgeAlert', () => {
            it('should set status to acknowledged and add timestamp', async () => {
                const alert = { id: 'alert-1', status: 'active' };
                vi.mocked(dbGet).mockResolvedValueOnce(alert as any);

                await acknowledgeAlert('alert-1');

                expect(dbPut).toHaveBeenCalledWith('alerts', expect.objectContaining({
                    status: 'acknowledged',
                    acknowledgedAt: expect.any(String),
                }));
            });

            it('should not update if alert not found', async () => {
                vi.mocked(dbGet).mockResolvedValueOnce(undefined);
                await acknowledgeAlert('non-existent');
                expect(dbPut).not.toHaveBeenCalled();
            });
        });

        describe('resolveAlert', () => {
            it('should set status to resolved and add timestamp', async () => {
                const alert = { id: 'alert-1', status: 'active' };
                vi.mocked(dbGet).mockResolvedValueOnce(alert as any);

                await resolveAlert('alert-1');

                expect(dbPut).toHaveBeenCalledWith('alerts', expect.objectContaining({
                    status: 'resolved',
                    resolvedAt: expect.any(String),
                }));
            });

            it('should record action taken if provided', async () => {
                const alert = { id: 'alert-1', status: 'active' };
                vi.mocked(dbGet).mockResolvedValueOnce(alert as any);

                await resolveAlert('alert-1', 'Fixed the issue');

                expect(dbPut).toHaveBeenCalledWith('alerts', expect.objectContaining({
                    actionTaken: 'Fixed the issue',
                }));
            });
        });

        describe('snoozeAlert', () => {
            it('should set status to snoozed and add snoozedUntil', async () => {
                const alert = { id: 'alert-1', status: 'active' };
                vi.mocked(dbGet).mockResolvedValueOnce(alert as any);

                await snoozeAlert('alert-1', 2);

                expect(dbPut).toHaveBeenCalledWith('alerts', expect.objectContaining({
                    status: 'snoozed',
                    snoozedUntil: expect.any(String),
                }));
            });
        });
    });

    describe('evaluateRule', () => {
        const baseRule: AlertRule = {
            id: 'rule-1',
            name: 'Test Rule',
            description: 'Test',
            enabled: true,
            metric: 'dau',
            condition: 'lt',
            threshold: 1000,
            severity: 'high',
            channels: ['in_app'],
            autoAdjust: false,
            dayOfWeekAware: false,
            cooldownMinutes: 60,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        it('should not trigger for disabled rule', () => {
            const rule = { ...baseRule, enabled: false };
            const result = evaluateRule(rule, 500);
            expect(result.triggered).toBe(false);
        });

        it('should trigger for lt condition', () => {
            const rule = { ...baseRule, condition: 'lt' as const, threshold: 1000 };
            const result = evaluateRule(rule, 500);
            expect(result.triggered).toBe(true);
        });

        it('should not trigger for lt when value above threshold', () => {
            const rule = { ...baseRule, condition: 'lt' as const, threshold: 1000 };
            const result = evaluateRule(rule, 1500);
            expect(result.triggered).toBe(false);
        });

        it('should trigger for gt condition', () => {
            const rule = { ...baseRule, condition: 'gt' as const, threshold: 1000 };
            const result = evaluateRule(rule, 1500);
            expect(result.triggered).toBe(true);
        });

        it('should trigger for eq condition', () => {
            const rule = { ...baseRule, condition: 'eq' as const, threshold: 1000 };
            const result = evaluateRule(rule, 1000);
            expect(result.triggered).toBe(true);
        });

        it('should trigger for change_gt with increase', () => {
            const rule = { ...baseRule, condition: 'change_gt' as const, threshold: 50 };
            const result = evaluateRule(rule, 200, 100); // 100% increase
            expect(result.triggered).toBe(true);
        });

        it('should trigger for change_lt with decrease', () => {
            const rule = { ...baseRule, condition: 'change_lt' as const, threshold: -20 };
            const result = evaluateRule(rule, 70, 100); // 30% decrease
            expect(result.triggered).toBe(true);
        });

        it('should not trigger change without previous value', () => {
            const rule = { ...baseRule, condition: 'change_lt' as const, threshold: -20 };
            const result = evaluateRule(rule, 70);
            expect(result.triggered).toBe(false);
        });

        it('should respect cooldown period', () => {
            const rule = {
                ...baseRule,
                lastTriggeredAt: new Date().toISOString(), // Just triggered
                cooldownMinutes: 60,
            };
            const result = evaluateRule(rule, 500);
            expect(result.triggered).toBe(false);
        });

        it('should trigger after cooldown expires', () => {
            const rule = {
                ...baseRule,
                lastTriggeredAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
                cooldownMinutes: 60,
            };
            const result = evaluateRule(rule, 500);
            expect(result.triggered).toBe(true);
        });

        it('should return alert object when triggered', () => {
            const rule = { ...baseRule, condition: 'lt' as const, threshold: 1000 };
            const result = evaluateRule(rule, 500);

            expect(result.alert).toBeDefined();
            expect(result.alert?.type).toBe('threshold');
            expect(result.alert?.severity).toBe('high');
            expect(result.alert?.metric).toBe('dau');
            expect(result.alert?.value).toBe(500);
        });

        it('should generate recommendations in alert', () => {
            const rule = { ...baseRule, metric: 'dau', condition: 'lt' as const, threshold: 1000 };
            const result = evaluateRule(rule, 500);

            expect(result.alert?.recommendations.length).toBeGreaterThan(0);
        });
    });

    describe('getAlertStats', () => {
        it('should return comprehensive statistics', async () => {
            const alerts: Alert[] = [
                createAlert('threshold', 'high', 'A1', 'M1'),
                createAlert('anomaly', 'critical', 'A2', 'M2'),
                createAlert('threshold', 'low', 'A3', 'M3'),
            ];
            alerts[0].status = 'active';
            alerts[1].status = 'acknowledged';
            alerts[2].status = 'resolved';

            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const stats = await getAlertStats();

            expect(stats.total).toBe(3);
            expect(stats.active).toBe(1);
            expect(stats.acknowledged).toBe(1);
            expect(stats.resolved).toBe(1);
        });

        it('should count alerts by severity', async () => {
            const alerts: Alert[] = [
                createAlert('threshold', 'high', 'A1', 'M1'),
                createAlert('threshold', 'high', 'A2', 'M2'),
                createAlert('threshold', 'critical', 'A3', 'M3'),
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const stats = await getAlertStats();

            expect(stats.bySeverity.high).toBe(2);
            expect(stats.bySeverity.critical).toBe(1);
        });

        it('should count alerts by type', async () => {
            const alerts: Alert[] = [
                createAlert('threshold', 'high', 'A1', 'M1'),
                createAlert('anomaly', 'high', 'A2', 'M2'),
                createAlert('threshold', 'high', 'A3', 'M3'),
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const stats = await getAlertStats();

            expect(stats.byType.threshold).toBe(2);
            expect(stats.byType.anomaly).toBe(1);
        });

        it('should count recent alerts', async () => {
            const now = Date.now();
            const alerts = [
                { ...createAlert('threshold', 'high', 'A1', 'M1'), createdAt: new Date(now - 1000).toISOString() },
                { ...createAlert('threshold', 'high', 'A2', 'M2'), createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString() },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(alerts);

            const stats = await getAlertStats();

            expect(stats.last24h).toBe(1);
            expect(stats.last7d).toBe(2);
        });
    });

    describe('initializeDefaultRules', () => {
        it('should not create rules if rules already exist', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([{ id: 'existing' }] as any);
            await initializeDefaultRules();
            expect(dbPut).not.toHaveBeenCalled();
        });

        it('should create default rules if none exist', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([]);
            await initializeDefaultRules();
            expect(dbPut).toHaveBeenCalled();
        });

        it('should create at least 5 default rules', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([]);
            await initializeDefaultRules();
            expect(dbPut).toHaveBeenCalledTimes(5);
        });
    });
});
