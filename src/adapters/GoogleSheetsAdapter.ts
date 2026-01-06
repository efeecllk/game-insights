/**
 * Google Sheets Adapter
 * Connects to Google Spreadsheets via OAuth and Sheets API
 * Phase 3: One-Click Integrations
 */

import {
    BaseAdapter,
    AdapterConfig,
    SchemaInfo,
    NormalizedData,
    DataQuery,
    AdapterCapabilities,
    ColumnInfo,
} from './BaseAdapter';

// ============================================================================
// Types
// ============================================================================

export interface GoogleSheetsConfig extends AdapterConfig {
    spreadsheetId: string;
    sheetName?: string;
    range?: string;
    hasHeaderRow: boolean;
    refreshInterval?: number; // minutes
}

export interface GoogleAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

interface SheetMetadata {
    title: string;
    sheetId: number;
    rowCount: number;
    columnCount: number;
}

interface SpreadsheetInfo {
    spreadsheetId: string;
    title: string;
    sheets: SheetMetadata[];
}

// ============================================================================
// OAuth Configuration
// ============================================================================

const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// ============================================================================
// Adapter Implementation
// ============================================================================

export class GoogleSheetsAdapter extends BaseAdapter {
    name = 'google_sheets';
    type = 'cloud' as const;

    private config: GoogleSheetsConfig | null = null;
    private tokens: GoogleAuthTokens | null = null;
    private cachedData: Record<string, unknown>[] = [];
    private schema: SchemaInfo | null = null;
    private lastFetch: Date | null = null;
    private spreadsheetInfo: SpreadsheetInfo | null = null;
    private abortController: AbortController | null = null;

    // OAuth client ID (would be configured per deployment)
    private clientId: string = '';

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    async connect(config: GoogleSheetsConfig): Promise<void> {
        this.config = config;
        this.abortController = new AbortController();

        if (!this.tokens) {
            throw new Error('No OAuth tokens. Please authenticate first.');
        }

        // Verify token validity
        if (this.isTokenExpired()) {
            await this.refreshAccessToken();
        }

        // Fetch spreadsheet metadata
        await this.fetchSpreadsheetInfo();

        // Initial data fetch
        await this.refresh();
    }

    async disconnect(): Promise<void> {
        // Abort any pending requests
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.config = null;
        this.tokens = null;
        this.cachedData = [];
        this.schema = null;
        this.lastFetch = null;
        this.spreadsheetInfo = null;
    }

    async testConnection(): Promise<boolean> {
        if (!this.config || !this.tokens) return false;

        try {
            await this.fetchSpreadsheetInfo();
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // Data Methods
    // ========================================================================

    async fetchSchema(): Promise<SchemaInfo> {
        await this.ensureFresh();
        if (!this.schema) {
            throw new Error('No schema available. Check connection.');
        }
        return this.schema;
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        await this.ensureFresh();

        let result = [...this.cachedData];

        // Apply filters
        if (query?.filters) {
            result = result.filter(row => {
                return query.filters!.every(filter => {
                    const value = row[filter.column];
                    switch (filter.operator) {
                        case '=': return value === filter.value;
                        case '!=': return value !== filter.value;
                        case '>': return (value as number) > (filter.value as number);
                        case '<': return (value as number) < (filter.value as number);
                        case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                        case 'in': return (filter.value as unknown[]).includes(value);
                        default: return true;
                    }
                });
            });
        }

        // Apply ordering
        if (query?.orderBy) {
            const { column, direction } = query.orderBy;
            result.sort((a, b) => {
                const aVal = a[column] as string | number;
                const bVal = b[column] as string | number;
                const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return direction === 'desc' ? -cmp : cmp;
            });
        }

        // Apply pagination
        if (query?.offset) result = result.slice(query.offset);
        if (query?.limit) result = result.slice(0, query.limit);

        return {
            columns: Object.keys(this.cachedData[0] || {}),
            rows: result,
            metadata: {
                source: `sheets:${this.config?.spreadsheetId || 'unknown'}`,
                fetchedAt: this.lastFetch?.toISOString() || new Date().toISOString(),
                rowCount: result.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false, // Sheets doesn't have true real-time
            supportsFiltering: true,
            supportsAggregation: false,
            maxRowsPerQuery: 50000, // Sheets has limits
        };
    }

    // ========================================================================
    // OAuth Methods
    // ========================================================================

    /**
     * Initialize OAuth flow - returns URL for user to authenticate
     */
    getOAuthUrl(redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: GOOGLE_SCOPES,
            access_type: 'offline',
            prompt: 'consent',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Set OAuth client ID (called during app initialization)
     */
    setClientId(clientId: string): void {
        this.clientId = clientId;
    }

    /**
     * Set tokens after OAuth callback
     */
    setTokens(tokens: GoogleAuthTokens): void {
        this.tokens = tokens;
    }

    /**
     * Get current tokens (for persistence)
     */
    getTokens(): GoogleAuthTokens | null {
        return this.tokens;
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(): boolean {
        if (!this.tokens) return true;
        return Date.now() >= this.tokens.expiresAt - 60000; // 1 min buffer
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(): Promise<void> {
        if (!this.tokens?.refreshToken) {
            throw new Error('No refresh token available. Re-authentication required.');
        }

        // Note: In production, this would call a backend endpoint
        // that securely handles the client secret
        throw new Error('Token refresh must be handled by backend. Please re-authenticate.');
    }

    // ========================================================================
    // Spreadsheet Methods
    // ========================================================================

    /**
     * List available sheets in the spreadsheet
     */
    getAvailableSheets(): SheetMetadata[] {
        return this.spreadsheetInfo?.sheets || [];
    }

    /**
     * Get spreadsheet title
     */
    getSpreadsheetTitle(): string {
        return this.spreadsheetInfo?.title || '';
    }

    /**
     * Force refresh data from Google Sheets
     */
    async refresh(): Promise<void> {
        if (!this.config || !this.tokens) {
            throw new Error('Not configured or not authenticated');
        }

        if (this.isTokenExpired()) {
            await this.refreshAccessToken();
        }

        const range = this.buildRange();
        const url = `${SHEETS_API_BASE}/${this.config.spreadsheetId}/values/${encodeURIComponent(range)}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.tokens.accessToken}`,
            },
            signal: this.abortController?.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Sheets API error: ${response.status} - ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const values: unknown[][] = data.values || [];

        if (values.length === 0) {
            this.cachedData = [];
            this.schema = { columns: [], rowCount: 0, sampleData: [] };
            this.lastFetch = new Date();
            return;
        }

        // Parse rows with headers
        const headers = this.config.hasHeaderRow
            ? (values[0] as string[]).map((h, i) => this.sanitizeHeader(h, i))
            : values[0].map((_, i) => `Column${i + 1}`);

        const dataRows = this.config.hasHeaderRow ? values.slice(1) : values;

        this.cachedData = dataRows.map(row => {
            const obj: Record<string, unknown> = {};
            headers.forEach((header, i) => {
                obj[header] = this.parseValue(row[i]);
            });
            return obj;
        });

        this.schema = this.analyzeSchema(this.cachedData);
        this.lastFetch = new Date();
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private async fetchSpreadsheetInfo(): Promise<void> {
        if (!this.config || !this.tokens) {
            throw new Error('Not configured or not authenticated');
        }

        const url = `${SHEETS_API_BASE}/${this.config.spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.tokens.accessToken}`,
            },
            signal: this.abortController?.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Sheets API error: ${response.status} - ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        this.spreadsheetInfo = {
            spreadsheetId: data.spreadsheetId,
            title: data.properties?.title || 'Untitled',
            sheets: data.sheets?.map((s: { properties: { title: string; sheetId: number; gridProperties?: { rowCount: number; columnCount: number } } }) => ({
                title: s.properties.title,
                sheetId: s.properties.sheetId,
                rowCount: s.properties.gridProperties?.rowCount || 0,
                columnCount: s.properties.gridProperties?.columnCount || 0,
            })) || [],
        };
    }

    private buildRange(): string {
        if (this.config?.range) {
            return this.config.range;
        }

        const sheetName = this.config?.sheetName || this.spreadsheetInfo?.sheets[0]?.title || 'Sheet1';
        return `'${sheetName}'`;
    }

    private sanitizeHeader(header: unknown, index: number): string {
        if (!header || typeof header !== 'string' || header.trim() === '') {
            return `Column${index + 1}`;
        }
        // Remove special characters, replace spaces with underscores
        return header
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();
    }

    private parseValue(value: unknown): unknown {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const strVal = String(value).trim();

        // Try number
        const num = Number(strVal);
        if (!isNaN(num) && strVal !== '') {
            return num;
        }

        // Try boolean
        if (strVal.toLowerCase() === 'true') return true;
        if (strVal.toLowerCase() === 'false') return false;

        // Return as string
        return strVal;
    }

    private async ensureFresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const refreshMs = (this.config.refreshInterval || 5) * 60 * 1000;
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > refreshMs) {
            await this.refresh();
        }
    }

    private analyzeSchema(data: Record<string, unknown>[]): SchemaInfo {
        if (data.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => {
            const sampleValues = data.slice(0, 10).map(row => row[name]);
            return {
                name,
                type: this.inferType(sampleValues),
                nullable: sampleValues.some(v => v === null || v === undefined),
                sampleValues,
            };
        });

        return { columns, rowCount: data.length, sampleData: data.slice(0, 10) };
    }

    private inferType(values: unknown[]): ColumnInfo['type'] {
        const nonNull = values.filter(v => v !== null && v !== undefined);
        if (nonNull.length === 0) return 'unknown';

        const types = new Set(nonNull.map(v => typeof v));

        if (types.size === 1) {
            const type = [...types][0];
            if (type === 'number') return 'number';
            if (type === 'boolean') return 'boolean';
            if (type === 'string') {
                // Check if all strings look like dates
                const allDates = nonNull.every(v =>
                    typeof v === 'string' && !isNaN(Date.parse(v)) && v.includes('-')
                );
                if (allDates) return 'date';
                return 'string';
            }
        }

        return 'string'; // Default to string for mixed types
    }
}

export default GoogleSheetsAdapter;
