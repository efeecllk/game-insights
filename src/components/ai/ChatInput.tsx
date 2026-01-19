/**
 * ChatInput - Input component for chat with suggestions
 */

import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  suggestions = [],
  placeholder = 'Type your question...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-2"
          >
            <span className="text-xs text-th-text-muted">Suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs bg-th-bg-elevated border border-th-border rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-surface-hover transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 p-2 bg-th-bg-elevated rounded-xl border border-th-border focus-within:border-th-accent-primary/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="flex-1 px-2 py-1.5 bg-transparent text-sm text-th-text-primary placeholder-th-text-disabled resize-none focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-2 bg-th-accent-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-th-accent-primary-hover transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Character hint */}
        <div className="absolute -bottom-5 right-2 text-[10px] text-th-text-muted">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}

export default ChatInput;
