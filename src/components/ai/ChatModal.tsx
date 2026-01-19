/**
 * ChatModal - Q&A chat overlay modal
 */

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useGame } from '@/context/GameContext';
import { useAI } from '@/context/AIContext';
import { useAIChat } from '@/hooks';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProviderStatus } from './ProviderStatus';

interface ChatModalProps {
  onClose: () => void;
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { activeGameData } = useData();
  const { selectedGame } = useGame();
  const { isConfigured } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearSession,
    suggestions,
  } = useAIChat({
    projectId: activeGameData?.id || 'default',
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl h-[80vh] bg-th-bg-surface rounded-2xl shadow-2xl border border-th-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-th-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20">
              <Bot className="w-5 h-5 text-th-accent-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Ask about your data</h2>
              <p className="text-xs text-th-text-muted">
                {activeGameData?.name || 'No data selected'} • {selectedGame}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProviderStatus compact />
            {messages.length > 0 && (
              <button
                onClick={clearSession}
                className="p-2 rounded-lg text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-elevated transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isConfigured && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-th-error-muted border border-th-error/20 mb-4">
                <AlertCircle className="w-8 h-8 text-th-error" />
              </div>
              <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                AI Not Configured
              </h3>
              <p className="text-sm text-th-text-muted max-w-xs">
                Please configure an AI provider in Settings to use the chat feature.
              </p>
            </div>
          )}

          {isConfigured && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/20 mb-4">
                <Sparkles className="w-8 h-8 text-th-accent-primary" />
              </div>
              <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                Ask anything about your data
              </h3>
              <p className="text-sm text-th-text-muted max-w-xs mb-6">
                I can help you understand your metrics, explain insights, and suggest improvements.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="px-3 py-2 text-sm bg-th-bg-elevated border border-th-border rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-surface-hover transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-th-bg-elevated flex items-center justify-center">
                <Bot className="w-4 h-4 text-th-text-secondary" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-sm bg-th-bg-elevated">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-th-text-muted rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-th-text-muted rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-th-text-muted rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-th-error-muted text-th-error text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-th-border">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            suggestions={messages.length > 0 ? suggestions : []}
            placeholder={isConfigured ? 'Type your question...' : 'Configure AI in Settings first'}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ChatModal;
