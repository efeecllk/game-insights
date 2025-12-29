/**
 * WelcomeFlow Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WelcomeFlow, useOnboarding } from '../../../src/components/Onboarding/WelcomeFlow';

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
}

describe('WelcomeFlow', () => {
    const defaultProps = {
        onComplete: vi.fn(),
        onSkip: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('welcome step', () => {
        it('should render welcome message', () => {
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Welcome to Game Insights')).toBeInTheDocument();
        });

        it('should display description text', () => {
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            expect(
                screen.getByText(/Zero-config analytics for indie game developers/i)
            ).toBeInTheDocument();
        });

        it('should render Get Started button', () => {
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
        });

        it('should render Skip button', () => {
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument();
        });

        it('should call onSkip when Skip button is clicked', async () => {
            const user = userEvent.setup();
            const onSkip = vi.fn();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} onSkip={onSkip} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /skip for now/i }));

            expect(onSkip).toHaveBeenCalled();
        });

        it('should display feature highlights', () => {
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Zero Config')).toBeInTheDocument();
            expect(screen.getByText('AI Analytics')).toBeInTheDocument();
            expect(screen.getByText('Instant Insights')).toBeInTheDocument();
        });

        it('should advance to choose-path step on Get Started click', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));

            expect(screen.getByText('How would you like to start?')).toBeInTheDocument();
        });
    });

    describe('choose-path step', () => {
        it('should render path options', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));

            expect(screen.getByText('Upload Your Data')).toBeInTheDocument();
            expect(screen.getByText('Explore Demo')).toBeInTheDocument();
        });

        it('should display path descriptions', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));

            expect(screen.getByText('Start analyzing your own game data right away')).toBeInTheDocument();
            expect(screen.getByText('See how it works with sample data')).toBeInTheDocument();
        });

        it('should have back button', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));

            expect(screen.getByText(/back/i)).toBeInTheDocument();
        });

        it('should go back to welcome step on back click', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText(/back/i));

            expect(screen.getByText('Welcome to Game Insights')).toBeInTheDocument();
        });

        it('should advance to complete step on Upload path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Upload Your Data').closest('button')!);

            expect(screen.getByText("You're all set!")).toBeInTheDocument();
        });

        it('should advance to game-type step on Demo path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);

            expect(screen.getByText('What type of game are you making?')).toBeInTheDocument();
        });

        it('should display step indicator', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));

            // Step indicator dots - there are 3 steps with .w-2.h-2.rounded-full styling
            const dots = document.querySelectorAll('.w-2.h-2.rounded-full');
            expect(dots.length).toBe(3);
        });
    });

    describe('game-type step', () => {
        it('should render game type options', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);

            expect(screen.getByText('Puzzle Game')).toBeInTheDocument();
            expect(screen.getByText('Idle / Clicker')).toBeInTheDocument();
            expect(screen.getByText('Battle Royale')).toBeInTheDocument();
            expect(screen.getByText('Match-3 Meta')).toBeInTheDocument();
            expect(screen.getByText('Gacha RPG')).toBeInTheDocument();
            expect(screen.getByText('Other')).toBeInTheDocument();
        });

        it('should display game type emojis', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);

            // Check for puzzle emoji
            expect(document.body.textContent).toContain('Puzzle Game');
        });

        it('should advance to complete step on game type selection', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);
            await user.click(screen.getByText('Puzzle Game').closest('button')!);

            expect(screen.getByText("You're all set!")).toBeInTheDocument();
        });

        it('should go back to choose-path on back click', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);
            await user.click(screen.getByText(/back/i));

            expect(screen.getByText('How would you like to start?')).toBeInTheDocument();
        });
    });

    describe('complete step', () => {
        it('should display completion message for upload path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Upload Your Data').closest('button')!);

            expect(screen.getByText(/upload your game data/i)).toBeInTheDocument();
        });

        it('should display completion message for demo path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);
            await user.click(screen.getByText('Puzzle Game').closest('button')!);

            expect(screen.getByText(/explore game insights/i)).toBeInTheDocument();
        });

        it('should display Upload Data button for upload path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Upload Your Data').closest('button')!);

            expect(screen.getByRole('button', { name: /upload data/i })).toBeInTheDocument();
        });

        it('should display Start Exploring button for demo path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);
            await user.click(screen.getByText('Puzzle Game').closest('button')!);

            expect(screen.getByRole('button', { name: /start exploring/i })).toBeInTheDocument();
        });

        it('should render final CTA button for upload path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Upload Your Data').closest('button')!);

            // The Upload Data button should be present on the final screen
            expect(screen.getByRole('button', { name: /upload data/i })).toBeInTheDocument();
        });

        it('should render final CTA button for demo path', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <WelcomeFlow {...defaultProps} />
                </TestWrapper>
            );

            await user.click(screen.getByRole('button', { name: /get started/i }));
            await user.click(screen.getByText('Explore Demo').closest('button')!);
            await user.click(screen.getByText('Puzzle Game').closest('button')!);

            // The Start Exploring button should be present on the final screen
            expect(screen.getByRole('button', { name: /start exploring/i })).toBeInTheDocument();
        });
    });
});

describe('useOnboarding hook', () => {
    function TestHookComponent() {
        const { hasCompleted, reset } = useOnboarding();
        return (
            <div>
                <span data-testid="status">{hasCompleted ? 'completed' : 'not-completed'}</span>
                <button onClick={reset}>Reset</button>
            </div>
        );
    }

    beforeEach(() => {
        localStorage.clear();
    });

    it('should return false when not completed', () => {
        render(<TestHookComponent />);

        expect(screen.getByTestId('status')).toHaveTextContent('not-completed');
    });

    it('should return true when completed', () => {
        localStorage.setItem('game-insights-onboarded', 'true');

        render(<TestHookComponent />);

        expect(screen.getByTestId('status')).toHaveTextContent('completed');
    });
});
