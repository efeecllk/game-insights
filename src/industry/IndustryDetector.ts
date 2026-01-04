/**
 * IndustryDetector - Detects industry type from data schema
 *
 * Analyzes column names and data patterns to determine which industry
 * the data belongs to. Uses semantic type matching and weighted scoring.
 */

import {
  IndustryType,
  DetectionResult,
  ColumnMeaning,
  IndustryPack,
  DetectionIndicator,
} from './types';
import { IndustryRegistry } from './IndustryRegistry';

export interface DetectorConfig {
  /** Minimum confidence threshold for primary detection */
  minConfidence?: number;
  /** Threshold below which detection is considered ambiguous */
  ambiguityThreshold?: number;
  /** Maximum number of alternatives to return */
  maxAlternatives?: number;
}

const DEFAULT_CONFIG: Required<DetectorConfig> = {
  minConfidence: 0.3,
  ambiguityThreshold: 0.2,
  maxAlternatives: 3,
};

export class IndustryDetector {
  private registry: IndustryRegistry;
  private config: Required<DetectorConfig>;

  constructor(registry?: IndustryRegistry, config?: DetectorConfig) {
    this.registry = registry || IndustryRegistry.getInstance();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect industry from column meanings
   */
  detect(columns: ColumnMeaning[]): DetectionResult {
    const packs = this.registry.getAllPacks();

    if (packs.length === 0) {
      return this.createEmptyResult();
    }

    // Score each industry
    const scores = this.calculateScores(columns, packs);

    // Sort by score
    const sortedScores = Object.entries(scores)
      .map(([industry, data]) => ({
        industry: industry as IndustryType,
        ...data,
      }))
      .sort((a, b) => b.score - a.score);

    if (sortedScores.length === 0 || sortedScores[0].score === 0) {
      return this.createEmptyResult();
    }

    // Normalize scores to confidence values
    const maxScore = sortedScores[0].score;
    const results = sortedScores.map((s) => ({
      industry: s.industry,
      subCategory: s.subCategory,
      confidence: maxScore > 0 ? s.score / maxScore : 0,
      reasons: s.reasons,
    }));

    // Determine if ambiguous
    const isAmbiguous =
      results.length > 1 &&
      results[1].confidence > 1 - this.config.ambiguityThreshold;

    // Build detected semantic types
    const detectedSemanticTypes = this.buildDetectedTypes(columns, packs);

    return {
      primary: results[0],
      alternatives: results.slice(1, this.config.maxAlternatives + 1),
      isAmbiguous,
      detectedSemanticTypes,
    };
  }

  /**
   * Detect industry with sub-category refinement
   */
  detectWithSubCategory(
    columns: ColumnMeaning[],
    industryHint?: IndustryType
  ): DetectionResult {
    const baseResult = this.detect(columns);

    // If we have a hint, try to match sub-category
    const targetIndustry = industryHint || baseResult.primary.industry;
    const pack = this.registry.getPack(targetIndustry);

    if (!pack || pack.subCategories.length <= 1) {
      return baseResult;
    }

    // Score sub-categories
    const subCategoryScores = this.scoreSubCategories(columns, pack);

    if (subCategoryScores.length > 0) {
      baseResult.primary.subCategory = subCategoryScores[0].id;
    }

    return baseResult;
  }

  /**
   * Calculate detection scores for each industry
   */
  private calculateScores(
    columns: ColumnMeaning[],
    packs: IndustryPack[]
  ): Record<string, { score: number; reasons: string[]; subCategory?: string }> {
    const scores: Record<string, { score: number; reasons: string[]; subCategory?: string }> = {};

    for (const pack of packs) {
      const { score, reasons } = this.scorePack(columns, pack);
      scores[pack.id] = { score, reasons };
    }

    return scores;
  }

  /**
   * Score a single pack against the columns
   */
  private scorePack(
    columns: ColumnMeaning[],
    pack: IndustryPack
  ): { score: number; reasons: string[] } {
    let totalScore = 0;
    const reasons: string[] = [];

    // Map column meanings to semantic types
    const foundTypes = new Map<string, number>();

    for (const col of columns) {
      // Check if the column meaning matches any semantic type in this pack
      const matchingType = pack.semanticTypes.find((st) =>
        st.patterns.some(
          (p) =>
            col.meaning.toLowerCase().includes(p.toLowerCase()) ||
            p.toLowerCase().includes(col.meaning.toLowerCase()) ||
            col.column.toLowerCase().includes(p.toLowerCase())
        )
      );

      if (matchingType) {
        const count = foundTypes.get(matchingType.type) || 0;
        foundTypes.set(matchingType.type, count + 1);
      }
    }

    // Score based on detection indicators
    for (const indicator of pack.detectionIndicators) {
      const matchCount = indicator.types.filter((t) => foundTypes.has(t)).length;
      const requiredCount = indicator.minCount || indicator.types.length;

      if (matchCount >= requiredCount) {
        totalScore += indicator.weight * matchCount;

        if (indicator.reason) {
          reasons.push(indicator.reason);
        } else {
          reasons.push(`Found ${matchCount} matching types: ${indicator.types.slice(0, 3).join(', ')}`);
        }
      }
    }

    // Bonus for high-priority semantic types
    for (const [typeId, _count] of foundTypes) {
      const semanticType = pack.semanticTypes.find((st) => st.type === typeId);
      if (semanticType && semanticType.priority >= 8) {
        totalScore += 2;
        reasons.push(`Strong indicator: ${semanticType.type}`);
      }
    }

    return { score: totalScore, reasons };
  }

  /**
   * Score sub-categories within a pack
   */
  private scoreSubCategories(
    columns: ColumnMeaning[],
    pack: IndustryPack
  ): Array<{ id: string; score: number }> {
    const scores: Array<{ id: string; score: number }> = [];

    for (const subCat of pack.subCategories) {
      let score = 0;

      // Check metrics specific to this sub-category
      const subMetrics = pack.metrics.filter(
        (m) => m.subCategories?.includes(subCat.id)
      );

      for (const metric of subMetrics) {
        const requiredTypes = metric.formula.requiredTypes || [];
        const hasRequired = requiredTypes.every((type) =>
          columns.some(
            (col) =>
              col.meaning.toLowerCase().includes(type.toLowerCase()) ||
              col.column.toLowerCase().includes(type.toLowerCase())
          )
        );

        if (hasRequired) {
          score += 1;
        }
      }

      // Check funnels specific to this sub-category
      const subFunnels = pack.funnels.filter(
        (f) => f.subCategories?.includes(subCat.id)
      );

      score += subFunnels.length * 0.5;

      scores.push({ id: subCat.id, score });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Build the list of detected semantic types from columns
   */
  private buildDetectedTypes(
    columns: ColumnMeaning[],
    packs: IndustryPack[]
  ): Array<{ column: string; type: string; confidence: number }> {
    const results: Array<{ column: string; type: string; confidence: number }> = [];

    for (const col of columns) {
      for (const pack of packs) {
        for (const semanticType of pack.semanticTypes) {
          for (const pattern of semanticType.patterns) {
            const colLower = col.column.toLowerCase();
            const meaningLower = col.meaning.toLowerCase();
            const patternLower = pattern.toLowerCase();

            let confidence = 0;

            if (meaningLower === patternLower || colLower === patternLower) {
              confidence = 1.0;
            } else if (
              meaningLower.includes(patternLower) ||
              colLower.includes(patternLower)
            ) {
              confidence = 0.8;
            } else if (
              patternLower.includes(meaningLower) ||
              patternLower.includes(colLower)
            ) {
              confidence = 0.6;
            }

            if (confidence > 0) {
              results.push({
                column: col.column,
                type: semanticType.type,
                confidence: confidence * col.confidence,
              });
            }
          }
        }
      }
    }

    // Deduplicate and keep highest confidence per column
    const uniqueResults = new Map<string, { column: string; type: string; confidence: number }>();

    for (const result of results) {
      const key = `${result.column}:${result.type}`;
      const existing = uniqueResults.get(key);

      if (!existing || result.confidence > existing.confidence) {
        uniqueResults.set(key, result);
      }
    }

    return Array.from(uniqueResults.values());
  }

  /**
   * Create an empty detection result
   */
  private createEmptyResult(): DetectionResult {
    return {
      primary: {
        industry: 'custom',
        confidence: 0,
        reasons: ['No industry packs registered or no matching indicators found'],
      },
      alternatives: [],
      isAmbiguous: false,
      detectedSemanticTypes: [],
    };
  }
}

/**
 * Factory function for creating a detector
 */
export function createIndustryDetector(config?: DetectorConfig): IndustryDetector {
  return new IndustryDetector(IndustryRegistry.getInstance(), config);
}
