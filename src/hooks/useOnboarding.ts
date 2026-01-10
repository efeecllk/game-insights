/**
 * useOnboarding Hook
 * Manages onboarding state
 * Extracted for lazy loading of WelcomeFlow component
 */

export function useOnboarding() {
    const hasCompleted = localStorage.getItem('game-insights-onboarded') === 'true';

    const reset = () => {
        localStorage.removeItem('game-insights-onboarded');
        localStorage.removeItem('game-insights-onboarding-path');
        localStorage.removeItem('game-insights-demo-type');
    };

    return {
        hasCompleted,
        reset,
    };
}
