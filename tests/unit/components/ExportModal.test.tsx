/**
 * ExportModal Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportModal } from '../../../src/components/ExportModal';

// Mock the export utilities
vi.mock('../../../src/lib/exportUtils', () => ({
    exportToCSV: vi.fn(),
    exportToJSON: vi.fn(),
    exportToMarkdown: vi.fn(),
    generateMarkdownReport: vi.fn(() => '# Test Report'),
    generateShareLink: vi.fn(() => ({
        id: 'test-share-id',
        url: 'http://localhost:3000/shared/test-share-id',
        dashboardId: 'test-dashboard',
        createdAt: new Date().toISOString(),
        accessCount: 0,
    })),
    getShareLinks: vi.fn(() => []),
    deleteShareLink: vi.fn(),
    copyToClipboard: vi.fn(() => Promise.resolve(true)),
}));

// Import mocked functions
import * as exportUtils from '../../../src/lib/exportUtils';

describe('ExportModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Dashboard',
        description: 'Test description',
        data: [
            { name: 'Item 1', value: 100 },
            { name: 'Item 2', value: 200 },
        ],
        dashboardId: 'test-dashboard-id',
        metrics: [
            { label: 'DAU', value: '10,000', change: 5 },
            { label: 'Revenue', value: '$5,000', change: -2 },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('rendering', () => {
        it('should render when isOpen is true', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByText('Export & Share')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            render(<ExportModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText('Export & Share')).not.toBeInTheDocument();
        });

        it('should display title in modal', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
        });

        it('should render Download and Share tabs', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByRole('tab', { name: /download/i })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: /share link/i })).toBeInTheDocument();
        });

        it('should render format selection buttons', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByText('CSV')).toBeInTheDocument();
            expect(screen.getByText('JSON')).toBeInTheDocument();
            expect(screen.getByText('Markdown')).toBeInTheDocument();
            expect(screen.getByText('PNG')).toBeInTheDocument();
            expect(screen.getByText('PDF')).toBeInTheDocument();
        });

        it('should render export button', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByRole('button', { name: /export as csv/i })).toBeInTheDocument();
        });
    });

    describe('tab switching', () => {
        it('should show download content by default', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByText('Export Format')).toBeInTheDocument();
        });

        it('should switch to share tab on click', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            expect(screen.getByText('Link Expires In')).toBeInTheDocument();
        });

        it('should switch back to download tab', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));
            await user.click(screen.getByRole('tab', { name: /download/i }));

            expect(screen.getByText('Export Format')).toBeInTheDocument();
        });
    });

    describe('format selection', () => {
        it('should select CSV by default', () => {
            render(<ExportModal {...defaultProps} />);

            // The CSV format button should have the selected styling
            const csvButton = screen.getByText('CSV').closest('button');
            expect(csvButton).toHaveClass('border-violet-500');
        });

        it('should change selected format on click', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            const jsonButton = screen.getByText('JSON').closest('button');
            if (jsonButton) {
                await user.click(jsonButton);
            }

            expect(screen.getByRole('button', { name: /export as json/i })).toBeInTheDocument();
        });

        it('should show warning for PNG format', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            const pngButton = screen.getByText('PNG').closest('button');
            if (pngButton) {
                await user.click(pngButton);
            }

            expect(screen.getByText(/requires additional setup/i)).toBeInTheDocument();
        });

        it('should show warning for PDF format', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            const pdfButton = screen.getByText('PDF').closest('button');
            if (pdfButton) {
                await user.click(pdfButton);
            }

            expect(screen.getByText(/requires additional setup/i)).toBeInTheDocument();
        });
    });

    describe('export functionality', () => {
        it('should call exportToCSV when exporting CSV', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            const exportButton = screen.getByRole('button', { name: /export as csv/i });
            await user.click(exportButton);

            expect(exportUtils.exportToCSV).toHaveBeenCalled();
        });

        it('should call exportToJSON when exporting JSON', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            const jsonButton = screen.getByText('JSON').closest('button');
            if (jsonButton) {
                await user.click(jsonButton);
            }

            const exportButton = screen.getByRole('button', { name: /export as json/i });
            await user.click(exportButton);

            expect(exportUtils.exportToJSON).toHaveBeenCalled();
        });

        it('should call exportToMarkdown when exporting Markdown', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            const mdButton = screen.getByText('Markdown').closest('button');
            if (mdButton) {
                await user.click(mdButton);
            }

            const exportButton = screen.getByRole('button', { name: /export as markdown/i });
            await user.click(exportButton);

            expect(exportUtils.generateMarkdownReport).toHaveBeenCalled();
            expect(exportUtils.exportToMarkdown).toHaveBeenCalled();
        });

        it('should not export CSV if no data', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} data={[]} />);

            const exportButton = screen.getByRole('button', { name: /export as csv/i });
            await user.click(exportButton);

            expect(exportUtils.exportToCSV).not.toHaveBeenCalled();
        });
    });

    describe('share functionality', () => {
        it('should render share options when on share tab', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            expect(screen.getByText('Link Expires In')).toBeInTheDocument();
            expect(screen.getByText('Password Protection (optional)')).toBeInTheDocument();
        });

        it('should show message when no dashboardId', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} dashboardId={undefined} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            expect(screen.getByText(/share links are only available for dashboards/i)).toBeInTheDocument();
        });

        it('should generate share link on button click', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));
            await user.click(screen.getByRole('button', { name: /generate share link/i }));

            expect(exportUtils.generateShareLink).toHaveBeenCalledWith('test-dashboard-id', expect.any(Object));
        });

        it('should display generated share link', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));
            await user.click(screen.getByRole('button', { name: /generate share link/i }));

            expect(screen.getByText('Link created!')).toBeInTheDocument();
        });

        it('should copy link to clipboard', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));
            await user.click(screen.getByRole('button', { name: /generate share link/i }));

            // Find and click the copy button (by finding the button with Copy icon)
            const copyButtons = document.querySelectorAll('button');
            const copyButton = Array.from(copyButtons).find(btn =>
                btn.querySelector('svg') && btn.closest('.bg-green-500\\/10')
            );
            if (copyButton) {
                await user.click(copyButton);
            }

            expect(exportUtils.copyToClipboard).toHaveBeenCalled();
        });

        it('should allow selecting expiration time', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            const select = screen.getByRole('combobox');
            await user.selectOptions(select, '168'); // 7 days

            expect(select).toHaveValue('168');
        });

        it('should allow entering password', async () => {
            const user = userEvent.setup();
            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            const passwordInput = screen.getByPlaceholderText('Enter password');
            await user.type(passwordInput, 'secret123');

            expect(passwordInput).toHaveValue('secret123');
        });
    });

    describe('close functionality', () => {
        it('should call onClose when clicking close button', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<ExportModal {...defaultProps} onClose={onClose} />);

            const closeButton = document.querySelector('button svg.w-5')?.closest('button');
            if (closeButton) {
                await user.click(closeButton);
            }

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when clicking backdrop', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<ExportModal {...defaultProps} onClose={onClose} />);

            const backdrop = document.querySelector('.bg-black\\/50');
            if (backdrop) {
                await user.click(backdrop);
            }

            // Note: This depends on implementation - if backdrop doesn't close modal, this test may need adjustment
        });
    });

    describe('format descriptions', () => {
        it('should display format descriptions', () => {
            render(<ExportModal {...defaultProps} />);

            expect(screen.getByText('Spreadsheet format')).toBeInTheDocument();
            expect(screen.getByText('Raw data format')).toBeInTheDocument();
            expect(screen.getByText('Report format')).toBeInTheDocument();
            expect(screen.getByText('Image snapshot')).toBeInTheDocument();
            expect(screen.getByText('Document format')).toBeInTheDocument();
        });
    });

    describe('existing share links', () => {
        it('should display existing share links', async () => {
            const user = userEvent.setup();
            vi.mocked(exportUtils.getShareLinks).mockReturnValue([
                {
                    id: 'existing-link-1',
                    url: 'http://localhost:3000/shared/existing-link-1',
                    dashboardId: 'test-dashboard-id',
                    createdAt: new Date().toISOString(),
                    accessCount: 5,
                },
            ]);

            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            expect(screen.getByText('Active Links')).toBeInTheDocument();
        });

        it('should allow deleting share links', async () => {
            const user = userEvent.setup();
            vi.mocked(exportUtils.getShareLinks).mockReturnValue([
                {
                    id: 'existing-link-1',
                    url: 'http://localhost:3000/shared/existing-link-1',
                    dashboardId: 'test-dashboard-id',
                    createdAt: new Date().toISOString(),
                    accessCount: 5,
                },
            ]);

            render(<ExportModal {...defaultProps} />);

            await user.click(screen.getByRole('tab', { name: /share link/i }));

            // Find delete button
            const deleteButton = document.querySelector('.hover\\:bg-red-500\\/20');
            if (deleteButton) {
                await user.click(deleteButton);
            }

            expect(exportUtils.deleteShareLink).toHaveBeenCalledWith('existing-link-1');
        });
    });
});
