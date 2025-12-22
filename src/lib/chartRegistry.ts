/**
 * Chart Registry - Implements Open/Closed Principle
 * New charts can be added without modifying existing code
 */

import { ChartType, ChartConfig } from '../types';
import { ComponentType } from 'react';

/**
 * Base props interface for all chart components
 */
export interface BaseChartProps<T = unknown> {
    data: T;
    config: ChartConfig;
    className?: string;
    onDataPointClick?: (point: unknown) => void;
}

/**
 * Chart metadata for registry
 */
export interface ChartMetadata {
    type: ChartType;
    name: string;
    description: string;
    category: string;
    requiredDataFields: string[];
    recommendedFor: string[];
}

/**
 * Registry entry combining component and metadata
 */
interface ChartRegistryEntry<T = unknown> {
    component: ComponentType<BaseChartProps<T>>;
    metadata: ChartMetadata;
}

/**
 * Chart Registry Class
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class ChartRegistryClass {
    private charts: Map<ChartType, ChartRegistryEntry> = new Map();

    /**
     * Register a new chart component
     */
    register<T>(
        type: ChartType,
        component: ComponentType<BaseChartProps<T>>,
        metadata: Omit<ChartMetadata, 'type'>
    ): void {
        this.charts.set(type, {
            component: component as ComponentType<BaseChartProps>,
            metadata: { ...metadata, type },
        });
    }

    /**
     * Get a chart component by type
     */
    get<T>(type: ChartType): ComponentType<BaseChartProps<T>> | undefined {
        const entry = this.charts.get(type);
        return entry?.component as ComponentType<BaseChartProps<T>> | undefined;
    }

    /**
     * Get chart metadata by type
     */
    getMetadata(type: ChartType): ChartMetadata | undefined {
        return this.charts.get(type)?.metadata;
    }

    /**
     * Get all registered chart types
     */
    getAll(): ChartMetadata[] {
        return Array.from(this.charts.values()).map((entry) => entry.metadata);
    }

    /**
     * Get charts recommended for a game category
     */
    getRecommendedFor(gameCategory: string): ChartMetadata[] {
        return this.getAll().filter((meta) =>
            meta.recommendedFor.includes(gameCategory)
        );
    }

    /**
     * Check if a chart type is registered
     */
    has(type: ChartType): boolean {
        return this.charts.has(type);
    }
}

// Singleton instance
export const ChartRegistry = new ChartRegistryClass();

/**
 * Decorator function for registering charts
 * Usage: @registerChart('retention_curve', metadata)
 */
export function registerChart(
    type: ChartType,
    metadata: Omit<ChartMetadata, 'type'>
) {
    return function <T, C extends ComponentType<BaseChartProps<T>>>(
        Component: C
    ): C {
        ChartRegistry.register(type, Component, metadata);
        return Component;
    };
}
