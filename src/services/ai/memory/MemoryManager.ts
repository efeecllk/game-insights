/**
 * MemoryManager - Manages memory instances across projects
 */

import { ProjectMemory } from './ProjectMemory';

/**
 * Singleton manager for project memories
 */
export class MemoryManager {
  private static instance: MemoryManager | null = null;
  private memories: Map<string, ProjectMemory>;

  private constructor() {
    this.memories = new Map();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  static resetInstance(): void {
    if (MemoryManager.instance) {
      MemoryManager.instance.clearAll();
    }
    MemoryManager.instance = null;
  }

  /**
   * Get or create a project memory
   */
  getMemory(projectId: string): ProjectMemory {
    if (!this.memories.has(projectId)) {
      this.memories.set(projectId, new ProjectMemory(projectId));
    }
    return this.memories.get(projectId)!;
  }

  /**
   * Check if a project has memory
   */
  hasMemory(projectId: string): boolean {
    return this.memories.has(projectId);
  }

  /**
   * Clear memory for a specific project
   */
  clearMemory(projectId: string): void {
    const memory = this.memories.get(projectId);
    if (memory) {
      memory.clearAll();
      this.memories.delete(projectId);
    }
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    for (const memory of this.memories.values()) {
      memory.clearAll();
    }
    this.memories.clear();
  }

  /**
   * Get all project IDs with memories
   */
  getProjectIds(): string[] {
    return Array.from(this.memories.keys());
  }

  /**
   * Get aggregate stats across all projects
   */
  getAggregateStats(): {
    projectCount: number;
    totalSessions: number;
    totalMessages: number;
  } {
    let totalSessions = 0;
    let totalMessages = 0;

    for (const memory of this.memories.values()) {
      const stats = memory.getStats();
      totalSessions += stats.sessionCount;
      totalMessages += stats.totalMessages;
    }

    return {
      projectCount: this.memories.size,
      totalSessions,
      totalMessages,
    };
  }
}

/**
 * Convenience function to get memory for a project
 */
export function getProjectMemory(projectId: string): ProjectMemory {
  return MemoryManager.getInstance().getMemory(projectId);
}
