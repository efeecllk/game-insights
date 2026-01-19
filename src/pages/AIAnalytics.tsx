/**
 * AI Analytics Page
 *
 * Main page for AI-powered analytics featuring:
 * - Actionable insights with category filtering
 * - One-click actions (segments, alerts, export)
 * - Natural language chat interface
 */

import { useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { AIPage } from '@/components/ai';

// Lazy load the chat modal since it's not always needed
const ChatModal = lazy(() => import('@/components/ai/ChatModal'));

export function AIAnalyticsPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="h-full">
      <AIPage onOpenChat={() => setIsChatOpen(true)} />

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Loader2 className="w-8 h-8 text-th-accent-primary animate-spin" />
              </div>
            }
          >
            <ChatModal onClose={() => setIsChatOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIAnalyticsPage;
