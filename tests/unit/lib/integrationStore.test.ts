/**
 * Integration Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    saveIntegration,
    getAllIntegrations,
    getIntegration,
    deleteIntegration,
    getIntegrationsByType,
    getIntegrationsByStatus,
    createIntegration,
    updateIntegrationStatus,
    updateIntegrationSyncResult,
    getCatalogItem,
    getIntegrationDisplayName,
    getIntegrationIcon,
    formatLastSync,
    getStatusColor,
    getStatusIcon,
    INTEGRATION_CATALOG,
    type Integration,
    type IntegrationConfig,
    type IntegrationType,
    type IntegrationStatus,
    type SyncResult,
} from '../../../src/lib/integrationStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    dbGetByIndex: vi.fn().mockResolvedValue([]),
    generateId: vi.fn().mockReturnValue('integration-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex } from '../../../src/lib/db';

describe('integrationStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('IndexedDB operations', () => {
        const mockIntegration: Integration = {
            id: 'int-1',
            config: {
                name: 'Test Integration',
                type: 'google_sheets',
                auth: { type: 'oauth', provider: 'google' },
                syncStrategy: { type: 'manual' },
            },
            status: 'connected',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            lastSyncAt: '2024-01-15T00:00:00Z',
            metadata: {
                rowCount: 1000,
                columnCount: 10,
            },
        };

        it('should save integration to database', async () => {
            await saveIntegration(mockIntegration);
            expect(dbPut).toHaveBeenCalledWith('integrations', mockIntegration);
        });

        it('should get all integrations', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockIntegration]);
            const integrations = await getAllIntegrations();
            expect(integrations).toEqual([mockIntegration]);
            expect(dbGetAll).toHaveBeenCalledWith('integrations');
        });

        it('should get integration by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockIntegration);
            const integration = await getIntegration('int-1');
            expect(integration).toEqual(mockIntegration);
            expect(dbGet).toHaveBeenCalledWith('integrations', 'int-1');
        });

        it('should return undefined for non-existent integration', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            const integration = await getIntegration('non-existent');
            expect(integration).toBeUndefined();
        });

        it('should delete integration', async () => {
            await deleteIntegration('int-1');
            expect(dbDelete).toHaveBeenCalledWith('integrations', 'int-1');
        });

        it('should get integrations by type', async () => {
            vi.mocked(dbGetByIndex).mockResolvedValueOnce([mockIntegration]);
            const integrations = await getIntegrationsByType('google_sheets');
            expect(integrations).toEqual([mockIntegration]);
            expect(dbGetByIndex).toHaveBeenCalledWith('integrations', 'type', 'google_sheets');
        });

        it('should get integrations by status', async () => {
            vi.mocked(dbGetByIndex).mockResolvedValueOnce([mockIntegration]);
            const integrations = await getIntegrationsByStatus('connected');
            expect(integrations).toEqual([mockIntegration]);
            expect(dbGetByIndex).toHaveBeenCalledWith('integrations', 'status', 'connected');
        });
    });

    describe('createIntegration', () => {
        const sampleConfig: IntegrationConfig = {
            name: 'My Google Sheet',
            type: 'google_sheets',
            auth: { type: 'oauth', provider: 'google' },
            syncStrategy: { type: 'manual' },
            googleSheets: {
                spreadsheetId: 'abc123',
                hasHeaderRow: true,
            },
        };

        it('should create integration with generated ID', () => {
            const integration = createIntegration(sampleConfig);
            expect(integration.id).toBe('integration-id-123');
        });

        it('should set status to disconnected', () => {
            const integration = createIntegration(sampleConfig);
            expect(integration.status).toBe('disconnected');
        });

        it('should set timestamps', () => {
            const integration = createIntegration(sampleConfig);
            expect(integration.createdAt).toBeDefined();
            expect(integration.updatedAt).toBeDefined();
        });

        it('should initialize empty metadata', () => {
            const integration = createIntegration(sampleConfig);
            expect(integration.metadata).toEqual({});
        });

        it('should store the config', () => {
            const integration = createIntegration(sampleConfig);
            expect(integration.config).toEqual(sampleConfig);
        });
    });

    describe('updateIntegrationStatus', () => {
        const baseIntegration: Integration = {
            id: 'int-1',
            config: {
                name: 'Test',
                type: 'firebase',
                auth: { type: 'none' },
                syncStrategy: { type: 'manual' },
            },
            status: 'disconnected',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            metadata: {},
        };

        it('should update status', () => {
            const updated = updateIntegrationStatus(baseIntegration, 'connected');
            expect(updated.status).toBe('connected');
        });

        it('should update updatedAt timestamp', () => {
            const updated = updateIntegrationStatus(baseIntegration, 'connected');
            expect(updated.updatedAt).not.toBe(baseIntegration.updatedAt);
        });

        it('should set lastError when provided', () => {
            const updated = updateIntegrationStatus(baseIntegration, 'error', 'Connection failed');
            expect(updated.lastError).toBe('Connection failed');
        });

        it('should clear lastError when not provided', () => {
            const withError = { ...baseIntegration, lastError: 'Previous error' };
            const updated = updateIntegrationStatus(withError, 'connected');
            expect(updated.lastError).toBeUndefined();
        });

        it('should preserve other fields', () => {
            const updated = updateIntegrationStatus(baseIntegration, 'syncing');
            expect(updated.id).toBe(baseIntegration.id);
            expect(updated.config).toEqual(baseIntegration.config);
            expect(updated.createdAt).toBe(baseIntegration.createdAt);
        });
    });

    describe('updateIntegrationSyncResult', () => {
        const baseIntegration: Integration = {
            id: 'int-1',
            config: {
                name: 'Test',
                type: 'supabase',
                auth: { type: 'apikey', key: 'test-key' },
                syncStrategy: { type: 'scheduled', intervalMinutes: 60 },
            },
            status: 'syncing',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            metadata: {},
        };

        it('should set status to connected on success', () => {
            const result: SyncResult = {
                success: true,
                rowCount: 500,
                duration: 1500,
            };

            const updated = updateIntegrationSyncResult(baseIntegration, result);
            expect(updated.status).toBe('connected');
        });

        it('should set status to error on failure', () => {
            const result: SyncResult = {
                success: false,
                rowCount: 0,
                duration: 500,
                error: 'Connection timeout',
            };

            const updated = updateIntegrationSyncResult(baseIntegration, result);
            expect(updated.status).toBe('error');
            expect(updated.lastError).toBe('Connection timeout');
        });

        it('should update lastSyncAt', () => {
            const result: SyncResult = {
                success: true,
                rowCount: 100,
                duration: 1000,
            };

            const updated = updateIntegrationSyncResult(baseIntegration, result);
            expect(updated.lastSyncAt).toBeDefined();
        });

        it('should update metadata with sync results', () => {
            const result: SyncResult = {
                success: true,
                rowCount: 750,
                duration: 2500,
            };

            const updated = updateIntegrationSyncResult(baseIntegration, result);
            expect(updated.metadata.rowCount).toBe(750);
            expect(updated.metadata.syncDuration).toBe(2500);
            expect(updated.metadata.dataFreshness).toBeDefined();
        });

        it('should preserve existing metadata', () => {
            const withMetadata = {
                ...baseIntegration,
                metadata: { columnCount: 15 },
            };

            const result: SyncResult = {
                success: true,
                rowCount: 100,
                duration: 1000,
            };

            const updated = updateIntegrationSyncResult(withMetadata, result);
            expect(updated.metadata.columnCount).toBe(15);
        });
    });

    describe('getCatalogItem', () => {
        it('should return catalog item for google_sheets', () => {
            const item = getCatalogItem('google_sheets');
            expect(item).toBeDefined();
            expect(item?.name).toBe('Google Sheets');
        });

        it('should return catalog item for firebase', () => {
            const item = getCatalogItem('firebase');
            expect(item).toBeDefined();
            expect(item?.name).toBe('Firebase Analytics');
        });

        it('should return undefined for unknown type', () => {
            const item = getCatalogItem('unknown' as IntegrationType);
            expect(item).toBeUndefined();
        });
    });

    describe('getIntegrationDisplayName', () => {
        it('should return config name if set', () => {
            const integration: Integration = {
                id: '1',
                config: {
                    name: 'My Custom Name',
                    type: 'google_sheets',
                    auth: { type: 'none' },
                    syncStrategy: { type: 'manual' },
                },
                status: 'connected',
                createdAt: '',
                updatedAt: '',
                metadata: {},
            };

            expect(getIntegrationDisplayName(integration)).toBe('My Custom Name');
        });

        it('should return catalog name if config name is empty', () => {
            const integration: Integration = {
                id: '1',
                config: {
                    name: '',
                    type: 'firebase',
                    auth: { type: 'none' },
                    syncStrategy: { type: 'manual' },
                },
                status: 'connected',
                createdAt: '',
                updatedAt: '',
                metadata: {},
            };

            expect(getIntegrationDisplayName(integration)).toBe('Firebase Analytics');
        });

        it('should return Unknown for unknown type with no name', () => {
            const integration: Integration = {
                id: '1',
                config: {
                    name: '',
                    type: 'unknown_type' as IntegrationType,
                    auth: { type: 'none' },
                    syncStrategy: { type: 'manual' },
                },
                status: 'connected',
                createdAt: '',
                updatedAt: '',
                metadata: {},
            };

            expect(getIntegrationDisplayName(integration)).toBe('Unknown');
        });
    });

    describe('getIntegrationIcon', () => {
        it('should return icon for google_sheets', () => {
            expect(getIntegrationIcon('google_sheets')).toBe('📊');
        });

        it('should return icon for firebase', () => {
            expect(getIntegrationIcon('firebase')).toBe('🔥');
        });

        it('should return icon for supabase', () => {
            expect(getIntegrationIcon('supabase')).toBe('⚡');
        });

        it('should return icon for postgresql', () => {
            expect(getIntegrationIcon('postgresql')).toBe('🐘');
        });

        it('should return default icon for unknown type', () => {
            expect(getIntegrationIcon('unknown' as IntegrationType)).toBe('📁');
        });
    });

    describe('formatLastSync', () => {
        it('should return Never if no lastSyncAt', () => {
            expect(formatLastSync(undefined)).toBe('Never');
        });

        it('should return Just now for very recent sync', () => {
            const now = new Date().toISOString();
            expect(formatLastSync(now)).toBe('Just now');
        });

        it('should return minutes ago for recent sync', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(formatLastSync(fiveMinutesAgo)).toBe('5 minutes ago');
        });

        it('should return singular minute', () => {
            const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
            expect(formatLastSync(oneMinuteAgo)).toBe('1 minute ago');
        });

        it('should return hours ago for older sync', () => {
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
            expect(formatLastSync(threeHoursAgo)).toBe('3 hours ago');
        });

        it('should return singular hour', () => {
            const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
            expect(formatLastSync(oneHourAgo)).toBe('1 hour ago');
        });

        it('should return days ago for very old sync', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            expect(formatLastSync(threeDaysAgo)).toBe('3 days ago');
        });

        it('should return formatted date for sync older than a week', () => {
            const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
            const result = formatLastSync(twoWeeksAgo);
            // Should be a formatted date string
            expect(result).not.toContain('ago');
        });
    });

    describe('getStatusColor', () => {
        it('should return green for connected', () => {
            expect(getStatusColor('connected')).toBe('text-green-500');
        });

        it('should return blue for syncing', () => {
            expect(getStatusColor('syncing')).toBe('text-blue-500');
        });

        it('should return yellow for paused', () => {
            expect(getStatusColor('paused')).toBe('text-yellow-500');
        });

        it('should return red for error', () => {
            expect(getStatusColor('error')).toBe('text-red-500');
        });

        it('should return zinc for disconnected', () => {
            expect(getStatusColor('disconnected')).toBe('text-zinc-500');
        });

        it('should return zinc for unknown status', () => {
            expect(getStatusColor('unknown' as IntegrationStatus)).toBe('text-zinc-500');
        });
    });

    describe('getStatusIcon', () => {
        it('should return green circle for connected', () => {
            expect(getStatusIcon('connected')).toBe('🟢');
        });

        it('should return sync icon for syncing', () => {
            expect(getStatusIcon('syncing')).toBe('🔄');
        });

        it('should return pause icon for paused', () => {
            expect(getStatusIcon('paused')).toBe('⏸️');
        });

        it('should return red circle for error', () => {
            expect(getStatusIcon('error')).toBe('🔴');
        });

        it('should return white circle for disconnected', () => {
            expect(getStatusIcon('disconnected')).toBe('⚪');
        });
    });

    describe('INTEGRATION_CATALOG', () => {
        it('should have multiple integrations', () => {
            expect(INTEGRATION_CATALOG.length).toBeGreaterThan(0);
        });

        it('should have required fields for each integration', () => {
            INTEGRATION_CATALOG.forEach(item => {
                expect(item.type).toBeDefined();
                expect(item.name).toBeDefined();
                expect(item.description).toBeDefined();
                expect(item.icon).toBeDefined();
                expect(item.tier).toBeDefined();
                expect(item.complexity).toBeDefined();
                expect(item.authMethods).toBeDefined();
                expect(item.features).toBeDefined();
            });
        });

        it('should include essential integrations', () => {
            const types = INTEGRATION_CATALOG.map(i => i.type);
            expect(types).toContain('google_sheets');
            expect(types).toContain('firebase');
            expect(types).toContain('supabase');
            expect(types).toContain('postgresql');
            expect(types).toContain('webhook');
        });

        it('should have valid tiers (1-4)', () => {
            INTEGRATION_CATALOG.forEach(item => {
                expect(item.tier).toBeGreaterThanOrEqual(1);
                expect(item.tier).toBeLessThanOrEqual(4);
            });
        });

        it('should have valid complexity levels', () => {
            const validComplexities = ['low', 'medium', 'high'];
            INTEGRATION_CATALOG.forEach(item => {
                expect(validComplexities).toContain(item.complexity);
            });
        });

        it('should have at least one auth method per integration', () => {
            INTEGRATION_CATALOG.forEach(item => {
                expect(item.authMethods.length).toBeGreaterThan(0);
            });
        });

        it('should have at least one feature per integration', () => {
            INTEGRATION_CATALOG.forEach(item => {
                expect(item.features.length).toBeGreaterThan(0);
            });
        });

        it('should have tier 1 integrations as lowest complexity', () => {
            const tier1 = INTEGRATION_CATALOG.filter(i => i.tier === 1);
            tier1.forEach(item => {
                expect(['low', 'medium']).toContain(item.complexity);
            });
        });
    });

    describe('Integration configuration types', () => {
        it('should support Google Sheets specific config', () => {
            const config: IntegrationConfig = {
                name: 'Sheets Test',
                type: 'google_sheets',
                auth: { type: 'oauth', provider: 'google' },
                syncStrategy: { type: 'scheduled', intervalMinutes: 60 },
                googleSheets: {
                    spreadsheetId: 'abc123',
                    sheetName: 'Sheet1',
                    range: 'A1:Z1000',
                    hasHeaderRow: true,
                },
            };

            const integration = createIntegration(config);
            expect(integration.config.googleSheets?.spreadsheetId).toBe('abc123');
        });

        it('should support Supabase specific config', () => {
            const config: IntegrationConfig = {
                name: 'Supabase Test',
                type: 'supabase',
                auth: { type: 'apikey', key: 'test-key' },
                syncStrategy: { type: 'realtime', method: 'websocket' },
                supabase: {
                    projectUrl: 'https://abc.supabase.co',
                    tableName: 'events',
                    selectColumns: ['id', 'event_name', 'timestamp'],
                },
            };

            const integration = createIntegration(config);
            expect(integration.config.supabase?.projectUrl).toBe('https://abc.supabase.co');
        });

        it('should support webhook specific config', () => {
            const config: IntegrationConfig = {
                name: 'Webhook Test',
                type: 'webhook',
                auth: { type: 'apikey', key: 'secret' },
                syncStrategy: { type: 'webhook' },
                webhook: {
                    endpointPath: '/api/webhook/events',
                    secretKey: 'my-secret',
                    expectedSchema: { event: 'string', value: 'number' },
                },
            };

            const integration = createIntegration(config);
            expect(integration.config.webhook?.endpointPath).toBe('/api/webhook/events');
        });
    });
});
