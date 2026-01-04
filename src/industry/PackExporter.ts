/**
 * PackExporter - Import/Export industry packs
 *
 * Provides functionality to export packs to JSON and import
 * them back, enabling sharing and customization of industry packs.
 */

import { IndustryPack } from './types';

/**
 * Pack export metadata
 */
export interface PackExportMetadata {
  exportedAt: string;
  exportVersion: string;
  author?: string;
  description?: string;
  homepage?: string;
  tags?: string[];
}

/**
 * Exported pack structure
 */
export interface ExportedPack {
  metadata: PackExportMetadata;
  pack: IndustryPack;
  checksum: string;
}

/**
 * Import validation result
 */
export interface ImportValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pack?: IndustryPack;
}

const EXPORT_VERSION = '1.0.0';

export class PackExporter {
  /**
   * Export a pack to JSON string
   */
  static async exportPack(
    pack: IndustryPack,
    options?: Partial<PackExportMetadata>
  ): Promise<string> {
    const metadata: PackExportMetadata = {
      exportedAt: new Date().toISOString(),
      exportVersion: EXPORT_VERSION,
      author: options?.author || pack.metadata?.author,
      description: options?.description || pack.description,
      homepage: options?.homepage || pack.metadata?.homepage,
      tags: options?.tags,
    };

    // Create a clean copy without internal state
    const cleanPack = this.cleanPackForExport(pack);

    // Generate checksum
    const packString = JSON.stringify(cleanPack);
    const checksum = await this.generateChecksum(packString);

    const exportedPack: ExportedPack = {
      metadata,
      pack: cleanPack,
      checksum,
    };

    return JSON.stringify(exportedPack, null, 2);
  }

  /**
   * Import a pack from JSON string
   */
  static async importPack(jsonString: string): Promise<ImportValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const data = JSON.parse(jsonString);

      // Check structure
      if (!data.metadata || !data.pack) {
        errors.push('Invalid pack format: missing metadata or pack');
        return { isValid: false, errors, warnings };
      }

      // Verify checksum
      const packString = JSON.stringify(data.pack);
      const expectedChecksum = await this.generateChecksum(packString);

      if (data.checksum !== expectedChecksum) {
        warnings.push('Checksum mismatch - pack may have been modified');
      }

      // Validate pack structure
      const packValidation = this.validatePack(data.pack);
      errors.push(...packValidation.errors);
      warnings.push(...packValidation.warnings);

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      return {
        isValid: true,
        errors: [],
        warnings,
        pack: data.pack as IndustryPack,
      };
    } catch (error) {
      errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Download pack as file
   */
  static downloadPack(jsonString: string, filename: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.json') ? filename : `${filename}.pack.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Read pack from file
   */
  static async readPackFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Clean pack for export (remove runtime state)
   */
  private static cleanPackForExport(pack: IndustryPack): IndustryPack {
    return {
      id: pack.id,
      name: pack.name,
      description: pack.description,
      version: pack.version,
      subCategories: [...pack.subCategories],
      semanticTypes: pack.semanticTypes.map((st) => ({
        type: st.type,
        patterns: [...st.patterns],
        priority: st.priority,
        description: st.description,
        dataType: st.dataType,
      })),
      detectionIndicators: pack.detectionIndicators.map((di) => ({
        types: [...di.types],
        weight: di.weight,
        minCount: di.minCount,
        reason: di.reason,
      })),
      metrics: pack.metrics.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        formula: { ...m.formula },
        format: m.format,
        category: m.category,
        thresholds: m.thresholds ? { ...m.thresholds } : undefined,
        tags: m.tags ? [...m.tags] : undefined,
        subCategories: m.subCategories ? [...m.subCategories] : undefined,
      })),
      funnels: pack.funnels.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        steps: f.steps.map((s) => ({ ...s })),
        subCategories: f.subCategories ? [...f.subCategories] : undefined,
      })),
      chartConfigs: {
        types: pack.chartConfigs.types.map((t) => ({ ...t })),
        defaultCharts: pack.chartConfigs.defaultCharts
          ? [...pack.chartConfigs.defaultCharts]
          : undefined,
      },
      insightTemplates: pack.insightTemplates.map((i) => ({
        id: i.id,
        name: i.name,
        template: i.template,
        requiredMetrics: [...i.requiredMetrics],
        priority: i.priority,
        category: i.category,
      })),
      terminology: { ...pack.terminology },
      theme: { ...pack.theme },
      metadata: pack.metadata ? { ...pack.metadata } : undefined,
    };
  }

  /**
   * Validate pack structure
   */
  private static validatePack(pack: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!pack.id) errors.push('Missing required field: id');
    if (!pack.name) errors.push('Missing required field: name');
    if (!pack.version) errors.push('Missing required field: version');

    // Arrays
    if (!Array.isArray(pack.subCategories)) {
      errors.push('subCategories must be an array');
    }
    if (!Array.isArray(pack.semanticTypes)) {
      errors.push('semanticTypes must be an array');
    }
    if (!Array.isArray(pack.metrics)) {
      errors.push('metrics must be an array');
    }

    // Validate semantic types
    if (Array.isArray(pack.semanticTypes)) {
      const typeIds = new Set<string>();
      pack.semanticTypes.forEach((st: any, i: number) => {
        if (!st.type) {
          errors.push(`semanticTypes[${i}]: missing type`);
        } else if (typeIds.has(st.type)) {
          errors.push(`semanticTypes[${i}]: duplicate type "${st.type}"`);
        } else {
          typeIds.add(st.type);
        }

        if (!Array.isArray(st.patterns) || st.patterns.length === 0) {
          warnings.push(`semanticTypes[${i}]: empty patterns array`);
        }
      });
    }

    // Validate metrics
    if (Array.isArray(pack.metrics)) {
      const metricIds = new Set<string>();
      pack.metrics.forEach((m: any, i: number) => {
        if (!m.id) {
          errors.push(`metrics[${i}]: missing id`);
        } else if (metricIds.has(m.id)) {
          errors.push(`metrics[${i}]: duplicate id "${m.id}"`);
        } else {
          metricIds.add(m.id);
        }

        if (!m.formula?.expression) {
          errors.push(`metrics[${i}]: missing formula.expression`);
        }
      });
    }

    // Validate theme
    if (!pack.theme) {
      warnings.push('Missing theme - defaults will be used');
    } else {
      if (!pack.theme.primaryColor) {
        warnings.push('theme.primaryColor is recommended');
      }
    }

    return { errors, warnings };
  }

  /**
   * Generate checksum for pack validation
   */
  private static async generateChecksum(data: string): Promise<string> {
    // Use SubtleCrypto if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Merge two packs (for customization)
   */
  static mergePacks(base: IndustryPack, overlay: Partial<IndustryPack>): IndustryPack {
    return {
      ...base,
      ...overlay,
      id: overlay.id || base.id,
      name: overlay.name || base.name,
      version: overlay.version || base.version,

      // Merge arrays (add new items, don't replace)
      subCategories: [
        ...base.subCategories,
        ...(overlay.subCategories || []).filter(
          (sc) => !base.subCategories.some((bsc) => bsc.id === sc.id)
        ),
      ],

      semanticTypes: [
        ...base.semanticTypes,
        ...(overlay.semanticTypes || []).filter(
          (st) => !base.semanticTypes.some((bst) => bst.type === st.type)
        ),
      ],

      metrics: [
        ...base.metrics,
        ...(overlay.metrics || []).filter(
          (m) => !base.metrics.some((bm) => bm.id === m.id)
        ),
      ],

      funnels: [
        ...base.funnels,
        ...(overlay.funnels || []).filter(
          (f) => !base.funnels.some((bf) => bf.id === f.id)
        ),
      ],

      insightTemplates: [
        ...base.insightTemplates,
        ...(overlay.insightTemplates || []).filter(
          (i) => !base.insightTemplates.some((bi) => bi.id === i.id)
        ),
      ],

      // Merge objects
      terminology: {
        ...base.terminology,
        ...overlay.terminology,
      },

      theme: {
        ...base.theme,
        ...overlay.theme,
      },

      metadata: {
        ...base.metadata,
        ...overlay.metadata,
      },
    };
  }
}

export default PackExporter;
