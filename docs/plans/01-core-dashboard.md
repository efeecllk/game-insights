# F001 - Core Dashboard

**Status:** ✅ Completed  
**Priority:** High  
**Effort:** Large

## Overview
The main dashboard framework with sidebar navigation and overview page.

## Features
- [x] GameAnalytics-style sidebar with 14 navigation items
- [x] Dynamic priority based on game type
- [x] Overview page with KPI cards and charts
- [x] Dark theme for main content area
- [x] Light theme sidebar with purple accents

## Files
- `src/components/Sidebar.tsx`
- `src/pages/Overview.tsx`
- `src/context/GameContext.tsx`
- `src/lib/gamePriorities.ts`

## Technical Details
- Uses React Router for navigation
- ECharts for visualizations
- Context API for game type state
