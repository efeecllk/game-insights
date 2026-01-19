/**
 * ExportTool - Export insights as markdown and other formats
 */

import type { AIInsight } from '../types';

export type ExportFormat = 'markdown' | 'json' | 'csv' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeEvidence?: boolean;
  includeRecommendations?: boolean;
  groupByCategory?: boolean;
}

/**
 * Export a single insight to markdown
 */
export function insightToMarkdown(insight: AIInsight, options?: Partial<ExportOptions>): string {
  const { includeMetadata = true, includeEvidence = true, includeRecommendations = true } = options || {};

  let md = `## ${getTypeEmoji(insight.type)} ${insight.title}\n\n`;

  if (includeMetadata) {
    md += `**Category:** ${insight.category} | **Priority:** ${insight.priority}/10 | **Impact:** ${insight.businessImpact}\n\n`;
  }

  md += `${insight.description}\n\n`;

  if (includeRecommendations && insight.recommendation) {
    md += `### Recommendation\n${insight.recommendation}\n\n`;
  }

  if (includeEvidence && insight.evidence && insight.evidence.length > 0) {
    md += `### Evidence\n`;
    md += insight.evidence.map((e) => `- ${e}`).join('\n');
    md += '\n\n';
  }

  if (insight.revenueImpact) {
    const sign = insight.revenueImpact.type === 'increase' ? '+' : '-';
    md += `**Revenue Impact:** ${sign}${insight.revenueImpact.percentage}%`;
    if (insight.revenueImpact.estimated) {
      md += ` (~$${insight.revenueImpact.estimated.toLocaleString()})`;
    }
    md += '\n\n';
  }

  md += `---\n\n`;

  return md;
}

/**
 * Export multiple insights to markdown
 */
export function insightsToMarkdown(insights: AIInsight[], options?: Partial<ExportOptions>): string {
  const { groupByCategory = false } = options || {};

  let md = `# AI Analytics Report\n\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n`;
  md += `**Total Insights:** ${insights.length}\n\n`;

  // Summary
  md += `## Summary\n\n`;
  const byCat = groupByCategory ? groupInsightsByCategory(insights) : null;

  if (byCat) {
    md += `| Category | Count | High Impact |\n`;
    md += `|----------|-------|-------------|\n`;
    for (const [category, categoryInsights] of Object.entries(byCat)) {
      const highImpact = categoryInsights.filter((i) => i.businessImpact === 'high').length;
      md += `| ${category} | ${categoryInsights.length} | ${highImpact} |\n`;
    }
    md += '\n';
  }

  md += `---\n\n`;

  // Insights
  if (groupByCategory && byCat) {
    for (const [category, categoryInsights] of Object.entries(byCat)) {
      md += `# ${capitalize(category)}\n\n`;
      for (const insight of categoryInsights) {
        md += insightToMarkdown(insight, options);
      }
    }
  } else {
    md += `# All Insights\n\n`;
    for (const insight of insights) {
      md += insightToMarkdown(insight, options);
    }
  }

  return md;
}

/**
 * Export insights to JSON
 */
export function insightsToJSON(insights: AIInsight[], options?: Partial<ExportOptions>): string {
  const { includeMetadata = true } = options || {};

  const exportData = insights.map((insight) => ({
    id: insight.id,
    type: insight.type,
    category: insight.category,
    title: insight.title,
    description: insight.description,
    recommendation: insight.recommendation,
    priority: insight.priority,
    confidence: insight.confidence,
    businessImpact: insight.businessImpact,
    evidence: insight.evidence,
    tags: insight.tags,
    revenueImpact: insight.revenueImpact,
    ...(includeMetadata && {
      source: insight.source,
      provider: insight.provider,
      model: insight.model,
      generatedAt: insight.generatedAt,
    }),
  }));

  return JSON.stringify({ insights: exportData, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Export insights to CSV
 */
export function insightsToCSV(insights: AIInsight[]): string {
  const headers = [
    'Title',
    'Category',
    'Type',
    'Priority',
    'Confidence',
    'Business Impact',
    'Description',
    'Recommendation',
    'Tags',
  ];

  const rows = insights.map((insight) => [
    escapeCSV(insight.title),
    insight.category,
    insight.type,
    insight.priority.toString(),
    (insight.confidence * 100).toFixed(0) + '%',
    insight.businessImpact,
    escapeCSV(insight.description),
    escapeCSV(insight.recommendation),
    insight.tags.join('; '),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Export insights to HTML
 */
export function insightsToHTML(insights: AIInsight[]): string {
  const styles = `
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { color: #ae5630; }
      .insight { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
      .insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .insight-type { font-size: 20px; }
      .insight-title { font-size: 18px; font-weight: 600; color: #333; }
      .insight-meta { font-size: 12px; color: #666; margin-bottom: 12px; }
      .insight-description { color: #444; margin-bottom: 12px; }
      .insight-recommendation { background: #f5f5f5; padding: 12px; border-radius: 4px; }
      .tag { display: inline-block; padding: 2px 8px; background: #e8e8e8; border-radius: 4px; font-size: 12px; margin-right: 4px; }
    </style>
  `;

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Analytics Report</title>
  ${styles}
</head>
<body>
  <h1>AI Analytics Report</h1>
  <p>Generated: ${new Date().toLocaleString()} | ${insights.length} insights</p>
`;

  for (const insight of insights) {
    html += `
  <div class="insight">
    <div class="insight-header">
      <span class="insight-type">${getTypeEmoji(insight.type)}</span>
      <span class="insight-title">${escapeHTML(insight.title)}</span>
    </div>
    <div class="insight-meta">
      ${insight.category} | Priority: ${insight.priority}/10 | ${insight.businessImpact} impact
    </div>
    <div class="insight-description">${escapeHTML(insight.description)}</div>
    <div class="insight-recommendation">
      <strong>Recommendation:</strong> ${escapeHTML(insight.recommendation)}
    </div>
    <div style="margin-top: 8px;">
      ${insight.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
    </div>
  </div>
`;
  }

  html += `</body></html>`;
  return html;
}

/**
 * Download insights as a file
 */
export function downloadInsights(insights: AIInsight[], options: ExportOptions): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  const dateStr = new Date().toISOString().split('T')[0];

  switch (options.format) {
    case 'markdown':
      content = insightsToMarkdown(insights, options);
      filename = `insights-${dateStr}.md`;
      mimeType = 'text/markdown';
      break;

    case 'json':
      content = insightsToJSON(insights, options);
      filename = `insights-${dateStr}.json`;
      mimeType = 'application/json';
      break;

    case 'csv':
      content = insightsToCSV(insights);
      filename = `insights-${dateStr}.csv`;
      mimeType = 'text/csv';
      break;

    case 'html':
      content = insightsToHTML(insights);
      filename = `insights-${dateStr}.html`;
      mimeType = 'text/html';
      break;

    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Helper functions

function getTypeEmoji(type: AIInsight['type']): string {
  const emojis: Record<AIInsight['type'], string> = {
    positive: '+',
    negative: '-',
    warning: '!',
    opportunity: '*',
    neutral: '~',
  };
  return emojis[type] || '~';
}

function groupInsightsByCategory(insights: AIInsight[]): Record<string, AIInsight[]> {
  return insights.reduce(
    (acc, insight) => {
      if (!acc[insight.category]) {
        acc[insight.category] = [];
      }
      acc[insight.category].push(insight);
      return acc;
    },
    {} as Record<string, AIInsight[]>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
