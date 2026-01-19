/**
 * SegmentTool - Create user segments from insights
 *
 * Generates segment definitions based on insight data
 */

import type { AIInsight, UserSegment, SegmentFilter } from '../types';

export interface SegmentCreationInput {
  insight: AIInsight;
  projectId: string;
  customName?: string;
  customFilters?: SegmentFilter[];
}

export interface SegmentCreationResult {
  segment: UserSegment;
  success: boolean;
  message: string;
}

/**
 * Generate segment filters based on insight content
 */
function generateFiltersFromInsight(insight: AIInsight): SegmentFilter[] {
  const filters: SegmentFilter[] = [];

  // Generate filters based on category
  switch (insight.category) {
    case 'retention':
      // Segment users with retention issues
      filters.push({
        field: 'days_since_last_session',
        operator: 'gt',
        value: 7,
      });
      break;

    case 'monetization':
      // Segment users based on spending
      if (insight.type === 'opportunity') {
        filters.push({
          field: 'total_spend',
          operator: 'gt',
          value: 0,
        });
        filters.push({
          field: 'session_count',
          operator: 'gt',
          value: 5,
        });
      } else {
        filters.push({
          field: 'total_spend',
          operator: 'eq',
          value: 0,
        });
      }
      break;

    case 'engagement':
      // Segment based on engagement levels
      if (insight.type === 'warning' || insight.type === 'negative') {
        filters.push({
          field: 'sessions_last_7_days',
          operator: 'lt',
          value: 3,
        });
      } else {
        filters.push({
          field: 'sessions_last_7_days',
          operator: 'gte',
          value: 5,
        });
      }
      break;

    case 'progression':
      // Segment based on progression
      filters.push({
        field: 'current_level',
        operator: 'gte',
        value: 1,
      });
      break;

    case 'quality':
      // Segment users experiencing issues
      filters.push({
        field: 'crash_count',
        operator: 'gt',
        value: 0,
      });
      break;
  }

  return filters;
}

/**
 * Create a segment from an insight
 */
export function createSegmentFromInsight(input: SegmentCreationInput): SegmentCreationResult {
  const { insight, projectId, customName, customFilters } = input;

  // Generate segment name
  const name = customName || `Segment: ${insight.title}`;

  // Generate description
  const description = `Auto-generated segment from insight: "${insight.title}". ${insight.recommendation}`;

  // Generate or use custom filters
  const filters = customFilters || generateFiltersFromInsight(insight);

  const segment: UserSegment = {
    id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    name,
    description,
    filters,
    createdAt: new Date().toISOString(),
    createdFrom: insight.id,
  };

  return {
    segment,
    success: true,
    message: `Created segment "${name}" with ${filters.length} filter(s)`,
  };
}

/**
 * Export segment definition as JSON
 */
export function exportSegmentDefinition(segment: UserSegment): string {
  return JSON.stringify(
    {
      name: segment.name,
      description: segment.description,
      filters: segment.filters,
      createdAt: segment.createdAt,
    },
    null,
    2
  );
}

/**
 * Validate segment filters
 */
export function validateSegmentFilters(filters: SegmentFilter[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const filter of filters) {
    if (!filter.field) {
      errors.push('Filter missing field name');
    }
    if (!filter.operator) {
      errors.push('Filter missing operator');
    }
    if (filter.value === undefined) {
      errors.push(`Filter for ${filter.field} missing value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
