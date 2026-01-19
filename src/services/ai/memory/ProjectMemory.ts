/**
 * ProjectMemory - Per-project conversation history management
 */

import type { ChatMessage, ChatSession } from '../types';

const MEMORY_STORAGE_KEY = 'game-insights-ai-memory';
const MAX_MESSAGES_PER_SESSION = 100;
const MAX_SESSIONS_PER_PROJECT = 10;

/**
 * Project-scoped memory for chat conversations
 */
export class ProjectMemory {
  private projectId: string;
  private sessions: Map<string, ChatSession>;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.sessions = new Map();
    this.load();
  }

  /**
   * Load sessions from storage
   */
  private load(): void {
    try {
      const stored = localStorage.getItem(`${MEMORY_STORAGE_KEY}-${this.projectId}`);
      if (stored) {
        const data = JSON.parse(stored) as ChatSession[];
        for (const session of data) {
          this.sessions.set(session.id, session);
        }
      }
    } catch (error) {
      console.error('Failed to load project memory:', error);
    }
  }

  /**
   * Save sessions to storage
   */
  private save(): void {
    try {
      const data = Array.from(this.sessions.values());
      localStorage.setItem(`${MEMORY_STORAGE_KEY}-${this.projectId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save project memory:', error);
    }
  }

  /**
   * Get or create an active session
   */
  getActiveSession(): ChatSession {
    // Find most recent session
    const sessions = Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (sessions.length > 0) {
      return sessions[0];
    }

    // Create new session
    return this.createSession();
  }

  /**
   * Create a new session
   */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: this.projectId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);

    // Cleanup old sessions if needed
    this.cleanupSessions();

    this.save();
    return session;
  }

  /**
   * Add a message to a session
   */
  addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(fullMessage);
    session.updatedAt = new Date().toISOString();

    // Cleanup old messages if needed
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }

    this.save();
    return fullMessage;
  }

  /**
   * Get all messages from a session
   */
  getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  /**
   * Get recent messages for context
   */
  getRecentMessages(sessionId: string, count: number = 10): ChatMessage[] {
    const messages = this.getMessages(sessionId);
    return messages.slice(-count);
  }

  /**
   * Clear a session
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.save();
  }

  /**
   * Clear all sessions for this project
   */
  clearAll(): void {
    this.sessions.clear();
    localStorage.removeItem(`${MEMORY_STORAGE_KEY}-${this.projectId}`);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Cleanup old sessions
   */
  private cleanupSessions(): void {
    const sessions = this.getAllSessions();
    if (sessions.length > MAX_SESSIONS_PER_PROJECT) {
      const toRemove = sessions.slice(MAX_SESSIONS_PER_PROJECT);
      for (const session of toRemove) {
        this.sessions.delete(session.id);
      }
    }
  }

  /**
   * Search messages across all sessions
   */
  searchMessages(query: string): ChatMessage[] {
    const results: ChatMessage[] = [];
    const lowerQuery = query.toLowerCase();

    for (const session of this.sessions.values()) {
      for (const message of session.messages) {
        if (message.content.toLowerCase().includes(lowerQuery)) {
          results.push(message);
        }
      }
    }

    return results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    sessionCount: number;
    totalMessages: number;
    oldestMessage: string | null;
    newestMessage: string | null;
  } {
    let totalMessages = 0;
    let oldest: string | null = null;
    let newest: string | null = null;

    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
      for (const msg of session.messages) {
        if (!oldest || msg.timestamp < oldest) {
          oldest = msg.timestamp;
        }
        if (!newest || msg.timestamp > newest) {
          newest = msg.timestamp;
        }
      }
    }

    return {
      sessionCount: this.sessions.size,
      totalMessages,
      oldestMessage: oldest,
      newestMessage: newest,
    };
  }
}
