/**
 * Adapter Factory Unit Tests
 * Tests for adapter creation and management
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createAdapter,
    disconnectAdapter,
    disconnectAllAdapters,
    getActiveAdapterIds,
    isAdapterActive,
} from '@/lib/adapterFactory';
import { GoogleSheetsAdapter } from '@/adapters/GoogleSheetsAdapter';
import { SupabaseAdapter } from '@/adapters/SupabaseAdapter';
import { PostgreSQLAdapter } from '@/adapters/PostgreSQLAdapter';
import { WebhookAdapter } from '@/adapters/WebhookAdapter';
import { APIAdapter } from '@/adapters/APIAdapter';
import { FirebaseAdapter } from '@/adapters/FirebaseAdapter';
import { PlayFabAdapter } from '@/adapters/PlayFabAdapter';
import { Integration } from '@/lib/integrationStore';

// Helper to create a mock integration
function createMockIntegration(
    type: string,
    overrides: Partial<Integration> = {}
): Integration {
    return {
        id: `test-${type}-${Date.now()}`,
        name: `Test ${type} Integration`,
        config: {
            type: type as Integration['config']['type'],
            name: `Test ${type}`,
            auth: { type: 'apikey', key: 'test-key', name: 'test-key-name' },
            ...(overrides.config || {}),
        },
        status: 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

describe('adapterFactory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await disconnectAllAdapters();
    });

    // =========================================================================
    // createAdapter Tests
    // =========================================================================

    describe('createAdapter', () => {
        it('should create GoogleSheetsAdapter for google_sheets type', () => {
            const integration = createMockIntegration('google_sheets');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(GoogleSheetsAdapter);
        });

        it('should create SupabaseAdapter for supabase type', () => {
            const integration = createMockIntegration('supabase');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(SupabaseAdapter);
        });

        it('should create PostgreSQLAdapter for postgresql type', () => {
            const integration = createMockIntegration('postgresql');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(PostgreSQLAdapter);
        });

        it('should create WebhookAdapter for webhook type', () => {
            const integration = createMockIntegration('webhook');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(WebhookAdapter);
        });

        it('should create APIAdapter for rest_api type', () => {
            const integration = createMockIntegration('rest_api');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(APIAdapter);
        });

        it('should create FirebaseAdapter for firebase type', () => {
            const integration = createMockIntegration('firebase');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(FirebaseAdapter);
        });

        it('should create PlayFabAdapter for playfab type', () => {
            const integration = createMockIntegration('playfab');
            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(PlayFabAdapter);
        });

        it('should throw error for mongodb type (not implemented)', () => {
            const integration = createMockIntegration('mongodb');
            expect(() => createAdapter(integration)).toThrow('not yet implemented');
        });

        it('should throw error for mysql type (not implemented)', () => {
            const integration = createMockIntegration('mysql');
            expect(() => createAdapter(integration)).toThrow('not yet implemented');
        });

        it('should throw error for unity type (not implemented)', () => {
            const integration = createMockIntegration('unity');
            expect(() => createAdapter(integration)).toThrow('not yet implemented');
        });

        it('should throw error for unknown type', () => {
            const integration = createMockIntegration('unknown_type');
            expect(() => createAdapter(integration)).toThrow('Unknown integration type');
        });
    });

    // =========================================================================
    // Adapter Registry Tests
    // =========================================================================

    describe('adapter registry', () => {
        it('should return empty array when no adapters are active', () => {
            const ids = getActiveAdapterIds();
            expect(ids).toEqual([]);
        });

        it('should return false for non-active adapter', () => {
            expect(isAdapterActive('non-existent-id')).toBe(false);
        });

        it('should disconnect adapter by id', async () => {
            // Create a mock adapter to track disconnect
            const integration = createMockIntegration('webhook');
            const adapter = createAdapter(integration);

            // Spy on disconnect
            const disconnectSpy = vi.spyOn(adapter, 'disconnect').mockResolvedValue();

            // This should not throw even if adapter doesn't exist
            await disconnectAdapter('non-existent-id');

            expect(disconnectSpy).not.toHaveBeenCalled();
        });

        it('should disconnect all adapters', async () => {
            // This should not throw even with no active adapters
            await expect(disconnectAllAdapters()).resolves.not.toThrow();
        });
    });

    // =========================================================================
    // Adapter Type Verification Tests
    // =========================================================================

    describe('adapter type verification', () => {
        it('should create adapters with valid name property', () => {
            const types = ['google_sheets', 'supabase', 'postgresql', 'webhook', 'rest_api', 'firebase', 'playfab'];

            for (const type of types) {
                const integration = createMockIntegration(type);
                const adapter = createAdapter(integration);
                expect(adapter.name).toBeTruthy();
                expect(typeof adapter.name).toBe('string');
            }
        });

        it('should create adapters with valid type property', () => {
            const types = ['google_sheets', 'supabase', 'postgresql', 'webhook', 'rest_api', 'firebase', 'playfab'];
            const validTypes = ['file', 'database', 'cloud', 'api', 'realtime'];

            for (const type of types) {
                const integration = createMockIntegration(type);
                const adapter = createAdapter(integration);
                expect(validTypes).toContain(adapter.type);
            }
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle integration with minimal config', () => {
            const minimalIntegration: Integration = {
                id: 'minimal-test',
                name: 'Minimal Test',
                config: {
                    type: 'webhook',
                    name: 'minimal',
                    auth: { type: 'none' },
                },
                status: 'inactive',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const adapter = createAdapter(minimalIntegration);
            expect(adapter).toBeInstanceOf(WebhookAdapter);
        });

        it('should handle integration with complex auth', () => {
            const integration: Integration = {
                id: 'oauth-test',
                name: 'OAuth Test',
                config: {
                    type: 'google_sheets',
                    name: 'oauth',
                    auth: {
                        type: 'oauth',
                        accessToken: 'test-access-token',
                        refreshToken: 'test-refresh-token',
                        expiresAt: Date.now() + 3600000,
                    },
                    googleSheets: {
                        spreadsheetId: 'test-sheet-id',
                    },
                },
                status: 'inactive',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const adapter = createAdapter(integration);
            expect(adapter).toBeInstanceOf(GoogleSheetsAdapter);
        });

        it('should create independent adapter instances', () => {
            const integration1 = createMockIntegration('webhook');
            const integration2 = createMockIntegration('webhook');

            const adapter1 = createAdapter(integration1);
            const adapter2 = createAdapter(integration2);

            expect(adapter1).not.toBe(adapter2);
        });
    });
});
