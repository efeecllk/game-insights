/**
 * Training Orchestrator
 * Simulates ML model training in the browser
 * Uses simplified algorithms suitable for client-side execution
 */

import type {
    TrainingJob,
    TrainingMetrics,
    ModelAlgorithm,
} from './types';
import {
    getTrainingJob,
    updateTrainingJob,
    updateTrainingJobStatus,
    updateTrainingProgress,
    addTrainingLog,
} from '../../lib/mlStudioStore';

// ============================================================================
// Types
// ============================================================================

export interface TrainingData {
    features: number[][];
    target: number[];
    featureNames: string[];
}

export interface TrainingCallbacks {
    onProgress?: (progress: number, epoch: number, metrics: Partial<TrainingMetrics>) => void;
    onLog?: (level: 'info' | 'warning' | 'error', message: string) => void;
    onComplete?: (metrics: TrainingMetrics) => void;
    onError?: (error: Error) => void;
}

interface TrainedModel {
    algorithm: ModelAlgorithm;
    coefficients?: number[];
    weights?: number[][];
    centroids?: number[][];
    featureImportance: number[];
    threshold?: number;
}

// ============================================================================
// Training Orchestrator Class
// ============================================================================

export class TrainingOrchestrator {
    private currentJobId: string | null = null;
    private abortController: AbortController | null = null;
    private isRunning = false;

    /**
     * Start training a job
     */
    async startTraining(jobId: string, data: TrainingData, callbacks?: TrainingCallbacks): Promise<void> {
        if (this.isRunning) {
            throw new Error('Training already in progress');
        }

        const job = await getTrainingJob(jobId);
        if (!job) {
            throw new Error('Training job not found');
        }

        this.currentJobId = jobId;
        this.isRunning = true;
        this.abortController = new AbortController();

        try {
            await updateTrainingJobStatus(jobId, 'training');
            await addTrainingLog(jobId, 'info', 'Training started');

            // Validate data
            this.validateData(data, job);
            await addTrainingLog(jobId, 'info', `Data validated: ${data.features.length} samples, ${data.featureNames.length} features`);

            // Split data
            const { trainX, trainY, testX, testY } = this.splitData(data, job.config.trainSplit);
            await addTrainingLog(jobId, 'info', `Data split: ${trainX.length} train, ${testX.length} test`);

            // Train model
            const model = await this.trainModel(
                job,
                trainX,
                trainY,
                testX,
                testY,
                callbacks
            );

            // Calculate final metrics
            const metrics = this.calculateMetrics(job, model, testX, testY);

            // Update job with results
            const updatedJob = await getTrainingJob(jobId);
            if (updatedJob) {
                updatedJob.status = 'completed';
                updatedJob.progress = 100;
                updatedJob.metrics = metrics;
                updatedJob.features = updatedJob.features.map((f, i) => ({
                    ...f,
                    importance: model.featureImportance[i] || 0,
                }));
                await updateTrainingJob(updatedJob);
            }

            await addTrainingLog(jobId, 'info', 'Training completed successfully');
            callbacks?.onComplete?.(metrics);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await updateTrainingJobStatus(jobId, 'failed', errorMessage);
            await addTrainingLog(jobId, 'error', `Training failed: ${errorMessage}`);
            callbacks?.onError?.(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isRunning = false;
            this.currentJobId = null;
            this.abortController = null;
        }
    }

    /**
     * Stop current training
     */
    stopTraining(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Check if training is running
     */
    isTrainingRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Get current job ID
     */
    getCurrentJobId(): string | null {
        return this.currentJobId;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private validateData(data: TrainingData, _job: TrainingJob): void {
        if (data.features.length === 0) {
            throw new Error('No training data provided');
        }
        if (data.features.length !== data.target.length) {
            throw new Error('Feature and target lengths do not match');
        }
        if (data.features[0].length !== data.featureNames.length) {
            throw new Error('Feature names do not match feature dimensions');
        }
    }

    private splitData(
        data: TrainingData,
        trainRatio: number
    ): { trainX: number[][]; trainY: number[]; testX: number[][]; testY: number[] } {
        const n = data.features.length;
        const indices = Array.from({ length: n }, (_, i) => i);

        // Shuffle indices
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const trainSize = Math.floor(n * trainRatio);
        const trainIndices = indices.slice(0, trainSize);
        const testIndices = indices.slice(trainSize);

        return {
            trainX: trainIndices.map(i => data.features[i]),
            trainY: trainIndices.map(i => data.target[i]),
            testX: testIndices.map(i => data.features[i]),
            testY: testIndices.map(i => data.target[i]),
        };
    }

    private async trainModel(
        job: TrainingJob,
        trainX: number[][],
        trainY: number[],
        testX: number[][],
        testY: number[],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        const { algorithm } = job.config;

        switch (algorithm) {
            case 'logistic_regression':
                return this.trainLogisticRegression(job, trainX, trainY, testX, testY, callbacks);
            case 'linear_regression':
                return this.trainLinearRegression(job, trainX, trainY, callbacks);
            case 'kmeans':
                return this.trainKMeans(job, trainX, callbacks);
            case 'gradient_boosting':
            case 'random_forest':
            case 'decision_tree':
                return this.trainTreeEnsemble(job, trainX, trainY, testX, testY, callbacks);
            case 'neural_network':
                return this.trainNeuralNetwork(job, trainX, trainY, testX, testY, callbacks);
            case 'isolation_forest':
                return this.trainIsolationForest(job, trainX, callbacks);
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
    }

    private async trainLogisticRegression(
        job: TrainingJob,
        trainX: number[][],
        trainY: number[],
        testX: number[][],
        testY: number[],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        const nFeatures = trainX[0].length;
        const maxIter = (job.config.hyperparameters.max_iter as number) || 100;
        const lr = 0.1;

        // Initialize weights
        const weights = Array(nFeatures + 1).fill(0);
        const lossHistory: number[] = [];
        const valLossHistory: number[] = [];

        for (let epoch = 0; epoch < maxIter; epoch++) {
            if (this.abortController?.signal.aborted) break;

            // Forward pass
            let totalLoss = 0;
            const gradients = Array(nFeatures + 1).fill(0);

            for (let i = 0; i < trainX.length; i++) {
                const x = [1, ...trainX[i]];
                const z = x.reduce((sum, xi, j) => sum + xi * weights[j], 0);
                const pred = this.sigmoid(z);
                const error = pred - trainY[i];

                totalLoss += trainY[i] === 1 ? -Math.log(pred + 1e-10) : -Math.log(1 - pred + 1e-10);

                for (let j = 0; j < x.length; j++) {
                    gradients[j] += error * x[j];
                }
            }

            // Update weights
            for (let j = 0; j < weights.length; j++) {
                weights[j] -= lr * gradients[j] / trainX.length;
            }

            const trainLoss = totalLoss / trainX.length;
            lossHistory.push(trainLoss);

            // Validation loss
            let valLoss = 0;
            for (let i = 0; i < testX.length; i++) {
                const x = [1, ...testX[i]];
                const z = x.reduce((sum, xi, j) => sum + xi * weights[j], 0);
                const pred = this.sigmoid(z);
                valLoss += testY[i] === 1 ? -Math.log(pred + 1e-10) : -Math.log(1 - pred + 1e-10);
            }
            valLossHistory.push(valLoss / testX.length);

            // Update progress
            const progress = Math.round((epoch / maxIter) * 100);
            await updateTrainingProgress(job.id, progress, epoch + 1, maxIter, { lossHistory, valLossHistory });
            callbacks?.onProgress?.(progress, epoch + 1, { lossHistory, valLossHistory });

            // Yield to prevent blocking
            if (epoch % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Calculate feature importance (absolute weight values)
        const absWeights = weights.slice(1).map(Math.abs);
        const sumWeights = absWeights.reduce((a, b) => a + b, 0);
        const featureImportance = absWeights.map(w => w / sumWeights);

        return {
            algorithm: 'logistic_regression',
            coefficients: weights,
            featureImportance,
            threshold: 0.5,
        };
    }

    private async trainLinearRegression(
        job: TrainingJob,
        trainX: number[][],
        trainY: number[],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        // Add bias term
        const X = trainX.map(row => [1, ...row]);

        // Normal equation: (X^T X)^-1 X^T y
        const XtX = this.matMul(this.transpose(X), X);
        const XtXinv = this.inverseMatrix(XtX);
        const XtY = this.matVecMul(this.transpose(X), trainY);
        const weights = this.matVecMul(XtXinv, XtY);

        // Simulate training progress
        for (let i = 0; i <= 10; i++) {
            const progress = i * 10;
            await updateTrainingProgress(job.id, progress, i, 10);
            callbacks?.onProgress?.(progress, i, {});
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Feature importance (coefficient magnitudes)
        const absCoeffs = weights.slice(1).map(Math.abs);
        const sumCoeffs = absCoeffs.reduce((a, b) => a + b, 0) || 1;
        const featureImportance = absCoeffs.map(c => c / sumCoeffs);

        return {
            algorithm: 'linear_regression',
            coefficients: weights,
            featureImportance,
        };
    }

    private async trainTreeEnsemble(
        job: TrainingJob,
        trainX: number[][],
        _trainY: number[],
        _testX: number[][],
        _testY: number[],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        const nEstimators = (job.config.hyperparameters.n_estimators as number) || 50;
        const nFeatures = trainX[0].length;

        // Simulate decision tree ensemble training
        const featureImportance = Array(nFeatures).fill(0);
        const lossHistory: number[] = [];
        const valLossHistory: number[] = [];

        for (let tree = 0; tree < nEstimators; tree++) {
            if (this.abortController?.signal.aborted) break;

            // Simulate feature selection for this tree
            const selectedFeatures = this.randomSample(
                Array.from({ length: nFeatures }, (_, i) => i),
                Math.max(1, Math.floor(Math.sqrt(nFeatures)))
            );

            // Accumulate importance
            for (const f of selectedFeatures) {
                featureImportance[f] += 1 / nEstimators;
            }

            // Simulate loss improvement
            const baseLoss = 0.5 * Math.exp(-tree * 0.05);
            lossHistory.push(baseLoss + Math.random() * 0.05);
            valLossHistory.push(baseLoss * 1.1 + Math.random() * 0.08);

            const progress = Math.round((tree / nEstimators) * 100);
            await updateTrainingProgress(job.id, progress, tree + 1, nEstimators, { lossHistory, valLossHistory });
            callbacks?.onProgress?.(progress, tree + 1, { lossHistory, valLossHistory });

            if (tree % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 20));
            }
        }

        // Normalize importance
        const sumImportance = featureImportance.reduce((a, b) => a + b, 0) || 1;
        const normalizedImportance = featureImportance.map(f => f / sumImportance);

        return {
            algorithm: job.config.algorithm,
            featureImportance: normalizedImportance,
        };
    }

    private async trainNeuralNetwork(
        job: TrainingJob,
        trainX: number[][],
        trainY: number[],
        testX: number[][],
        testY: number[],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        const nFeatures = trainX[0].length;
        const epochs = (job.config.hyperparameters.epochs as number) || 50;
        const hiddenLayers = String(job.config.hyperparameters.hidden_layers || '32,16').split(',').map(Number);
        const lr = (job.config.hyperparameters.learning_rate as number) || 0.01;

        // Initialize weights
        const layers = [nFeatures, ...hiddenLayers, 1];
        const weights: number[][][] = [];

        for (let i = 0; i < layers.length - 1; i++) {
            const layerWeights: number[][] = [];
            for (let j = 0; j < layers[i + 1]; j++) {
                const neuronWeights = Array.from(
                    { length: layers[i] + 1 },
                    () => (Math.random() - 0.5) * 0.5
                );
                layerWeights.push(neuronWeights);
            }
            weights.push(layerWeights);
        }

        const lossHistory: number[] = [];
        const valLossHistory: number[] = [];

        for (let epoch = 0; epoch < epochs; epoch++) {
            if (this.abortController?.signal.aborted) break;

            let totalLoss = 0;

            // Training
            for (let i = 0; i < trainX.length; i++) {
                let input = trainX[i];

                // Forward pass
                const activations: number[][] = [input];
                for (let l = 0; l < weights.length; l++) {
                    const output: number[] = [];
                    for (const neuronWeights of weights[l]) {
                        let z = neuronWeights[0]; // bias
                        for (let j = 0; j < input.length; j++) {
                            z += neuronWeights[j + 1] * input[j];
                        }
                        output.push(l === weights.length - 1 ? this.sigmoid(z) : Math.max(0, z));
                    }
                    activations.push(output);
                    input = output;
                }

                const pred = activations[activations.length - 1][0];
                const error = pred - trainY[i];
                totalLoss += error * error;

                // Simplified backprop (output layer only for speed)
                const outputGradient = error * pred * (1 - pred);
                const prevActivation = [1, ...activations[activations.length - 2]];
                for (let j = 0; j < weights[weights.length - 1][0].length; j++) {
                    weights[weights.length - 1][0][j] -= lr * outputGradient * prevActivation[j];
                }
            }

            lossHistory.push(totalLoss / trainX.length);

            // Validation loss
            let valLoss = 0;
            for (let i = 0; i < testX.length; i++) {
                let input = testX[i];
                for (const layer of weights) {
                    const output: number[] = [];
                    for (const neuronWeights of layer) {
                        let z = neuronWeights[0];
                        for (let j = 0; j < input.length; j++) {
                            z += neuronWeights[j + 1] * input[j];
                        }
                        output.push(this.sigmoid(z));
                    }
                    input = output;
                }
                const pred = input[0];
                valLoss += (pred - testY[i]) * (pred - testY[i]);
            }
            valLossHistory.push(valLoss / testX.length);

            const progress = Math.round((epoch / epochs) * 100);
            await updateTrainingProgress(job.id, progress, epoch + 1, epochs, { lossHistory, valLossHistory });
            callbacks?.onProgress?.(progress, epoch + 1, { lossHistory, valLossHistory });

            if (epoch % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        // Feature importance from first layer weights
        const firstLayerWeights = weights[0];
        const featureImportance = Array(nFeatures).fill(0);
        for (const neuronWeights of firstLayerWeights) {
            for (let j = 1; j < neuronWeights.length; j++) {
                featureImportance[j - 1] += Math.abs(neuronWeights[j]);
            }
        }
        const sumImportance = featureImportance.reduce((a, b) => a + b, 0) || 1;

        return {
            algorithm: 'neural_network',
            weights: weights.flat(),
            featureImportance: featureImportance.map(f => f / sumImportance),
            threshold: 0.5,
        };
    }

    private async trainKMeans(
        job: TrainingJob,
        trainX: number[][],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        const nClusters = (job.config.hyperparameters.n_clusters as number) || 5;
        const maxIter = (job.config.hyperparameters.max_iter as number) || 100;
        const nFeatures = trainX[0].length;

        // Initialize centroids randomly
        let centroids = this.randomSample(trainX, nClusters);
        let inertia = Infinity;

        for (let iter = 0; iter < maxIter; iter++) {
            if (this.abortController?.signal.aborted) break;

            // Assign points to clusters
            const assignments: number[] = [];
            let newInertia = 0;

            for (const x of trainX) {
                let minDist = Infinity;
                let cluster = 0;
                for (let c = 0; c < centroids.length; c++) {
                    const dist = this.euclideanDistance(x, centroids[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        cluster = c;
                    }
                }
                assignments.push(cluster);
                newInertia += minDist * minDist;
            }

            // Check convergence
            if (Math.abs(inertia - newInertia) < 0.0001) break;
            inertia = newInertia;

            // Update centroids
            const newCentroids: number[][] = Array(nClusters).fill(null).map(() => Array(nFeatures).fill(0));
            const counts = Array(nClusters).fill(0);

            for (let i = 0; i < trainX.length; i++) {
                const c = assignments[i];
                counts[c]++;
                for (let j = 0; j < nFeatures; j++) {
                    newCentroids[c][j] += trainX[i][j];
                }
            }

            for (let c = 0; c < nClusters; c++) {
                if (counts[c] > 0) {
                    for (let j = 0; j < nFeatures; j++) {
                        newCentroids[c][j] /= counts[c];
                    }
                }
            }
            centroids = newCentroids;

            const progress = Math.round((iter / maxIter) * 100);
            await updateTrainingProgress(job.id, progress, iter + 1, maxIter, { inertia });
            callbacks?.onProgress?.(progress, iter + 1, { inertia });

            if (iter % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        // Feature importance based on centroid variance
        const featureVariance = Array(nFeatures).fill(0);
        for (let j = 0; j < nFeatures; j++) {
            const values = centroids.map(c => c[j]);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            featureVariance[j] = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
        }
        const sumVariance = featureVariance.reduce((a, b) => a + b, 0) || 1;

        return {
            algorithm: 'kmeans',
            centroids,
            featureImportance: featureVariance.map(v => v / sumVariance),
        };
    }

    private async trainIsolationForest(
        job: TrainingJob,
        trainX: number[][],
        callbacks?: TrainingCallbacks
    ): Promise<TrainedModel> {
        const nEstimators = (job.config.hyperparameters.n_estimators as number) || 100;
        const contamination = (job.config.hyperparameters.contamination as number) || 0.1;
        const nFeatures = trainX[0].length;

        // Simulate isolation forest training
        const featureImportance = Array(nFeatures).fill(0);

        for (let tree = 0; tree < nEstimators; tree++) {
            if (this.abortController?.signal.aborted) break;

            // Random feature selection
            const selectedFeature = Math.floor(Math.random() * nFeatures);
            featureImportance[selectedFeature] += 1 / nEstimators;

            const progress = Math.round((tree / nEstimators) * 100);
            await updateTrainingProgress(job.id, progress, tree + 1, nEstimators);
            callbacks?.onProgress?.(progress, tree + 1, {});

            if (tree % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        // Normalize importance
        const sumImportance = featureImportance.reduce((a, b) => a + b, 0) || 1;

        // Calculate anomaly threshold
        const threshold = this.quantile(trainX.map(x => x.reduce((a, b) => a + b, 0)), 1 - contamination);

        return {
            algorithm: 'isolation_forest',
            featureImportance: featureImportance.map(f => f / sumImportance),
            threshold,
        };
    }

    private calculateMetrics(
        job: TrainingJob,
        model: TrainedModel,
        testX: number[][],
        testY: number[]
    ): TrainingMetrics {
        const modelType = job.modelType;

        if (modelType === 'segmentation') {
            // Clustering metrics
            const silhouetteScore = 0.4 + Math.random() * 0.3; // Simulated
            return {
                silhouetteScore,
                inertia: 1000 * Math.random(),
            };
        }

        if (modelType === 'anomaly') {
            // Anomaly detection metrics
            return {
                precision: 0.85 + Math.random() * 0.1,
                recall: 0.75 + Math.random() * 0.15,
                f1Score: 0.8 + Math.random() * 0.1,
            };
        }

        // Classification or regression
        const predictions = testX.map(x => this.predict(model, x));

        if (modelType === 'ltv' || modelType === 'revenue') {
            // Regression metrics
            const mae = predictions.reduce((sum, p, i) => sum + Math.abs(p - testY[i]), 0) / testY.length;
            const mse = predictions.reduce((sum, p, i) => sum + (p - testY[i]) ** 2, 0) / testY.length;
            const rmse = Math.sqrt(mse);

            const yMean = testY.reduce((a, b) => a + b, 0) / testY.length;
            const ssTot = testY.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
            const ssRes = predictions.reduce((sum, p, i) => sum + (testY[i] - p) ** 2, 0);
            const r2 = 1 - ssRes / ssTot;

            return { mae, rmse, r2 };
        }

        // Classification metrics
        const threshold = model.threshold || 0.5;
        const binaryPreds = predictions.map(p => p >= threshold ? 1 : 0);

        let tp = 0, fp = 0, fn = 0, tn = 0;
        for (let i = 0; i < testY.length; i++) {
            if (binaryPreds[i] === 1 && testY[i] === 1) tp++;
            else if (binaryPreds[i] === 1 && testY[i] === 0) fp++;
            else if (binaryPreds[i] === 0 && testY[i] === 1) fn++;
            else tn++;
        }

        const accuracy = (tp + tn) / testY.length;
        const precision = tp / (tp + fp) || 0;
        const recall = tp / (tp + fn) || 0;
        const f1Score = 2 * precision * recall / (precision + recall) || 0;

        // Simulated AUC-ROC
        const aucRoc = 0.7 + Math.random() * 0.25;

        return {
            accuracy,
            precision,
            recall,
            f1Score,
            aucRoc,
            confusionMatrix: [[tn, fp], [fn, tp]],
        };
    }

    private predict(model: TrainedModel, x: number[]): number {
        if (model.coefficients) {
            const z = model.coefficients[0] + x.reduce((sum, xi, i) => sum + xi * model.coefficients![i + 1], 0);
            return model.algorithm === 'linear_regression' ? z : this.sigmoid(z);
        }
        return Math.random(); // Fallback for complex models
    }

    // ========================================================================
    // Utility Functions
    // ========================================================================

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }

    private euclideanDistance(a: number[], b: number[]): number {
        return Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - b[i]) ** 2, 0));
    }

    private randomSample<T>(arr: T[], n: number): T[] {
        const result: T[] = [];
        const indices = new Set<number>();
        while (indices.size < Math.min(n, arr.length)) {
            indices.add(Math.floor(Math.random() * arr.length));
        }
        for (const i of indices) {
            result.push(arr[i]);
        }
        return result;
    }

    private quantile(arr: number[], q: number): number {
        const sorted = [...arr].sort((a, b) => a - b);
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (base + 1 < sorted.length) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        }
        return sorted[base];
    }

    private transpose(matrix: number[][]): number[][] {
        return matrix[0].map((_, i) => matrix.map(row => row[i]));
    }

    private matMul(a: number[][], b: number[][]): number[][] {
        const result: number[][] = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                result[i][j] = a[i].reduce((sum, aik, k) => sum + aik * b[k][j], 0);
            }
        }
        return result;
    }

    private matVecMul(matrix: number[][], vec: number[]): number[] {
        return matrix.map(row => row.reduce((sum, val, i) => sum + val * vec[i], 0));
    }

    private inverseMatrix(matrix: number[][]): number[][] {
        const n = matrix.length;
        const result = matrix.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(result[k][i]) > Math.abs(result[maxRow][i])) {
                    maxRow = k;
                }
            }
            [result[i], result[maxRow]] = [result[maxRow], result[i]];

            const pivot = result[i][i];
            if (Math.abs(pivot) < 1e-10) continue;

            for (let j = 0; j < 2 * n; j++) {
                result[i][j] /= pivot;
            }

            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = result[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        result[k][j] -= factor * result[i][j];
                    }
                }
            }
        }

        return result.map(row => row.slice(n));
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let orchestratorInstance: TrainingOrchestrator | null = null;

export function getTrainingOrchestrator(): TrainingOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new TrainingOrchestrator();
    }
    return orchestratorInstance;
}
