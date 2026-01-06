/**
 * Card Component
 *
 * Clean card with:
 * - Multiple variants (default, elevated, interactive, glass)
 * - Simple border hover states
 * - Framer Motion animations
 */

import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'glass' | 'gradient-border';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: ReactNode;
    variant?: CardVariant;
    padding?: CardPadding;
    animate?: boolean;
    staggerIndex?: number;
    hover?: boolean;
}

const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
};

const variantStyles: Record<CardVariant, string> = {
    default:
        'bg-th-bg-surface border border-th-border',
    elevated:
        'bg-th-bg-surface border border-th-border-strong shadow-theme-sm',
    interactive:
        'bg-th-bg-surface border border-th-border hover:border-th-border-strong cursor-pointer',
    glass: 'bg-th-bg-surface/80 border border-th-border',
    'gradient-border':
        'relative bg-th-bg-surface border border-th-border',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            children,
            variant = 'default',
            padding = 'md',
            animate = false,
            staggerIndex = 0,
            hover = false,
            className = '',
            ...props
        },
        ref
    ) => {
        const animationProps = animate
            ? {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: {
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                      delay: staggerIndex * 0.05,
                  },
              }
            : {};

        const hoverProps = hover
            ? {
                  whileHover: { y: -2, scale: 1.01 },
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
              }
            : {};

        return (
            <motion.div
                ref={ref}
                className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
                {...animationProps}
                {...hoverProps}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

/**
 * Card Header sub-component
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    action?: ReactNode;
    subtitle?: string;
    icon?: ReactNode;
}

export function CardHeader({ title, action, subtitle, icon, className = '', ...props }: CardHeaderProps) {
    return (
        <div className={`flex items-center justify-between pb-4 border-b border-th-border ${className}`} {...props}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-th-text-primary">{title}</h3>
                    {subtitle && <p className="text-sm text-th-text-muted mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

/**
 * Card Content sub-component
 */
export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`pt-4 ${className}`} {...props}>
            {children}
        </div>
    );
}

/**
 * Card Footer sub-component
 */
export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`pt-4 mt-4 border-t border-th-border ${className}`} {...props}>
            {children}
        </div>
    );
}

export default Card;
