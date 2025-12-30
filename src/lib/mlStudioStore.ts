/**
 * ML Studio Store
 * IndexedDB storage for training jobs and deployed models
 */

import { getDatabase, generateId } from './db';
import type {
    TrainingJob,
    DeployedModel,
    TrainingConfig,
    FeatureConfig,
    TrainingLogEntry,
    TrainingMetrics,
    ModelType,
    ModelStatus,
} from '../ai/studio/types';

// ============================================================================
// Database Helpers
// ============================================================================

async function getTrainingJobsStore(mode: IDBTransactionMode = 'readwrite') {
    const db = await getDatabase();
    return db.transaction('trainingJobs', mode).objectStore('trainingJobs');
}

async function getModelsStore(mode: IDBTransactionMode = 'readwrite') {
    const db = await getDatabase();
    return db.transaction('deployedModels', mode).objectStore('deployedModels');
}

// ============================================================================
// Training Jobs CRUD
// ============================================================================

/**
 * Create a new training job
 */
export async function createTrainingJob(
    name: string,
    modelType: ModelType,
    features: FeatureConfig[],
    config: Partial<TrainingConfig>,
    dataSourceId?: string
): Promise<TrainingJob> {
    const job: TrainingJob = {
        id: generateId(),
        name,
        modelType,
        status: 'draft',
        createdAt: new Date().toISOString(),
        features,
        config: {
            modelType,
            algorithm: 'gradient_boosting',
            trainSplit: 0.8,
            crossValidation: true,
            cvFolds: 5,
            randomSeed: 42,
            hyperparameters: {},
            ...config,
        },
        dataSourceId,
        progress: 0,
        logs: [],
    };

    const store = await getTrainingJobsStore();
    await store.add(job);

    return job;
}

/**
 * Get all training jobs
 */
export async function getAllTrainingJobs(): Promise<TrainingJob[]> {
    const store = await getTrainingJobsStore();
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a training job by ID
 */
export async function getTrainingJob(id: string): Promise<TrainingJob | undefined> {
    const store = await getTrainingJobsStore();
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update a training job
 */
export async function updateTrainingJob(job: TrainingJob): Promise<void> {
    const store = await getTrainingJobsStore();
    await store.put(job);
}

/**
 * Delete a training job
 */
export async function deleteTrainingJob(id: string): Promise<void> {
    const store = await getTrainingJobsStore();
    await store.delete(id);
}

/**
 * Update training job status
 */
export async function updateTrainingJobStatus(
    id: string,
    status: ModelStatus,
    error?: string
): Promise<TrainingJob | null> {
    const job = await getTrainingJob(id);
    if (!job) return null;

    job.status = status;
    if (error) job.error = error;

    if (status === 'training') {
        job.startedAt = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date().toISOString();
        if (job.startedAt) {
            job.trainingTime = Math.round(
                (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000
            );
        }
    }

    await updateTrainingJob(job);
    return job;
}

/**
 * Update training job progress
 */
export async function updateTrainingProgress(
    id: string,
    progress: number,
    currentEpoch?: number,
    totalEpochs?: number,
    metrics?: Partial<TrainingMetrics>
): Promise<TrainingJob | null> {
    const job = await getTrainingJob(id);
    if (!job) return null;

    job.progress = progress;
    if (currentEpoch !== undefined) job.currentEpoch = currentEpoch;
    if (totalEpochs !== undefined) job.totalEpochs = totalEpochs;
    if (metrics) {
        job.metrics = { ...job.metrics, ...metrics };
    }

    await updateTrainingJob(job);
    return job;
}

/**
 * Add a log entry to training job
 */
export async function addTrainingLog(
    id: string,
    level: TrainingLogEntry['level'],
    message: string,
    data?: Record<string, unknown>
): Promise<void> {
    const job = await getTrainingJob(id);
    if (!job) return;

    job.logs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
    });

    // Keep only last 1000 logs
    if (job.logs.length > 1000) {
        job.logs = job.logs.slice(-1000);
    }

    await updateTrainingJob(job);
}

// ============================================================================
// Deployed Models CRUD
// ============================================================================

/**
 * Deploy a model from a training job
 */
export async function deployModel(
    job: TrainingJob,
    name?: string,
    description?: string,
    modelData?: string
): Promise<DeployedModel> {
    if (job.status !== 'completed' || !job.metrics) {
        throw new Error('Cannot deploy an incomplete training job');
    }

    // Get existing versions for this model type
    const existingModels = await getModelsByType(job.modelType);
    const maxVersion = existingModels.reduce((max, m) => Math.max(max, m.version), 0);

    const model: DeployedModel = {
        id: generateId(),
        name: name || job.name,
        description: description || job.description,
        modelType: job.modelType,
        algorithm: job.config.algorithm,
        version: maxVersion + 1,
        trainingJobId: job.id,
        deployedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        features: job.features,
        config: job.config,
        metrics: job.metrics,
        modelData,
        usageStats: {
            totalPredictions: 0,
        },
    };

    // Deactivate other versions
    for (const existing of existingModels) {
        if (existing.isActive) {
            existing.isActive = false;
            await updateDeployedModel(existing);
        }
    }

    const store = await getModelsStore();
    await store.add(model);

    // Update training job status
    await updateTrainingJobStatus(job.id, 'deployed');

    return model;
}

/**
 * Get all deployed models
 */
export async function getAllDeployedModels(): Promise<DeployedModel[]> {
    const store = await getModelsStore();
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a deployed model by ID
 */
export async function getDeployedModel(id: string): Promise<DeployedModel | undefined> {
    const store = await getModelsStore();
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get models by type
 */
export async function getModelsByType(modelType: ModelType): Promise<DeployedModel[]> {
    const models = await getAllDeployedModels();
    return models.filter(m => m.modelType === modelType);
}

/**
 * Get active model by type
 */
export async function getActiveModel(modelType: ModelType): Promise<DeployedModel | undefined> {
    const models = await getModelsByType(modelType);
    return models.find(m => m.isActive);
}

/**
 * Update a deployed model
 */
export async function updateDeployedModel(model: DeployedModel): Promise<void> {
    const store = await getModelsStore();
    await store.put(model);
}

/**
 * Delete a deployed model
 */
export async function deleteDeployedModel(id: string): Promise<void> {
    const store = await getModelsStore();
    await store.delete(id);
}

/**
 * Activate a model version
 */
export async function activateModelVersion(id: string): Promise<void> {
    const model = await getDeployedModel(id);
    if (!model) return;

    // Deactivate other versions of same type
    const sameTypeModels = await getModelsByType(model.modelType);
    for (const m of sameTypeModels) {
        if (m.id !== id && m.isActive) {
            m.isActive = false;
            await updateDeployedModel(m);
        }
    }

    model.isActive = true;
    await updateDeployedModel(model);
}

/**
 * Record a prediction
 */
export async function recordPrediction(modelId: string, latencyMs: number): Promise<void> {
    const model = await getDeployedModel(modelId);
    if (!model) return;

    model.usageStats.totalPredictions += 1;
    model.usageStats.lastUsed = new Date().toISOString();

    // Update rolling average latency
    if (model.usageStats.avgLatencyMs === undefined) {
        model.usageStats.avgLatencyMs = latencyMs;
    } else {
        // Exponential moving average
        model.usageStats.avgLatencyMs = model.usageStats.avgLatencyMs * 0.9 + latencyMs * 0.1;
    }

    await updateDeployedModel(model);
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

export interface MLStudioStats {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    runningJobs: number;
    totalModels: number;
    activeModels: number;
    totalPredictions: number;
    avgTrainingTime: number;
    jobsByType: Record<ModelType, number>;
    modelsByType: Record<ModelType, number>;
}

/**
 * Get ML Studio statistics
 */
export async function getMLStudioStats(): Promise<MLStudioStats> {
    const jobs = await getAllTrainingJobs();
    const models = await getAllDeployedModels();

    const stats: MLStudioStats = {
        totalJobs: jobs.length,
        completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'deployed').length,
        failedJobs: jobs.filter(j => j.status === 'failed').length,
        runningJobs: jobs.filter(j => j.status === 'training').length,
        totalModels: models.length,
        activeModels: models.filter(m => m.isActive).length,
        totalPredictions: models.reduce((sum, m) => sum + m.usageStats.totalPredictions, 0),
        avgTrainingTime: 0,
        jobsByType: {} as Record<ModelType, number>,
        modelsByType: {} as Record<ModelType, number>,
    };

    // Calculate average training time
    const completedJobs = jobs.filter(j => j.trainingTime);
    if (completedJobs.length > 0) {
        stats.avgTrainingTime = completedJobs.reduce((sum, j) => sum + (j.trainingTime || 0), 0) / completedJobs.length;
    }

    // Count by type
    for (const job of jobs) {
        stats.jobsByType[job.modelType] = (stats.jobsByType[job.modelType] || 0) + 1;
    }
    for (const model of models) {
        stats.modelsByType[model.modelType] = (stats.modelsByType[model.modelType] || 0) + 1;
    }

    return stats;
}

// ============================================================================
// Sample Data
// ============================================================================

/**
 * Initialize sample training jobs for demo
 */
export async function initializeSampleJobs(): Promise<void> {
    const jobs = await getAllTrainingJobs();
    if (jobs.length > 0) return;

    // Create a sample completed job
    const sampleJob = await createTrainingJob(
        'Churn Prediction v1',
        'churn',
        [
            { name: 'days_since_last_session', type: 'numeric', role: 'feature', missingStrategy: 'median', scaling: 'standard' },
            { name: 'total_sessions', type: 'numeric', role: 'feature', missingStrategy: 'zero', scaling: 'minmax' },
            { name: 'total_purchases', type: 'numeric', role: 'feature', missingStrategy: 'zero', scaling: 'standard' },
            { name: 'avg_session_length', type: 'numeric', role: 'feature', missingStrategy: 'mean', scaling: 'standard' },
            { name: 'country', type: 'categorical', role: 'feature', missingStrategy: 'mode', encoding: 'onehot' },
            { name: 'churned', type: 'numeric', role: 'target', missingStrategy: 'drop' },
        ],
        {
            algorithm: 'gradient_boosting',
            hyperparameters: {
                n_estimators: 100,
                max_depth: 6,
                learning_rate: 0.1,
            },
        }
    );

    // Update to completed status with metrics
    sampleJob.status = 'completed';
    sampleJob.startedAt = new Date(Date.now() - 120000).toISOString();
    sampleJob.completedAt = new Date().toISOString();
    sampleJob.trainingTime = 120;
    sampleJob.progress = 100;
    sampleJob.currentEpoch = 100;
    sampleJob.totalEpochs = 100;
    sampleJob.metrics = {
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.82,
        f1Score: 0.835,
        aucRoc: 0.91,
        confusionMatrix: [[850, 50], [80, 320]],
        lossHistory: Array.from({ length: 20 }, (_, i) => 0.5 * Math.exp(-0.1 * i) + 0.1),
        valLossHistory: Array.from({ length: 20 }, (_, i) => 0.55 * Math.exp(-0.09 * i) + 0.12),
    };
    sampleJob.features = sampleJob.features.map((f, i) => ({
        ...f,
        importance: [0.35, 0.25, 0.20, 0.12, 0.08][i] || 0,
    }));
    sampleJob.logs = [
        { timestamp: sampleJob.startedAt!, level: 'info', message: 'Training started' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Epoch 50/100 completed', data: { loss: 0.15 } },
        { timestamp: sampleJob.completedAt!, level: 'info', message: 'Training completed successfully' },
    ];

    await updateTrainingJob(sampleJob);
}
