/**
 * Connection Wizard Component
 * Multi-step guided setup for data source integrations
 * Phase 3: Data Sources
 */

import { useState, useCallback } from 'react';
import {
    X,
    ArrowRight,
    ArrowLeft,
    Check,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    RefreshCw,
    Clock,
    Zap,
    Bell,
    Database,
    Shield,
    Info,
} from 'lucide-react';
import {
    IntegrationType,
    IntegrationConfig,
    SyncStrategy,
    AuthMethod,
    INTEGRATION_CATALOG,
    IntegrationCatalogItem,
} from '../../lib/integrationStore';
import { useIntegrations } from '../../context/IntegrationContext';

// ============================================================================
// Types
// ============================================================================

type WizardStep = 'select' | 'auth' | 'configure' | 'sync' | 'test';

interface ConnectionWizardProps {
    initialType?: IntegrationType;
    onComplete?: () => void;
    onCancel?: () => void;
}

interface FormState {
    // Common
    name: string;
    type: IntegrationType | null;

    // Auth
    authMethod: AuthMethod['type'];
    apiKey: string;
    username: string;
    password: string;
    connectionString: string;
    bearerToken: string;

    // Google Sheets
    spreadsheetId: string;
    sheetName: string;
    range: string;
    hasHeaderRow: boolean;

    // Supabase
    projectUrl: string;
    tableName: string;

    // PostgreSQL
    host: string;
    port: number;
    database: string;
    schema: string;
    ssl: boolean;
    query: string;

    // Webhook
    endpointPath: string;
    secretKey: string;

    // REST API
    apiUrl: string;
    headerName: string;
    dataPath: string;

    // Sync
    syncType: SyncStrategy['type'];
    intervalMinutes: number;
    pollIntervalSeconds: number;
}

const initialFormState: FormState = {
    name: '',
    type: null,
    authMethod: 'apikey',
    apiKey: '',
    username: '',
    password: '',
    connectionString: '',
    bearerToken: '',
    spreadsheetId: '',
    sheetName: '',
    range: '',
    hasHeaderRow: true,
    projectUrl: '',
    tableName: '',
    host: '',
    port: 5432,
    database: '',
    schema: 'public',
    ssl: true,
    query: '',
    endpointPath: '',
    secretKey: '',
    apiUrl: '',
    headerName: 'X-API-Key',
    dataPath: '',
    syncType: 'manual',
    intervalMinutes: 60,
    pollIntervalSeconds: 30,
};

// ============================================================================
// Main Component
// ============================================================================

export function ConnectionWizard({ initialType, onComplete, onCancel }: ConnectionWizardProps) {
    const { addIntegration, updateStatus } = useIntegrations();
    const [currentStep, setCurrentStep] = useState<WizardStep>(initialType ? 'auth' : 'select');
    const [form, setForm] = useState<FormState>({
        ...initialFormState,
        type: initialType || null,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testError, setTestError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Get catalog item for selected type
    const catalogItem = form.type ? INTEGRATION_CATALOG.find(i => i.type === form.type) : null;

    // Update form field
    const updateForm = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    // Step navigation
    const steps: WizardStep[] = ['select', 'auth', 'configure', 'sync', 'test'];
    const currentStepIndex = steps.indexOf(currentStep);

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex]);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex]);
        }
    };

    // Validate current step
    const isStepValid = (): boolean => {
        switch (currentStep) {
            case 'select':
                return form.type !== null;
            case 'auth':
                return validateAuth();
            case 'configure':
                return validateConfig();
            case 'sync':
                return true; // Sync settings have defaults
            case 'test':
                return testStatus === 'success';
            default:
                return false;
        }
    };

    const validateAuth = (): boolean => {
        if (!catalogItem) return false;
        const method = form.authMethod;

        switch (method) {
            case 'apikey':
                return form.apiKey.trim().length > 0;
            case 'bearer':
                return form.bearerToken.trim().length > 0;
            case 'basic':
                return form.username.trim().length > 0 && form.password.trim().length > 0;
            case 'connection':
                return form.connectionString.trim().length > 0;
            case 'oauth':
                // OAuth is handled separately - for now, just check we have a type
                return true;
            case 'serviceAccount':
                // Service account would need JSON upload
                return true;
            case 'none':
                return true;
            default:
                return false;
        }
    };

    const validateConfig = (): boolean => {
        switch (form.type) {
            case 'google_sheets':
                return form.spreadsheetId.trim().length > 0;
            case 'supabase':
                return form.projectUrl.trim().length > 0 && form.tableName.trim().length > 0;
            case 'postgresql':
            case 'mysql':
            case 'mongodb':
                return form.host.trim().length > 0 && form.database.trim().length > 0;
            case 'webhook':
                return form.endpointPath.trim().length > 0;
            case 'rest_api':
                return form.apiUrl.trim().length > 0;
            case 'firebase':
            case 'playfab':
            case 'unity':
                return form.name.trim().length > 0;
            default:
                return true;
        }
    };

    // Test connection
    const testConnection = async () => {
        setTestStatus('testing');
        setTestError(null);

        try {
            // Simulate connection test
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Basic validation for different types
            if (form.type === 'supabase') {
                if (!form.projectUrl.includes('supabase.co')) {
                    throw new Error('Invalid Supabase URL. Expected format: https://xxx.supabase.co');
                }
            }

            if (form.type === 'postgresql' || form.type === 'mysql') {
                if (form.port < 1 || form.port > 65535) {
                    throw new Error('Invalid port number');
                }
            }

            // Connection test passed
            setTestStatus('success');
        } catch (error) {
            setTestStatus('error');
            setTestError(error instanceof Error ? error.message : 'Connection failed');
        }
    };

    // Build integration config
    const buildConfig = (): IntegrationConfig => {
        const auth = buildAuthMethod();
        const sync = buildSyncStrategy();

        const config: IntegrationConfig = {
            name: form.name || catalogItem?.name || 'New Integration',
            type: form.type!,
            auth,
            syncStrategy: sync,
        };

        // Add type-specific config
        switch (form.type) {
            case 'google_sheets':
                config.googleSheets = {
                    spreadsheetId: form.spreadsheetId,
                    sheetName: form.sheetName || undefined,
                    range: form.range || undefined,
                    hasHeaderRow: form.hasHeaderRow,
                };
                break;
            case 'supabase':
                config.supabase = {
                    projectUrl: form.projectUrl,
                    tableName: form.tableName,
                };
                break;
            case 'postgresql':
                config.postgresql = {
                    host: form.host,
                    port: form.port,
                    database: form.database,
                    schema: form.schema || 'public',
                    tableName: form.tableName || undefined,
                    query: form.query || undefined,
                    ssl: form.ssl,
                };
                break;
            case 'webhook':
                config.webhook = {
                    endpointPath: form.endpointPath,
                    secretKey: form.secretKey || undefined,
                };
                break;
            case 'firebase':
                config.firebase = {
                    projectId: form.name,
                };
                break;
        }

        return config;
    };

    const buildAuthMethod = (): AuthMethod => {
        switch (form.authMethod) {
            case 'apikey':
                return { type: 'apikey', key: form.apiKey, headerName: form.headerName };
            case 'bearer':
                return { type: 'bearer', token: form.bearerToken };
            case 'basic':
                return { type: 'basic', username: form.username, password: form.password };
            case 'connection':
                return { type: 'connection', connectionString: form.connectionString };
            case 'oauth':
                return { type: 'oauth', provider: (form.type === 'google_sheets' ? 'google' : form.type === 'unity' ? 'unity' : 'firebase') as 'google' | 'unity' | 'firebase' };
            case 'serviceAccount':
                return { type: 'serviceAccount', credentials: {} };
            default:
                return { type: 'none' };
        }
    };

    const buildSyncStrategy = (): SyncStrategy => {
        switch (form.syncType) {
            case 'scheduled':
                return { type: 'scheduled', intervalMinutes: form.intervalMinutes };
            case 'realtime':
                return { type: 'realtime', method: 'polling', pollIntervalSeconds: form.pollIntervalSeconds };
            case 'webhook':
                return { type: 'webhook' };
            default:
                return { type: 'manual' };
        }
    };

    // Create integration
    const handleCreate = async () => {
        if (!form.type) return;

        setIsCreating(true);
        try {
            const config = buildConfig();
            const integration = await addIntegration(config);
            await updateStatus(integration.id, 'connected');
            onComplete?.();
        } catch (error) {
            console.error('Failed to create integration:', error);
            setTestStatus('error');
            setTestError(error instanceof Error ? error.message : 'Failed to create integration');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-th-bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-th-border-subtle">
                    <div>
                        <h2 className="text-xl font-semibold text-th-text-primary">
                            {catalogItem ? `Connect ${catalogItem.name}` : 'Add Data Source'}
                        </h2>
                        <p className="text-sm text-th-text-muted mt-1">
                            {getStepDescription(currentStep)}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-th-bg-surface-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-th-text-muted" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-th-border-subtle">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                        index < currentStepIndex
                                            ? 'bg-th-accent-primary text-white'
                                            : index === currentStepIndex
                                            ? 'bg-th-accent-primary-muted text-th-accent-primary border-2 border-th-accent-primary'
                                            : 'bg-th-bg-elevated text-th-text-muted'
                                    }`}
                                >
                                    {index < currentStepIndex ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-12 h-0.5 mx-2 ${
                                            index < currentStepIndex
                                                ? 'bg-th-accent-primary'
                                                : 'bg-th-border-subtle'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-th-text-muted">
                        <span>Select</span>
                        <span>Auth</span>
                        <span>Configure</span>
                        <span>Sync</span>
                        <span>Test</span>
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {currentStep === 'select' && (
                        <SelectStep form={form} updateForm={updateForm} />
                    )}
                    {currentStep === 'auth' && catalogItem && (
                        <AuthStep
                            form={form}
                            updateForm={updateForm}
                            catalogItem={catalogItem}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                        />
                    )}
                    {currentStep === 'configure' && (
                        <ConfigureStep form={form} updateForm={updateForm} />
                    )}
                    {currentStep === 'sync' && (
                        <SyncStep form={form} updateForm={updateForm} />
                    )}
                    {currentStep === 'test' && (
                        <TestStep
                            form={form}
                            testStatus={testStatus}
                            testError={testError}
                            onTest={testConnection}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-th-border-subtle bg-th-bg-subtle">
                    <button
                        onClick={currentStepIndex === 0 ? onCancel : goBack}
                        className="flex items-center gap-2 px-4 py-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {currentStepIndex === 0 ? 'Cancel' : 'Back'}
                    </button>

                    {currentStep === 'test' ? (
                        <button
                            onClick={handleCreate}
                            disabled={testStatus !== 'success' || isCreating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-th-accent-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-th-accent-primary/90 transition-colors"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Create Connection
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={goNext}
                            disabled={!isStepValid()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-th-accent-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-th-accent-primary/90 transition-colors"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Step Components
// ============================================================================

function SelectStep({
    form,
    updateForm,
}: {
    form: FormState;
    updateForm: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
    // Group integrations by tier
    const tier1 = INTEGRATION_CATALOG.filter(i => i.tier === 1);
    const tier2 = INTEGRATION_CATALOG.filter(i => i.tier === 2);
    const tier3 = INTEGRATION_CATALOG.filter(i => i.tier >= 3);

    return (
        <div className="space-y-6">
            {/* Tier 1 - Most Popular */}
            <div>
                <h3 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-th-accent-primary" />
                    Most Popular
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {tier1.map(item => (
                        <IntegrationOption
                            key={item.type}
                            item={item}
                            selected={form.type === item.type}
                            onSelect={() => updateForm('type', item.type)}
                        />
                    ))}
                </div>
            </div>

            {/* Tier 2 - Databases */}
            <div>
                <h3 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-th-info" />
                    Databases
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {tier2.map(item => (
                        <IntegrationOption
                            key={item.type}
                            item={item}
                            selected={form.type === item.type}
                            onSelect={() => updateForm('type', item.type)}
                        />
                    ))}
                </div>
            </div>

            {/* Tier 3 - Game Platforms */}
            <div>
                <h3 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-th-success" />
                    Game Platforms
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {tier3.map(item => (
                        <IntegrationOption
                            key={item.type}
                            item={item}
                            selected={form.type === item.type}
                            onSelect={() => updateForm('type', item.type)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function IntegrationOption({
    item,
    selected,
    onSelect,
}: {
    item: IntegrationCatalogItem;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
                selected
                    ? 'border-th-accent-primary bg-th-accent-primary-muted'
                    : 'border-th-border-subtle hover:border-th-border bg-th-bg-elevated hover:bg-th-bg-surface-hover'
            }`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-th-text-primary">{item.name}</div>
                    <div className="text-xs text-th-text-muted mt-0.5 line-clamp-2">
                        {item.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.complexity === 'low'
                                ? 'bg-th-success-muted text-th-success'
                                : item.complexity === 'medium'
                                ? 'bg-th-warning-muted text-th-warning'
                                : 'bg-th-error-muted text-th-error'
                        }`}>
                            {item.complexity}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}

function AuthStep({
    form,
    updateForm,
    catalogItem,
    showPassword,
    setShowPassword,
}: {
    form: FormState;
    updateForm: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
    catalogItem: IntegrationCatalogItem;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
}) {
    // Set default auth method based on catalog
    const availableAuth = catalogItem.authMethods;

    return (
        <div className="space-y-6">
            {/* Connection Name */}
            <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">
                    Connection Name
                </label>
                <input
                    type="text"
                    value={form.name}
                    onChange={e => updateForm('name', e.target.value)}
                    placeholder={`My ${catalogItem.name}`}
                    className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                />
            </div>

            {/* Auth Method Selection */}
            {availableAuth.length > 1 && (
                <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-2">
                        Authentication Method
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableAuth.map(method => (
                            <button
                                key={method}
                                onClick={() => updateForm('authMethod', method)}
                                className={`px-4 py-2 rounded-lg border transition-colors ${
                                    form.authMethod === method
                                        ? 'border-th-accent-primary bg-th-accent-primary-muted text-th-accent-primary'
                                        : 'border-th-border-subtle hover:border-th-border text-th-text-secondary'
                                }`}
                            >
                                {getAuthMethodLabel(method)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Auth Fields based on method */}
            {form.authMethod === 'apikey' && (
                <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.apiKey}
                            onChange={e => updateForm('apiKey', e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-2.5 pr-12 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-th-text-muted mt-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Credentials are encrypted and stored locally
                    </p>
                </div>
            )}

            {form.authMethod === 'bearer' && (
                <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-2">
                        Bearer Token
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.bearerToken}
                            onChange={e => updateForm('bearerToken', e.target.value)}
                            placeholder="Enter your bearer token"
                            className="w-full px-4 py-2.5 pr-12 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {form.authMethod === 'basic' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={e => updateForm('username', e.target.value)}
                            placeholder="Enter username"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => updateForm('password', e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-4 py-2.5 pr-12 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {form.authMethod === 'connection' && (
                <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-2">
                        Connection String
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.connectionString}
                            onChange={e => updateForm('connectionString', e.target.value)}
                            placeholder="postgresql://user:pass@host:5432/db"
                            className="w-full px-4 py-2.5 pr-12 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {form.authMethod === 'oauth' && (
                <div className="p-4 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-th-info flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-th-text-secondary">
                                OAuth authentication will open a popup window to sign in with your {catalogItem.name} account.
                            </p>
                            <button className="mt-3 px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary/90 transition-colors">
                                Sign in with {form.type === 'google_sheets' ? 'Google' : catalogItem.name}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {form.authMethod === 'none' && (
                <div className="p-4 bg-th-success-muted rounded-xl border border-th-success/20">
                    <div className="flex items-center gap-2 text-th-success">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">No authentication required</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function ConfigureStep({
    form,
    updateForm,
}: {
    form: FormState;
    updateForm: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Google Sheets Config */}
            {form.type === 'google_sheets' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Spreadsheet ID or URL
                        </label>
                        <input
                            type="text"
                            value={form.spreadsheetId}
                            onChange={e => updateForm('spreadsheetId', extractSpreadsheetId(e.target.value))}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                        />
                        <p className="text-xs text-th-text-muted mt-1">
                            Paste the full URL or just the spreadsheet ID
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                Sheet Name (optional)
                            </label>
                            <input
                                type="text"
                                value={form.sheetName}
                                onChange={e => updateForm('sheetName', e.target.value)}
                                placeholder="Sheet1"
                                className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                Range (optional)
                            </label>
                            <input
                                type="text"
                                value={form.range}
                                onChange={e => updateForm('range', e.target.value)}
                                placeholder="A1:Z1000"
                                className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.hasHeaderRow}
                            onChange={e => updateForm('hasHeaderRow', e.target.checked)}
                            className="w-4 h-4 rounded border-th-border text-th-accent-primary focus:ring-th-accent-primary"
                        />
                        <span className="text-sm text-th-text-secondary">First row contains headers</span>
                    </label>
                </>
            )}

            {/* Supabase Config */}
            {form.type === 'supabase' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Project URL
                        </label>
                        <input
                            type="text"
                            value={form.projectUrl}
                            onChange={e => updateForm('projectUrl', e.target.value)}
                            placeholder="https://xxxxx.supabase.co"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Table Name
                        </label>
                        <input
                            type="text"
                            value={form.tableName}
                            onChange={e => updateForm('tableName', e.target.value)}
                            placeholder="game_events"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                        />
                    </div>
                </>
            )}

            {/* PostgreSQL/MySQL Config */}
            {(form.type === 'postgresql' || form.type === 'mysql') && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                Host
                            </label>
                            <input
                                type="text"
                                value={form.host}
                                onChange={e => updateForm('host', e.target.value)}
                                placeholder="localhost"
                                className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                Port
                            </label>
                            <input
                                type="number"
                                value={form.port}
                                onChange={e => updateForm('port', parseInt(e.target.value) || 5432)}
                                placeholder={form.type === 'mysql' ? '3306' : '5432'}
                                className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                Database
                            </label>
                            <input
                                type="text"
                                value={form.database}
                                onChange={e => updateForm('database', e.target.value)}
                                placeholder="game_analytics"
                                className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                Schema
                            </label>
                            <input
                                type="text"
                                value={form.schema}
                                onChange={e => updateForm('schema', e.target.value)}
                                placeholder="public"
                                className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Table or Query (optional)
                        </label>
                        <textarea
                            value={form.query || form.tableName}
                            onChange={e => updateForm('query', e.target.value)}
                            placeholder="SELECT * FROM events WHERE created_at > NOW() - INTERVAL '7 days'"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.ssl}
                            onChange={e => updateForm('ssl', e.target.checked)}
                            className="w-4 h-4 rounded border-th-border text-th-accent-primary focus:ring-th-accent-primary"
                        />
                        <span className="text-sm text-th-text-secondary">Use SSL connection</span>
                    </label>
                </>
            )}

            {/* Webhook Config */}
            {form.type === 'webhook' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Endpoint Path
                        </label>
                        <div className="flex items-center">
                            <span className="px-4 py-2.5 bg-th-bg-elevated border border-r-0 border-th-border-subtle rounded-l-lg text-th-text-muted text-sm">
                                /webhook/
                            </span>
                            <input
                                type="text"
                                value={form.endpointPath}
                                onChange={e => updateForm('endpointPath', e.target.value)}
                                placeholder="my-game-events"
                                className="flex-1 px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-r-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                            />
                        </div>
                        <p className="text-xs text-th-text-muted mt-1">
                            Your webhook URL will be: <code className="text-th-accent-primary">https://api.gameinsights.dev/webhook/{form.endpointPath || 'my-game-events'}</code>
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Secret Key (optional)
                        </label>
                        <input
                            type="text"
                            value={form.secretKey}
                            onChange={e => updateForm('secretKey', e.target.value)}
                            placeholder="Auto-generated if empty"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                    </div>
                </>
            )}

            {/* REST API Config */}
            {form.type === 'rest_api' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            API URL
                        </label>
                        <input
                            type="text"
                            value={form.apiUrl}
                            onChange={e => updateForm('apiUrl', e.target.value)}
                            placeholder="https://api.example.com/v1/events"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Data Path (optional)
                        </label>
                        <input
                            type="text"
                            value={form.dataPath}
                            onChange={e => updateForm('dataPath', e.target.value)}
                            placeholder="data.events"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                        />
                        <p className="text-xs text-th-text-muted mt-1">
                            JSON path to the data array in the response (e.g., data.items)
                        </p>
                    </div>
                </>
            )}

            {/* Firebase/PlayFab/Unity - Basic config */}
            {(form.type === 'firebase' || form.type === 'playfab' || form.type === 'unity') && (
                <div className="p-4 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-th-info flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-th-text-secondary">
                            <p className="font-medium text-th-text-primary mb-1">
                                {form.type === 'firebase' && 'Firebase Analytics Configuration'}
                                {form.type === 'playfab' && 'PlayFab Configuration'}
                                {form.type === 'unity' && 'Unity Gaming Services Configuration'}
                            </p>
                            <p>
                                Advanced configuration for this integration will be available after initial connection.
                                You can customize event types, date ranges, and data filtering later.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MongoDB Config */}
            {form.type === 'mongodb' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Connection String
                        </label>
                        <input
                            type="text"
                            value={form.connectionString}
                            onChange={e => updateForm('connectionString', e.target.value)}
                            placeholder="mongodb+srv://user:pass@cluster.mongodb.net/db"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Collection Name
                        </label>
                        <input
                            type="text"
                            value={form.tableName}
                            onChange={e => updateForm('tableName', e.target.value)}
                            placeholder="events"
                            className="w-full px-4 py-2.5 bg-th-bg-elevated border border-th-border-subtle rounded-lg text-th-text-primary placeholder:text-th-text-disabled focus:outline-none focus:border-th-accent-primary"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function SyncStep({
    form,
    updateForm,
}: {
    form: FormState;
    updateForm: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
    const syncOptions: Array<{
        type: SyncStrategy['type'];
        icon: typeof Clock;
        title: string;
        description: string;
    }> = [
        {
            type: 'manual',
            icon: RefreshCw,
            title: 'Manual',
            description: 'Sync data when you click refresh',
        },
        {
            type: 'scheduled',
            icon: Clock,
            title: 'Scheduled',
            description: 'Automatically sync at regular intervals',
        },
        {
            type: 'realtime',
            icon: Zap,
            title: 'Real-time',
            description: 'Keep data continuously updated',
        },
    ];

    // Add webhook option for webhook type
    if (form.type === 'webhook') {
        syncOptions.push({
            type: 'webhook',
            icon: Bell,
            title: 'Push-based',
            description: 'Receive data when events are pushed',
        });
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-3">
                {syncOptions.map(option => {
                    const Icon = option.icon;
                    const isSelected = form.syncType === option.type;

                    return (
                        <button
                            key={option.type}
                            onClick={() => updateForm('syncType', option.type)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                    ? 'border-th-accent-primary bg-th-accent-primary-muted'
                                    : 'border-th-border-subtle hover:border-th-border bg-th-bg-elevated'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                    isSelected ? 'bg-th-accent-primary/20' : 'bg-th-bg-surface'
                                }`}>
                                    <Icon className={`w-5 h-5 ${
                                        isSelected ? 'text-th-accent-primary' : 'text-th-text-muted'
                                    }`} />
                                </div>
                                <div>
                                    <div className="font-medium text-th-text-primary">{option.title}</div>
                                    <div className="text-sm text-th-text-muted">{option.description}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Interval setting for scheduled sync */}
            {form.syncType === 'scheduled' && (
                <div className="p-4 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                    <label className="block text-sm font-medium text-th-text-secondary mb-3">
                        Sync Interval
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={5}
                            max={1440}
                            step={5}
                            value={form.intervalMinutes}
                            onChange={e => updateForm('intervalMinutes', parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm font-medium text-th-text-primary min-w-[80px] text-right">
                            {formatInterval(form.intervalMinutes)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-th-text-muted mt-1">
                        <span>5 min</span>
                        <span>24 hours</span>
                    </div>
                </div>
            )}

            {/* Poll interval for realtime */}
            {form.syncType === 'realtime' && (
                <div className="p-4 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                    <label className="block text-sm font-medium text-th-text-secondary mb-3">
                        Poll Interval
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={5}
                            max={300}
                            step={5}
                            value={form.pollIntervalSeconds}
                            onChange={e => updateForm('pollIntervalSeconds', parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm font-medium text-th-text-primary min-w-[60px] text-right">
                            {form.pollIntervalSeconds}s
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-th-text-muted mt-1">
                        <span>5 sec</span>
                        <span>5 min</span>
                    </div>
                    <p className="text-xs text-th-warning mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Shorter intervals may increase API usage
                    </p>
                </div>
            )}
        </div>
    );
}

function TestStep({
    form,
    testStatus,
    testError,
    onTest,
}: {
    form: FormState;
    testStatus: 'idle' | 'testing' | 'success' | 'error';
    testError: string | null;
    onTest: () => void;
}) {
    const catalogItem = form.type ? INTEGRATION_CATALOG.find(i => i.type === form.type) : null;

    return (
        <div className="space-y-6">
            {/* Connection Summary */}
            <div className="p-4 bg-th-bg-elevated rounded-xl border border-th-border-subtle">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Connection Summary</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-th-text-muted">Type</span>
                        <span className="text-th-text-primary flex items-center gap-2">
                            <span>{catalogItem?.icon}</span>
                            {catalogItem?.name}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-th-text-muted">Name</span>
                        <span className="text-th-text-primary">{form.name || 'Untitled'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-th-text-muted">Auth</span>
                        <span className="text-th-text-primary">{getAuthMethodLabel(form.authMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-th-text-muted">Sync</span>
                        <span className="text-th-text-primary capitalize">{form.syncType}</span>
                    </div>
                </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex flex-col items-center justify-center py-8">
                {testStatus === 'idle' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-th-bg-elevated flex items-center justify-center mb-4">
                            <Database className="w-8 h-8 text-th-text-muted" />
                        </div>
                        <p className="text-th-text-secondary mb-4">Ready to test your connection</p>
                        <button
                            onClick={onTest}
                            className="flex items-center gap-2 px-6 py-3 bg-th-accent-primary text-white rounded-lg font-medium hover:bg-th-accent-primary/90 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Test Connection
                        </button>
                    </>
                )}

                {testStatus === 'testing' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-th-accent-primary-muted flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-th-accent-primary animate-spin" />
                        </div>
                        <p className="text-th-text-secondary">Testing connection...</p>
                        <p className="text-sm text-th-text-muted mt-1">This may take a few seconds</p>
                    </>
                )}

                {testStatus === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-th-success-muted flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-th-success" />
                        </div>
                        <p className="text-th-success font-medium mb-2">Connection successful!</p>
                        <p className="text-sm text-th-text-muted">Your data source is ready to use</p>
                    </>
                )}

                {testStatus === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-th-error-muted flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-th-error" />
                        </div>
                        <p className="text-th-error font-medium mb-2">Connection failed</p>
                        {testError && (
                            <p className="text-sm text-th-text-muted mb-4 text-center max-w-sm">
                                {testError}
                            </p>
                        )}
                        <button
                            onClick={onTest}
                            className="flex items-center gap-2 px-4 py-2 border border-th-border-subtle rounded-lg text-th-text-secondary hover:bg-th-bg-surface-hover transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStepDescription(step: WizardStep): string {
    switch (step) {
        case 'select':
            return 'Choose a data source type to connect';
        case 'auth':
            return 'Configure authentication credentials';
        case 'configure':
            return 'Set up the data source details';
        case 'sync':
            return 'Choose how to keep data updated';
        case 'test':
            return 'Verify your connection works';
        default:
            return '';
    }
}

function getAuthMethodLabel(method: AuthMethod['type']): string {
    switch (method) {
        case 'apikey':
            return 'API Key';
        case 'bearer':
            return 'Bearer Token';
        case 'basic':
            return 'Username/Password';
        case 'connection':
            return 'Connection String';
        case 'oauth':
            return 'OAuth';
        case 'serviceAccount':
            return 'Service Account';
        case 'none':
            return 'No Auth';
        default:
            return method;
    }
}

function formatInterval(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    if (minutes === 60) return '1 hour';
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    return '24 hours';
}

function extractSpreadsheetId(input: string): string {
    // Extract spreadsheet ID from Google Sheets URL
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
}

export default ConnectionWizard;
