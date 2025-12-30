/**
 * ML Studio Page
 * Visual interface for training, managing, and deploying ML models
 */

import { useState, useEffect } from 'react';
import {
    Brain,
    Plus,
    Play,
    Trash2,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp,
    BarChart3,
    Settings,
    Layers,
    Target,
    Activity,
    Zap,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import {
    getAllTrainingJobs,
    getAllDeployedModels,
    createTrainingJob,
    deleteTrainingJob,
    deployModel,
    getMLStudioStats,
    initializeSampleJobs,
    type MLStudioStats,
} from '../lib/mlStudioStore';
import type {
    TrainingJob,
    DeployedModel,
    ModelType,
    ModelAlgorithm,
    FeatureConfig,
} from '../ai/studio/types';
import {
    MODEL_TYPE_INFO,
    ALGORITHM_CONFIGS,
} from '../ai/studio/types';

// ============================================================================
// Main Page
// ============================================================================

export function MLStudioPage() {
    const [jobs, setJobs] = useState<TrainingJob[]>([]);
    const [models, setModels] = useState<DeployedModel[]>([]);
    const [stats, setStats] = useState<MLStudioStats | null>(null);
    const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
    const [view, setView] = useState<'jobs' | 'models' | 'create' | 'detail'>('jobs');
    const [loading, setLoading] = useState(true);

    async function loadData() {
        setLoading(true);
        await initializeSampleJobs();
        const [loadedJobs, loadedModels, loadedStats] = await Promise.all([
            getAllTrainingJobs(),
            getAllDeployedModels(),
            getMLStudioStats(),
        ]);
        setJobs(loadedJobs);
        setModels(loadedModels);
        setStats(loadedStats);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleDeleteJob(id: string) {
        await deleteTrainingJob(id);
        await loadData();
        if (selectedJob?.id === id) {
            setSelectedJob(null);
            setView('jobs');
        }
    }

    async function handleDeployModel(job: TrainingJob) {
        await deployModel(job);
        await loadData();
    }

    async function handleCreateJob(
        name: string,
        modelType: ModelType,
        algorithm: ModelAlgorithm,
        features: FeatureConfig[]
    ) {
        await createTrainingJob(name, modelType, features, { algorithm });
        await loadData();
        setView('jobs');
    }

    function handleSelectJob(job: TrainingJob) {
        setSelectedJob(job);
        setView('detail');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Brain className="w-7 h-7 text-accent-primary" />
                        ML Studio
                    </h1>
                    <p className="text-zinc-500 mt-1">Train, evaluate, and deploy machine learning models</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('models')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                            view === 'models'
                                ? 'bg-accent-primary text-white border-accent-primary'
                                : 'bg-bg-card border-white/10 text-zinc-300 hover:bg-bg-card-hover'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        Models ({models.length})
                    </button>
                    <button
                        onClick={() => setView('create')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Training Job
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <StatsCard
                        label="Training Jobs"
                        value={stats.totalJobs}
                        icon={Activity}
                        color="purple"
                    />
                    <StatsCard
                        label="Completed"
                        value={stats.completedJobs}
                        icon={CheckCircle}
                        color="green"
                    />
                    <StatsCard
                        label="Deployed Models"
                        value={stats.totalModels}
                        icon={Zap}
                        color="blue"
                    />
                    <StatsCard
                        label="Total Predictions"
                        value={stats.totalPredictions}
                        icon={Target}
                        color="orange"
                    />
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            ) : view === 'jobs' ? (
                <JobList
                    jobs={jobs}
                    onSelect={handleSelectJob}
                    onDelete={handleDeleteJob}
                    onDeploy={handleDeployModel}
                />
            ) : view === 'models' ? (
                <ModelList
                    models={models}
                    onBack={() => setView('jobs')}
                />
            ) : view === 'create' ? (
                <CreateJobWizard
                    onSave={handleCreateJob}
                    onCancel={() => setView('jobs')}
                />
            ) : view === 'detail' && selectedJob ? (
                <JobDetail
                    job={selectedJob}
                    onBack={() => setView('jobs')}
                    onDeploy={() => handleDeployModel(selectedJob)}
                />
            ) : null}
        </div>
    );
}

// ============================================================================
// Stats Card
// ============================================================================

function StatsCard({
    label,
    value,
    icon: Icon,
    color = 'purple',
}: {
    label: string;
    value: number;
    icon: typeof Brain;
    color?: 'purple' | 'green' | 'blue' | 'orange';
}) {
    const colors = {
        purple: 'bg-accent-primary/10 text-accent-primary',
        green: 'bg-green-500/10 text-green-500',
        blue: 'bg-blue-500/10 text-blue-500',
        orange: 'bg-orange-500/10 text-orange-500',
    };

    return (
        <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
                    <p className="text-sm text-zinc-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Job List
// ============================================================================

function JobList({
    jobs,
    onSelect,
    onDelete,
    onDeploy,
}: {
    jobs: TrainingJob[];
    onSelect: (job: TrainingJob) => void;
    onDelete: (id: string) => void;
    onDeploy: (job: TrainingJob) => void;
}) {
    if (jobs.length === 0) {
        return (
            <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] text-center">
                <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No training jobs yet</h3>
                <p className="text-zinc-500">Create your first ML model to get started</p>
            </div>
        );
    }

    const statusConfig = {
        draft: { color: 'bg-zinc-500/10 text-zinc-400', icon: Settings, label: 'Draft' },
        training: { color: 'bg-blue-500/10 text-blue-500', icon: RefreshCw, label: 'Training' },
        completed: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle, label: 'Completed' },
        failed: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle, label: 'Failed' },
        deployed: { color: 'bg-purple-500/10 text-purple-500', icon: Zap, label: 'Deployed' },
        archived: { color: 'bg-zinc-500/10 text-zinc-500', icon: Clock, label: 'Archived' },
    };

    return (
        <div className="space-y-4">
            {jobs.map((job) => {
                const config = statusConfig[job.status];
                const StatusIcon = config.icon;
                const typeInfo = MODEL_TYPE_INFO[job.modelType];

                return (
                    <div
                        key={job.id}
                        className="bg-bg-card rounded-card border border-white/[0.06] hover:border-white/10 transition-all"
                    >
                        <div className="p-6 cursor-pointer" onClick={() => onSelect(job)}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white">{job.name}</h3>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}>
                                            <StatusIcon className="w-3 h-3 inline mr-1" />
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-3">
                                        {typeInfo.name} • {ALGORITHM_CONFIGS[job.config.algorithm].name}
                                    </p>

                                    <div className="flex items-center gap-6 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Layers className="w-4 h-4" />
                                            {job.features.length} features
                                        </span>
                                        {job.metrics?.accuracy !== undefined && (
                                            <span className="flex items-center gap-1 text-green-500">
                                                <TrendingUp className="w-4 h-4" />
                                                {(job.metrics.accuracy * 100).toFixed(1)}% accuracy
                                            </span>
                                        )}
                                        {job.trainingTime && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {job.trainingTime}s training time
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-zinc-500" />
                            </div>

                            {/* Progress bar for training jobs */}
                            {job.status === 'training' && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-zinc-400">
                                            Epoch {job.currentEpoch || 0} / {job.totalEpochs || 100}
                                        </span>
                                        <span className="text-blue-500">{job.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all animate-pulse"
                                            style={{ width: `${job.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="px-6 py-3 border-t border-white/[0.06] flex items-center gap-2">
                            {job.status === 'completed' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeploy(job); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors text-sm"
                                >
                                    <Upload className="w-4 h-4" />
                                    Deploy
                                </button>
                            )}
                            {job.status === 'draft' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); /* Would start training */ }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors text-sm"
                                >
                                    <Play className="w-4 h-4" />
                                    Start Training
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm ml-auto"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// Model List
// ============================================================================

function ModelList({
    models,
    onBack,
}: {
    models: DeployedModel[];
    onBack: () => void;
}) {
    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to training jobs
            </button>

            {models.length === 0 ? (
                <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] text-center">
                    <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No deployed models</h3>
                    <p className="text-zinc-500">Complete a training job and deploy it</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {models.map((model) => {
                        const typeInfo = MODEL_TYPE_INFO[model.modelType];

                        return (
                            <div
                                key={model.id}
                                className="bg-bg-card rounded-card p-6 border border-white/[0.06]"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                                                v{model.version}
                                            </span>
                                            {model.isActive && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-400 mb-3">
                                            {typeInfo.name} • {ALGORITHM_CONFIGS[model.algorithm].name}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    {model.metrics.accuracy !== undefined && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Accuracy</p>
                                            <p className="text-lg font-bold text-white">
                                                {(model.metrics.accuracy * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    )}
                                    {model.metrics.f1Score !== undefined && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">F1 Score</p>
                                            <p className="text-lg font-bold text-white">
                                                {(model.metrics.f1Score * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Predictions</p>
                                        <p className="text-lg font-bold text-white">
                                            {model.usageStats.totalPredictions.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Avg Latency</p>
                                        <p className="text-lg font-bold text-white">
                                            {model.usageStats.avgLatencyMs?.toFixed(0) || '—'}ms
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Job Detail
// ============================================================================

function JobDetail({
    job,
    onBack,
    onDeploy,
}: {
    job: TrainingJob;
    onBack: () => void;
    onDeploy: () => void;
}) {
    const typeInfo = MODEL_TYPE_INFO[job.modelType];
    const algorithmInfo = ALGORITHM_CONFIGS[job.config.algorithm];

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to training jobs
            </button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">{job.name}</h2>
                    <p className="text-zinc-400 mt-1">{typeInfo.name} • {algorithmInfo.name}</p>
                </div>
                {job.status === 'completed' && (
                    <button
                        onClick={onDeploy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Deploy Model
                    </button>
                )}
            </div>

            {/* Metrics */}
            {job.metrics && (
                <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-primary" />
                        Training Metrics
                    </h3>
                    <div className="grid grid-cols-4 gap-6">
                        {job.metrics.accuracy !== undefined && (
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">Accuracy</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.accuracy * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.precision !== undefined && (
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">Precision</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.precision * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.recall !== undefined && (
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">Recall</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.recall * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.f1Score !== undefined && (
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">F1 Score</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.f1Score * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.aucRoc !== undefined && (
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">AUC-ROC</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.aucRoc * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Feature Importance */}
            {job.features.some(f => f.importance !== undefined) && (
                <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-accent-primary" />
                        Feature Importance
                    </h3>
                    <div className="space-y-3">
                        {job.features
                            .filter(f => f.importance !== undefined && f.role === 'feature')
                            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                            .map((feature) => (
                                <div key={feature.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-white">{feature.name}</span>
                                        <span className="text-sm text-zinc-400">
                                            {((feature.importance || 0) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent-primary rounded-full"
                                            style={{ width: `${(feature.importance || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Training Logs */}
            {job.logs.length > 0 && (
                <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent-primary" />
                        Training Logs
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {job.logs.slice(-20).map((log, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 text-sm"
                            >
                                <span className="text-zinc-500 font-mono text-xs">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`${
                                    log.level === 'error' ? 'text-red-400' :
                                    log.level === 'warning' ? 'text-yellow-400' :
                                    'text-zinc-400'
                                }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Create Job Wizard
// ============================================================================

function CreateJobWizard({
    onSave,
    onCancel,
}: {
    onSave: (name: string, modelType: ModelType, algorithm: ModelAlgorithm, features: FeatureConfig[]) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState('');
    const [modelType, setModelType] = useState<ModelType>('churn');
    const [algorithm, setAlgorithm] = useState<ModelAlgorithm>('gradient_boosting');

    const typeInfo = MODEL_TYPE_INFO[modelType];
    const availableAlgorithms = typeInfo.recommendedAlgorithms;

    // Default features based on model type
    const defaultFeatures: FeatureConfig[] = [
        { name: 'days_since_last_session', type: 'numeric', role: 'feature', missingStrategy: 'median', scaling: 'standard' },
        { name: 'total_sessions', type: 'numeric', role: 'feature', missingStrategy: 'zero', scaling: 'minmax' },
        { name: 'total_purchases', type: 'numeric', role: 'feature', missingStrategy: 'zero', scaling: 'standard' },
        { name: 'avg_session_length', type: 'numeric', role: 'feature', missingStrategy: 'mean', scaling: 'standard' },
        { name: 'country', type: 'categorical', role: 'feature', missingStrategy: 'mode', encoding: 'onehot' },
        { name: 'target', type: 'numeric', role: 'target', missingStrategy: 'drop' },
    ];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSave(name, modelType, algorithm, defaultFeatures);
    }

    return (
        <div className="space-y-6">
            <button
                onClick={onCancel}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to training jobs
            </button>

            <div className="bg-bg-card rounded-card border border-white/[0.06]">
                <div className="p-6 border-b border-white/[0.06]">
                    <h2 className="text-xl font-semibold text-white">Create New Training Job</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Job Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary"
                            placeholder="e.g., Churn Prediction v2"
                        />
                    </div>

                    {/* Model Type */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">
                            Model Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(MODEL_TYPE_INFO) as ModelType[]).map((type) => {
                                const info = MODEL_TYPE_INFO[type];
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setModelType(type);
                                            setAlgorithm(info.recommendedAlgorithms[0]);
                                        }}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            modelType === type
                                                ? 'border-accent-primary bg-accent-primary/10'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <p className="text-white font-medium">{info.name}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{info.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Algorithm */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">
                            Algorithm
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {availableAlgorithms.map((algo) => {
                                const info = ALGORITHM_CONFIGS[algo];
                                return (
                                    <button
                                        key={algo}
                                        type="button"
                                        onClick={() => setAlgorithm(algo)}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            algorithm === algo
                                                ? 'border-accent-primary bg-accent-primary/10'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <p className="text-white font-medium">{info.name}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{info.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name}
                            className="px-6 py-2.5 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Job
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MLStudioPage;
