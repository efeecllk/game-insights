/**
 * Button Component - Obsidian Analytics Design
 *
 * Premium button with:
 * - Multiple variants (primary, secondary, ghost, danger)
 * - Size options (sm, md, lg)
 * - Icon support (left/right)
 * - Loading state with spinner
 * - Framer Motion animations
 * - Glassmorphism effects
 */

import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-500/40 focus:ring-emerald-500/20',
    secondary:
        'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white focus:ring-white/10',
    ghost:
        'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 focus:ring-white/10',
    danger:
        'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 focus:ring-rose-500/20',
    outline:
        'bg-transparent border-white/[0.12] text-slate-300 hover:bg-white/[0.03] hover:border-white/[0.2] focus:ring-white/10',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

const iconSizes: Record<ButtonSize, string> = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            icon,
            iconPosition = 'left',
            loading = false,
            fullWidth = false,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <motion.button
                ref={ref}
                whileHover={isDisabled ? undefined : { scale: 1.02 }}
                whileTap={isDisabled ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                disabled={isDisabled}
                className={`
                    relative inline-flex items-center justify-center font-medium
                    border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${className}
                `}
                {...props}
            >
                {/* Loading spinner */}
                {loading && (
                    <Loader2 className={`${iconSizes[size]} animate-spin`} />
                )}

                {/* Left icon */}
                {!loading && icon && iconPosition === 'left' && (
                    <span className={iconSizes[size]}>{icon}</span>
                )}

                {/* Button text */}
                <span>{children}</span>

                {/* Right icon */}
                {!loading && icon && iconPosition === 'right' && (
                    <span className={iconSizes[size]}>{icon}</span>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

/**
 * Icon-only button variant
 */
interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    icon: ReactNode;
    size?: ButtonSize;
    variant?: ButtonVariant;
    label: string; // Required for accessibility
}

const iconOnlySizes: Record<ButtonSize, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, size = 'md', variant = 'ghost', label, disabled, className = '', ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileHover={disabled ? undefined : { scale: 1.1 }}
                whileTap={disabled ? undefined : { scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                disabled={disabled}
                aria-label={label}
                className={`
                    relative inline-flex items-center justify-center
                    border rounded-xl transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${variantStyles[variant]}
                    ${iconOnlySizes[size]}
                    ${className}
                `}
                {...props}
            >
                <span className={iconSizes[size]}>{icon}</span>
            </motion.button>
        );
    }
);

IconButton.displayName = 'IconButton';

/**
 * Button group for grouping related buttons
 */
interface ButtonGroupProps {
    children: ReactNode;
    className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
    return (
        <div
            className={`
                inline-flex items-center
                [&>button]:rounded-none
                [&>button:first-child]:rounded-l-xl
                [&>button:last-child]:rounded-r-xl
                [&>button:not(:last-child)]:border-r-0
                ${className}
            `}
        >
            {children}
        </div>
    );
}

export default Button;
