/**
 * Unified Card Component
 * Design System v2 - Consistent card styling with variants
 */

import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'gradient-border';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  staggerIndex?: number;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantStyles = {
  default: 'bg-th-bg-surface border border-th-border rounded-2xl',
  elevated: 'bg-th-bg-elevated border border-th-border rounded-2xl shadow-theme-md',
  interactive: 'bg-th-bg-surface border border-th-border rounded-2xl hover:border-th-accent-primary/30 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-all duration-250 cursor-pointer hover:-translate-y-0.5',
  glass: 'glass-card',
  'gradient-border': 'gradient-border',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    animate = false,
    staggerIndex,
    className = '',
    ...props
  }, ref) => {
    const animationClass = animate
      ? `animate-fade-in-up${staggerIndex ? ` stagger-${staggerIndex}` : ''}`
      : '';

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${paddingStyles[padding]} ${animationClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header sub-component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
  subtitle?: string;
}

export function CardHeader({ title, action, subtitle, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-th-border-subtle ${className}`} {...props}>
      <div>
        <h3 className="font-display font-semibold text-th-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-sm text-th-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Content sub-component
export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Footer sub-component
export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-4 mt-4 border-t border-th-border-subtle ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
