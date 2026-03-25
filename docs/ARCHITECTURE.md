# Architecture

## Overview

Game Insights is a React + TypeScript app built around three layers:

1. Data import and local persistence
2. Domain analytics and AI-assisted analysis
3. Route-level dashboards and shared UI

```text
Upload / sample data
  -> importers in src/lib/importers/
  -> local stores in src/lib/dataStore.ts and src/lib/db.ts
  -> analysis in src/ai/ and src/services/ai/
  -> screens in src/pages/
```

## Current Repo Layout

```text
src/
├── pages/           # Route screens: Upload, AI Analytics, Funnels, Monetization, Dashboard Builder, Games, Settings, Landing
├── components/      # Shared UI, upload flow, charts, landing, settings, onboarding
├── context/         # Theme, data, game, and toast state
├── hooks/           # Shared application hooks
├── lib/             # Importers, persistence, stores, sample data, chart/theme helpers
├── ai/              # App analytics engine
├── services/ai/     # Provider-backed LLM orchestration
├── services/openai.ts
└── types/
```

## Layer Boundaries

### `src/lib`

This layer handles local data and utility concerns:

- `src/lib/importers/` parses file, URL, clipboard, and folder inputs
- `src/lib/dataStore.ts` and `src/lib/db.ts` manage browser persistence
- `src/lib/realDataProvider.ts` and `src/lib/dataProviders.ts` expose demo and uploaded-data providers
- `src/lib/sampleData.ts` generates built-in demo datasets
- `src/lib/columnAnalyzer.ts` bridges optional AI-assisted column mapping

### `src/ai`

This layer contains domain-specific analytics used by the app itself:

- `DataPipeline` orchestrates sampling, schema analysis, cleaning, metrics, anomalies, cohorts, funnels, and insights
- `SchemaAnalyzer`, `GameTypeDetector`, `DataCleaner`, and `ChartSelector` classify and prepare the data
- `MetricCalculator`, `FunnelDetector`, `CohortAnalyzer`, `AnomalyDetector`, and `RecommendationEngine` derive analytics outputs
- `MonetizationAnalyzer`, `QuestionAnswering`, and `ReportGenerator` build higher-level user-facing outputs
- `src/ai/ml/` holds the lightweight predictive models used by the app

### `src/services/ai`

This layer wraps provider-based AI functionality:

- `AIService` coordinates provider access
- `providers/` contains OpenAI, Anthropic, Ollama, and factory code
- `chains/` contains reusable LLM workflows
- `prompts/` contains prompt builders and system prompts
- `tools/` exposes segment, alert, and export helpers
- `memory/` stores project memory for AI sessions

## State Management

The main React context providers are:

- `DataContext` for uploaded data and saved profiles
- `GameContext` for the selected game category
- `ThemeContext` for theme selection
- `ToastContext` for notifications

Most long-lived app state is persisted locally through the stores in `src/lib/`.

## UI Organization

- `src/pages/` contains the route screens
- `src/components/upload/` contains the upload wizard pieces
- `src/components/charts/` wraps the chart components used by analytics pages
- `src/components/ui/` contains the reusable low-level design system primitives
- `src/components/landing/` contains the public marketing page sections

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:run
pnpm test:e2e
pnpm storybook
```

## Notes

- The app is local-first by default
- Optional AI provider configuration lives in the Settings screen
- Warm theme tokens and layout styles are defined in `src/index.css`
