/**
 * ChatMessage - Individual chat message component
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@/services/ai/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-th-accent-primary-muted text-th-accent-primary'
            : 'bg-th-bg-elevated text-th-text-secondary'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`relative group inline-block p-3 rounded-2xl ${
            isUser
              ? 'bg-th-accent-primary text-white rounded-tr-sm'
              : 'bg-th-bg-elevated text-th-text-primary rounded-tl-sm'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            <MessageContent content={message.content} isUser={isUser} />
          </div>

          {/* Copy button */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-th-text-muted hover:text-th-text-secondary"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-[10px] text-th-text-muted mt-1 ${isUser ? 'text-right' : 'text-left'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        {/* Tool calls if any */}
        {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.metadata.toolCalls.map((tool, i) => (
              <div
                key={i}
                className={`text-xs px-2 py-1 rounded ${
                  tool.success
                    ? 'bg-th-success-muted text-th-success'
                    : 'bg-th-error-muted text-th-error'
                }`}
              >
                {tool.tool}: {tool.success ? 'Success' : tool.error}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.metadata.suggestions.map((suggestion, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-th-bg-surface rounded-lg text-th-text-muted"
              >
                {suggestion}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

/**
 * Parse and render markdown-like content
 */
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Simple markdown parsing
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\n)/g);

  return (
    <>
      {parts.map((part, i) => {
        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Italic
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        // Code
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className={`px-1 rounded text-xs ${
                isUser ? 'bg-white/20' : 'bg-th-bg-surface'
              }`}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        // Line break
        if (part === '\n') {
          return <br key={i} />;
        }
        // Regular text
        return part;
      })}
    </>
  );
}

export default ChatMessage;
