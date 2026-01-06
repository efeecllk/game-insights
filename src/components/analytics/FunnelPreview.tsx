/**
 * FunnelPreview Component - Obsidian Analytics Design
 *
 * Premium funnel visualization with:
 * - Glassmorphism container
 * - Claude orange gradient bars
 * - Bottleneck highlighting
 * - Dark theme styling
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
        <div className={`relative group ${className ?? ''}`}>
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/5 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Card container */}
            <div className="relative bg-slate-900  rounded-2xl border border-slate-800 overflow-hidden">
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                <div className="relative">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-display font-semibold text-white">{funnel.name}</h3>
                                <p className="text-sm text-slate-500 mt-0.5 capitalize">{funnel.type} funnel</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-display font-bold text-[#DA7756]">
                                    {(funnel.completionRate * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">completion rate</div>
                            </div>
                        </div>
                    </div>

                    {/* Funnel Steps */}
                    <div className="p-4 space-y-2">
                        {funnel.steps.map((step, index) => {
                            const widthPercent = (step.userCount / maxValue) * 100;
                            const isBottleneck = funnel.bottleneck?.step === step.name;

                            return (
                                <div key={index}>
                                    {/* Step */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                            isBottleneck
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-white">{step.name}</span>
                                                    {isBottleneck && (
                                                        <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            bottleneck
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-400 font-mono">
                                                    {step.userCount.toLocaleString()} ({step.percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        isBottleneck
                                                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                            : 'bg-[#DA7756]'
                                                    }`}
                                                    style={{ width: `${widthPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connector arrow */}
                                    {index < funnel.steps.length - 1 && (
                                        <div className="flex items-center ml-9 my-1">
                                            <div className="flex-1 border-l-2 border-dashed border-slate-700 h-4" />
                                            <div className="text-xs text-slate-600 px-2 font-mono">
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
                            <div className="p-3 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-xl">
                                <div className="text-xs font-medium text-[#DA7756] mb-1">Recommendation</div>
                                <p className="text-sm text-slate-300">{funnel.bottleneck.recommendations[0]}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FunnelPreview;
