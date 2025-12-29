/**
 * GoogleSheetsAdapter Unit Tests
 * Tests for Google Sheets adapter including OAuth, spreadsheet selection, and data fetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleSheetsAdapter, GoogleSheetsConfig, GoogleAuthTokens } from '@/adapters/GoogleSheetsAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GoogleSheetsAdapter', () => {
    let adapter: GoogleSheetsAdapter;
    let validConfig: GoogleSheetsConfig;
    let validTokens: GoogleAuthTokens;

    beforeEach(() => {
        adapter = new GoogleSheetsAdapter();
        validConfig = {
            name: 'test-sheets',
            type: 'cloud',
            spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
            sheetName: 'Sheet1',
            hasHeaderRow: true,
            refreshInterval: 5,
        };
        validTokens = {
            accessToken: 'valid-access-token-123',
            refreshToken: 'valid-refresh-token-456',
            expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
        };
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await adapter.disconnect();
    });

    // =========================================================================
    // Basic Properties Tests
    // =========================================================================

    describe('basic properties', () => {
        it('should have correct name', () => {
            expect(adapter.name).toBe('google_sheets');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('cloud');
        });

        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();
            expect(capabilities.supportsRealtime).toBe(false);
            expect(capabilities.supportsFiltering).toBe(true);
            expect(capabilities.supportsAggregation).toBe(false);
            expect(capabilities.maxRowsPerQuery).toBe(50000);
        });
    });

    // =========================================================================
    // OAuth Tests
    // =========================================================================

    describe('OAuth', () => {
        it('should generate correct OAuth URL', () => {
            adapter.setClientId('test-client-id');

            const redirectUri = 'https://app.example.com/callback';
            const url = adapter.getOAuthUrl(redirectUri);

            expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
            expect(url).toContain('client_id=test-client-id');
            expect(url).toContain(encodeURIComponent(redirectUri));
            expect(url).toContain('response_type=code');
            expect(url).toContain('access_type=offline');
            expect(url).toContain('spreadsheets.readonly');
        });

        it('should store and retrieve tokens', () => {
            adapter.setTokens(validTokens);

            const tokens = adapter.getTokens();

            expect(tokens).toEqual(validTokens);
        });

        it('should detect expired tokens', () => {
            const expiredTokens = {
                ...validTokens,
                expiresAt: Date.now() - 1000, // Expired 1 second ago
            };

            adapter.setTokens(expiredTokens);

            expect(adapter.isTokenExpired()).toBe(true);
        });

        it('should detect valid tokens', () => {
            adapter.setTokens(validTokens);

            expect(adapter.isTokenExpired()).toBe(false);
        });

        it('should consider token expired with 1 minute buffer', () => {
            const almostExpiredTokens = {
                ...validTokens,
                expiresAt: Date.now() + 30 * 1000, // 30 seconds from now
            };

            adapter.setTokens(almostExpiredTokens);

            expect(adapter.isTokenExpired()).toBe(true);
        });

        it('should return true for isTokenExpired when no tokens', () => {
            expect(adapter.isTokenExpired()).toBe(true);
        });
    });

    // =========================================================================
    // Connection Tests
    // =========================================================================

    describe('connect', () => {
        it('should throw error when no OAuth tokens', async () => {
            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'No OAuth tokens. Please authenticate first.'
            );
        });

        it('should connect successfully with valid tokens', async () => {
            adapter.setTokens(validTokens);

            // Mock spreadsheet info fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test Spreadsheet' },
                    sheets: [
                        {
                            properties: {
                                title: 'Sheet1',
                                sheetId: 0,
                                gridProperties: { rowCount: 100, columnCount: 10 },
                            },
                        },
                    ],
                }),
            });

            // Mock data fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', 'Score', 'Active'],
                        ['Alice', '100', 'TRUE'],
                        ['Bob', '200', 'FALSE'],
                    ],
                }),
            });

            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });

        it('should throw error when token is expired and cannot refresh', async () => {
            const expiredTokens = {
                ...validTokens,
                expiresAt: Date.now() - 1000,
                refreshToken: 'refresh-token',
            };

            adapter.setTokens(expiredTokens);

            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'Token refresh must be handled by backend'
            );
        });

        it('should handle API error during spreadsheet info fetch', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({
                    error: { message: 'Spreadsheet not found' },
                }),
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow('Sheets API error');
        });
    });

    describe('disconnect', () => {
        it('should clear state on disconnect', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            await adapter.disconnect();

            expect(adapter.getTokens()).toBeNull();
            expect(adapter.getAvailableSheets()).toEqual([]);
        });
    });

    describe('testConnection', () => {
        it('should return true when connection is valid', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });

        it('should return false when not configured', async () => {
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should return false when API call fails', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Schema Tests
    // =========================================================================

    describe('fetchSchema', () => {
        it('should return schema from cached data', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [{ properties: { title: 'Sheet1', sheetId: 0, gridProperties: { rowCount: 10, columnCount: 3 } } }],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', 'Score', 'Active'],
                        ['Alice', '100', 'TRUE'],
                        ['Bob', '200', 'FALSE'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toHaveLength(3);
            expect(schema.columns.map(c => c.name)).toEqual(['name', 'score', 'active']);
            expect(schema.rowCount).toBe(2);
        });

        it('should infer types correctly', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Text', 'Number', 'Boolean', 'Date'],
                        ['hello', '42', 'true', '2024-01-15'],
                        ['world', '100', 'false', '2024-02-20'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns.find(c => c.name === 'text')?.type).toBe('string');
            expect(schema.columns.find(c => c.name === 'number')?.type).toBe('number');
            expect(schema.columns.find(c => c.name === 'boolean')?.type).toBe('boolean');
            expect(schema.columns.find(c => c.name === 'date')?.type).toBe('date');
        });

        it('should throw error when not connected', async () => {
            await expect(adapter.fetchSchema()).rejects.toThrow('Not configured');
        });
    });

    // =========================================================================
    // Data Fetch Tests
    // =========================================================================

    describe('fetchData', () => {
        const setupConnection = async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [{ properties: { title: 'Sheet1', sheetId: 0, gridProperties: { rowCount: 10, columnCount: 3 } } }],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', 'Score', 'Active'],
                        ['Alice', '100', 'TRUE'],
                        ['Bob', '200', 'FALSE'],
                        ['Charlie', '150', 'TRUE'],
                    ],
                }),
            });

            await adapter.connect(validConfig);
        };

        it('should fetch all data without query', async () => {
            await setupConnection();

            const result = await adapter.fetchData();

            expect(result.rows).toHaveLength(3);
            expect(result.metadata.source).toContain('sheets:');
        });

        it('should apply equality filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'name', operator: '=', value: 'Alice' }],
            });

            expect(result.rows).toHaveLength(1);
            expect((result.rows[0] as Record<string, unknown>).name).toBe('Alice');
        });

        it('should apply inequality filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'name', operator: '!=', value: 'Alice' }],
            });

            expect(result.rows).toHaveLength(2);
        });

        it('should apply greater than filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'score', operator: '>', value: 100 }],
            });

            expect(result.rows).toHaveLength(2);
        });

        it('should apply less than filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'score', operator: '<', value: 150 }],
            });

            expect(result.rows).toHaveLength(1);
        });

        it('should apply contains filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'name', operator: 'contains', value: 'li' }],
            });

            expect(result.rows).toHaveLength(2); // Alice and Charlie
        });

        it('should apply in filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'name', operator: 'in', value: ['Alice', 'Bob'] }],
            });

            expect(result.rows).toHaveLength(2);
        });

        it('should apply ordering', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                orderBy: { column: 'score', direction: 'desc' },
            });

            expect((result.rows[0] as Record<string, unknown>).score).toBe(200);
            expect((result.rows[2] as Record<string, unknown>).score).toBe(100);
        });

        it('should apply pagination', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                offset: 1,
                limit: 1,
            });

            expect(result.rows).toHaveLength(1);
            expect((result.rows[0] as Record<string, unknown>).name).toBe('Bob');
        });
    });

    // =========================================================================
    // Spreadsheet Methods Tests
    // =========================================================================

    describe('getAvailableSheets', () => {
        it('should return available sheets after connection', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [
                        { properties: { title: 'Sheet1', sheetId: 0, gridProperties: { rowCount: 100, columnCount: 10 } } },
                        { properties: { title: 'Sheet2', sheetId: 1, gridProperties: { rowCount: 50, columnCount: 5 } } },
                    ],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            const sheets = adapter.getAvailableSheets();

            expect(sheets).toHaveLength(2);
            expect(sheets[0].title).toBe('Sheet1');
            expect(sheets[1].title).toBe('Sheet2');
        });

        it('should return empty array when not connected', () => {
            const sheets = adapter.getAvailableSheets();
            expect(sheets).toEqual([]);
        });
    });

    describe('getSpreadsheetTitle', () => {
        it('should return spreadsheet title after connection', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'My Game Analytics' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            const title = adapter.getSpreadsheetTitle();
            expect(title).toBe('My Game Analytics');
        });

        it('should return empty string when not connected', () => {
            const title = adapter.getSpreadsheetTitle();
            expect(title).toBe('');
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    describe('refresh', () => {
        it('should refresh data from API', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [{ properties: { title: 'Sheet1', sheetId: 0, gridProperties: { rowCount: 10, columnCount: 2 } } }],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', 'Score'],
                        ['Initial', '100'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            let data = await adapter.fetchData();
            expect(data.rows).toHaveLength(1);

            // Mock new data
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', 'Score'],
                        ['Updated1', '200'],
                        ['Updated2', '300'],
                    ],
                }),
            });

            await adapter.refresh();

            data = await adapter.fetchData();
            expect(data.rows).toHaveLength(2);
        });

        it('should throw error when not configured', async () => {
            await expect(adapter.refresh()).rejects.toThrow('Not configured');
        });

        it('should handle API error during refresh', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({
                    error: { message: 'Permission denied' },
                }),
            });

            await expect(adapter.refresh()).rejects.toThrow('Sheets API error');
        });
    });

    // =========================================================================
    // Header Parsing Tests
    // =========================================================================

    describe('header parsing', () => {
        it('should sanitize headers with special characters', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['User Name!', 'Score (Points)', 'Is Active?'],
                        ['Alice', '100', 'TRUE'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns.map(c => c.name)).toEqual([
                'user_name',
                'score_points',
                'is_active',
            ]);
        });

        it('should handle empty headers', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', '', 'Score'],
                        ['Alice', 'data', '100'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns[1].name).toBe('Column2');
        });

        it('should generate column names when no header row', async () => {
            const configNoHeader = {
                ...validConfig,
                hasHeaderRow: false,
            };

            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Alice', '100', 'TRUE'],
                        ['Bob', '200', 'FALSE'],
                    ],
                }),
            });

            await adapter.connect(configNoHeader);

            const schema = await adapter.fetchSchema();

            expect(schema.columns.map(c => c.name)).toEqual(['Column1', 'Column2', 'Column3']);
            expect(schema.rowCount).toBe(2);
        });
    });

    // =========================================================================
    // Value Parsing Tests
    // =========================================================================

    describe('value parsing', () => {
        it('should parse numbers correctly', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Value'],
                        ['42'],
                        ['3.14'],
                        ['-100'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const result = await adapter.fetchData();

            expect((result.rows[0] as Record<string, unknown>).value).toBe(42);
            expect((result.rows[1] as Record<string, unknown>).value).toBe(3.14);
            expect((result.rows[2] as Record<string, unknown>).value).toBe(-100);
        });

        it('should parse booleans correctly', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Active'],
                        ['TRUE'],
                        ['true'],
                        ['FALSE'],
                        ['false'],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const result = await adapter.fetchData();

            expect((result.rows[0] as Record<string, unknown>).active).toBe(true);
            expect((result.rows[1] as Record<string, unknown>).active).toBe(true);
            expect((result.rows[2] as Record<string, unknown>).active).toBe(false);
            expect((result.rows[3] as Record<string, unknown>).active).toBe(false);
        });

        it('should handle null and empty values', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    values: [
                        ['Name', 'Score'],
                        ['Alice', ''],
                        ['', '100'],
                        [null, null],
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const result = await adapter.fetchData();

            expect((result.rows[0] as Record<string, unknown>).score).toBeNull();
            expect((result.rows[1] as Record<string, unknown>).name).toBeNull();
        });
    });

    // =========================================================================
    // Range Building Tests
    // =========================================================================

    describe('range building', () => {
        it('should use custom range when provided', async () => {
            const configWithRange = {
                ...validConfig,
                range: 'A1:C100',
            };

            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(configWithRange);

            const calls = mockFetch.mock.calls;
            const dataFetchCall = calls.find(call =>
                call[0].includes('/values/')
            );

            expect(dataFetchCall?.[0]).toContain('A1%3AC100');
        });

        it('should use sheet name when no range provided', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [{ properties: { title: 'DataSheet', sheetId: 0, gridProperties: { rowCount: 10, columnCount: 3 } } }],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            const configWithSheet = {
                ...validConfig,
                sheetName: 'DataSheet',
                range: undefined,
            };

            await adapter.connect(configWithSheet);

            const calls = mockFetch.mock.calls;
            const dataFetchCall = calls.find(call =>
                call[0].includes('/values/')
            );

            expect(dataFetchCall?.[0]).toContain("'DataSheet'");
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should handle empty spreadsheet', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ values: [] }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toHaveLength(0);
            expect(schema.rowCount).toBe(0);
        });

        it('should handle network errors', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter.connect(validConfig)).rejects.toThrow();
        });

        it('should handle missing values in response', async () => {
            adapter.setTokens(validTokens);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    spreadsheetId: validConfig.spreadsheetId,
                    properties: { title: 'Test' },
                    sheets: [],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}), // No values property
            });

            await adapter.connect(validConfig);

            const data = await adapter.fetchData();
            expect(data.rows).toHaveLength(0);
        });
    });
});
