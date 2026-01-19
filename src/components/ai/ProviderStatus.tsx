/**
 * ProviderStatus - Connection status indicator for AI provider
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAI } from '@/context/AIContext';

interface ProviderStatusProps {
  compact?: boolean;
}

export function ProviderStatus({ compact = false }: ProviderStatusProps) {
  const { status, isConnected, isConfigured, refreshStatus } = useAI();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStatus();
    setRefreshing(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-th-success' : isConfigured ? 'bg-th-warning' : 'bg-th-error'
          }`}
        />
        <span className="text-xs text-th-text-muted">
          {isConnected ? status?.model : isConfigured ? 'Disconnected' : 'Not configured'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {isConnected && status && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-th-success-muted text-th-success rounded-lg text-sm"
          >
            <Check className="w-4 h-4" />
            <span className="font-medium">{status.model}</span>
          </motion.div>
        )}

        {!isConnected && isConfigured && (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-th-warning-muted text-th-warning rounded-lg text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Disconnected</span>
          </motion.div>
        )}

        {!isConfigured && (
          <motion.div
            key="not-configured"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-th-error-muted text-th-error rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Not configured</span>
            </div>
            <Link
              to="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-surface-hover transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {isConfigured && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-elevated transition-colors disabled:opacity-50"
          title="Refresh connection"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

export default ProviderStatus;
