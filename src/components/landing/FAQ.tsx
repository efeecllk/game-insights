/**
 * FAQ Section - Accordion-style frequently asked questions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqItems: FAQItem[] = [
    {
        question: 'What file formats are supported?',
        answer: 'Game Insights supports CSV, Excel (.xlsx, .xls), JSON, and SQLite database files. Simply drag and drop your file and the system will automatically detect the format and parse your data.',
    },
    {
        question: 'Do I need to create an account?',
        answer: 'No, Game Insights is completely free to use with no signup required. Just open the app and start analyzing your data immediately. No email, no password, no friction.',
    },
    {
        question: 'Is my data sent to any server?',
        answer: 'No, your data is processed 100% locally in your browser using IndexedDB for storage. Nothing is ever uploaded to external servers. Your data stays on your machine at all times.',
    },
    {
        question: "What if my game type isn't listed?",
        answer: 'Our AI-powered detection works for most game types automatically by analyzing your data columns and patterns. If your game doesn\'t fit a specific category, the system provides custom analytics that adapt to your data structure.',
    },
    {
        question: 'Can I use this for non-gaming data?',
        answer: 'Absolutely! While Game Insights is optimized for mobile game analytics, it works with any tabular data. The AI will analyze your columns and generate appropriate visualizations regardless of the data domain.',
    },
    {
        question: 'How large can my files be?',
        answer: 'Game Insights includes streaming support for files over 50MB, processing them in chunks to avoid memory issues. This allows you to analyze large datasets without performance degradation.',
    },
    {
        question: 'Is this really free?',
        answer: 'Yes, Game Insights is completely free and open source under the MIT license. You can use it, modify it, and even self-host it. No premium tiers, no hidden costs, no usage limits.',
    },
];

interface FAQAccordionItemProps {
    item: FAQItem;
    isOpen: boolean;
    onToggle: () => void;
    index: number;
}

function FAQAccordionItem({ item, isOpen, onToggle, index }: FAQAccordionItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="border-b border-th-border-subtle last:border-b-0"
        >
            <button
                onClick={onToggle}
                className="w-full py-5 flex items-center justify-between text-left transition-colors duration-200 hover:bg-th-bg-subtle/50 px-1 -mx-1 rounded-lg"
                aria-expanded={isOpen}
            >
                <span className="text-base font-semibold text-th-text-primary pr-4">
                    {item.question}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5 text-th-text-muted" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 text-th-text-muted leading-relaxed pr-10">
                            {item.answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function FAQ() {
    const [openItems, setOpenItems] = useState<Set<number>>(new Set());

    const toggleItem = (index: number) => {
        setOpenItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <section id="faq" className="py-20 md:py-28">
            <div className="max-w-3xl mx-auto px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-th-text-primary mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-th-text-secondary">
                        Everything you need to know about Game Insights
                    </p>
                </motion.div>

                {/* FAQ accordion */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-th-bg-surface rounded-2xl border border-th-border-subtle p-6 md:p-8"
                >
                    {faqItems.map((item, index) => (
                        <FAQAccordionItem
                            key={index}
                            item={item}
                            isOpen={openItems.has(index)}
                            onToggle={() => toggleItem(index)}
                            index={index}
                        />
                    ))}
                </motion.div>

                {/* Help link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-8 text-th-text-muted"
                >
                    Still have questions?{' '}
                    <a
                        href="https://github.com/efecelik/game-insights/discussions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-th-accent-primary hover:text-th-accent-primary-hover transition-colors"
                    >
                        Start a discussion on GitHub
                    </a>
                </motion.p>
            </div>
        </section>
    );
}
