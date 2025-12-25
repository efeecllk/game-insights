/**
 * FunnelPreview Component
 * Displays detected funnels with step visualization
 */

import { AlertCircle } from 'lucide-react';
import { DetectedFunnel } from '../../ai/FunnelDetector';

interface FunnelPreviewProps {
    funnel: DetectedFunnel;
    className?: string;
}

export function FunnelPreview({ funnel, className }: FunnelPreviewProps) {
    const maxValue = Math.max(...funnel.steps.map(s => s.userCount));

    return (
        <div className={`bg-white rounded-xl border border-gray-200 ${className ?? ''}`}>
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">{funnel.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{funnel.type} funnel</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-violet-600">
                            {(funnel.completionRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">completion rate</div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-2">
                {funnel.steps.map((step, index) => {
                    const widthPercent = (step.userCount / maxValue) * 100;
                    const isBottleneck = funnel.bottleneck?.step === step.name;

                    return (
                        <div key={index}>
                            {/* Step */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">{step.name}</span>
                                            {isBottleneck && (
                                                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    bottleneck
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {step.userCount.toLocaleString()} ({step.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                isBottleneck
                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                    : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                                            }`}
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Connector arrow */}
                            {index < funnel.steps.length - 1 && (
                                <div className="flex items-center ml-9 my-1">
                                    <div className="flex-1 border-l-2 border-dashed border-gray-200 h-4" />
                                    <div className="text-xs text-gray-400 px-2">
                                        -{step.dropOffRate.toFixed(0)}% drop-off
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottleneck recommendations */}
            {funnel.bottleneck && funnel.bottleneck.recommendations.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg">
                        <div className="text-xs font-medium text-violet-700 mb-1">Recommendation</div>
                        <p className="text-sm text-violet-900">{funnel.bottleneck.recommendations[0]}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FunnelPreview;
