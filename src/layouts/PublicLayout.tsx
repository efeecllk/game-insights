/**
 * Public Layout - Full-width layout without sidebar
 * Used for landing page and other public-facing pages
 */

import { ReactNode } from 'react';
import { motion, MotionConfig } from 'framer-motion';

interface PublicLayoutProps {
    children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="min-h-screen bg-th-bg-base"
            >
                {children}
            </motion.div>
        </MotionConfig>
    );
}
