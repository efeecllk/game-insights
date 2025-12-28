/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Semantic background colors
                'th-bg': {
                    base: 'var(--color-bg-base)',
                    subtle: 'var(--color-bg-subtle)',
                    surface: 'var(--color-bg-surface)',
                    'surface-hover': 'var(--color-bg-surface-hover)',
                    elevated: 'var(--color-bg-elevated)',
                    overlay: 'var(--color-bg-overlay)',
                },

                // Semantic text colors
                'th-text': {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    muted: 'var(--color-text-muted)',
                    disabled: 'var(--color-text-disabled)',
                    inverse: 'var(--color-text-inverse)',
                },

                // Border colors
                'th-border': {
                    subtle: 'var(--color-border-subtle)',
                    DEFAULT: 'var(--color-border-default)',
                    strong: 'var(--color-border-strong)',
                    focus: 'var(--color-border-focus)',
                },

                // Accent colors
                'th-accent': {
                    primary: 'var(--color-accent-primary)',
                    'primary-hover': 'var(--color-accent-primary-hover)',
                    'primary-muted': 'var(--color-accent-primary-muted)',
                    secondary: 'var(--color-accent-secondary)',
                    'secondary-hover': 'var(--color-accent-secondary-hover)',
                },

                // Semantic status colors
                'th-success': {
                    DEFAULT: 'var(--color-success)',
                    muted: 'var(--color-success-muted)',
                },
                'th-warning': {
                    DEFAULT: 'var(--color-warning)',
                    muted: 'var(--color-warning-muted)',
                },
                'th-error': {
                    DEFAULT: 'var(--color-error)',
                    muted: 'var(--color-error-muted)',
                },
                'th-info': {
                    DEFAULT: 'var(--color-info)',
                    muted: 'var(--color-info-muted)',
                },

                // Chart colors
                'th-chart': {
                    1: 'var(--color-chart-1)',
                    2: 'var(--color-chart-2)',
                    3: 'var(--color-chart-3)',
                    4: 'var(--color-chart-4)',
                    5: 'var(--color-chart-5)',
                    6: 'var(--color-chart-6)',
                    7: 'var(--color-chart-7)',
                    8: 'var(--color-chart-8)',
                },

                // Interactive states
                'th-interactive': {
                    hover: 'var(--color-interactive-hover)',
                    active: 'var(--color-interactive-active)',
                    selected: 'var(--color-interactive-selected)',
                },

                // Legacy colors (for backward compatibility during migration)
                'bg-darkest': 'var(--color-bg-base)',
                'bg-dark': 'var(--color-bg-subtle)',
                'bg-card': 'var(--color-bg-surface)',
                'bg-card-hover': 'var(--color-bg-surface-hover)',
                'bg-elevated': 'var(--color-bg-elevated)',
                'accent': {
                    primary: 'var(--color-accent-primary)',
                    secondary: 'var(--color-accent-secondary)',
                },
                'chart': {
                    purple: 'var(--color-chart-1)',
                    indigo: 'var(--color-chart-2)',
                    pink: 'var(--color-chart-3)',
                    cyan: 'var(--color-chart-4)',
                    green: 'var(--color-chart-5)',
                    orange: 'var(--color-chart-6)',
                },
            },
            boxShadow: {
                'theme-sm': 'var(--shadow-sm)',
                'theme-md': 'var(--shadow-md)',
                'theme-lg': 'var(--shadow-lg)',
                'theme-xl': 'var(--shadow-xl)',
            },
            borderRadius: {
                'card': '16px',
            },
        },
    },
    plugins: [],
}
