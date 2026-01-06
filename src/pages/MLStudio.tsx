/**
 * ML Studio Page
 * Visual interface for training, managing, and deploying ML models
 * Redesigned with Obsidian design system
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Sparkles,
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
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
};

// ============================================================================
// Noise texture for glassmorphism
// ============================================================================


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
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C15F3C]/5 rounded-full" />
                <div className="absolute top-1/2 -left-32 w-72 h-72 bg-[#DA7756]/5 rounded-full" />
                <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-[#A68B5B]/5 rounded-full" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative p-6 space-y-6"
            >
                {/* Header */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="p-3 rounded-xl bg-gradient-to-br from-[#C15F3C]/20 to-[#DA7756]/10 border border-[#C15F3C]/20"
                        >
                            <Brain className="w-6 h-6 text-[#C15F3C]" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                ML Studio
                            </h1>
                            <p className="text-slate-400 text-sm">Train, evaluate, and deploy machine learning models</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setView('models')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                                view === 'models'
                                    ? 'bg-[#DA7756] text-white border-[#C15F3C] '
                                    : 'bg-slate-800  border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                            
                        >
                            <Layers className="w-4 h-4" />
                            Models ({models.length})
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setView('create')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DA7756] text-white hover:bg-[#C15F3C] transition-all "
                        >
                            <Plus className="w-4 h-4" />
                            New Training Job
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                {stats && (
                    <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
                        <StatsCard label="Training Jobs" value={stats.totalJobs} icon={Activity} color="orange" />
                        <StatsCard label="Completed" value={stats.completedJobs} icon={CheckCircle} color="orange" />
                        <StatsCard label="Deployed Models" value={stats.totalModels} icon={Zap} color="blue" />
                        <StatsCard label="Total Predictions" value={stats.totalPredictions} icon={Target} color="amber" />
                    </motion.div>
                )}

                {/* Main Content */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center h-64"
                        >
                            <div className="relative">
                                <div className="w-12 h-12 border-2 border-[#DA7756]/20 rounded-full" />
                                <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-[#DA7756] rounded-full animate-spin" />
                            </div>
                        </motion.div>
                    ) : view === 'jobs' ? (
                        <motion.div key="jobs" variants={itemVariants}>
                            <JobList jobs={jobs} onSelect={handleSelectJob} onDelete={handleDeleteJob} onDeploy={handleDeployModel} />
                        </motion.div>
                    ) : view === 'models' ? (
                        <motion.div key="models" variants={itemVariants}>
                            <ModelList models={models} onBack={() => setView('jobs')} />
                        </motion.div>
                    ) : view === 'create' ? (
                        <motion.div key="create" variants={itemVariants}>
                            <CreateJobWizard onSave={handleCreateJob} onCancel={() => setView('jobs')} />
                        </motion.div>
                    ) : view === 'detail' && selectedJob ? (
                        <motion.div key="detail" variants={itemVariants}>
                            <JobDetail job={selectedJob} onBack={() => setView('jobs')} onDeploy={() => handleDeployModel(selectedJob)} />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </motion.div>
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
    color = 'violet',
}: {
    label: string;
    value: number;
    icon: typeof Brain;
    color?: 'violet' | 'orange' | 'blue' | 'amber';
}) {
    const colors = {
        violet: 'from-[#C15F3C]/20 to-[#DA7756]/10 border-[#C15F3C]/20 text-[#C15F3C]',
        orange: 'from-[#DA7756]/20 to-[#C15F3C]/10 border-[#DA7756]/20 text-[#DA7756]',
        blue: 'from-[#8F8B82]/20 to-[#A68B5B]/10 border-[#8F8B82]/20 text-[#8F8B82]',
        amber: 'from-amber-500/20 to-[#E5A84B]/10 border-amber-500/20 text-amber-400',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-slate-900  rounded-2xl border border-slate-800 p-4"
            
        >
            <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} border flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                </div>
            </div>
        </motion.div>
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
            <motion.div
                variants={cardVariants}
                className="bg-slate-900  rounded-2xl border border-slate-800 p-12 text-center"
                
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No training jobs yet</h3>
                <p className="text-slate-500">Create your first ML model to get started</p>
            </motion.div>
        );
    }

    const statusConfig = {
        draft: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Settings, label: 'Draft' },
        training: { color: 'bg-[#8F8B82]/10 text-[#8F8B82] border-[#8F8B82]/20', icon: RefreshCw, label: 'Training' },
        completed: { color: 'bg-[#DA7756]/10 text-[#DA7756] border-[#DA7756]/20', icon: CheckCircle, label: 'Completed' },
        failed: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertCircle, label: 'Failed' },
        deployed: { color: 'bg-[#C15F3C]/10 text-[#C15F3C] border-[#C15F3C]/20', icon: Zap, label: 'Deployed' },
        archived: { color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Clock, label: 'Archived' },
    };

    return (
        <motion.div variants={containerVariants} className="space-y-4">
            {jobs.map((job, index) => {
                const config = statusConfig[job.status];
                const StatusIcon = config.icon;
                const typeInfo = MODEL_TYPE_INFO[job.modelType];

                return (
                    <motion.div
                        key={job.id}
                        variants={itemVariants}
                        custom={index}
                        whileHover={{ scale: 1.01 }}
                        className="bg-slate-900  rounded-2xl border border-slate-800 hover:border-white/[0.1] transition-all"
                        
                    >
                        <div className="p-6 cursor-pointer" onClick={() => onSelect(job)}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white">{job.name}</h3>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
                                            <StatusIcon className="w-3 h-3 inline mr-1" />
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-3">
                                        {typeInfo.name} • {ALGORITHM_CONFIGS[job.config.algorithm].name}
                                    </p>

                                    <div className="flex items-center gap-6 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Layers className="w-4 h-4" />
                                            {job.features.length} features
                                        </span>
                                        {job.metrics?.accuracy !== undefined && (
                                            <span className="flex items-center gap-1 text-[#DA7756]">
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

                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </div>

                            {/* Progress bar for training jobs */}
                            {job.status === 'training' && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-slate-400">
                                            Epoch {job.currentEpoch || 0} / {job.totalEpochs || 100}
                                        </span>
                                        <span className="text-[#8F8B82]">{job.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${job.progress}%` }}
                                            className="h-full bg-gradient-to-r from-[#8F8B82] to-[#A68B5B] rounded-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="px-6 py-3 border-t border-slate-800 flex items-center gap-2">
                            {job.status === 'completed' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); onDeploy(job); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] hover:bg-[#C15F3C]/20 transition-colors text-sm border border-[#C15F3C]/20"
                                >
                                    <Upload className="w-4 h-4" />
                                    Deploy
                                </motion.button>
                            )}
                            {job.status === 'draft' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#DA7756]/10 text-[#DA7756] hover:bg-[#DA7756]/20 transition-colors text-sm border border-[#DA7756]/20"
                                >
                                    <Play className="w-4 h-4" />
                                    Start Training
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm ml-auto border border-rose-500/20"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </motion.button>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
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
            <motion.button
                whileHover={{ x: -4 }}
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to training jobs
            </motion.button>

            {models.length === 0 ? (
                <motion.div
                    variants={cardVariants}
                    className="bg-slate-900  rounded-2xl border border-slate-800 p-12 text-center"
                    
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800 flex items-center justify-center">
                        <Layers className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No deployed models</h3>
                    <p className="text-slate-500">Complete a training job and deploy it</p>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} className="grid gap-4">
                    {models.map((model, index) => {
                        const typeInfo = MODEL_TYPE_INFO[model.modelType];

                        return (
                            <motion.div
                                key={model.id}
                                variants={itemVariants}
                                custom={index}
                                whileHover={{ scale: 1.01 }}
                                className="bg-slate-900  rounded-2xl border border-slate-800 p-6"
                                
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-lg bg-[#C15F3C]/20 text-[#C15F3C] border border-[#C15F3C]/20">
                                                v{model.version}
                                            </span>
                                            {model.isActive && (
                                                <span className="text-xs px-2 py-0.5 rounded-lg bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/20">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3">
                                            {typeInfo.name} • {ALGORITHM_CONFIGS[model.algorithm].name}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    {model.metrics.accuracy !== undefined && (
                                        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                                            <p className="text-xs text-slate-500 mb-1">Accuracy</p>
                                            <p className="text-lg font-bold text-white">
                                                {(model.metrics.accuracy * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    )}
                                    {model.metrics.f1Score !== undefined && (
                                        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                                            <p className="text-xs text-slate-500 mb-1">F1 Score</p>
                                            <p className="text-lg font-bold text-white">
                                                {(model.metrics.f1Score * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                                        <p className="text-xs text-slate-500 mb-1">Predictions</p>
                                        <p className="text-lg font-bold text-white">
                                            {model.usageStats.totalPredictions.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                                        <p className="text-xs text-slate-500 mb-1">Avg Latency</p>
                                        <p className="text-lg font-bold text-white">
                                            {model.usageStats.avgLatencyMs?.toFixed(0) || '—'}ms
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
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
            <motion.button
                whileHover={{ x: -4 }}
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to training jobs
            </motion.button>

            {/* Header */}
            <motion.div
                variants={itemVariants}
                className="flex items-start justify-between"
            >
                <div>
                    <h2 className="text-2xl font-bold text-white">{job.name}</h2>
                    <p className="text-slate-400 mt-1">{typeInfo.name} • {algorithmInfo.name}</p>
                </div>
                {job.status === 'completed' && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onDeploy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DA7756] text-white hover:bg-[#C15F3C] transition-all "
                    >
                        <Upload className="w-4 h-4" />
                        Deploy Model
                    </motion.button>
                )}
            </motion.div>

            {/* Metrics */}
            {job.metrics && (
                <motion.div
                    variants={cardVariants}
                    className="bg-slate-900  rounded-2xl border border-slate-800 p-6"
                    
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#C15F3C]" />
                        Training Metrics
                    </h3>
                    <div className="grid grid-cols-5 gap-4">
                        {job.metrics.accuracy !== undefined && (
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <p className="text-sm text-slate-500 mb-1">Accuracy</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.accuracy * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.precision !== undefined && (
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <p className="text-sm text-slate-500 mb-1">Precision</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.precision * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.recall !== undefined && (
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <p className="text-sm text-slate-500 mb-1">Recall</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.recall * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.f1Score !== undefined && (
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <p className="text-sm text-slate-500 mb-1">F1 Score</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.f1Score * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {job.metrics.aucRoc !== undefined && (
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <p className="text-sm text-slate-500 mb-1">AUC-ROC</p>
                                <p className="text-2xl font-bold text-white">
                                    {(job.metrics.aucRoc * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Feature Importance */}
            {job.features.some(f => f.importance !== undefined) && (
                <motion.div
                    variants={cardVariants}
                    className="bg-slate-900  rounded-2xl border border-slate-800 p-6"
                    
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#C15F3C]" />
                        Feature Importance
                    </h3>
                    <div className="space-y-3">
                        {job.features
                            .filter(f => f.importance !== undefined && f.role === 'feature')
                            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                            .map((feature, index) => (
                                <motion.div
                                    key={feature.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-white">{feature.name}</span>
                                        <span className="text-sm text-slate-400">
                                            {((feature.importance || 0) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(feature.importance || 0) * 100}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                            className="h-full bg-[#DA7756] rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </motion.div>
            )}

            {/* Training Logs */}
            {job.logs.length > 0 && (
                <motion.div
                    variants={cardVariants}
                    className="bg-slate-900  rounded-2xl border border-slate-800 p-6"
                    
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#C15F3C]" />
                        Training Logs
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {job.logs.slice(-20).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className="flex items-start gap-3 text-sm"
                            >
                                <span className="text-slate-500 font-mono text-xs whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`${
                                    log.level === 'error' ? 'text-rose-400' :
                                    log.level === 'warning' ? 'text-amber-400' :
                                    'text-slate-400'
                                }`}>
                                    {log.message}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
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
            <motion.button
                whileHover={{ x: -4 }}
                onClick={onCancel}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to training jobs
            </motion.button>

            <motion.div
                variants={cardVariants}
                className="bg-slate-900  rounded-2xl border border-slate-800"
                
            >
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C15F3C]/20 to-[#DA7756]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#C15F3C]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Create New Training Job</h2>
                        <p className="text-sm text-slate-500">Configure your machine learning model</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Job Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors"
                            placeholder="e.g., Churn Prediction v2"
                        />
                    </div>

                    {/* Model Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">
                            Model Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(MODEL_TYPE_INFO) as ModelType[]).map((type) => {
                                const info = MODEL_TYPE_INFO[type];
                                return (
                                    <motion.button
                                        key={type}
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setModelType(type);
                                            setAlgorithm(info.recommendedAlgorithms[0]);
                                        }}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            modelType === type
                                                ? 'border-[#DA7756]/50 bg-[#DA7756]/10 '
                                                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                                        }`}
                                    >
                                        <p className="text-white font-medium">{info.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Algorithm */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">
                            Algorithm
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {availableAlgorithms.map((algo) => {
                                const info = ALGORITHM_CONFIGS[algo];
                                return (
                                    <motion.button
                                        key={algo}
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setAlgorithm(algo)}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            algorithm === algo
                                                ? 'border-[#DA7756]/50 bg-[#DA7756]/10 '
                                                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                                        }`}
                                    >
                                        <p className="text-white font-medium">{info.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!name}
                            className="px-6 py-2.5 rounded-xl bg-[#DA7756] text-white hover:bg-[#C15F3C] transition-all disabled:opacity-50 disabled:cursor-not-allowed "
                        >
                            Create Job
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default MLStudioPage;
