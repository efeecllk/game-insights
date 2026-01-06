/**
 * Error Resolution Guide Component - Obsidian Analytics Design
 *
 * Premium error troubleshooting with:
 * - Glassmorphism containers
 * - Animated expandable sections
 * - Severity-based color coding
 * - Interactive completion tracking
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
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
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const expandVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.2 },
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: { duration: 0.15 },
    },
};

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
        critical: {
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/30',
            text: 'text-rose-400',
            iconBg: 'bg-rose-500/20',
        },
        warning: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            iconBg: 'bg-amber-500/20',
        },
        info: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
        },
    };

    const colors = severityColors[errorPattern.severity];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
        >
            {/* Header */}
            <div className={`p-4 border-b border-white/[0.06] ${colors.bg}`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.iconBg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white">{errorPattern.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{errorPattern.description}</p>
                    </div>
                    {onClose && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500">Error:</span>
                    <code className="text-rose-400 font-mono text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                        {error.message}
                    </code>
                </div>
            </div>

            {/* Possible Causes */}
            <div className="p-4 border-b border-white/[0.06]">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    Possible Causes
                </h4>
                <ul className="space-y-2">
                    {errorPattern.causes.map((cause, idx) => (
                        <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-start gap-2 text-sm text-slate-400"
                        >
                            <span className="text-slate-600 mt-0.5">•</span>
                            {cause}
                        </motion.li>
                    ))}
                </ul>
            </div>

            {/* Resolution Steps */}
            <div className="p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Resolution Steps
                </h4>
                <div className="space-y-2">
                    {errorPattern.steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`rounded-xl border transition-colors ${
                                completedSteps.has(idx)
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-white/[0.02] border-white/[0.06]'
                            }`}
                        >
                            <button
                                onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                                className="w-full p-3 flex items-center gap-3 text-left"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        toggleStepComplete(idx);
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        completedSteps.has(idx)
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-white/[0.2] hover:border-emerald-500/50'
                                    }`}
                                >
                                    {completedSteps.has(idx) && <Check className="w-3 h-3" />}
                                </motion.button>
                                <div className="flex-1 min-w-0">
                                    <span className={`font-medium ${completedSteps.has(idx) ? 'text-emerald-400' : 'text-white'}`}>
                                        Step {idx + 1}: {step.title}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: expandedStep === idx ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="w-5 h-5 text-slate-500" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {expandedStep === idx && (
                                    <motion.div
                                        variants={expandVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="overflow-hidden"
                                    >
                                        <div className="px-3 pb-3 pt-0 ml-9">
                                            <p className="text-sm text-slate-400 mb-3">{step.description}</p>
                                            {step.action && (
                                                <StepAction
                                                    action={step.action}
                                                    onCopy={handleCopy}
                                                    copiedText={copiedText}
                                                    onEditConnection={onEditConnection}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Prevention Tips */}
            {errorPattern.preventionTips && (
                <div className="px-4 pb-4">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Prevention Tips
                        </h4>
                        <ul className="space-y-2">
                            {errorPattern.preventionTips.map((tip, idx) => (
                                <motion.li
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + idx * 0.05 }}
                                    className="flex items-start gap-2 text-sm text-slate-400"
                                >
                                    <span className="text-emerald-500 mt-0.5">•</span>
                                    {tip}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 flex items-center gap-3">
                {onRetry && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onRetry}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </motion.button>
                )}
                {onEditConnection && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onEditConnection}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 rounded-xl text-sm font-medium transition-colors"
                    >
                        Edit Connection
                    </motion.button>
                )}
                {errorPattern.docsUrl && (
                    <a
                        href={errorPattern.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Documentation
                    </a>
                )}
            </div>

            {/* Integration Info */}
            {catalogItem && (
                <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
                    <p className="text-xs text-slate-500">
                        Integration: {catalogItem.icon} {catalogItem.name}
                        {error.timestamp && ` • Error occurred ${new Date(error.timestamp).toLocaleString()}`}
                    </p>
                </div>
            )}
        </motion.div>
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
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCopy(action.value)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
                >
                    {copiedText === action.value ? (
                        <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            {action.label}
                        </>
                    )}
                </motion.button>
            );

        case 'link':
            return (
                <a
                    href={action.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-emerald-400 hover:bg-white/[0.06] transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    {action.label}
                </a>
            );

        case 'button':
            return (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.value === 'edit' ? onEditConnection : action.onClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                    {action.label}
                </motion.button>
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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6"
        >
            <div className="flex items-start gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/20 rounded-xl blur-lg" />
                    <div className="relative p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white">Connection Error</h3>
                    <p className="text-sm text-slate-400 mt-1 mb-4">{error.message}</p>

                    <div className="space-y-3 mb-5">
                        <p className="text-sm font-medium text-slate-300">Try these steps:</p>
                        <ul className="space-y-2 text-sm text-slate-400">
                            {[
                                'Check your internet connection',
                                'Verify your credentials are correct',
                                'Ensure the service is available',
                                'Try again in a few minutes',
                            ].map((step, idx) => (
                                <motion.li
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-2"
                                >
                                    <span className="text-slate-600">{idx + 1}.</span>
                                    {step}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-3">
                        {onRetry && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onRetry}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </motion.button>
                        )}
                        {onEditConnection && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onEditConnection}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Edit Connection
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
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
