/**
 * AlertTool - Create metric alerts from insights
 *
 * Generates alert configurations based on insight data
 */

import type { AIInsight, MetricAlert } from '../types';

export interface AlertCreationInput {
  insight: AIInsight;
  projectId: string;
  customMetric?: string;
  customCondition?: 'above' | 'below' | 'change';
  customThreshold?: number;
}

export interface AlertCreationResult {
  alert: MetricAlert;
  success: boolean;
  message: string;
}

/**
 * Infer alert configuration from insight
 */
function inferAlertConfig(insight: AIInsight): {
  metricName: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
} {
  // Use metric name if provided
  let metricName = insight.metricName || '';
  let condition: 'above' | 'below' | 'change' = 'change';
  let threshold = 0;

  // Infer based on category and type
  switch (insight.category) {
    case 'retention':
      metricName = metricName || 'd7_retention';
      if (insight.type === 'warning' || insight.type === 'negative') {
        condition = 'below';
        threshold = 20; // Alert if D7 retention drops below 20%
      } else {
        condition = 'above';
        threshold = 30;
      }
      break;

    case 'monetization':
      metricName = metricName || 'arpu';
      if (insight.type === 'warning' || insight.type === 'negative') {
        condition = 'below';
        threshold = 1; // Alert if ARPU drops below $1
      } else {
        condition = 'change';
        threshold = 10; // Alert on 10% change
      }
      break;

    case 'engagement':
      metricName = metricName || 'dau';
      if (insight.type === 'warning' || insight.type === 'negative') {
        condition = 'below';
        threshold = 1000; // Alert if DAU drops below 1000
      } else {
        condition = 'change';
        threshold = 15;
      }
      break;

    case 'progression':
      metricName = metricName || 'level_completion_rate';
      if (insight.type === 'warning') {
        condition = 'below';
        threshold = 50; // Alert if completion rate below 50%
      } else {
        condition = 'change';
        threshold = 10;
      }
      break;

    case 'quality':
      metricName = metricName || 'crash_rate';
      condition = 'above';
      threshold = 1; // Alert if crash rate above 1%
      break;

    default:
      metricName = metricName || insight.category;
      condition = 'change';
      threshold = 10;
  }

  return { metricName, condition, threshold };
}

/**
 * Create an alert from an insight
 */
export function createAlertFromInsight(input: AlertCreationInput): AlertCreationResult {
  const { insight, projectId, customMetric, customCondition, customThreshold } = input;

  // Infer or use custom configuration
  const inferred = inferAlertConfig(insight);
  const metricName = customMetric || inferred.metricName;
  const condition = customCondition || inferred.condition;
  const threshold = customThreshold ?? inferred.threshold;

  const alert: MetricAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    metricName,
    condition,
    threshold,
    enabled: true,
    createdAt: new Date().toISOString(),
    createdFrom: insight.id,
  };

  const conditionText =
    condition === 'above'
      ? `goes above ${threshold}`
      : condition === 'below'
        ? `drops below ${threshold}`
        : `changes by ${threshold}%`;

  return {
    alert,
    success: true,
    message: `Created alert for "${metricName}" when it ${conditionText}`,
  };
}

/**
 * Format alert for display
 */
export function formatAlertDescription(alert: MetricAlert): string {
  const conditionText =
    alert.condition === 'above'
      ? `exceeds ${alert.threshold}`
      : alert.condition === 'below'
        ? `falls below ${alert.threshold}`
        : `changes by ${alert.threshold}%`;

  return `Alert when ${alert.metricName} ${conditionText}`;
}

/**
 * Check if a value triggers an alert
 */
export function checkAlertCondition(
  alert: MetricAlert,
  currentValue: number,
  previousValue?: number
): boolean {
  if (!alert.enabled) return false;

  switch (alert.condition) {
    case 'above':
      return currentValue > alert.threshold;

    case 'below':
      return currentValue < alert.threshold;

    case 'change':
      if (previousValue === undefined) return false;
      const changePercent = Math.abs((currentValue - previousValue) / previousValue) * 100;
      return changePercent > alert.threshold;

    default:
      return false;
  }
}

/**
 * Export alert configuration
 */
export function exportAlertDefinition(alert: MetricAlert): string {
  return JSON.stringify(
    {
      metricName: alert.metricName,
      condition: alert.condition,
      threshold: alert.threshold,
      enabled: alert.enabled,
    },
    null,
    2
  );
}
