/**
 * Button Component - Obsidian Analytics Design
 *
 * Premium button with:
 * - Multiple variants (primary, secondary, ghost, danger)
 * - Size options (sm, md, lg)
 * - Icon support (left/right)
 * - Loading state with spinner
 * - CSS-based animations (performance optimized)
 * - Glassmorphism effects
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
        'bg-th-accent-primary-muted border-th-accent-primary/30 text-th-accent-primary hover:bg-th-accent-primary/30 hover:border-th-accent-primary/40 focus:ring-th-accent-primary/20',
    secondary:
        'bg-th-bg-elevated border-th-border text-th-text-secondary hover:bg-th-bg-surface-hover hover:border-th-border-strong hover:text-th-text-primary focus:ring-th-border/20',
    ghost:
        'bg-transparent border-transparent text-th-text-muted hover:bg-th-interactive-hover hover:text-th-text-secondary focus:ring-th-border/20',
    danger:
        'bg-th-error-muted border-th-error/20 text-th-error hover:bg-th-error/20 hover:border-th-error/30 focus:ring-th-error/20',
    outline:
        'bg-transparent border-th-border text-th-text-secondary hover:bg-th-interactive-hover hover:border-th-border-strong focus:ring-th-border/20',
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
            <button
                ref={ref}
                disabled={isDisabled}
                className={`
                    relative inline-flex items-center justify-center font-medium
                    border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-th-bg-base
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:hover:scale-100 disabled:active:scale-100
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
            </button>
        );
    }
);

Button.displayName = 'Button';

/**
 * Icon-only button variant
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
            <button
                ref={ref}
                disabled={disabled}
                aria-label={label}
                className={`
                    relative inline-flex items-center justify-center
                    border rounded-xl transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-th-bg-base
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:scale-110 active:scale-90
                    disabled:hover:scale-100 disabled:active:scale-100
                    ${variantStyles[variant]}
                    ${iconOnlySizes[size]}
                    ${className}
                `}
                {...props}
            >
                <span className={iconSizes[size]}>{icon}</span>
            </button>
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
