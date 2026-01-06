/**
 * Cleanup Utilities - Prevent zombie processes and memory leaks
 *
 * Provides utilities for:
 * - Aborting pending fetch requests when components unmount
 * - Auto-cleaning timer/interval registry
 * - WebSocket connection management with proper cleanup
 * - General resource cleanup coordination
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================================
// Fetch Abort Controller Manager
// ============================================================================

/**
 * Creates an AbortController manager for fetch requests
 * Automatically aborts all pending requests on cleanup
 */
export class FetchAbortManager {
    private controllers: Map<string, AbortController> = new Map();
    private isDisposed: boolean = false;

    /**
     * Create a new AbortController for a fetch request
     * @param key - Unique identifier for this request (optional)
     * @returns AbortSignal to pass to fetch
     */
    createSignal(key?: string): AbortSignal {
        if (this.isDisposed) {
            const controller = new AbortController();
            controller.abort();
            return controller.signal;
        }

        const id = key || `fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const controller = new AbortController();
        this.controllers.set(id, controller);

        return controller.signal;
    }

    /**
     * Abort a specific request by key
     */
    abort(key: string): void {
        const controller = this.controllers.get(key);
        if (controller) {
            controller.abort();
            this.controllers.delete(key);
        }
    }

    /**
     * Abort all pending requests and mark as disposed
     */
    abortAll(): void {
        this.controllers.forEach((controller) => {
            controller.abort();
        });
        this.controllers.clear();
        this.isDisposed = true;
    }

    /**
     * Remove a completed request from tracking
     */
    complete(key: string): void {
        this.controllers.delete(key);
    }

    /**
     * Get count of active requests
     */
    getActiveCount(): number {
        return this.controllers.size;
    }

    /**
     * Check if disposed
     */
    get disposed(): boolean {
        return this.isDisposed;
    }
}

/**
 * React hook for fetch abort management
 * Automatically aborts all pending requests when component unmounts
 */
export function useFetchAbort() {
    const managerRef = useRef<FetchAbortManager | null>(null);

    // Initialize manager lazily
    if (!managerRef.current) {
        managerRef.current = new FetchAbortManager();
    }

    useEffect(() => {
        return () => {
            managerRef.current?.abortAll();
        };
    }, []);

    const createSignal = useCallback((key?: string) => {
        return managerRef.current!.createSignal(key);
    }, []);

    const abort = useCallback((key: string) => {
        managerRef.current?.abort(key);
    }, []);

    const complete = useCallback((key: string) => {
        managerRef.current?.complete(key);
    }, []);

    return {
        createSignal,
        abort,
        complete,
        getActiveCount: () => managerRef.current?.getActiveCount() ?? 0,
    };
}

// ============================================================================
// Timer Registry
// ============================================================================

type TimerCallback = () => void;
type TimerHandle = { clear: () => void };

/**
 * Registry for managing timers and intervals with automatic cleanup
 */
export class TimerRegistry {
    private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
    private animationFrames: Map<string, number> = new Map();
    private isDisposed: boolean = false;

    /**
     * Create a timeout with automatic cleanup
     */
    setTimeout(callback: TimerCallback, delay: number, key?: string): TimerHandle {
        if (this.isDisposed) return { clear: () => {} };

        const id = key || `timeout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Clear existing timer with same key
        this.clearTimeout(id);

        const handle = setTimeout(() => {
            callback();
            this.timeouts.delete(id);
        }, delay);

        this.timeouts.set(id, handle);

        return {
            clear: () => this.clearTimeout(id),
        };
    }

    /**
     * Create an interval with automatic cleanup
     */
    setInterval(callback: TimerCallback, delay: number, key?: string): TimerHandle {
        if (this.isDisposed) return { clear: () => {} };

        const id = key || `interval-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Clear existing interval with same key
        this.clearInterval(id);

        const handle = setInterval(callback, delay);
        this.intervals.set(id, handle);

        return {
            clear: () => this.clearInterval(id),
        };
    }

    /**
     * Create a requestAnimationFrame with automatic cleanup
     */
    requestAnimationFrame(callback: FrameRequestCallback, key?: string): TimerHandle {
        if (this.isDisposed) return { clear: () => {} };

        const id = key || `raf-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Cancel existing frame with same key
        this.cancelAnimationFrame(id);

        const handle = requestAnimationFrame((time) => {
            this.animationFrames.delete(id);
            callback(time);
        });

        this.animationFrames.set(id, handle);

        return {
            clear: () => this.cancelAnimationFrame(id),
        };
    }

    /**
     * Create a recurring animation frame loop
     */
    createAnimationLoop(callback: FrameRequestCallback, key?: string): TimerHandle {
        if (this.isDisposed) return { clear: () => {} };

        const id = key || `loop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let handle: number;

        const loop: FrameRequestCallback = (time) => {
            if (this.isDisposed || !this.animationFrames.has(id)) return;
            callback(time);
            handle = requestAnimationFrame(loop);
            this.animationFrames.set(id, handle);
        };

        handle = requestAnimationFrame(loop);
        this.animationFrames.set(id, handle);

        return {
            clear: () => this.cancelAnimationFrame(id),
        };
    }

    clearTimeout(key: string): void {
        const handle = this.timeouts.get(key);
        if (handle) {
            clearTimeout(handle);
            this.timeouts.delete(key);
        }
    }

    clearInterval(key: string): void {
        const handle = this.intervals.get(key);
        if (handle) {
            clearInterval(handle);
            this.intervals.delete(key);
        }
    }

    cancelAnimationFrame(key: string): void {
        const handle = this.animationFrames.get(key);
        if (handle) {
            cancelAnimationFrame(handle);
            this.animationFrames.delete(key);
        }
    }

    /**
     * Clear all timers and mark as disposed
     */
    clearAll(): void {
        this.timeouts.forEach((handle) => clearTimeout(handle));
        this.timeouts.clear();

        this.intervals.forEach((handle) => clearInterval(handle));
        this.intervals.clear();

        this.animationFrames.forEach((handle) => cancelAnimationFrame(handle));
        this.animationFrames.clear();

        this.isDisposed = true;
    }

    /**
     * Get count of active timers
     */
    getActiveCount(): { timeouts: number; intervals: number; animationFrames: number } {
        return {
            timeouts: this.timeouts.size,
            intervals: this.intervals.size,
            animationFrames: this.animationFrames.size,
        };
    }
}

/**
 * React hook for timer management with automatic cleanup
 */
export function useTimers() {
    const registryRef = useRef<TimerRegistry | null>(null);

    // Initialize registry lazily
    if (!registryRef.current) {
        registryRef.current = new TimerRegistry();
    }

    useEffect(() => {
        return () => {
            registryRef.current?.clearAll();
        };
    }, []);

    return useMemo(() => ({
        setTimeout: (callback: TimerCallback, delay: number, key?: string) =>
            registryRef.current!.setTimeout(callback, delay, key),
        setInterval: (callback: TimerCallback, delay: number, key?: string) =>
            registryRef.current!.setInterval(callback, delay, key),
        requestAnimationFrame: (callback: FrameRequestCallback, key?: string) =>
            registryRef.current!.requestAnimationFrame(callback, key),
        createAnimationLoop: (callback: FrameRequestCallback, key?: string) =>
            registryRef.current!.createAnimationLoop(callback, key),
        clearTimeout: (key: string) => registryRef.current?.clearTimeout(key),
        clearInterval: (key: string) => registryRef.current?.clearInterval(key),
        cancelAnimationFrame: (key: string) => registryRef.current?.cancelAnimationFrame(key),
        clearAll: () => registryRef.current?.clearAll(),
        getActiveCount: () => registryRef.current?.getActiveCount(),
    }), []);
}

// ============================================================================
// WebSocket Connection Manager
// ============================================================================

export interface WebSocketConfig {
    url: string;
    protocols?: string | string[];
    reconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    onOpen?: (event: Event) => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onReconnect?: (attempt: number) => void;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

/**
 * WebSocket connection manager with automatic cleanup and reconnection
 */
export class WebSocketManager {
    private ws: WebSocket | null = null;
    private config: Required<WebSocketConfig>;
    private reconnectAttempts: number = 0;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private isDisposed: boolean = false;
    private status: WebSocketStatus = 'disconnected';
    private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();

    constructor(config: WebSocketConfig) {
        this.config = {
            url: config.url,
            protocols: config.protocols ?? [],
            reconnect: config.reconnect ?? true,
            reconnectDelay: config.reconnectDelay ?? 1000,
            maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
            onOpen: config.onOpen ?? (() => {}),
            onMessage: config.onMessage ?? (() => {}),
            onError: config.onError ?? (() => {}),
            onClose: config.onClose ?? (() => {}),
            onReconnect: config.onReconnect ?? (() => {}),
        };
    }

    /**
     * Connect to WebSocket server
     */
    connect(): void {
        if (this.isDisposed) return;
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.setStatus('connecting');

        try {
            this.ws = new WebSocket(this.config.url, this.config.protocols);

            this.ws.onopen = (event) => {
                this.reconnectAttempts = 0;
                this.setStatus('connected');
                this.config.onOpen(event);
            };

            this.ws.onmessage = (event) => {
                this.config.onMessage(event);
            };

            this.ws.onerror = (event) => {
                this.setStatus('error');
                this.config.onError(event);
            };

            this.ws.onclose = (event) => {
                this.setStatus('disconnected');
                this.config.onClose(event);

                // Attempt reconnection if enabled and not disposed
                if (this.config.reconnect && !this.isDisposed && !event.wasClean) {
                    this.scheduleReconnect();
                }
            };
        } catch (error) {
            this.setStatus('error');
            console.error('[WebSocketManager] Connection error:', error);
        }
    }

    private scheduleReconnect(): void {
        if (this.isDisposed) return;
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.warn('[WebSocketManager] Max reconnect attempts reached');
            return;
        }

        this.setStatus('reconnecting');
        this.reconnectAttempts++;
        this.config.onReconnect(this.reconnectAttempts);

        // Exponential backoff
        const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Send data through WebSocket
     */
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocketManager] Cannot send - not connected');
            return false;
        }

        try {
            this.ws.send(data);
            return true;
        } catch (error) {
            console.error('[WebSocketManager] Send error:', error);
            return false;
        }
    }

    /**
     * Close the connection
     */
    close(code?: number, reason?: string): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            // Prevent reconnection on intentional close
            const ws = this.ws;
            this.ws = null;

            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close(code ?? 1000, reason ?? 'Client closed');
            }
        }

        this.setStatus('disconnected');
    }

    /**
     * Dispose and cleanup all resources
     */
    dispose(): void {
        this.isDisposed = true;
        this.close();
        this.statusListeners.clear();
    }

    /**
     * Get current status
     */
    getStatus(): WebSocketStatus {
        return this.status;
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(listener: (status: WebSocketStatus) => void): () => void {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    private setStatus(status: WebSocketStatus): void {
        this.status = status;
        this.statusListeners.forEach((listener) => listener(status));
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

/**
 * React hook for WebSocket connections with automatic cleanup
 */
export function useWebSocket(config: WebSocketConfig | null) {
    const managerRef = useRef<WebSocketManager | null>(null);
    const configRef = useRef(config);

    // Update config ref
    configRef.current = config;

    useEffect(() => {
        if (!config) return;

        managerRef.current = new WebSocketManager(config);
        managerRef.current.connect();

        return () => {
            managerRef.current?.dispose();
            managerRef.current = null;
        };
    }, [config?.url]); // Only reconnect on URL change

    const send = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        return managerRef.current?.send(data) ?? false;
    }, []);

    const close = useCallback(() => {
        managerRef.current?.close();
    }, []);

    const reconnect = useCallback(() => {
        managerRef.current?.close();
        managerRef.current?.connect();
    }, []);

    return {
        send,
        close,
        reconnect,
        isConnected: () => managerRef.current?.isConnected() ?? false,
        getStatus: () => managerRef.current?.getStatus() ?? 'disconnected',
    };
}

// ============================================================================
// Combined Cleanup Hook
// ============================================================================

/**
 * Comprehensive cleanup hook that provides all cleanup utilities
 */
export function useCleanup() {
    const fetchAbort = useFetchAbort();
    const timers = useTimers();

    // Combined fetch function with automatic abort handling
    const safeFetch = useCallback(
        async <T>(
            input: RequestInfo | URL,
            init?: RequestInit,
            key?: string
        ): Promise<T | null> => {
            const signal = fetchAbort.createSignal(key);

            try {
                const response = await fetch(input, { ...init, signal });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (key) fetchAbort.complete(key);

                return data as T;
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Request was aborted - this is expected on unmount
                    return null;
                }
                throw error;
            }
        },
        [fetchAbort]
    );

    return {
        fetchAbort,
        timers,
        safeFetch,
    };
}

// ============================================================================
// Event Listener Cleanup
// ============================================================================

type EventListenerCleanup = () => void;

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
    eventName: K,
    handler: (event: WindowEventMap[K]) => void,
    element: Window | HTMLElement | null = typeof window !== 'undefined' ? window : null,
    options?: AddEventListenerOptions
): void {
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!element) return;

        const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);

        element.addEventListener(eventName, eventListener, options);

        return () => {
            element.removeEventListener(eventName, eventListener, options);
        };
    }, [eventName, element, options]);
}

/**
 * Create an event listener registry for manual management
 */
export class EventListenerRegistry {
    private listeners: Map<string, EventListenerCleanup> = new Map();

    add(
        target: EventTarget,
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions,
        key?: string
    ): EventListenerCleanup {
        const id = key || `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Remove existing listener with same key
        this.remove(id);

        target.addEventListener(type, listener, options);

        const cleanup = () => {
            target.removeEventListener(type, listener, options);
            this.listeners.delete(id);
        };

        this.listeners.set(id, cleanup);

        return cleanup;
    }

    remove(key: string): void {
        const cleanup = this.listeners.get(key);
        if (cleanup) {
            cleanup();
        }
    }

    removeAll(): void {
        this.listeners.forEach((cleanup) => cleanup());
        this.listeners.clear();
    }
}

// ============================================================================
// Resource Pool
// ============================================================================

/**
 * Generic resource pool with automatic cleanup
 */
export class ResourcePool<T> {
    private resources: Map<string, T> = new Map();
    private disposers: Map<string, () => void> = new Map();

    acquire(key: string, factory: () => T, disposer?: (resource: T) => void): T {
        let resource = this.resources.get(key);

        if (!resource) {
            resource = factory();
            this.resources.set(key, resource);

            if (disposer) {
                this.disposers.set(key, () => disposer(resource as T));
            }
        }

        return resource;
    }

    release(key: string): void {
        const disposer = this.disposers.get(key);
        if (disposer) {
            disposer();
            this.disposers.delete(key);
        }
        this.resources.delete(key);
    }

    releaseAll(): void {
        this.disposers.forEach((disposer) => disposer());
        this.disposers.clear();
        this.resources.clear();
    }

    has(key: string): boolean {
        return this.resources.has(key);
    }

    get(key: string): T | undefined {
        return this.resources.get(key);
    }
}
