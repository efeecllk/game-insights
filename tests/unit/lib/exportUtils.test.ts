/**
 * Export Utilities Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    exportToCSV,
    exportToJSON,
    generateMarkdownReport,
    generateShareLink,
    getShareLinks,
    deleteShareLink,
    copyToClipboard,
    formatFileSize,
} from '../../../src/lib/exportUtils';

describe('exportUtils', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(500)).toBe('500 B');
        });

        it('should format kilobytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1.0 KB');
            expect(formatFileSize(2048)).toBe('2.0 KB');
        });

        it('should format megabytes correctly', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
            expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
        });
    });

    describe('generateMarkdownReport', () => {
        it('should generate markdown with title', () => {
            const result = generateMarkdownReport({
                title: 'Test Report',
            });

            expect(result).toContain('# Test Report');
        });

        it('should include description when provided', () => {
            const result = generateMarkdownReport({
                title: 'Test Report',
                description: 'This is a test description',
            });

            expect(result).toContain('This is a test description');
        });

        it('should include metrics table when provided', () => {
            const result = generateMarkdownReport({
                title: 'Test Report',
                metrics: [
                    { label: 'DAU', value: '10,000', change: 5.2 },
                    { label: 'Revenue', value: '$500', change: -2.1 },
                ],
            });

            expect(result).toContain('## Key Metrics');
            expect(result).toContain('| DAU | 10,000 | +5.2% |');
            expect(result).toContain('| Revenue | $500 | -2.1% |');
        });

        it('should include sections when provided', () => {
            const result = generateMarkdownReport({
                title: 'Test Report',
                sections: [
                    { title: 'Summary', content: 'This is the summary' },
                    { title: 'Details', content: 'More details here' },
                ],
            });

            expect(result).toContain('## Summary');
            expect(result).toContain('This is the summary');
            expect(result).toContain('## Details');
            expect(result).toContain('More details here');
        });

        it('should include generated timestamp when provided', () => {
            const date = new Date('2024-01-15T10:30:00Z');
            const result = generateMarkdownReport({
                title: 'Test Report',
                generatedAt: date,
            });

            expect(result).toContain('*Generated:');
        });
    });

    describe('generateShareLink', () => {
        it('should generate a share link with required fields', () => {
            const link = generateShareLink('dashboard-123');

            expect(link.id).toBeDefined();
            expect(link.url).toContain('/shared/');
            expect(link.dashboardId).toBe('dashboard-123');
            expect(link.createdAt).toBeDefined();
            expect(link.accessCount).toBe(0);
        });

        it('should include expiration when specified', () => {
            const link = generateShareLink('dashboard-123', { expiresIn: 24 });

            expect(link.expiresAt).toBeDefined();
        });

        it('should include password when specified', () => {
            const link = generateShareLink('dashboard-123', { password: 'secret' });

            expect(link.password).toBe('secret');
        });

        it('should store link in localStorage', () => {
            generateShareLink('dashboard-123');

            const stored = JSON.parse(localStorage.getItem('shareLinks') || '[]');
            expect(stored.length).toBe(1);
        });
    });

    describe('getShareLinks', () => {
        it('should return empty array when no links exist', () => {
            const links = getShareLinks();
            expect(links).toEqual([]);
        });

        it('should return stored links', () => {
            generateShareLink('dashboard-1');
            generateShareLink('dashboard-2');

            const links = getShareLinks();
            expect(links.length).toBe(2);
        });
    });

    describe('deleteShareLink', () => {
        it('should delete a share link by id', () => {
            const link1 = generateShareLink('dashboard-1');
            generateShareLink('dashboard-2');

            expect(getShareLinks().length).toBe(2);

            deleteShareLink(link1.id);

            expect(getShareLinks().length).toBe(1);
            expect(getShareLinks().find(l => l.id === link1.id)).toBeUndefined();
        });
    });

    describe('copyToClipboard', () => {
        it('should copy text to clipboard', async () => {
            const result = await copyToClipboard('test text');

            expect(result).toBe(true);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
        });
    });

    describe('exportToCSV', () => {
        it('should not export when data is empty', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            exportToCSV([]);

            expect(warnSpy).toHaveBeenCalledWith('No data to export');
        });

        it('should create CSV blob with headers', () => {
            // Mock document methods
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn(),
            };
            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
            vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
            vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);

            const data = [
                { name: 'Test', value: 100 },
                { name: 'Test2', value: 200 },
            ];

            exportToCSV(data);

            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toContain('.csv');
        });
    });

    describe('exportToJSON', () => {
        it('should create JSON blob', () => {
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn(),
            };
            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
            vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
            vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);

            const data = { test: 'value' };

            exportToJSON(data);

            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toContain('.json');
        });
    });
});
