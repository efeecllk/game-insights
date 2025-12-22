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
                // Background colors
                'bg-darkest': '#0a0a0f',
                'bg-dark': '#12121a',
                'bg-card': '#1a1a24',
                'bg-card-hover': '#22222e',
                'bg-elevated': '#252532',

                // Accent colors
                'accent': {
                    primary: '#8b5cf6',
                    secondary: '#6366f1',
                },

                // Chart colors
                'chart': {
                    purple: '#8b5cf6',
                    indigo: '#6366f1',
                    pink: '#ec4899',
                    cyan: '#22d3ee',
                    green: '#22c55e',
                    orange: '#f97316',
                },
            },
            borderRadius: {
                'card': '16px',
            },
        },
    },
    plugins: [],
}
