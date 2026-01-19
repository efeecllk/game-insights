/**
 * AI Settings Panel
 *
 * Configuration panel for AI providers (OpenAI, Anthropic, Ollama)
 * Allows users to set API keys, select models, and configure triggers
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Server,
  Zap,
  Clock,
  Upload,
} from 'lucide-react';
import {
  getAIService,
  type AIConfig,
  type AIProvider,
  type ProviderStatus,
} from '@/services/ai';
import { getAvailableModels } from '@/services/ai/config';

// Provider metadata
const providerInfo: Record<
  AIProvider,
  { name: string; description: string; icon: React.ElementType }
> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models',
    icon: Sparkles,
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models',
    icon: Bot,
  },
  ollama: {
    name: 'Ollama',
    description: 'Local models (llama, mistral)',
    icon: Server,
  },
};

export function AISettingsPanel() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load config on mount
  useEffect(() => {
    const service = getAIService();
    setConfig(service.getConfig());
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const service = getAIService();
    const providerStatus = await service.getStatus();
    setStatus(providerStatus);
  };

  const handleProviderChange = useCallback((provider: AIProvider) => {
    const service = getAIService();
    service.setProvider(provider);
    setConfig(service.getConfig());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    loadStatus();
  }, []);

  const handleApiKeyChange = useCallback(
    (provider: 'openai' | 'anthropic', key: string) => {
      const service = getAIService();
      service.setApiKey(provider, key);
      setConfig(service.getConfig());
    },
    []
  );

  const handleModelChange = useCallback((provider: AIProvider, model: string) => {
    const service = getAIService();
    service.setModel(provider, model);
    setConfig(service.getConfig());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    loadStatus();
  }, []);

  const handleOllamaEndpointChange = useCallback((endpoint: string) => {
    const service = getAIService();
    service.updateConfig({ ollamaEndpoint: endpoint });
    setConfig(service.getConfig());
  }, []);

  const handleTriggerChange = useCallback(
    (trigger: keyof AIConfig['triggers'], value: boolean | 'daily' | 'weekly') => {
      const service = getAIService();
      const currentConfig = service.getConfig();
      if (trigger === 'scheduleInterval') {
        service.updateConfig({
          triggers: { ...currentConfig.triggers, scheduleInterval: value as 'daily' | 'weekly' },
        });
      } else {
        service.updateConfig({
          triggers: { ...currentConfig.triggers, [trigger]: value },
        });
      }
      setConfig(service.getConfig());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    []
  );

  const handleTestConnection = async () => {
    setTesting(true);
    const service = getAIService();
    await service.testConnection();
    await loadStatus();
    setTesting(false);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-th-text-muted" />
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="bg-th-bg-surface rounded-2xl p-6 border border-th-border group-hover:border-th-border-strong transition-colors duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-th-text-primary">AI Configuration</h3>
              <p className="text-xs text-th-text-muted">Configure AI providers for analytics</p>
            </div>
          </div>
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs text-th-success flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Saved
              </motion.span>
            )}
            <StatusBadge status={status} testing={testing} />
          </div>
        </div>

        {/* Provider Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-th-text-secondary mb-3">
            AI Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(providerInfo) as AIProvider[]).map((provider) => {
              const info = providerInfo[provider];
              const isSelected = config.provider === provider;
              const Icon = info.icon;
              return (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-th-accent-primary-muted border border-th-accent-primary/30'
                      : 'bg-th-bg-elevated border border-th-border hover:bg-th-bg-surface-hover'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${isSelected ? 'bg-th-accent-primary/20' : 'bg-th-bg-surface'}`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isSelected ? 'text-th-accent-primary' : 'text-th-text-muted'}`}
                      />
                    </div>
                    <div
                      className={`text-sm font-medium ${isSelected ? 'text-th-accent-primary' : 'text-th-text-secondary'}`}
                    >
                      {info.name}
                    </div>
                    <div className="text-[10px] text-th-text-muted text-center">{info.description}</div>
                  </div>
                  {isSelected && <Check className="absolute top-2 right-2 w-4 h-4 text-th-accent-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider-specific Configuration */}
        <AnimatePresence mode="wait">
          <motion.div
            key={config.provider}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {config.provider === 'openai' && (
              <OpenAIConfig
                config={config}
                showKey={showOpenAIKey}
                onToggleShowKey={() => setShowOpenAIKey(!showOpenAIKey)}
                onApiKeyChange={(key) => handleApiKeyChange('openai', key)}
                onModelChange={(model) => handleModelChange('openai', model)}
              />
            )}
            {config.provider === 'anthropic' && (
              <AnthropicConfig
                config={config}
                showKey={showAnthropicKey}
                onToggleShowKey={() => setShowAnthropicKey(!showAnthropicKey)}
                onApiKeyChange={(key) => handleApiKeyChange('anthropic', key)}
                onModelChange={(model) => handleModelChange('anthropic', model)}
              />
            )}
            {config.provider === 'ollama' && (
              <OllamaConfig
                config={config}
                onEndpointChange={handleOllamaEndpointChange}
                onModelChange={(model) => handleModelChange('ollama', model)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Analysis Triggers */}
        <div className="mt-6 pt-6 border-t border-th-border-subtle">
          <label className="block text-sm font-medium text-th-text-secondary mb-3">
            Analysis Triggers
          </label>
          <div className="space-y-3">
            <TriggerOption
              icon={Upload}
              label="On Upload"
              description="Generate insights when data is uploaded"
              checked={config.triggers.onUpload}
              onChange={(v) => handleTriggerChange('onUpload', v)}
            />
            <TriggerOption
              icon={Zap}
              label="On Demand"
              description="Generate insights manually"
              checked={config.triggers.onDemand}
              onChange={(v) => handleTriggerChange('onDemand', v)}
            />
            <TriggerOption
              icon={Clock}
              label="Scheduled"
              description="Generate insights on a schedule"
              checked={config.triggers.scheduled}
              onChange={(v) => handleTriggerChange('scheduled', v)}
            />
            {config.triggers.scheduled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-8 flex gap-2"
              >
                {(['daily', 'weekly'] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => handleTriggerChange('scheduleInterval', interval)}
                    className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                      config.triggers.scheduleInterval === interval
                        ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/30'
                        : 'bg-th-bg-elevated text-th-text-muted border border-th-border hover:bg-th-bg-surface-hover'
                    }`}
                  >
                    {interval}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="mt-6 pt-6 border-t border-th-border-subtle flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2.5 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-secondary hover:bg-th-bg-surface-hover hover:text-th-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Test Connection
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, testing }: { status: ProviderStatus | null; testing: boolean }) {
  if (testing) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-th-bg-elevated text-th-text-muted">
        <Loader2 className="w-3 h-3 animate-spin" />
        Testing...
      </span>
    );
  }

  if (!status) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-th-bg-elevated text-th-text-muted">
        <AlertCircle className="w-3 h-3" />
        Not configured
      </span>
    );
  }

  if (status.connected) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-th-success-muted text-th-success">
        <Check className="w-3 h-3" />
        Connected
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-th-error-muted text-th-error">
      <AlertCircle className="w-3 h-3" />
      {status.error || 'Disconnected'}
    </span>
  );
}

// OpenAI Config Component
function OpenAIConfig({
  config,
  showKey,
  onToggleShowKey,
  onApiKeyChange,
  onModelChange,
}: {
  config: AIConfig;
  showKey: boolean;
  onToggleShowKey: () => void;
  onApiKeyChange: (key: string) => void;
  onModelChange: (model: string) => void;
}) {
  const models = getAvailableModels('openai');

  return (
    <div className="space-y-4">
      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-2">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKeys.openai || ''}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-3 pr-12 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-disabled focus:outline-none focus:border-th-accent-primary/50 focus:bg-th-bg-surface-hover transition-all font-mono text-sm"
          />
          <button
            onClick={onToggleShowKey}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-th-text-muted">
          Get your API key from{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-th-accent-primary hover:underline"
          >
            platform.openai.com
          </a>
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-2">Model</label>
        <div className="grid grid-cols-2 gap-2">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => onModelChange(model)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                config.models.openai === model
                  ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/30'
                  : 'bg-th-bg-elevated text-th-text-muted border border-th-border hover:bg-th-bg-surface-hover'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Anthropic Config Component
function AnthropicConfig({
  config,
  showKey,
  onToggleShowKey,
  onApiKeyChange,
  onModelChange,
}: {
  config: AIConfig;
  showKey: boolean;
  onToggleShowKey: () => void;
  onApiKeyChange: (key: string) => void;
  onModelChange: (model: string) => void;
}) {
  const models = getAvailableModels('anthropic');

  return (
    <div className="space-y-4">
      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-2">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKeys.anthropic || ''}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 pr-12 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-disabled focus:outline-none focus:border-th-accent-primary/50 focus:bg-th-bg-surface-hover transition-all font-mono text-sm"
          />
          <button
            onClick={onToggleShowKey}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text-secondary transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-th-text-muted">
          Get your API key from{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-th-accent-primary hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-2">Model</label>
        <div className="space-y-2">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => onModelChange(model)}
              className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                config.models.anthropic === model
                  ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/30'
                  : 'bg-th-bg-elevated text-th-text-muted border border-th-border hover:bg-th-bg-surface-hover'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Ollama Config Component
function OllamaConfig({
  config,
  onEndpointChange,
  onModelChange,
}: {
  config: AIConfig;
  onEndpointChange: (endpoint: string) => void;
  onModelChange: (model: string) => void;
}) {
  const models = getAvailableModels('ollama');

  return (
    <div className="space-y-4">
      {/* Endpoint Input */}
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-2">
          Ollama Endpoint
        </label>
        <input
          type="text"
          value={config.ollamaEndpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          placeholder="http://localhost:11434"
          className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-disabled focus:outline-none focus:border-th-accent-primary/50 focus:bg-th-bg-surface-hover transition-all font-mono text-sm"
        />
        <p className="mt-1.5 text-xs text-th-text-muted">
          Make sure Ollama is running locally.{' '}
          <a
            href="https://ollama.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="text-th-accent-primary hover:underline"
          >
            Download Ollama
          </a>
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-2">Model</label>
        <div className="grid grid-cols-2 gap-2">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => onModelChange(model)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                config.models.ollama === model
                  ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/30'
                  : 'bg-th-bg-elevated text-th-text-muted border border-th-border hover:bg-th-bg-surface-hover'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Trigger Option Component
function TriggerOption({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 bg-th-bg-elevated rounded-xl border border-th-border cursor-pointer hover:bg-th-bg-surface-hover transition-colors">
      <div
        className={`p-2 rounded-lg ${checked ? 'bg-th-accent-primary/20' : 'bg-th-bg-surface'}`}
      >
        <Icon className={`w-4 h-4 ${checked ? 'text-th-accent-primary' : 'text-th-text-muted'}`} />
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${checked ? 'text-th-text-primary' : 'text-th-text-secondary'}`}>
          {label}
        </div>
        <div className="text-xs text-th-text-muted">{description}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-th-accent-primary' : 'bg-th-bg-surface border border-th-border'
        }`}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? '22px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </label>
  );
}

export default AISettingsPanel;
