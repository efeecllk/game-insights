# Usage Guide

This guide covers the current user flow in Game Insights.

## Start Here

When you open the app for the first time, you land on the Upload experience. From there you can:

- Upload your own data
- Load one of the built-in sample datasets
- Configure AI behavior in Settings

## Supported Inputs

Game Insights can import:

- CSV
- TSV
- JSON
- NDJSON
- Excel files (`.xlsx`, `.xls`)
- SQLite databases (`.db`, `.sqlite`, `.sqlite3`)
- URLs
- Clipboard text
- Folder uploads

## Sample Data

The built-in demo datasets are:

- Puzzle Game Analytics
- Idle Game Analytics
- Gacha RPG Analytics

They are useful for exploring the app without preparing a file first.

## Upload Flow

The upload page walks through four steps:

1. Upload a file or load sample data
2. Preview the parsed rows and column quality
3. Run analysis and column mapping
4. Review the detected game type and save the dataset

The upload flow uses the local importer layer in `src/lib/importers/`, the browser persistence layer in `src/lib/dataStore.ts`, and the analytics helpers in `src/lib/columnAnalyzer.ts`.

## AI Analysis

If you want LLM-backed analysis, configure a provider in Settings. The app otherwise falls back to local pattern-based analysis.

The analysis output is surfaced in:

- Upload review cards
- AI Analytics
- Funnels
- Monetization

## Main Screens

- `Upload` for importing and reviewing data
- `AI Analytics` for insights, anomalies, and questions
- `Funnels` for detecting progression funnels
- `Monetization` for revenue and payer analysis
- `Dashboard Builder` for custom dashboards
- `Games` for managing game entries
- `Settings` for theme, language, and AI provider configuration

## Practical Notes

- The app stores data locally in the browser
- The warm theme and layout tokens are defined in `src/index.css`
- `pnpm dev` starts the app on `http://localhost:5173`
