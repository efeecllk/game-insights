/**
 * Error Handler Utilities
 * Phase 8: Enhanced error UX with user-friendly messages
 */

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
    // Network errors
    NETWORK_OFFLINE = 'NETWORK_OFFLINE',
    NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
    NETWORK_ERROR = 'NETWORK_ERROR',

    // Authentication errors
    AUTH_EXPIRED = 'AUTH_EXPIRED',
    AUTH_INVALID = 'AUTH_INVALID',
    AUTH_MISSING = 'AUTH_MISSING',

    // File errors
    FILE_PARSE_ERROR = 'FILE_PARSE_ERROR',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    FILE_UNSUPPORTED = 'FILE_UNSUPPORTED',
    FILE_EMPTY = 'FILE_EMPTY',
    FILE_CORRUPT = 'FILE_CORRUPT',

    // Data errors
    DATA_INVALID = 'DATA_INVALID',
    DATA_MISSING = 'DATA_MISSING',
    DATA_CORRUPT = 'DATA_CORRUPT',

    // Integration errors
    INTEGRATION_CONNECTION = 'INTEGRATION_CONNECTION',
    INTEGRATION_AUTH = 'INTEGRATION_AUTH',
    INTEGRATION_RATE_LIMIT = 'INTEGRATION_RATE_LIMIT',
    INTEGRATION_QUOTA = 'INTEGRATION_QUOTA',

    // Sync errors
    SYNC_FAILED = 'SYNC_FAILED',
    SYNC_CONFLICT = 'SYNC_CONFLICT',
    SYNC_TIMEOUT = 'SYNC_TIMEOUT',

    // Storage errors
    STORAGE_FULL = 'STORAGE_FULL',
    STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',

    // API errors
    API_ERROR = 'API_ERROR',
    API_NOT_FOUND = 'API_NOT_FOUND',
    API_SERVER_ERROR = 'API_SERVER_ERROR',

    // Unknown
    UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Error Messages
// ============================================================================

interface FriendlyError {
    title: string;
    message: string;
    technical?: string;
}

const ERROR_MESSAGES: Record<ErrorCode, FriendlyError> = {
    [ErrorCode.NETWORK_OFFLINE]: {
        title: 'No Internet Connection',
        message: 'Connection failed. Please check your internet and try again.',
    },
    [ErrorCode.NETWORK_TIMEOUT]: {
        title: 'Request Timed Out',
        message: 'The request took too long. Please try again.',
    },
    [ErrorCode.NETWORK_ERROR]: {
        title: 'Connection Failed',
        message: 'Could not connect to the server. Please check your internet.',
    },
    [ErrorCode.AUTH_EXPIRED]: {
        title: 'Session Expired',
        message: 'Your session has expired. Please reconnect your account.',
    },
    [ErrorCode.AUTH_INVALID]: {
        title: 'Authentication Failed',
        message: 'Invalid credentials. Please check your API key or reconnect.',
    },
    [ErrorCode.AUTH_MISSING]: {
        title: 'Authentication Required',
        message: 'Please add your API key or sign in to continue.',
    },
    [ErrorCode.FILE_PARSE_ERROR]: {
        title: 'File Read Error',
        message: "Couldn't read this file. Try a different format (CSV, JSON, Excel).",
    },
    [ErrorCode.FILE_TOO_LARGE]: {
        title: 'File Too Large',
        message: 'This file exceeds the size limit. Try splitting it into smaller files.',
    },
    [ErrorCode.FILE_UNSUPPORTED]: {
        title: 'Unsupported Format',
        message: 'This file type is not supported. Try CSV, JSON, or Excel formats.',
    },
    [ErrorCode.FILE_EMPTY]: {
        title: 'Empty File',
        message: 'This file appears to be empty. Please check and try again.',
    },
    [ErrorCode.FILE_CORRUPT]: {
        title: 'Corrupt File',
        message: 'This file appears to be damaged. Try re-exporting from the source.',
    },
    [ErrorCode.DATA_INVALID]: {
        title: 'Invalid Data',
        message: 'The data format is not recognized. Please check your file structure.',
    },
    [ErrorCode.DATA_MISSING]: {
        title: 'Missing Data',
        message: 'Required data is missing. Please check your file has all required columns.',
    },
    [ErrorCode.DATA_CORRUPT]: {
        title: 'Data Error',
        message: 'Some data could not be processed. Try re-exporting from source.',
    },
    [ErrorCode.INTEGRATION_CONNECTION]: {
        title: 'Connection Failed',
        message: "Couldn't connect to this service. Please check your credentials.",
    },
    [ErrorCode.INTEGRATION_AUTH]: {
        title: 'Authorization Failed',
        message: 'Access denied. Please check permissions or reconnect your account.',
    },
    [ErrorCode.INTEGRATION_RATE_LIMIT]: {
        title: 'Rate Limited',
        message: 'Too many requests. Please wait a few minutes and try again.',
    },
    [ErrorCode.INTEGRATION_QUOTA]: {
        title: 'Quota Exceeded',
        message: 'You have reached your usage limit. Please upgrade or wait for reset.',
    },
    [ErrorCode.SYNC_FAILED]: {
        title: 'Sync Failed',
        message: 'Data sync failed. Please check your connection and try again.',
    },
    [ErrorCode.SYNC_CONFLICT]: {
        title: 'Sync Conflict',
        message: 'Data was modified elsewhere. Please refresh and try again.',
    },
    [ErrorCode.SYNC_TIMEOUT]: {
        title: 'Sync Timed Out',
        message: 'Sync took too long. Your data may be too large or connection slow.',
    },
    [ErrorCode.STORAGE_FULL]: {
        title: 'Storage Full',
        message: 'Local storage is full. Please delete some data and try again.',
    },
    [ErrorCode.STORAGE_UNAVAILABLE]: {
        title: 'Storage Unavailable',
        message: 'Could not save data. Please check your browser settings.',
    },
    [ErrorCode.API_ERROR]: {
        title: 'Request Failed',
        message: 'Something went wrong with the request. Please try again.',
    },
    [ErrorCode.API_NOT_FOUND]: {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
    },
    [ErrorCode.API_SERVER_ERROR]: {
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
    },
    [ErrorCode.UNKNOWN]: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
    },
};

// ============================================================================
// Recovery Actions
// ============================================================================

export interface RecoveryAction {
    label: string;
    action: 'retry' | 'refresh' | 'reconnect' | 'settings' | 'support' | 'dismiss';
    primary?: boolean;
}

const RECOVERY_ACTIONS: Record<ErrorCode, RecoveryAction[]> = {
    [ErrorCode.NETWORK_OFFLINE]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.NETWORK_TIMEOUT]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.NETWORK_ERROR]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.AUTH_EXPIRED]: [
        { label: 'Reconnect', action: 'reconnect', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.AUTH_INVALID]: [
        { label: 'Go to Settings', action: 'settings', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.AUTH_MISSING]: [
        { label: 'Go to Settings', action: 'settings', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.FILE_PARSE_ERROR]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.FILE_TOO_LARGE]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.FILE_UNSUPPORTED]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.FILE_EMPTY]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.FILE_CORRUPT]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.DATA_INVALID]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.DATA_MISSING]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.DATA_CORRUPT]: [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.INTEGRATION_CONNECTION]: [
        { label: 'Reconnect', action: 'reconnect', primary: true },
        { label: 'Go to Settings', action: 'settings' },
    ],
    [ErrorCode.INTEGRATION_AUTH]: [
        { label: 'Reconnect', action: 'reconnect', primary: true },
        { label: 'Go to Settings', action: 'settings' },
    ],
    [ErrorCode.INTEGRATION_RATE_LIMIT]: [
        { label: 'Retry Later', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.INTEGRATION_QUOTA]: [
        { label: 'Go to Settings', action: 'settings', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.SYNC_FAILED]: [
        { label: 'Retry Sync', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.SYNC_CONFLICT]: [
        { label: 'Refresh', action: 'refresh', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.SYNC_TIMEOUT]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.STORAGE_FULL]: [
        { label: 'Manage Data', action: 'settings', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.STORAGE_UNAVAILABLE]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Contact Support', action: 'support' },
    ],
    [ErrorCode.API_ERROR]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.API_NOT_FOUND]: [
        { label: 'Refresh', action: 'refresh', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
    ],
    [ErrorCode.API_SERVER_ERROR]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Contact Support', action: 'support' },
    ],
    [ErrorCode.UNKNOWN]: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Refresh Page', action: 'refresh' },
    ],
};

// ============================================================================
// Error Detection
// ============================================================================

/**
 * Detects the error code from various error types
 */
function detectErrorCode(error: unknown): ErrorCode {
    // Check for offline
    if (!navigator.onLine) {
        return ErrorCode.NETWORK_OFFLINE;
    }

    // Handle Error objects
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();

        // Network errors
        if (name === 'typeerror' && message.includes('fetch')) {
            return ErrorCode.NETWORK_ERROR;
        }
        if (message.includes('timeout') || name === 'aborterror') {
            return ErrorCode.NETWORK_TIMEOUT;
        }
        if (message.includes('network') || message.includes('connection')) {
            return ErrorCode.NETWORK_ERROR;
        }

        // Auth errors
        if (message.includes('unauthorized') || message.includes('401')) {
            return ErrorCode.AUTH_INVALID;
        }
        if (message.includes('expired') || message.includes('token')) {
            return ErrorCode.AUTH_EXPIRED;
        }
        if (message.includes('forbidden') || message.includes('403')) {
            return ErrorCode.AUTH_INVALID;
        }

        // File errors
        if (message.includes('parse') || message.includes('syntax')) {
            return ErrorCode.FILE_PARSE_ERROR;
        }
        if (message.includes('too large') || message.includes('size')) {
            return ErrorCode.FILE_TOO_LARGE;
        }
        if (message.includes('unsupported') || message.includes('format')) {
            return ErrorCode.FILE_UNSUPPORTED;
        }
        if (message.includes('empty')) {
            return ErrorCode.FILE_EMPTY;
        }
        if (message.includes('corrupt')) {
            return ErrorCode.FILE_CORRUPT;
        }

        // Rate limiting
        if (message.includes('rate limit') || message.includes('429') || message.includes('too many')) {
            return ErrorCode.INTEGRATION_RATE_LIMIT;
        }

        // Quota
        if (message.includes('quota') || message.includes('limit exceeded')) {
            return ErrorCode.INTEGRATION_QUOTA;
        }

        // Storage
        if (message.includes('quota') && message.includes('storage')) {
            return ErrorCode.STORAGE_FULL;
        }
        if (message.includes('indexeddb') || message.includes('storage')) {
            return ErrorCode.STORAGE_UNAVAILABLE;
        }

        // Server errors
        if (message.includes('500') || message.includes('internal server')) {
            return ErrorCode.API_SERVER_ERROR;
        }
        if (message.includes('404') || message.includes('not found')) {
            return ErrorCode.API_NOT_FOUND;
        }
    }

    // Handle response objects
    if (typeof error === 'object' && error !== null) {
        const obj = error as Record<string, unknown>;

        // Check status codes
        if ('status' in obj) {
            const status = obj.status as number;
            if (status === 401) return ErrorCode.AUTH_INVALID;
            if (status === 403) return ErrorCode.AUTH_INVALID;
            if (status === 404) return ErrorCode.API_NOT_FOUND;
            if (status === 429) return ErrorCode.INTEGRATION_RATE_LIMIT;
            if (status >= 500) return ErrorCode.API_SERVER_ERROR;
        }

        // Check error codes
        if ('code' in obj) {
            const code = String(obj.code).toLowerCase();
            if (code.includes('auth')) return ErrorCode.AUTH_INVALID;
            if (code.includes('network')) return ErrorCode.NETWORK_ERROR;
            if (code.includes('timeout')) return ErrorCode.NETWORK_TIMEOUT;
        }
    }

    return ErrorCode.UNKNOWN;
}

// ============================================================================
// Main API
// ============================================================================

export interface ParsedError {
    code: ErrorCode;
    title: string;
    message: string;
    technical?: string;
    recoveryActions: RecoveryAction[];
    originalError?: unknown;
}

/**
 * Parse any error into a user-friendly format
 */
export function parseError(error: unknown): ParsedError {
    const code = detectErrorCode(error);
    const friendly = ERROR_MESSAGES[code];
    const actions = RECOVERY_ACTIONS[code];

    // Extract technical details for debugging
    let technical: string | undefined;
    if (error instanceof Error) {
        technical = `${error.name}: ${error.message}`;
        if (error.stack) {
            technical += `\n${error.stack}`;
        }
    } else if (typeof error === 'string') {
        technical = error;
    } else if (error !== null && typeof error === 'object') {
        try {
            technical = JSON.stringify(error, null, 2);
        } catch {
            technical = String(error);
        }
    }

    return {
        code,
        title: friendly.title,
        message: friendly.message,
        technical,
        recoveryActions: actions,
        originalError: error,
    };
}

/**
 * Get recovery actions for an error code
 */
export function getErrorRecoveryActions(code: ErrorCode): RecoveryAction[] {
    return RECOVERY_ACTIONS[code] || RECOVERY_ACTIONS[ErrorCode.UNKNOWN];
}

/**
 * Get a simple user-friendly message for an error
 */
export function getErrorMessage(error: unknown): string {
    const parsed = parseError(error);
    return parsed.message;
}

/**
 * Log error with context for debugging
 */
export function logError(
    error: unknown,
    context?: Record<string, unknown>
): ParsedError {
    const parsed = parseError(error);

    // Console log for debugging
    console.error('[Game Insights Error]', {
        code: parsed.code,
        title: parsed.title,
        message: parsed.message,
        technical: parsed.technical,
        context,
        timestamp: new Date().toISOString(),
    });

    return parsed;
}

/**
 * Create a typed error with a specific code
 */
export class AppError extends Error {
    code: ErrorCode;

    constructor(code: ErrorCode, message?: string) {
        const friendly = ERROR_MESSAGES[code];
        super(message || friendly.message);
        this.code = code;
        this.name = 'AppError';
    }
}

export default {
    parseError,
    getErrorRecoveryActions,
    getErrorMessage,
    logError,
    ErrorCode,
    AppError,
};
