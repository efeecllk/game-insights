/**
 * Anomaly Configuration Panel
 * UI for configuring anomaly detection thresholds and parameters
 */

import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Sliders,
    RotateCcw,
    Check,
    Info,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { AnomalyThresholds, DetectionConfig } from '../../ai/AnomalyDetector';
import { SemanticType } from '../../ai/SchemaAnalyzer';

// Storage keys
const ANOMALY_CONFIG_STORAGE = 'game_insights_anomaly_config';
const ANOMALY_THRESHOLDS_STORAGE = 'game_insights_anomaly_thresholds';

// Default values
const DEFAULT_THRESHOLDS: AnomalyThresholds = {
    lowStdDev: 2.0,
    mediumStdDev: 2.5,
    highStdDev: 3.0,
    criticalStdDev: 4.0,
    minDataPoints: 7,
    minPercentChange: 20,
};

const DEFAULT_CONFIG: Omit<DetectionConfig, 'thresholds'> = {
    lookbackDays: 30,
    granularity: 'day',
    metrics: ['revenue', 'dau', 'retention_day', 'level', 'error_type'],
};

// Available metrics for detection
const AVAILABLE_METRICS: { value: SemanticType; label: string; description: string }[] = [
    { value: 'revenue', label: 'Revenue', description: 'Track revenue spikes and drops' },
    { value: 'dau', label: 'DAU', description: 'Daily active users anomalies' },
    { value: 'retention_day', label: 'Retention', description: 'Retention rate changes' },
    { value: 'level', label: 'Level/Progression', description: 'Progression anomalies' },
    { value: 'session_duration', label: 'Session Duration', description: 'Session length changes' },
    { value: 'error_type', label: 'Errors', description: 'Error rate spikes' },
    { value: 'purchase_amount', label: 'Purchases', description: 'Purchase amount changes' },
    { value: 'conversion', label: 'Conversion', description: 'Conversion rate anomalies' },
];

// Helper functions for localStorage
export function getStoredAnomalyThresholds(): AnomalyThresholds {
    try {
        const stored = localStorage.getItem(ANOMALY_THRESHOLDS_STORAGE);
        if (stored) {
            return { ...DEFAULT_THRESHOLDS, ...JSON.parse(stored) };
        }
    } catch {
        // Ignore parse errors
    }
    return DEFAULT_THRESHOLDS;
}

export function setStoredAnomalyThresholds(thresholds: AnomalyThresholds): void {
    localStorage.setItem(ANOMALY_THRESHOLDS_STORAGE, JSON.stringify(thresholds));
}

export function getStoredAnomalyConfig(): DetectionConfig {
    try {
        const stored = localStorage.getItem(ANOMALY_CONFIG_STORAGE);
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch {
        // Ignore parse errors
    }
    return DEFAULT_CONFIG;
}

export function setStoredAnomalyConfig(config: DetectionConfig): void {
    localStorage.setItem(ANOMALY_CONFIG_STORAGE, JSON.stringify(config));
}

interface ThresholdSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    onChange: (value: number) => void;
}

function ThresholdSlider({
    label,
    value,
    min,
    max,
    step,
    unit = '',
    description,
    severity,
    onChange,
}: ThresholdSliderProps) {
    const severityColors: Record<string, string> = {
        low: 'bg-blue-500',
        medium: 'bg-yellow-500',
        high: 'bg-orange-500',
        critical: 'bg-red-500',
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {severity && (
                        <div className={`w-3 h-3 rounded-full ${severityColors[severity]}`} />
                    )}
                    <span className="text-sm font-medium text-th-text-secondary">{label}</span>
                </div>
                <span className="text-sm font-mono text-th-text-primary">
                    {value}{unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-th-bg-elevated rounded-lg appearance-none cursor-pointer accent-th-accent-primary"
            />
            <p className="text-xs text-th-text-muted">{description}</p>
        </div>
    );
}

export function AnomalyConfigPanel() {
    const [thresholds, setThresholds] = useState<AnomalyThresholds>(DEFAULT_THRESHOLDS);
    const [config, setConfig] = useState<DetectionConfig>(DEFAULT_CONFIG);
    const [expanded, setExpanded] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load stored settings on mount
    useEffect(() => {
        setThresholds(getStoredAnomalyThresholds());
        setConfig(getStoredAnomalyConfig());
    }, []);

    // Track changes
    useEffect(() => {
        const storedThresholds = getStoredAnomalyThresholds();
        const storedConfig = getStoredAnomalyConfig();
        const thresholdsChanged = JSON.stringify(thresholds) !== JSON.stringify(storedThresholds);
        const configChanged = JSON.stringify(config) !== JSON.stringify(storedConfig);
        setHasChanges(thresholdsChanged || configChanged);
    }, [thresholds, config]);

    const handleThresholdChange = (key: keyof AnomalyThresholds, value: number) => {
        setThresholds(prev => ({ ...prev, [key]: value }));
    };

    const handleConfigChange = <K extends keyof DetectionConfig>(
        key: K,
        value: DetectionConfig[K]
    ) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleMetricToggle = (metric: SemanticType) => {
        const currentMetrics = config.metrics || [];
        const newMetrics = currentMetrics.includes(metric)
            ? currentMetrics.filter(m => m !== metric)
            : [...currentMetrics, metric];
        handleConfigChange('metrics', newMetrics);
    };

    const handleSave = () => {
        setStoredAnomalyThresholds(thresholds);
        setStoredAnomalyConfig(config);
        setSaved(true);
        setHasChanges(false);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setThresholds(DEFAULT_THRESHOLDS);
        setConfig(DEFAULT_CONFIG);
    };

    return (
        <div className="bg-th-bg-surface rounded-card p-6 border border-th-border">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-th-text-primary">
                            Anomaly Detection
                        </h3>
                        <p className="text-sm text-th-text-muted">
                            Configure thresholds and sensitivity
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-th-text-muted" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-th-text-muted" />
                )}
            </button>

            {/* Expandable Content */}
            {expanded && (
                <div className="mt-6 space-y-6">
                    {/* Severity Thresholds */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-th-text-muted" />
                            <h4 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide">
                                Severity Thresholds
                            </h4>
                        </div>

                        <div className="bg-th-bg-elevated rounded-xl p-4 space-y-5">
                            <ThresholdSlider
                                label="Low Severity"
                                value={thresholds.lowStdDev}
                                min={1}
                                max={3}
                                step={0.1}
                                unit="σ"
                                severity="low"
                                description="Standard deviations from mean to trigger low severity alert"
                                onChange={(v) => handleThresholdChange('lowStdDev', v)}
                            />
                            <ThresholdSlider
                                label="Medium Severity"
                                value={thresholds.mediumStdDev}
                                min={1.5}
                                max={4}
                                step={0.1}
                                unit="σ"
                                severity="medium"
                                description="Standard deviations for medium severity (should be > low)"
                                onChange={(v) => handleThresholdChange('mediumStdDev', v)}
                            />
                            <ThresholdSlider
                                label="High Severity"
                                value={thresholds.highStdDev}
                                min={2}
                                max={5}
                                step={0.1}
                                unit="σ"
                                severity="high"
                                description="Standard deviations for high severity (should be > medium)"
                                onChange={(v) => handleThresholdChange('highStdDev', v)}
                            />
                            <ThresholdSlider
                                label="Critical Severity"
                                value={thresholds.criticalStdDev}
                                min={3}
                                max={6}
                                step={0.1}
                                unit="σ"
                                severity="critical"
                                description="Standard deviations for critical alerts (should be > high)"
                                onChange={(v) => handleThresholdChange('criticalStdDev', v)}
                            />
                        </div>

                        {/* Validation warning */}
                        {(thresholds.lowStdDev >= thresholds.mediumStdDev ||
                            thresholds.mediumStdDev >= thresholds.highStdDev ||
                            thresholds.highStdDev >= thresholds.criticalStdDev) && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <Info className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                <span className="text-sm text-yellow-500">
                                    Thresholds should increase with severity: Low &lt; Medium &lt; High &lt; Critical
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Detection Parameters */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide">
                            Detection Parameters
                        </h4>

                        <div className="bg-th-bg-elevated rounded-xl p-4 space-y-5">
                            <ThresholdSlider
                                label="Minimum Data Points"
                                value={thresholds.minDataPoints}
                                min={3}
                                max={30}
                                step={1}
                                description="Minimum data points required before anomaly detection activates"
                                onChange={(v) => handleThresholdChange('minDataPoints', v)}
                            />
                            <ThresholdSlider
                                label="Minimum % Change"
                                value={thresholds.minPercentChange}
                                min={5}
                                max={50}
                                step={5}
                                unit="%"
                                description="Minimum percentage change from baseline to flag as anomaly"
                                onChange={(v) => handleThresholdChange('minPercentChange', v)}
                            />
                            <ThresholdSlider
                                label="Lookback Period"
                                value={config.lookbackDays || 30}
                                min={7}
                                max={90}
                                step={1}
                                unit=" days"
                                description="Historical data window for baseline calculation"
                                onChange={(v) => handleConfigChange('lookbackDays', v)}
                            />
                        </div>
                    </div>

                    {/* Granularity */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide">
                            Time Granularity
                        </h4>

                        <div className="flex gap-2">
                            {(['hour', 'day', 'week'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => handleConfigChange('granularity', g)}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        config.granularity === g
                                            ? 'bg-th-accent-primary text-white'
                                            : 'bg-th-bg-elevated text-th-text-secondary hover:bg-th-interactive-hover'
                                    }`}
                                >
                                    {g.charAt(0).toUpperCase() + g.slice(1)}ly
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-th-text-muted">
                            Aggregate data by hour, day, or week for anomaly detection
                        </p>
                    </div>

                    {/* Metrics to Monitor */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide">
                            Metrics to Monitor
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_METRICS.map((metric) => {
                                const isSelected = config.metrics?.includes(metric.value);
                                return (
                                    <button
                                        key={metric.value}
                                        onClick={() => handleMetricToggle(metric.value)}
                                        className={`p-3 rounded-lg border text-left transition-colors ${
                                            isSelected
                                                ? 'bg-th-accent-primary-muted border-th-accent-primary'
                                                : 'bg-th-bg-elevated border-th-border hover:border-th-text-muted'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium ${
                                                isSelected ? 'text-th-accent-primary' : 'text-th-text-secondary'
                                            }`}>
                                                {metric.label}
                                            </span>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-th-accent-primary" />
                                            )}
                                        </div>
                                        <p className="text-xs text-th-text-muted mt-1">
                                            {metric.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-th-border">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 text-th-text-secondary hover:bg-th-interactive-hover rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset to Defaults
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
                                hasChanges
                                    ? 'bg-th-accent-primary text-white hover:bg-th-accent-primary-hover'
                                    : 'bg-th-bg-elevated text-th-text-muted cursor-not-allowed'
                            }`}
                        >
                            {saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Saved!
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-th-bg-elevated rounded-xl">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-th-text-muted flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-th-text-muted space-y-2">
                                <p>
                                    <span className="text-th-text-secondary font-medium">Standard Deviation (σ)</span> measures how far a value deviates from the mean. Higher thresholds = fewer alerts.
                                </p>
                                <p>
                                    Changes apply to future analyses. Re-run analysis from the Analytics page to see updated results.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnomalyConfigPanel;
