/**
 * Experiment Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import {
    calculateSampleSize,
    calculateBayesianProbability,
    createExperiment,
    createVariant,
} from '../../../src/lib/experimentStore';

describe('experimentStore', () => {
    describe('calculateSampleSize', () => {
        it('should calculate sample size with default parameters', () => {
            const result = calculateSampleSize(0.10, 0.02); // 10% baseline, 2% MDE

            expect(result.perVariant).toBeGreaterThan(0);
            expect(result.total).toBe(result.perVariant * 2);
        });

        it('should require larger sample for smaller effect size', () => {
            const smallEffect = calculateSampleSize(0.10, 0.01);
            const largeEffect = calculateSampleSize(0.10, 0.05);

            expect(smallEffect.perVariant).toBeGreaterThan(largeEffect.perVariant);
        });

        it('should require larger sample for higher power', () => {
            const lowPower = calculateSampleSize(0.10, 0.02, 0.7);
            const highPower = calculateSampleSize(0.10, 0.02, 0.9);

            expect(highPower.perVariant).toBeGreaterThan(lowPower.perVariant);
        });

        it('should require larger sample for higher significance level', () => {
            const lowSig = calculateSampleSize(0.10, 0.02, 0.8, 0.10);
            const highSig = calculateSampleSize(0.10, 0.02, 0.8, 0.01);

            expect(highSig.perVariant).toBeGreaterThan(lowSig.perVariant);
        });
    });

    describe('calculateBayesianProbability', () => {
        it('should return approximately equal probabilities for equal rates', () => {
            const result = calculateBayesianProbability(100, 1000, 100, 1000, 1000);

            // With equal conversion rates, probabilities should be close to 50%
            expect(result.controlProbability).toBeGreaterThan(0.4);
            expect(result.controlProbability).toBeLessThan(0.6);
            expect(result.treatmentProbability).toBeGreaterThan(0.4);
            expect(result.treatmentProbability).toBeLessThan(0.6);
        });

        it('should favor treatment when it has higher conversion', () => {
            const result = calculateBayesianProbability(100, 1000, 200, 1000, 1000);

            expect(result.treatmentProbability).toBeGreaterThan(result.controlProbability);
        });

        it('should favor control when it has higher conversion', () => {
            const result = calculateBayesianProbability(200, 1000, 100, 1000, 1000);

            expect(result.controlProbability).toBeGreaterThan(result.treatmentProbability);
        });

        it('should sum to approximately 1', () => {
            const result = calculateBayesianProbability(100, 1000, 150, 1000, 1000);

            expect(result.controlProbability + result.treatmentProbability).toBeCloseTo(1, 1);
        });
    });

    describe('createExperiment', () => {
        it('should create experiment with required fields', () => {
            const experiment = createExperiment('Test Experiment', 'Test description');

            expect(experiment.id).toBeDefined();
            expect(experiment.name).toBe('Test Experiment');
            expect(experiment.description).toBe('Test description');
            expect(experiment.status).toBe('draft');
            expect(experiment.createdAt).toBeDefined();
        });

        it('should create with default control and treatment variants', () => {
            const experiment = createExperiment('Test', 'Description');

            expect(experiment.variants.length).toBe(2);
            expect(experiment.variants.find(v => v.isControl)).toBeDefined();
            expect(experiment.variants.find(v => !v.isControl)).toBeDefined();
        });

        it('should set default type to ab', () => {
            const experiment = createExperiment('Test', 'Desc');
            expect(experiment.type).toBe('ab');
        });

        it('should allow custom type', () => {
            const experiment = createExperiment('Test', 'Desc', {
                type: 'multivariate',
            });
            expect(experiment.type).toBe('multivariate');
        });

        it('should set default traffic allocation to 100%', () => {
            const experiment = createExperiment('Test', 'Desc');
            expect(experiment.trafficAllocation).toBe(100);
        });

        it('should allow custom traffic allocation', () => {
            const experiment = createExperiment('Test', 'Desc', {
                trafficAllocation: 50,
            });
            expect(experiment.trafficAllocation).toBe(50);
        });

        it('should set default statistical parameters', () => {
            const experiment = createExperiment('Test', 'Desc');

            expect(experiment.statisticalPower).toBe(0.8);
            expect(experiment.significanceLevel).toBe(0.05);
        });

        it('should allow custom hypothesis', () => {
            const experiment = createExperiment('Test', 'Desc', {
                hypothesis: 'New button color increases clicks',
            });
            expect(experiment.hypothesis).toBe('New button color increases clicks');
        });
    });

    describe('createVariant', () => {
        it('should create variant with required fields', () => {
            const variant = createVariant('Control', 'Original version', 50, true);

            expect(variant.id).toBeDefined();
            expect(variant.name).toBe('Control');
            expect(variant.description).toBe('Original version');
            expect(variant.trafficPercent).toBe(50);
            expect(variant.isControl).toBe(true);
        });

        it('should default isControl to false', () => {
            const variant = createVariant('Treatment', 'New version', 50);
            expect(variant.isControl).toBe(false);
        });

        it('should allow custom traffic percent', () => {
            const variant = createVariant('Test', 'Test', 30);
            expect(variant.trafficPercent).toBe(30);
        });

        it('should generate unique IDs', () => {
            const v1 = createVariant('V1', 'Desc 1', 50);
            const v2 = createVariant('V2', 'Desc 2', 50);

            expect(v1.id).not.toBe(v2.id);
        });
    });
});
