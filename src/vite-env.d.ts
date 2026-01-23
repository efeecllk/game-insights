/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BASE_URL: string;
    readonly VITE_OPENAI_API_KEY?: string;
    readonly VITE_ANTHROPIC_API_KEY?: string;
    readonly VITE_GA_MEASUREMENT_ID?: string;
    readonly VITE_DEMO_MODE?: string;
    readonly VITE_EXPERIMENTAL_FEATURES?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
