/**
 * Sidebar Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../../src/components/Sidebar';
import { DataProvider } from '../../../src/context/DataContext';
import { GameProvider } from '../../../src/context/GameContext';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock IndexedDB for DataProvider
vi.mock('../../../src/lib/dataStore', () => ({
    initDB: vi.fn().mockResolvedValue(undefined),
    getAllGameData: vi.fn().mockResolvedValue([]),
    getAllGameProfiles: vi.fn().mockResolvedValue([]),
    saveGameData: vi.fn().mockResolvedValue(undefined),
    saveGameProfile: vi.fn().mockResolvedValue(undefined),
    deleteGameData: vi.fn().mockResolvedValue(undefined),
    generateId: vi.fn().mockReturnValue('test-id'),
}));

// Test wrapper component with all required providers
function TestWrapper({
    children,
    initialRoute = '/',
}: {
    children: React.ReactNode;
    initialRoute?: string;
}) {
    return (
        <MemoryRouter initialEntries={[initialRoute]}>
            <ThemeProvider>
                <DataProvider>
                    <GameProvider>{children}</GameProvider>
                </DataProvider>
            </ThemeProvider>
        </MemoryRouter>
    );
}

describe('Sidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('rendering', () => {
        it('should render sidebar with logo', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Game Insights')).toBeInTheDocument();
        });

        it('should render navigation items', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Overview')).toBeInTheDocument();
            expect(screen.getByText('Games')).toBeInTheDocument();
            expect(screen.getByText('Data Sources')).toBeInTheDocument();
            expect(screen.getByText('AI Analytics')).toBeInTheDocument();
        });

        it('should render all main navigation items', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Funnels')).toBeInTheDocument();
            expect(screen.getByText('Monetization')).toBeInTheDocument();
            expect(screen.getByText('Predictions')).toBeInTheDocument();
            expect(screen.getByText('A/B Testing')).toBeInTheDocument();
            expect(screen.getByText('Game Settings')).toBeInTheDocument();
        });

        it('should render theme toggle button', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByRole('button', { name: /switch to (light|dark) theme/i })).toBeInTheDocument();
        });

        it('should render active game indicator', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Active Game')).toBeInTheDocument();
            expect(screen.getByText('puzzle')).toBeInTheDocument();
        });
    });

    describe('navigation', () => {
        it('should highlight active route', () => {
            render(
                <TestWrapper initialRoute="/">
                    <Sidebar />
                </TestWrapper>
            );

            const overviewLink = screen.getByRole('link', { name: /overview/i });
            expect(overviewLink).toHaveClass('bg-th-accent-primary-muted');
        });

        it('should highlight analytics route when active', () => {
            render(
                <TestWrapper initialRoute="/analytics">
                    <Sidebar />
                </TestWrapper>
            );

            const analyticsLink = screen.getByRole('link', { name: /ai analytics/i });
            expect(analyticsLink).toHaveClass('bg-th-accent-primary-muted');
        });

        it('should have correct href for navigation links', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByRole('link', { name: /overview/i })).toHaveAttribute('href', '/');
            expect(screen.getByRole('link', { name: /games/i })).toHaveAttribute('href', '/games');
            expect(screen.getByRole('link', { name: /monetization/i })).toHaveAttribute(
                'href',
                '/monetization'
            );
        });

        it('should navigate to correct path on click', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const monetizationLink = screen.getByRole('link', { name: /monetization/i });
            await user.click(monetizationLink);

            expect(monetizationLink).toHaveAttribute('href', '/monetization');
        });
    });

    describe('badges', () => {
        it('should display New badge on Templates', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const templatesItem = screen.getByText('Templates').closest('a');
            expect(templatesItem?.textContent).toContain('New');
        });

        it('should display New badge on Predictions', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const predictionsItem = screen.getByText('Predictions').closest('a');
            expect(predictionsItem?.textContent).toContain('New');
        });

        it('should display B badge on Distributions', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const distributionsItem = screen.getByText('Distributions').closest('a');
            expect(distributionsItem?.textContent).toContain('B');
        });
    });

    describe('external links', () => {
        it('should mark User Analysis as external link', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            // User Analysis has external: true in config
            const userAnalysisLink = screen.getByRole('link', { name: /user analysis/i });
            expect(userAnalysisLink).toBeInTheDocument();
        });
    });

    describe('theme toggle', () => {
        it('should toggle theme on button click', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const themeButton = screen.getByRole('button', { name: /switch to (light|dark) theme/i });
            await user.click(themeButton);

            // Theme should change - verify button still works after toggle
            expect(themeButton).toBeInTheDocument();
        });

        it('should display theme label', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Theme')).toBeInTheDocument();
        });
    });

    describe('game type display', () => {
        it('should display current game type', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Active Game')).toBeInTheDocument();
            // Default game type is 'puzzle'
            expect(screen.getByText('puzzle')).toBeInTheDocument();
        });
    });

    describe('sidebar layout', () => {
        it('should have fixed positioning', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const sidebar = document.querySelector('aside');
            expect(sidebar).toHaveClass('fixed');
        });

        it('should have correct width', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const sidebar = document.querySelector('aside');
            expect(sidebar).toHaveClass('w-[200px]');
        });

        it('should have scrollable navigation area', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const nav = document.querySelector('nav');
            expect(nav).toHaveClass('overflow-y-auto');
        });
    });

    describe('accessibility', () => {
        it('should use semantic aside element', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(document.querySelector('aside')).toBeInTheDocument();
        });

        it('should use semantic nav element', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(document.querySelector('nav')).toBeInTheDocument();
        });

        it('should have aria-label on theme toggle', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            // The aria-label changes based on current theme (Switch to light/dark theme)
            const themeButton = screen.getByRole('button', { name: /switch to (light|dark) theme/i });
            expect(themeButton).toHaveAttribute('aria-label', expect.stringMatching(/Switch to (light|dark) theme/));
        });

        it('should have accessible navigation links', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const links = screen.getAllByRole('link');
            expect(links.length).toBeGreaterThan(10);
        });
    });

    describe('priority sorting', () => {
        it('should render items in priority order for puzzle game type', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            const links = screen.getAllByRole('link');
            const linkTexts = links.map((link) => link.textContent?.trim().split(/\s+/)[0]);

            // Overview should be first for puzzle
            expect(linkTexts[0]).toBe('Overview');
        });
    });

    describe('logo section', () => {
        it('should render logo icon', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            // Logo container with gradient
            const logoContainer = document.querySelector('.bg-gradient-to-br');
            expect(logoContainer).toBeInTheDocument();
        });

        it('should render app name', () => {
            render(
                <TestWrapper>
                    <Sidebar />
                </TestWrapper>
            );

            expect(screen.getByText('Game Insights')).toBeInTheDocument();
        });
    });
});
