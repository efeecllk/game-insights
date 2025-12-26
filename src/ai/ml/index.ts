/**
 * ML Models Index
 * Phase 5: Advanced AI & Automation
 */

// Types
export * from './types';

// Models
export { RetentionPredictor, retentionPredictor } from './RetentionPredictor';
export { ChurnPredictor, churnPredictor } from './ChurnPredictor';
export { LTVPredictor, ltvPredictor } from './LTVPredictor';
export { RevenueForecaster, revenueForecaster } from './RevenueForecaster';
export { AnomalyModel, anomalyModel } from './AnomalyModel';
export { SegmentationModel, segmentationModel } from './SegmentationModel';

// ============================================================================
// Unified ML Service
// ============================================================================

import { retentionPredictor } from './RetentionPredictor';
import { churnPredictor } from './ChurnPredictor';
import { ltvPredictor } from './LTVPredictor';
import { revenueForecaster } from './RevenueForecaster';
import { anomalyModel } from './AnomalyModel';
import { segmentationModel } from './SegmentationModel';

/**
 * Initialize all ML models
 */
export async function initializeMLModels(): Promise<void> {
    await Promise.all([
        retentionPredictor.initialize(),
        churnPredictor.initialize(),
        ltvPredictor.initialize(),
        revenueForecaster.initialize(),
        anomalyModel.initialize(),
        segmentationModel.initialize(),
    ]);
}

/**
 * Get all model metrics
 */
export function getModelMetrics(): Record<string, unknown> {
    return {
        retention: retentionPredictor.metrics,
        churn: churnPredictor.metrics,
        ltv: ltvPredictor.metrics,
        revenue: revenueForecaster.metrics,
        anomaly: anomalyModel.metrics,
        segmentation: segmentationModel.metrics,
    };
}
