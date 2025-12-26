/**
 * Natural Language Report Generator
 * Auto-generates readable analytics reports
 * Phase 5: Advanced AI & Automation
 */

import type { GameCategory } from '../types';
import type { Recommendation } from './RecommendationEngine';
import type { Anomaly } from './ml/types';

// ============================================================================
// Types
// ============================================================================

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReportFormat = 'markdown' | 'html' | 'plain';

export interface ReportMetrics {
    // User Metrics
    dau: number;
    dauChange: number;
    mau: number;
    mauChange: number;
    newUsers: number;
    returningUsers: number;

    // Retention
    d1Retention: number;
    d1RetentionChange: number;
    d7Retention: number;
    d7RetentionChange: number;
    d30Retention: number;

    // Revenue
    revenue: number;
    revenueChange: number;
    arpu: number;
    arppu: number;
    payerConversionRate: number;

    // Engagement
    avgSessionLength: number;
    avgSessionsPerDay: number;
    avgLevel: number;

    // Predictions
    revenueProjection30d?: number;
    atRiskUsers?: number;
    churnRate?: number;
}

export interface ReportData {
    type: ReportType;
    gameType: GameCategory;
    gameName: string;
    period: {
        start: string;
        end: string;
    };
    metrics: ReportMetrics;
    anomalies: Anomaly[];
    recommendations: Recommendation[];
    highlights: string[];
    concerns: string[];
}

export interface GeneratedReport {
    id: string;
    type: ReportType;
    title: string;
    content: string;
    format: ReportFormat;
    summary: string;
    createdAt: string;
    data: ReportData;
}

// ============================================================================
// Report Templates
// ============================================================================

const HEALTH_THRESHOLDS = {
    excellent: { d1Retention: 0.45, d7Retention: 0.20, payerConversion: 0.05 },
    good: { d1Retention: 0.35, d7Retention: 0.15, payerConversion: 0.03 },
    average: { d1Retention: 0.25, d7Retention: 0.10, payerConversion: 0.02 },
    poor: { d1Retention: 0.15, d7Retention: 0.05, payerConversion: 0.01 },
};

// ============================================================================
// Report Generator Class
// ============================================================================

export class ReportGenerator {
    /**
     * Generate a complete report
     */
    generateReport(data: ReportData, format: ReportFormat = 'markdown'): GeneratedReport {
        const title = this.generateTitle(data);
        const content = this.generateContent(data, format);
        const summary = this.generateSummary(data);

        return {
            id: `report-${Date.now()}`,
            type: data.type,
            title,
            content,
            format,
            summary,
            createdAt: new Date().toISOString(),
            data,
        };
    }

    /**
     * Generate daily digest
     */
    generateDailyDigest(data: ReportData): GeneratedReport {
        return this.generateReport({ ...data, type: 'daily' });
    }

    /**
     * Generate weekly summary
     */
    generateWeeklySummary(data: ReportData): GeneratedReport {
        return this.generateReport({ ...data, type: 'weekly' });
    }

    /**
     * Generate monthly review
     */
    generateMonthlyReview(data: ReportData): GeneratedReport {
        return this.generateReport({ ...data, type: 'monthly' });
    }

    // ========================================================================
    // Content Generation
    // ========================================================================

    private generateTitle(data: ReportData): string {
        const periodLabel = {
            daily: 'Daily Digest',
            weekly: 'Weekly Summary',
            monthly: 'Monthly Review',
            custom: 'Analytics Report',
        }[data.type];

        return `${data.gameName} - ${periodLabel}`;
    }

    private generateSummary(data: ReportData): string {
        const health = this.assessHealth(data.metrics);
        const trend = this.assessTrend(data.metrics);

        return `Overall health: ${health}. ${trend}. ${data.highlights.length} highlights, ${data.concerns.length} concerns.`;
    }

    private generateContent(data: ReportData, format: ReportFormat): string {
        const sections: string[] = [];

        // Header
        sections.push(this.generateHeader(data, format));

        // Health Summary
        sections.push(this.generateHealthSection(data, format));

        // Key Metrics
        sections.push(this.generateMetricsSection(data, format));

        // Highlights
        if (data.highlights.length > 0) {
            sections.push(this.generateHighlightsSection(data, format));
        }

        // Concerns
        if (data.concerns.length > 0) {
            sections.push(this.generateConcernsSection(data, format));
        }

        // Anomalies
        if (data.anomalies.length > 0) {
            sections.push(this.generateAnomaliesSection(data, format));
        }

        // Predictions
        sections.push(this.generatePredictionsSection(data, format));

        // Recommendations
        if (data.recommendations.length > 0) {
            sections.push(this.generateRecommendationsSection(data, format));
        }

        // Footer
        sections.push(this.generateFooter(data, format));

        return sections.join('\n\n');
    }

    private generateHeader(data: ReportData, format: ReportFormat): string {
        const periodText = this.formatPeriod(data.period);

        if (format === 'markdown') {
            return `# ${data.gameName} Analytics Report\n## ${periodText}`;
        } else if (format === 'html') {
            return `<h1>${data.gameName} Analytics Report</h1>\n<h2>${periodText}</h2>`;
        }
        return `${data.gameName} Analytics Report\n${periodText}\n${'='.repeat(40)}`;
    }

    private generateHealthSection(data: ReportData, format: ReportFormat): string {
        const health = this.assessHealth(data.metrics);
        const healthEmoji = {
            'Excellent': '🟢',
            'Good': '🟢',
            'Average': '🟡',
            'Needs Attention': '🟠',
            'Critical': '🔴',
        }[health];

        const healthDescription = this.getHealthDescription(data);

        if (format === 'markdown') {
            return `**Overall Health: ${healthEmoji} ${health}**\n\n${healthDescription}`;
        } else if (format === 'html') {
            return `<p><strong>Overall Health: ${healthEmoji} ${health}</strong></p>\n<p>${healthDescription}</p>`;
        }
        return `Overall Health: ${health}\n\n${healthDescription}`;
    }

    private generateMetricsSection(data: ReportData, format: ReportFormat): string {
        const m = data.metrics;
        const lines: string[] = [];

        if (format === 'markdown') {
            lines.push('### Key Metrics\n');
            lines.push('| Metric | Value | Change |');
            lines.push('|--------|-------|--------|');
            lines.push(`| DAU | ${this.formatNumber(m.dau)} | ${this.formatChange(m.dauChange)} |`);
            lines.push(`| Revenue | ${this.formatCurrency(m.revenue)} | ${this.formatChange(m.revenueChange)} |`);
            lines.push(`| D1 Retention | ${this.formatPercent(m.d1Retention)} | ${this.formatChange(m.d1RetentionChange)} |`);
            lines.push(`| D7 Retention | ${this.formatPercent(m.d7Retention)} | ${this.formatChange(m.d7RetentionChange)} |`);
            lines.push(`| ARPU | ${this.formatCurrency(m.arpu)} | - |`);
            lines.push(`| Payer Conversion | ${this.formatPercent(m.payerConversionRate)} | - |`);
        } else if (format === 'html') {
            lines.push('<h3>Key Metrics</h3>');
            lines.push('<table><tr><th>Metric</th><th>Value</th><th>Change</th></tr>');
            lines.push(`<tr><td>DAU</td><td>${this.formatNumber(m.dau)}</td><td>${this.formatChange(m.dauChange)}</td></tr>`);
            lines.push(`<tr><td>Revenue</td><td>${this.formatCurrency(m.revenue)}</td><td>${this.formatChange(m.revenueChange)}</td></tr>`);
            lines.push(`<tr><td>D1 Retention</td><td>${this.formatPercent(m.d1Retention)}</td><td>${this.formatChange(m.d1RetentionChange)}</td></tr>`);
            lines.push('</table>');
        } else {
            lines.push('Key Metrics:');
            lines.push(`  DAU: ${this.formatNumber(m.dau)} (${this.formatChange(m.dauChange)})`);
            lines.push(`  Revenue: ${this.formatCurrency(m.revenue)} (${this.formatChange(m.revenueChange)})`);
            lines.push(`  D1 Retention: ${this.formatPercent(m.d1Retention)}`);
            lines.push(`  D7 Retention: ${this.formatPercent(m.d7Retention)}`);
        }

        return lines.join('\n');
    }

    private generateHighlightsSection(data: ReportData, format: ReportFormat): string {
        if (format === 'markdown') {
            const items = data.highlights.map(h => `- ✅ ${h}`).join('\n');
            return `### Highlights\n\n${items}`;
        } else if (format === 'html') {
            const items = data.highlights.map(h => `<li>✅ ${h}</li>`).join('\n');
            return `<h3>Highlights</h3>\n<ul>${items}</ul>`;
        }
        const items = data.highlights.map(h => `  + ${h}`).join('\n');
        return `Highlights:\n${items}`;
    }

    private generateConcernsSection(data: ReportData, format: ReportFormat): string {
        if (format === 'markdown') {
            const items = data.concerns.map(c => `- ⚠️ ${c}`).join('\n');
            return `### Concerns\n\n${items}`;
        } else if (format === 'html') {
            const items = data.concerns.map(c => `<li>⚠️ ${c}</li>`).join('\n');
            return `<h3>Concerns</h3>\n<ul>${items}</ul>`;
        }
        const items = data.concerns.map(c => `  ! ${c}`).join('\n');
        return `Concerns:\n${items}`;
    }

    private generateAnomaliesSection(data: ReportData, format: ReportFormat): string {
        const anomalyLines = data.anomalies.slice(0, 3).map(a => {
            const icon = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟠' : '🟡';
            return `${icon} **${a.metric}**: ${a.value} (expected ${a.expectedValue})`;
        });

        if (format === 'markdown') {
            return `### Anomalies Detected\n\n${anomalyLines.join('\n')}`;
        } else if (format === 'html') {
            const items = anomalyLines.map(a => `<li>${a}</li>`).join('\n');
            return `<h3>Anomalies Detected</h3>\n<ul>${items}</ul>`;
        }
        return `Anomalies:\n${anomalyLines.join('\n')}`;
    }

    private generatePredictionsSection(data: ReportData, format: ReportFormat): string {
        const m = data.metrics;
        const predictions: string[] = [];

        if (m.revenueProjection30d) {
            predictions.push(`Next 30-day revenue projection: ${this.formatCurrency(m.revenueProjection30d)}`);
        }
        if (m.atRiskUsers) {
            predictions.push(`At-risk users: ${m.atRiskUsers} (${this.formatPercent(m.churnRate || 0)} churn rate)`);
        }

        if (predictions.length === 0) {
            return '';
        }

        if (format === 'markdown') {
            return `### Predictions\n\n${predictions.map(p => `- 🔮 ${p}`).join('\n')}`;
        } else if (format === 'html') {
            return `<h3>Predictions</h3>\n<ul>${predictions.map(p => `<li>🔮 ${p}</li>`).join('\n')}</ul>`;
        }
        return `Predictions:\n${predictions.map(p => `  * ${p}`).join('\n')}`;
    }

    private generateRecommendationsSection(data: ReportData, format: ReportFormat): string {
        const topRecs = data.recommendations.slice(0, 3);

        if (format === 'markdown') {
            const items = topRecs.map((r, i) => {
                const priorityIcon = r.priority === 'critical' ? '🔴' : r.priority === 'high' ? '🟠' : '🟡';
                return `${i + 1}. ${priorityIcon} **${r.title}**\n   ${r.description}`;
            }).join('\n\n');
            return `### Recommendations\n\n${items}`;
        } else if (format === 'html') {
            const items = topRecs.map(r => `<li><strong>${r.title}</strong>: ${r.description}</li>`).join('\n');
            return `<h3>Recommendations</h3>\n<ol>${items}</ol>`;
        }
        const items = topRecs.map((r, i) => `  ${i + 1}. ${r.title}: ${r.description}`).join('\n');
        return `Recommendations:\n${items}`;
    }

    private generateFooter(_data: ReportData, format: ReportFormat): string {
        const timestamp = new Date().toLocaleString();

        if (format === 'markdown') {
            return `---\n*Generated by Game Insights on ${timestamp}*`;
        } else if (format === 'html') {
            return `<hr><p><em>Generated by Game Insights on ${timestamp}</em></p>`;
        }
        return `\n---\nGenerated by Game Insights on ${timestamp}`;
    }

    // ========================================================================
    // Analysis Helpers
    // ========================================================================

    private assessHealth(metrics: ReportMetrics): string {
        const scores: number[] = [];

        // D1 Retention score
        if (metrics.d1Retention >= HEALTH_THRESHOLDS.excellent.d1Retention) scores.push(4);
        else if (metrics.d1Retention >= HEALTH_THRESHOLDS.good.d1Retention) scores.push(3);
        else if (metrics.d1Retention >= HEALTH_THRESHOLDS.average.d1Retention) scores.push(2);
        else if (metrics.d1Retention >= HEALTH_THRESHOLDS.poor.d1Retention) scores.push(1);
        else scores.push(0);

        // D7 Retention score
        if (metrics.d7Retention >= HEALTH_THRESHOLDS.excellent.d7Retention) scores.push(4);
        else if (metrics.d7Retention >= HEALTH_THRESHOLDS.good.d7Retention) scores.push(3);
        else if (metrics.d7Retention >= HEALTH_THRESHOLDS.average.d7Retention) scores.push(2);
        else if (metrics.d7Retention >= HEALTH_THRESHOLDS.poor.d7Retention) scores.push(1);
        else scores.push(0);

        // Trend scores
        if (metrics.dauChange > 5) scores.push(4);
        else if (metrics.dauChange > 0) scores.push(3);
        else if (metrics.dauChange > -5) scores.push(2);
        else scores.push(1);

        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avg >= 3.5) return 'Excellent';
        if (avg >= 2.5) return 'Good';
        if (avg >= 1.5) return 'Average';
        if (avg >= 0.5) return 'Needs Attention';
        return 'Critical';
    }

    private assessTrend(metrics: ReportMetrics): string {
        const trends: string[] = [];

        if (metrics.dauChange > 10) trends.push('DAU growing strongly');
        else if (metrics.dauChange > 0) trends.push('DAU trending up');
        else if (metrics.dauChange < -10) trends.push('DAU declining significantly');
        else if (metrics.dauChange < 0) trends.push('DAU trending down');

        if (metrics.revenueChange > 10) trends.push('revenue up');
        else if (metrics.revenueChange < -10) trends.push('revenue down');

        if (trends.length === 0) return 'Metrics are stable';
        return trends.join(', ');
    }

    private getHealthDescription(data: ReportData): string {
        const m = data.metrics;
        const parts: string[] = [];

        // DAU commentary
        if (m.dauChange > 10) {
            parts.push(`Your game saw ${m.dauChange.toFixed(0)}% DAU growth this period.`);
        } else if (m.dauChange < -10) {
            parts.push(`DAU declined ${Math.abs(m.dauChange).toFixed(0)}% this period.`);
        } else {
            parts.push(`DAU remained stable at ${this.formatNumber(m.dau)}.`);
        }

        // Retention commentary
        if (m.d1Retention >= 0.4) {
            parts.push(`D1 retention at ${this.formatPercent(m.d1Retention)} is excellent.`);
        } else if (m.d1Retention >= 0.3) {
            parts.push(`D1 retention at ${this.formatPercent(m.d1Retention)} is solid.`);
        } else {
            parts.push(`D1 retention at ${this.formatPercent(m.d1Retention)} needs improvement.`);
        }

        // Revenue commentary
        if (m.revenue > 0) {
            parts.push(`Total revenue: ${this.formatCurrency(m.revenue)}.`);
        }

        return parts.join(' ');
    }

    // ========================================================================
    // Formatting Helpers
    // ========================================================================

    private formatPeriod(period: { start: string; end: string }): string {
        const start = new Date(period.start);
        const end = new Date(period.end);

        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

        if (start.toDateString() === end.toDateString()) {
            return start.toLocaleDateString('en-US', options);
        }

        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
    }

    private formatNumber(value: number): string {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(0);
    }

    private formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    private formatPercent(value: number): string {
        return `${(value * 100).toFixed(1)}%`;
    }

    private formatChange(change: number): string {
        if (change > 0) return `+${change.toFixed(1)}%`;
        if (change < 0) return `${change.toFixed(1)}%`;
        return '0%';
    }

    // ========================================================================
    // Auto-generate Highlights and Concerns
    // ========================================================================

    generateHighlights(metrics: ReportMetrics): string[] {
        const highlights: string[] = [];

        if (metrics.dauChange > 10) {
            highlights.push(`DAU grew ${metrics.dauChange.toFixed(0)}% this period`);
        }
        if (metrics.d1Retention >= 0.4) {
            highlights.push(`D1 retention at ${this.formatPercent(metrics.d1Retention)} is above average`);
        }
        if (metrics.revenueChange > 10) {
            highlights.push(`Revenue increased ${metrics.revenueChange.toFixed(0)}%`);
        }
        if (metrics.payerConversionRate > 0.04) {
            highlights.push(`Payer conversion at ${this.formatPercent(metrics.payerConversionRate)} is strong`);
        }
        if (metrics.d7Retention > 0.18) {
            highlights.push(`D7 retention exceeds industry benchmark`);
        }

        return highlights;
    }

    generateConcerns(metrics: ReportMetrics): string[] {
        const concerns: string[] = [];

        if (metrics.dauChange < -10) {
            concerns.push(`DAU dropped ${Math.abs(metrics.dauChange).toFixed(0)}% - investigate cause`);
        }
        if (metrics.d1Retention < 0.25) {
            concerns.push(`D1 retention at ${this.formatPercent(metrics.d1Retention)} is below target`);
        }
        if (metrics.revenueChange < -15) {
            concerns.push(`Revenue declined ${Math.abs(metrics.revenueChange).toFixed(0)}%`);
        }
        if (metrics.d7Retention < 0.10) {
            concerns.push(`D7 retention needs urgent attention`);
        }
        if (metrics.atRiskUsers && metrics.atRiskUsers > 100) {
            concerns.push(`${metrics.atRiskUsers} users at high churn risk`);
        }

        return concerns;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const reportGenerator = new ReportGenerator();
