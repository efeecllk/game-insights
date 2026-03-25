import { motion } from 'framer-motion';
import {
    ChevronDown,
    Download,
    AlertTriangle,
    Info,
    Lightbulb,
    Play,
} from 'lucide-react';

import { sampleDatasets } from '../../lib/sampleData';
import { UPLOAD_HOW_IT_WORKS_STEPS, UPLOAD_SAMPLE_DOWNLOADS, UPLOAD_STEP_HINTS, type UploadStep } from './uploadContent';

interface UploadHowItWorksSectionProps {
    onHide: () => void;
}

interface UploadSampleDataSectionProps {
    onTryExampleData: (datasetId: string) => void;
}

interface UploadStepHintsSectionProps {
    step: UploadStep;
    showHints: boolean;
    onToggle: () => void;
}

interface UploadApiKeyNoticeProps {
    apiKey: string | null;
}

export function UploadHowItWorksSection({ onHide }: UploadHowItWorksSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="relative bg-th-bg-surface rounded-2xl p-6 border border-th-border-subtle overflow-hidden">
                <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 text-th-accent-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-th-text-primary">How It Works</h3>
                                <p className="text-sm text-th-text-muted">4 simple steps to analyze your game data</p>
                            </div>
                        </div>
                        <button
                            onClick={onHide}
                            className="text-th-text-muted hover:text-th-text-secondary transition-colors text-sm"
                        >
                            Hide
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {UPLOAD_HOW_IT_WORKS_STEPS.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                                className="bg-th-bg-elevated/50 rounded-xl p-4 border border-th-border-subtle"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-th-accent-primary-muted text-th-accent-primary flex items-center justify-center text-xs font-bold">
                                        {item.step}
                                    </div>
                                    <item.icon className="w-4 h-4 text-th-accent-primary" />
                                </div>
                                <h4 className="font-medium text-th-text-primary text-sm mb-1">{item.title}</h4>
                                <p className="text-xs text-th-text-muted">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function UploadSampleDataSection({ onTryExampleData }: UploadSampleDataSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative bg-th-bg-surface rounded-2xl p-4 border border-th-border-subtle"
        >
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-th-accent-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-th-accent-primary font-medium text-sm mb-2">Try Example Data</p>
                    <p className="text-xs text-th-text-muted mb-3">
                        See how Game Insights works with sample datasets - no upload required
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {sampleDatasets.map((dataset) => (
                            <button
                                key={dataset.id}
                                onClick={() => onTryExampleData(dataset.id)}
                                className="px-3 py-1.5 text-xs bg-th-bg-elevated/50 hover:bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary rounded-lg border border-th-border-subtle hover:border-th-accent-primary/30 transition-all"
                                title={dataset.description}
                            >
                                {dataset.name}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-th-border-subtle">
                        <p className="text-xs text-th-text-muted mb-2 flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Or download comprehensive sample CSVs (700-850 rows each):
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {UPLOAD_SAMPLE_DOWNLOADS.map((sample) => (
                                <a
                                    key={sample.file}
                                    href={`/sample-data/${sample.file}`}
                                    download={sample.file}
                                    className="px-2 py-1 text-xs bg-th-bg-elevated/30 hover:bg-th-bg-elevated/50 text-th-text-muted hover:text-th-text-secondary rounded border border-th-border-subtle hover:border-th-border transition-all flex items-center gap-1"
                                >
                                    <Download className="w-3 h-3" />
                                    {sample.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function UploadStepHintsSection({ step, showHints, onToggle }: UploadStepHintsSectionProps) {
    if (!showHints || step === 'complete') return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="bg-th-bg-elevated/30 rounded-xl p-4 border border-th-border-subtle">
                <button onClick={onToggle} className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-th-accent-primary" />
                        <span className="text-sm font-medium text-th-text-secondary">
                            {UPLOAD_STEP_HINTS[step].title}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-th-text-muted ${showHints ? 'rotate-180' : ''}`} />
                </button>
                <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2 pl-6">
                    {UPLOAD_STEP_HINTS[step].hints.map((hint, index) => (
                        <li key={index} className="text-xs text-th-text-muted list-disc">
                            {hint}
                        </li>
                    ))}
                </motion.ul>
            </div>
        </motion.div>
    );
}

export function UploadApiKeyNotice({ apiKey }: UploadApiKeyNoticeProps) {
    if (apiKey) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative bg-th-warning-muted rounded-2xl p-4 border border-th-warning/20 overflow-hidden"
        >
            <div className="relative flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-th-warning-muted border border-th-warning/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-th-warning" />
                </div>
                <div>
                    <p className="text-th-warning font-medium">No API key configured</p>
                    <p className="text-sm text-th-text-secondary mt-1">
                        Add your OpenAI API key in Settings for better column detection. Without it, we'll use
                        pattern matching only.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
