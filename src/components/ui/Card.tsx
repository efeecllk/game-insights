/**
 * Card Component - Obsidian Analytics Design
 *
 * Premium card with:
 * - Glassmorphism effects
 * - Multiple variants (default, elevated, interactive, glass)
 * - Noise texture backgrounds
 * - Orange accent hover states
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
        'bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-white/[0.06]',
    elevated:
        'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/20',
    interactive:
        'bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-white/[0.06] hover:border-[#DA7756]/20 hover:shadow-lg hover:shadow-[#DA7756]/5 cursor-pointer',
    glass: 'glass-card bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]',
    'gradient-border':
        'relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl',
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

        // Gradient border wrapper
        if (variant === 'gradient-border') {
            return (
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/20 via-[#C15F3C]/20 to-[#DA7756]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <motion.div
                        ref={ref}
                        className={`relative rounded-2xl overflow-hidden ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
                        {...animationProps}
                        {...hoverProps}
                        {...props}
                    >
                        {/* Noise texture */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative">{children}</div>
                    </motion.div>
                </div>
            );
        }

        return (
            <motion.div
                ref={ref}
                className={`relative rounded-2xl overflow-hidden ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
                {...animationProps}
                {...hoverProps}
                {...props}
            >
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                <div className="relative">{children}</div>
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
        <div className={`flex items-center justify-between pb-4 border-b border-white/[0.04] ${className}`} {...props}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
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
        <div className={`pt-4 mt-4 border-t border-white/[0.04] ${className}`} {...props}>
            {children}
        </div>
    );
}

export default Card;
