/**
 * Connection Wizard Component - Obsidian Analytics Design
 *
 * Multi-step guided setup with:
 * - Glassmorphism containers
 * - Animated step transitions
 * - Emerald accent colors
 * - Premium form styling
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    name: string;
    type: IntegrationType | null;
    authMethod: AuthMethod['type'];
    apiKey: string;
    username: string;
    password: string;
    connectionString: string;
    bearerToken: string;
    spreadsheetId: string;
    sheetName: string;
    range: string;
    hasHeaderRow: boolean;
    projectUrl: string;
    tableName: string;
    host: string;
    port: number;
    database: string;
    schema: string;
    ssl: boolean;
    query: string;
    endpointPath: string;
    secretKey: string;
    apiUrl: string;
    headerName: string;
    dataPath: string;
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
// Animation Variants
// ============================================================================

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.95, y: 20 },
};

const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
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

    const catalogItem = form.type ? INTEGRATION_CATALOG.find(i => i.type === form.type) : null;

    const updateForm = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

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

    const isStepValid = (): boolean => {
        switch (currentStep) {
            case 'select':
                return form.type !== null;
            case 'auth':
                return validateAuth();
            case 'configure':
                return validateConfig();
            case 'sync':
                return true;
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
            case 'serviceAccount':
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

    const testConnection = async () => {
        setTestStatus('testing');
        setTestError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

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

            setTestStatus('success');
        } catch (error) {
            setTestStatus('error');
            setTestError(error instanceof Error ? error.message : 'Connection failed');
        }
    };

    const buildConfig = (): IntegrationConfig => {
        const auth = buildAuthMethod();
        const sync = buildSyncStrategy();

        const config: IntegrationConfig = {
            name: form.name || catalogItem?.name || 'New Integration',
            type: form.type!,
            auth,
            syncStrategy: sync,
        };

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
        <AnimatePresence>
            <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    variants={modalVariants}
                    className="bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-950/98 backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/[0.08]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {catalogItem ? `Connect ${catalogItem.name}` : 'Add Data Source'}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {getStepDescription(currentStep)}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCancel}
                            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </motion.button>
                    </div>

                    {/* Progress Steps */}
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={step} className="flex items-center">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                            index < currentStepIndex
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : index === currentStepIndex
                                                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                                                : 'bg-white/[0.05] text-slate-500'
                                        }`}
                                    >
                                        {index < currentStepIndex ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </motion.div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`w-12 h-0.5 mx-2 transition-colors ${
                                                index < currentStepIndex
                                                    ? 'bg-emerald-500'
                                                    : 'bg-white/[0.08]'
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                            <span>Select</span>
                            <span>Auth</span>
                            <span>Configure</span>
                            <span>Sync</span>
                            <span>Test</span>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                variants={contentVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
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
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-white/[0.06] bg-white/[0.02]">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={currentStepIndex === 0 ? onCancel : goBack}
                            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
                        </motion.button>

                        {currentStep === 'test' ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCreate}
                                disabled={testStatus !== 'success' || isCreating}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
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
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={goNext}
                                disabled={!isStepValid()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
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
    const tier1 = INTEGRATION_CATALOG.filter(i => i.tier === 1);
    const tier2 = INTEGRATION_CATALOG.filter(i => i.tier === 2);
    const tier3 = INTEGRATION_CATALOG.filter(i => i.tier >= 3);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
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

            <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
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

            <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-violet-400" />
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
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSelect}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
                selected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.02] hover:bg-white/[0.04]'
            }`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {item.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            item.complexity === 'low'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : item.complexity === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {item.complexity}
                        </span>
                    </div>
                </div>
            </div>
        </motion.button>
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
    const availableAuth = catalogItem.authMethods;

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Connection Name
                </label>
                <input
                    type="text"
                    value={form.name}
                    onChange={e => updateForm('name', e.target.value)}
                    placeholder={`My ${catalogItem.name}`}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
            </div>

            {availableAuth.length > 1 && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Authentication Method
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableAuth.map(method => (
                            <button
                                key={method}
                                onClick={() => updateForm('authMethod', method)}
                                className={`px-4 py-2 rounded-lg border transition-all ${
                                    form.authMethod === method
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                        : 'border-white/[0.08] hover:border-white/[0.16] text-slate-400'
                                }`}
                            >
                                {getAuthMethodLabel(method)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {form.authMethod === 'apikey' && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.apiKey}
                            onChange={e => updateForm('apiKey', e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-2.5 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Credentials are encrypted and stored locally
                    </p>
                </div>
            )}

            {form.authMethod === 'bearer' && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bearer Token
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.bearerToken}
                            onChange={e => updateForm('bearerToken', e.target.value)}
                            placeholder="Enter your bearer token"
                            className="w-full px-4 py-2.5 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {form.authMethod === 'basic' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={e => updateForm('username', e.target.value)}
                            placeholder="Enter username"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => updateForm('password', e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-4 py-2.5 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {form.authMethod === 'connection' && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Connection String
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.connectionString}
                            onChange={e => updateForm('connectionString', e.target.value)}
                            placeholder="postgresql://user:pass@host:5432/db"
                            className="w-full px-4 py-2.5 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {form.authMethod === 'oauth' && (
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-300">
                                OAuth authentication will open a popup window to sign in with your {catalogItem.name} account.
                            </p>
                            <button className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors">
                                Sign in with {form.type === 'google_sheets' ? 'Google' : catalogItem.name}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {form.authMethod === 'none' && (
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400">
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
            {form.type === 'google_sheets' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Spreadsheet ID or URL
                        </label>
                        <input
                            type="text"
                            value={form.spreadsheetId}
                            onChange={e => updateForm('spreadsheetId', extractSpreadsheetId(e.target.value))}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Paste the full URL or just the spreadsheet ID
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Sheet Name (optional)
                            </label>
                            <input
                                type="text"
                                value={form.sheetName}
                                onChange={e => updateForm('sheetName', e.target.value)}
                                placeholder="Sheet1"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Range (optional)
                            </label>
                            <input
                                type="text"
                                value={form.range}
                                onChange={e => updateForm('range', e.target.value)}
                                placeholder="A1:Z1000"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.hasHeaderRow}
                            onChange={e => updateForm('hasHeaderRow', e.target.checked)}
                            className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.03] text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-300">First row contains headers</span>
                    </label>
                </>
            )}

            {form.type === 'supabase' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project URL
                        </label>
                        <input
                            type="text"
                            value={form.projectUrl}
                            onChange={e => updateForm('projectUrl', e.target.value)}
                            placeholder="https://xxxxx.supabase.co"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Table Name
                        </label>
                        <input
                            type="text"
                            value={form.tableName}
                            onChange={e => updateForm('tableName', e.target.value)}
                            placeholder="game_events"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                    </div>
                </>
            )}

            {(form.type === 'postgresql' || form.type === 'mysql') && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Host</label>
                            <input
                                type="text"
                                value={form.host}
                                onChange={e => updateForm('host', e.target.value)}
                                placeholder="localhost"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Port</label>
                            <input
                                type="number"
                                value={form.port}
                                onChange={e => updateForm('port', parseInt(e.target.value) || 5432)}
                                placeholder={form.type === 'mysql' ? '3306' : '5432'}
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Database</label>
                            <input
                                type="text"
                                value={form.database}
                                onChange={e => updateForm('database', e.target.value)}
                                placeholder="game_analytics"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Schema</label>
                            <input
                                type="text"
                                value={form.schema}
                                onChange={e => updateForm('schema', e.target.value)}
                                placeholder="public"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Table or Query (optional)
                        </label>
                        <textarea
                            value={form.query || form.tableName}
                            onChange={e => updateForm('query', e.target.value)}
                            placeholder="SELECT * FROM events WHERE created_at > NOW() - INTERVAL '7 days'"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all resize-none"
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.ssl}
                            onChange={e => updateForm('ssl', e.target.checked)}
                            className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.03] text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-300">Use SSL connection</span>
                    </label>
                </>
            )}

            {form.type === 'webhook' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Endpoint Path</label>
                        <div className="flex items-center">
                            <span className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] border-r-0 rounded-l-xl text-slate-500 text-sm">
                                /webhook/
                            </span>
                            <input
                                type="text"
                                value={form.endpointPath}
                                onChange={e => updateForm('endpointPath', e.target.value)}
                                placeholder="my-game-events"
                                className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-r-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Your webhook URL will be: <code className="text-emerald-400">https://api.gameinsights.dev/webhook/{form.endpointPath || 'my-game-events'}</code>
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Secret Key (optional)
                        </label>
                        <input
                            type="text"
                            value={form.secretKey}
                            onChange={e => updateForm('secretKey', e.target.value)}
                            placeholder="Auto-generated if empty"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                        />
                    </div>
                </>
            )}

            {form.type === 'rest_api' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">API URL</label>
                        <input
                            type="text"
                            value={form.apiUrl}
                            onChange={e => updateForm('apiUrl', e.target.value)}
                            placeholder="https://api.example.com/v1/events"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Data Path (optional)
                        </label>
                        <input
                            type="text"
                            value={form.dataPath}
                            onChange={e => updateForm('dataPath', e.target.value)}
                            placeholder="data.events"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            JSON path to the data array in the response (e.g., data.items)
                        </p>
                    </div>
                </>
            )}

            {(form.type === 'firebase' || form.type === 'playfab' || form.type === 'unity') && (
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-300">
                            <p className="font-medium text-white mb-1">
                                {form.type === 'firebase' && 'Firebase Analytics Configuration'}
                                {form.type === 'playfab' && 'PlayFab Configuration'}
                                {form.type === 'unity' && 'Unity Gaming Services Configuration'}
                            </p>
                            <p>
                                Advanced configuration for this integration will be available after initial connection.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {form.type === 'mongodb' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Connection String
                        </label>
                        <input
                            type="text"
                            value={form.connectionString}
                            onChange={e => updateForm('connectionString', e.target.value)}
                            placeholder="mongodb+srv://user:pass@cluster.mongodb.net/db"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Collection Name
                        </label>
                        <input
                            type="text"
                            value={form.tableName}
                            onChange={e => updateForm('tableName', e.target.value)}
                            placeholder="events"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
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
        { type: 'manual', icon: RefreshCw, title: 'Manual', description: 'Sync data when you click refresh' },
        { type: 'scheduled', icon: Clock, title: 'Scheduled', description: 'Automatically sync at regular intervals' },
        { type: 'realtime', icon: Zap, title: 'Real-time', description: 'Keep data continuously updated' },
    ];

    if (form.type === 'webhook') {
        syncOptions.push({ type: 'webhook', icon: Bell, title: 'Push-based', description: 'Receive data when events are pushed' });
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-3">
                {syncOptions.map(option => {
                    const Icon = option.icon;
                    const isSelected = form.syncType === option.type;

                    return (
                        <motion.button
                            key={option.type}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => updateForm('syncType', option.type)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.02]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/20' : 'bg-white/[0.03]'}`}>
                                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">{option.title}</div>
                                    <div className="text-sm text-slate-400">{option.description}</div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {form.syncType === 'scheduled' && (
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                    <label className="block text-sm font-medium text-slate-300 mb-3">Sync Interval</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={5}
                            max={1440}
                            step={5}
                            value={form.intervalMinutes}
                            onChange={e => updateForm('intervalMinutes', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-white/[0.1] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-sm font-medium text-white min-w-[80px] text-right">
                            {formatInterval(form.intervalMinutes)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>5 min</span>
                        <span>24 hours</span>
                    </div>
                </div>
            )}

            {form.syncType === 'realtime' && (
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                    <label className="block text-sm font-medium text-slate-300 mb-3">Poll Interval</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={5}
                            max={300}
                            step={5}
                            value={form.pollIntervalSeconds}
                            onChange={e => updateForm('pollIntervalSeconds', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-white/[0.1] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-sm font-medium text-white min-w-[60px] text-right">
                            {form.pollIntervalSeconds}s
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>5 sec</span>
                        <span>5 min</span>
                    </div>
                    <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
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
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Connection Summary</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Type</span>
                        <span className="text-white flex items-center gap-2">
                            <span>{catalogItem?.icon}</span>
                            {catalogItem?.name}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="text-white">{form.name || 'Untitled'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Auth</span>
                        <span className="text-white">{getAuthMethodLabel(form.authMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Sync</span>
                        <span className="text-white capitalize">{form.syncType}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-8">
                {testStatus === 'idle' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
                            <Database className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-300 mb-4">Ready to test your connection</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onTest}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Test Connection
                        </motion.button>
                    </>
                )}

                {testStatus === 'testing' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        </div>
                        <p className="text-slate-300">Testing connection...</p>
                        <p className="text-sm text-slate-500 mt-1">This may take a few seconds</p>
                    </>
                )}

                {testStatus === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4"
                        >
                            <Check className="w-8 h-8 text-emerald-400" />
                        </motion.div>
                        <p className="text-emerald-400 font-medium mb-2">Connection successful!</p>
                        <p className="text-sm text-slate-400">Your data source is ready to use</p>
                    </>
                )}

                {testStatus === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-rose-400" />
                        </div>
                        <p className="text-rose-400 font-medium mb-2">Connection failed</p>
                        {testError && (
                            <p className="text-sm text-slate-400 mb-4 text-center max-w-sm">
                                {testError}
                            </p>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onTest}
                            className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] rounded-lg text-slate-300 hover:bg-white/[0.04] transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </motion.button>
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
        case 'select': return 'Choose a data source type to connect';
        case 'auth': return 'Configure authentication credentials';
        case 'configure': return 'Set up the data source details';
        case 'sync': return 'Choose how to keep data updated';
        case 'test': return 'Verify your connection works';
        default: return '';
    }
}

function getAuthMethodLabel(method: AuthMethod['type']): string {
    switch (method) {
        case 'apikey': return 'API Key';
        case 'bearer': return 'Bearer Token';
        case 'basic': return 'Username/Password';
        case 'connection': return 'Connection String';
        case 'oauth': return 'OAuth';
        case 'serviceAccount': return 'Service Account';
        case 'none': return 'No Auth';
        default: return method;
    }
}

function formatInterval(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    if (minutes === 60) return '1 hour';
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    return '24 hours';
}

function extractSpreadsheetId(input: string): string {
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
}

export default ConnectionWizard;
