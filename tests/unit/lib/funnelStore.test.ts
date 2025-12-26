/**
 * Funnel Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import {
    createFunnel,
    createFunnelStep,
    getMockFunnelResult,
    COMMON_EVENTS,
    FILTER_OPERATORS,
} from '../../../src/lib/funnelStore';

describe('funnelStore', () => {
    describe('createFunnel', () => {
        it('should create a funnel with required fields', () => {
            const funnel = createFunnel('Test Funnel');

            expect(funnel.id).toBeDefined();
            expect(funnel.name).toBe('Test Funnel');
            expect(funnel.icon).toBe('🔻');
            expect(funnel.steps).toEqual([]);
            expect(funnel.createdAt).toBeDefined();
            expect(funnel.updatedAt).toBeDefined();
        });

        it('should set default conversion window to 24 hours', () => {
            const funnel = createFunnel('Test');
            expect(funnel.conversionWindow).toBe(24);
        });

        it('should set default counting method to unique', () => {
            const funnel = createFunnel('Test');
            expect(funnel.countingMethod).toBe('unique');
        });

        it('should allow custom options', () => {
            const funnel = createFunnel('Test', {
                description: 'Test description',
                icon: '🚀',
                conversionWindow: 168,
                countingMethod: 'totals',
            });

            expect(funnel.description).toBe('Test description');
            expect(funnel.icon).toBe('🚀');
            expect(funnel.conversionWindow).toBe(168);
            expect(funnel.countingMethod).toBe('totals');
        });

        it('should allow preset steps', () => {
            const steps = [
                { id: 's1', name: 'Step 1', event: 'app_open', order: 1 },
                { id: 's2', name: 'Step 2', event: 'purchase_complete', order: 2 },
            ];

            const funnel = createFunnel('Test', { steps });

            expect(funnel.steps.length).toBe(2);
            expect(funnel.steps[0].name).toBe('Step 1');
        });
    });

    describe('createFunnelStep', () => {
        it('should create a step with required fields', () => {
            const step = createFunnelStep('Tutorial Start', 'tutorial_start', 1);

            expect(step.id).toBeDefined();
            expect(step.name).toBe('Tutorial Start');
            expect(step.event).toBe('tutorial_start');
            expect(step.order).toBe(1);
            expect(step.filters).toEqual([]);
        });

        it('should assign correct order', () => {
            const step1 = createFunnelStep('Step 1', 'event1', 1);
            const step2 = createFunnelStep('Step 2', 'event2', 2);
            const step3 = createFunnelStep('Step 3', 'event3', 3);

            expect(step1.order).toBe(1);
            expect(step2.order).toBe(2);
            expect(step3.order).toBe(3);
        });

        it('should generate unique IDs', () => {
            const step1 = createFunnelStep('Step 1', 'event1', 1);
            const step2 = createFunnelStep('Step 2', 'event2', 2);

            expect(step1.id).not.toBe(step2.id);
        });
    });

    describe('getMockFunnelResult', () => {
        it('should return result with correct funnel ID', () => {
            const funnel = createFunnel('Test', {
                steps: [
                    { id: 's1', name: 'Step 1', event: 'app_open', order: 1 },
                    { id: 's2', name: 'Step 2', event: 'purchase', order: 2 },
                ],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.funnelId).toBe(funnel.id);
        });

        it('should return results for all steps', () => {
            const funnel = createFunnel('Test', {
                steps: [
                    { id: 's1', name: 'Step 1', event: 'e1', order: 1 },
                    { id: 's2', name: 'Step 2', event: 'e2', order: 2 },
                    { id: 's3', name: 'Step 3', event: 'e3', order: 3 },
                ],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.steps.length).toBe(3);
        });

        it('should have decreasing users at each step', () => {
            const funnel = createFunnel('Test', {
                steps: [
                    { id: 's1', name: 'Step 1', event: 'e1', order: 1 },
                    { id: 's2', name: 'Step 2', event: 'e2', order: 2 },
                    { id: 's3', name: 'Step 3', event: 'e3', order: 3 },
                ],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.steps[0].users).toBeGreaterThan(result.steps[1].users);
            expect(result.steps[1].users).toBeGreaterThan(result.steps[2].users);
        });

        it('should have first step with 0 dropoff rate', () => {
            const funnel = createFunnel('Test', {
                steps: [
                    { id: 's1', name: 'Step 1', event: 'e1', order: 1 },
                    { id: 's2', name: 'Step 2', event: 'e2', order: 2 },
                ],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.steps[0].dropoffRate).toBe(0);
        });

        it('should have decreasing conversion rates', () => {
            const funnel = createFunnel('Test', {
                steps: [
                    { id: 's1', name: 'Step 1', event: 'e1', order: 1 },
                    { id: 's2', name: 'Step 2', event: 'e2', order: 2 },
                    { id: 's3', name: 'Step 3', event: 'e3', order: 3 },
                ],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.steps[0].conversionRate).toBe(100);
            expect(result.steps[1].conversionRate).toBeLessThan(100);
            expect(result.steps[2].conversionRate).toBeLessThan(result.steps[1].conversionRate);
        });

        it('should include overall conversion rate', () => {
            const funnel = createFunnel('Test', {
                steps: [
                    { id: 's1', name: 'Step 1', event: 'e1', order: 1 },
                    { id: 's2', name: 'Step 2', event: 'e2', order: 2 },
                ],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.overallConversion).toBeDefined();
            expect(result.overallConversion).toBeGreaterThan(0);
            expect(result.overallConversion).toBeLessThan(100);
        });

        it('should include median time', () => {
            const funnel = createFunnel('Test', {
                steps: [{ id: 's1', name: 'Step 1', event: 'e1', order: 1 }],
            });

            const result = getMockFunnelResult(funnel);

            expect(result.medianTime).toBeDefined();
            expect(result.medianTime).toBeGreaterThan(0);
        });
    });

    describe('COMMON_EVENTS', () => {
        it('should have lifecycle events', () => {
            const lifecycleEvents = COMMON_EVENTS.filter(e => e.category === 'lifecycle');
            expect(lifecycleEvents.length).toBeGreaterThan(0);
        });

        it('should have onboarding events', () => {
            const onboardingEvents = COMMON_EVENTS.filter(e => e.category === 'onboarding');
            expect(onboardingEvents.length).toBeGreaterThan(0);
        });

        it('should have gameplay events', () => {
            const gameplayEvents = COMMON_EVENTS.filter(e => e.category === 'gameplay');
            expect(gameplayEvents.length).toBeGreaterThan(0);
        });

        it('should have monetization events', () => {
            const monetizationEvents = COMMON_EVENTS.filter(e => e.category === 'monetization');
            expect(monetizationEvents.length).toBeGreaterThan(0);
        });

        it('should have value, label, and category for all events', () => {
            COMMON_EVENTS.forEach(event => {
                expect(event.value).toBeDefined();
                expect(event.label).toBeDefined();
                expect(event.category).toBeDefined();
            });
        });
    });

    describe('FILTER_OPERATORS', () => {
        it('should have 5 operators', () => {
            expect(FILTER_OPERATORS.length).toBe(5);
        });

        it('should include all standard operators', () => {
            const values = FILTER_OPERATORS.map(o => o.value);

            expect(values).toContain('equals');
            expect(values).toContain('not_equals');
            expect(values).toContain('contains');
            expect(values).toContain('greater_than');
            expect(values).toContain('less_than');
        });
    });
});
