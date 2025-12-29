/**
 * Error Resolution Guide Component
 * Provides contextual help and troubleshooting for connection errors
 * Phase 3: Data Sources
 */

import { useState } from 'react';
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Copy,
    RefreshCw,
    Shield,
    Wifi,
    Key,
    Database,
    Clock,
    HelpCircle,
    Check,
    X,
    Lightbulb,
    Terminal,
} from 'lucide-react';
import { IntegrationType, INTEGRATION_CATALOG } from '../../lib/integrationStore';

// ============================================================================
// Types
// ============================================================================

export interface ErrorInfo {
    code?: string;
    message: string;
    integrationType: IntegrationType;
    timestamp?: string;
}

interface ResolutionStep {
    title: string;
    description: string;
    action?: {
        type: 'copy' | 'link' | 'button';
        label: string;
        value: string;
        onClick?: () => void;
    };
}

interface ErrorPattern {
    pattern: RegExp | string;
    title: string;
    icon: React.ElementType;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    causes: string[];
    steps: ResolutionStep[];
    preventionTips?: string[];
    docsUrl?: string;
}

// ============================================================================
// Error Patterns Database
// ============================================================================

const commonErrorPatterns: ErrorPattern[] = [
    // Authentication Errors
    {
        pattern: /invalid.*api.*key|unauthorized|401|authentication.*failed/i,
        title: 'Authentication Failed',
        icon: Key,
        severity: 'critical',
        description: 'The API key or credentials provided are invalid or have expired.',
        causes: [
            'API key is incorrect or has typos',
            'API key has been revoked or expired',
            'Wrong key type (anon vs service role)',
            'Key has insufficient permissions',
        ],
        steps: [
            {
                title: 'Verify your API key',
                description: 'Double-check that you\'ve copied the complete API key without any extra spaces.',
            },
            {
                title: 'Generate a new key',
                description: 'If the key might be compromised or expired, generate a new one from your service dashboard.',
            },
            {
                title: 'Check key permissions',
                description: 'Ensure the API key has read access to the data you\'re trying to access.',
            },
            {
                title: 'Update connection settings',
                description: 'Go to the integration settings and paste the correct API key.',
                action: {
                    type: 'button',
                    label: 'Edit Connection',
                    value: 'edit',
                },
            },
        ],
        preventionTips: [
            'Store API keys securely and never share them',
            'Set up key rotation policies',
            'Use environment-specific keys (dev/prod)',
        ],
    },

    // Connection Errors
    {
        pattern: /connection.*refused|ECONNREFUSED|network.*error|timeout|ETIMEDOUT/i,
        title: 'Connection Failed',
        icon: Wifi,
        severity: 'critical',
        description: 'Unable to establish a connection to the data source.',
        causes: [
            'Service is down or unreachable',
            'Firewall blocking the connection',
            'Incorrect hostname or port',
            'Network connectivity issues',
        ],
        steps: [
            {
                title: 'Check service status',
                description: 'Verify that the service is online and operational.',
            },
            {
                title: 'Verify connection details',
                description: 'Ensure the hostname, port, and protocol are correct.',
            },
            {
                title: 'Check firewall settings',
                description: 'Make sure your firewall allows outbound connections to the service.',
            },
            {
                title: 'Test network connectivity',
                description: 'Try accessing the service from a browser or using ping/curl.',
                action: {
                    type: 'copy',
                    label: 'Copy test command',
                    value: 'curl -I https://your-service-url',
                },
            },
        ],
        preventionTips: [
            'Set up monitoring alerts for service availability',
            'Configure connection retry logic with exponential backoff',
            'Use connection pooling to handle temporary failures',
        ],
    },

    // SSL/TLS Errors
    {
        pattern: /ssl|tls|certificate|CERT_|self.signed/i,
        title: 'SSL/TLS Error',
        icon: Shield,
        severity: 'warning',
        description: 'There was a problem with the secure connection certificate.',
        causes: [
            'SSL certificate has expired',
            'Self-signed certificate not trusted',
            'Certificate hostname mismatch',
            'Intermediate certificate missing',
        ],
        steps: [
            {
                title: 'Check certificate validity',
                description: 'Verify the SSL certificate hasn\'t expired using an online checker.',
                action: {
                    type: 'link',
                    label: 'SSL Checker',
                    value: 'https://www.sslshopper.com/ssl-checker.html',
                },
            },
            {
                title: 'Update connection settings',
                description: 'If using a self-signed cert in development, you may need to allow insecure connections.',
            },
            {
                title: 'Contact your administrator',
                description: 'For production issues, work with your IT team to resolve certificate issues.',
            },
        ],
        preventionTips: [
            'Set up certificate expiration monitoring',
            'Use automated certificate renewal (e.g., Let\'s Encrypt)',
            'Always use valid certificates in production',
        ],
    },

    // Rate Limiting
    {
        pattern: /rate.*limit|too.*many.*requests|429|throttl/i,
        title: 'Rate Limited',
        icon: Clock,
        severity: 'warning',
        description: 'Too many requests have been made in a short period.',
        causes: [
            'Sync frequency is too high',
            'Multiple integrations hitting the same service',
            'API rate limit reached for your plan',
        ],
        steps: [
            {
                title: 'Wait and retry',
                description: 'Rate limits typically reset after a few minutes. Wait before retrying.',
            },
            {
                title: 'Reduce sync frequency',
                description: 'Increase the interval between syncs to stay within limits.',
                action: {
                    type: 'button',
                    label: 'Adjust Sync Settings',
                    value: 'sync-settings',
                },
            },
            {
                title: 'Check your plan limits',
                description: 'Review your service plan\'s rate limits and consider upgrading if needed.',
            },
        ],
        preventionTips: [
            'Implement request caching to reduce API calls',
            'Use webhooks instead of polling when available',
            'Batch multiple operations into single requests',
        ],
    },

    // Database Errors
    {
        pattern: /table.*not.*found|relation.*does.*not.*exist|unknown.*column|no.*such.*table/i,
        title: 'Table or Column Not Found',
        icon: Database,
        severity: 'critical',
        description: 'The specified table or column doesn\'t exist in the database.',
        causes: [
            'Table name is misspelled',
            'Table was renamed or deleted',
            'Wrong database or schema selected',
            'Column names have changed',
        ],
        steps: [
            {
                title: 'Verify table name',
                description: 'Check the exact spelling and case of the table name in your database.',
            },
            {
                title: 'Check schema/database',
                description: 'Ensure you\'re connected to the correct database and schema.',
            },
            {
                title: 'Browse available tables',
                description: 'Use the table browser to see what tables are available.',
                action: {
                    type: 'button',
                    label: 'Browse Tables',
                    value: 'browse-tables',
                },
            },
            {
                title: 'Update connection config',
                description: 'If the table was renamed, update your integration settings.',
            },
        ],
        preventionTips: [
            'Use migrations to track database schema changes',
            'Document table and column naming conventions',
            'Test integrations after database schema updates',
        ],
    },

    // Permission Errors
    {
        pattern: /permission.*denied|access.*denied|403|forbidden|not.*authorized/i,
        title: 'Permission Denied',
        icon: Shield,
        severity: 'critical',
        description: 'The account doesn\'t have permission to access the requested resource.',
        causes: [
            'Insufficient database privileges',
            'Row-level security blocking access',
            'API key lacks required scopes',
            'Resource is private or restricted',
        ],
        steps: [
            {
                title: 'Check account permissions',
                description: 'Verify the account has read access to the required tables/resources.',
            },
            {
                title: 'Review API key scopes',
                description: 'Ensure the API key has all necessary permissions enabled.',
            },
            {
                title: 'Check RLS policies',
                description: 'If using Supabase, verify Row Level Security policies allow access.',
            },
            {
                title: 'Contact administrator',
                description: 'Request the necessary permissions from your database administrator.',
            },
        ],
        preventionTips: [
            'Use dedicated service accounts with minimal required permissions',
            'Document required permissions for each integration',
            'Set up permission auditing and alerts',
        ],
    },

    // Data Format Errors
    {
        pattern: /invalid.*json|parse.*error|unexpected.*token|malformed/i,
        title: 'Data Format Error',
        icon: AlertCircle,
        severity: 'warning',
        description: 'The data received is not in the expected format.',
        causes: [
            'API response format changed',
            'Data contains invalid characters',
            'Encoding issues (UTF-8 vs other)',
            'Empty or null responses',
        ],
        steps: [
            {
                title: 'Check API response',
                description: 'Manually test the API to see the actual response format.',
            },
            {
                title: 'Verify data path',
                description: 'Ensure the JSON path to your data is still correct.',
            },
            {
                title: 'Check for encoding issues',
                description: 'Verify the response uses UTF-8 encoding.',
            },
            {
                title: 'Contact support',
                description: 'If the API changed, you may need to update your integration.',
            },
        ],
        preventionTips: [
            'Validate API responses before processing',
            'Add error handling for malformed data',
            'Monitor for API version changes',
        ],
    },
];

// Integration-specific error patterns
const integrationErrorPatterns: Partial<Record<IntegrationType, ErrorPattern[]>> = {
    supabase: [
        {
            pattern: /supabase.*project.*not.*found|invalid.*project|project.*id/i,
            title: 'Invalid Supabase Project',
            icon: Database,
            severity: 'critical',
            description: 'The Supabase project URL is invalid or the project doesn\'t exist.',
            causes: [
                'Project URL is incorrect',
                'Project was deleted or suspended',
                'Using wrong region URL',
            ],
            steps: [
                {
                    title: 'Verify project URL',
                    description: 'Go to your Supabase dashboard and copy the project URL from Settings > API.',
                    action: {
                        type: 'link',
                        label: 'Supabase Dashboard',
                        value: 'https://supabase.com/dashboard',
                    },
                },
                {
                    title: 'Check project status',
                    description: 'Ensure your project is active and not paused due to inactivity.',
                },
                {
                    title: 'Update connection',
                    description: 'Enter the correct project URL in your integration settings.',
                },
            ],
            docsUrl: 'https://supabase.com/docs/guides/api',
        },
    ],
    google_sheets: [
        {
            pattern: /spreadsheet.*not.*found|unable.*to.*access|sharing/i,
            title: 'Spreadsheet Access Error',
            icon: Database,
            severity: 'critical',
            description: 'Cannot access the Google Spreadsheet.',
            causes: [
                'Spreadsheet ID is incorrect',
                'Spreadsheet is not shared publicly or with the service account',
                'Spreadsheet was deleted',
            ],
            steps: [
                {
                    title: 'Check sharing settings',
                    description: 'Make sure the spreadsheet is shared with "Anyone with the link" or the service account email.',
                },
                {
                    title: 'Verify spreadsheet ID',
                    description: 'Copy the ID from the spreadsheet URL: docs.google.com/spreadsheets/d/[ID]/edit',
                },
                {
                    title: 'Re-authenticate',
                    description: 'Try disconnecting and reconnecting your Google account.',
                },
            ],
            docsUrl: 'https://developers.google.com/sheets/api/guides/authorizing',
        },
    ],
    postgresql: [
        {
            pattern: /password.*authentication.*failed|pg_hba.conf|no.*pg_hba.conf.*entry/i,
            title: 'PostgreSQL Authentication Failed',
            icon: Key,
            severity: 'critical',
            description: 'Could not authenticate with the PostgreSQL database.',
            causes: [
                'Incorrect username or password',
                'IP address not in pg_hba.conf whitelist',
                'SSL mode mismatch',
            ],
            steps: [
                {
                    title: 'Verify credentials',
                    description: 'Double-check the username and password.',
                },
                {
                    title: 'Check IP whitelist',
                    description: 'Ensure your IP address is allowed in pg_hba.conf or firewall rules.',
                },
                {
                    title: 'Try with SSL',
                    description: 'Enable SSL in connection settings if required by the server.',
                },
                {
                    title: 'Test connection locally',
                    description: 'Try connecting using psql to verify credentials.',
                    action: {
                        type: 'copy',
                        label: 'Copy psql command',
                        value: 'psql -h hostname -U username -d database',
                    },
                },
            ],
            docsUrl: 'https://www.postgresql.org/docs/current/auth-pg-hba-conf.html',
        },
    ],
};

// ============================================================================
// Main Component
// ============================================================================

interface ErrorResolutionGuideProps {
    error: ErrorInfo;
    onRetry?: () => void;
    onEditConnection?: () => void;
    onClose?: () => void;
}

export function ErrorResolutionGuide({
    error,
    onRetry,
    onEditConnection,
    onClose,
}: ErrorResolutionGuideProps) {
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    // Find matching error pattern
    const errorPattern = findMatchingPattern(error);
    const catalogItem = INTEGRATION_CATALOG.find(i => i.type === error.integrationType);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const toggleStepComplete = (index: number) => {
        const newCompleted = new Set(completedSteps);
        if (newCompleted.has(index)) {
            newCompleted.delete(index);
        } else {
            newCompleted.add(index);
        }
        setCompletedSteps(newCompleted);
    };

    if (!errorPattern) {
        return <GenericErrorGuide error={error} onRetry={onRetry} onEditConnection={onEditConnection} />;
    }

    const Icon = errorPattern.icon;
    const severityColors = {
        critical: 'bg-red-500/10 border-red-500/30 text-red-500',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    };

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            {/* Header */}
            <div className={`p-4 border-b ${severityColors[errorPattern.severity]}`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${errorPattern.severity === 'critical' ? 'bg-red-500/20' : errorPattern.severity === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-th-text-primary">{errorPattern.title}</h3>
                        <p className="text-sm text-th-text-muted mt-1">{errorPattern.description}</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-th-bg-surface-hover rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-th-text-muted" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            <div className="px-4 py-3 bg-th-bg-elevated border-b border-th-border-subtle">
                <div className="flex items-center gap-2 text-sm">
                    <Terminal className="w-4 h-4 text-th-text-muted" />
                    <span className="text-th-text-muted">Error:</span>
                    <code className="text-red-400 font-mono text-xs bg-red-500/10 px-2 py-0.5 rounded">
                        {error.message}
                    </code>
                </div>
            </div>

            {/* Possible Causes */}
            <div className="p-4 border-b border-th-border-subtle">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Possible Causes
                </h4>
                <ul className="space-y-2">
                    {errorPattern.causes.map((cause, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-th-text-muted">
                            <span className="text-th-text-disabled mt-0.5">•</span>
                            {cause}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Resolution Steps */}
            <div className="p-4">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Resolution Steps
                </h4>
                <div className="space-y-2">
                    {errorPattern.steps.map((step, idx) => (
                        <div
                            key={idx}
                            className={`rounded-lg border transition-colors ${
                                completedSteps.has(idx)
                                    ? 'bg-green-500/5 border-green-500/30'
                                    : 'bg-th-bg-elevated border-th-border-subtle'
                            }`}
                        >
                            <button
                                onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                                className="w-full p-3 flex items-center gap-3 text-left"
                            >
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        toggleStepComplete(idx);
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        completedSteps.has(idx)
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-th-border hover:border-th-accent-primary'
                                    }`}
                                >
                                    {completedSteps.has(idx) && <Check className="w-3 h-3" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <span className={`font-medium ${completedSteps.has(idx) ? 'text-green-500' : 'text-th-text-primary'}`}>
                                        Step {idx + 1}: {step.title}
                                    </span>
                                </div>
                                {expandedStep === idx ? (
                                    <ChevronDown className="w-5 h-5 text-th-text-muted" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-th-text-muted" />
                                )}
                            </button>

                            {expandedStep === idx && (
                                <div className="px-3 pb-3 pt-0 ml-9">
                                    <p className="text-sm text-th-text-muted mb-3">{step.description}</p>
                                    {step.action && (
                                        <StepAction
                                            action={step.action}
                                            onCopy={handleCopy}
                                            copiedText={copiedText}
                                            onEditConnection={onEditConnection}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Prevention Tips */}
            {errorPattern.preventionTips && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-th-accent-primary-muted rounded-lg">
                        <h4 className="text-sm font-medium text-th-accent-primary mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Prevention Tips
                        </h4>
                        <ul className="space-y-1">
                            {errorPattern.preventionTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-th-text-secondary">
                                    <span className="text-th-accent-primary mt-0.5">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 flex items-center gap-3">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary/90 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </button>
                )}
                {onEditConnection && (
                    <button
                        onClick={onEditConnection}
                        className="flex items-center gap-2 px-4 py-2 bg-th-bg-elevated text-th-text-secondary rounded-lg text-sm font-medium hover:bg-th-interactive-hover transition-colors"
                    >
                        Edit Connection
                    </button>
                )}
                {errorPattern.docsUrl && (
                    <a
                        href={errorPattern.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-th-text-muted hover:text-th-text-secondary text-sm transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Documentation
                    </a>
                )}
            </div>

            {/* Integration Info */}
            {catalogItem && (
                <div className="px-4 pb-4 pt-2 border-t border-th-border-subtle">
                    <p className="text-xs text-th-text-muted">
                        Integration: {catalogItem.icon} {catalogItem.name}
                        {error.timestamp && ` • Error occurred ${new Date(error.timestamp).toLocaleString()}`}
                    </p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function StepAction({
    action,
    onCopy,
    copiedText,
    onEditConnection,
}: {
    action: ResolutionStep['action'];
    onCopy: (text: string) => void;
    copiedText: string | null;
    onEditConnection?: () => void;
}) {
    if (!action) return null;

    switch (action.type) {
        case 'copy':
            return (
                <button
                    onClick={() => onCopy(action.value)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-th-bg-surface border border-th-border-subtle rounded text-sm text-th-text-secondary hover:bg-th-interactive-hover transition-colors"
                >
                    {copiedText === action.value ? (
                        <>
                            <Check className="w-4 h-4 text-green-500" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            {action.label}
                        </>
                    )}
                </button>
            );

        case 'link':
            return (
                <a
                    href={action.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-th-bg-surface border border-th-border-subtle rounded text-sm text-th-accent-primary hover:bg-th-interactive-hover transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    {action.label}
                </a>
            );

        case 'button':
            return (
                <button
                    onClick={action.value === 'edit' ? onEditConnection : action.onClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-th-accent-primary/10 border border-th-accent-primary/30 rounded text-sm text-th-accent-primary hover:bg-th-accent-primary/20 transition-colors"
                >
                    {action.label}
                </button>
            );

        default:
            return null;
    }
}

function GenericErrorGuide({
    error,
    onRetry,
    onEditConnection,
}: {
    error: ErrorInfo;
    onRetry?: () => void;
    onEditConnection?: () => void;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-6">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-th-text-primary">Connection Error</h3>
                    <p className="text-sm text-th-text-muted mt-1 mb-4">{error.message}</p>

                    <div className="space-y-3 mb-4">
                        <p className="text-sm font-medium text-th-text-secondary">Try these steps:</p>
                        <ul className="space-y-2 text-sm text-th-text-muted">
                            <li className="flex items-start gap-2">
                                <span className="text-th-text-disabled">1.</span>
                                Check your internet connection
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-th-text-disabled">2.</span>
                                Verify your credentials are correct
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-th-text-disabled">3.</span>
                                Ensure the service is available
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-th-text-disabled">4.</span>
                                Try again in a few minutes
                            </li>
                        </ul>
                    </div>

                    <div className="flex items-center gap-3">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary/90 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                        )}
                        {onEditConnection && (
                            <button
                                onClick={onEditConnection}
                                className="flex items-center gap-2 px-4 py-2 bg-th-bg-elevated text-th-text-secondary rounded-lg text-sm font-medium hover:bg-th-interactive-hover transition-colors"
                            >
                                Edit Connection
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function findMatchingPattern(error: ErrorInfo): ErrorPattern | null {
    // First, check integration-specific patterns
    const integrationPatterns = integrationErrorPatterns[error.integrationType];
    if (integrationPatterns) {
        for (const pattern of integrationPatterns) {
            if (typeof pattern.pattern === 'string') {
                if (error.message.toLowerCase().includes(pattern.pattern.toLowerCase())) {
                    return pattern;
                }
            } else if (pattern.pattern.test(error.message)) {
                return pattern;
            }
        }
    }

    // Then check common patterns
    for (const pattern of commonErrorPatterns) {
        if (typeof pattern.pattern === 'string') {
            if (error.message.toLowerCase().includes(pattern.pattern.toLowerCase())) {
                return pattern;
            }
        } else if (pattern.pattern.test(error.message)) {
            return pattern;
        }
    }

    return null;
}

export default ErrorResolutionGuide;
