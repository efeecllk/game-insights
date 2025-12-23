# F006 - AI Data Analyst

**Status:** ✅ Completed  
**Priority:** High  
**Effort:** Large

## Overview
AI-powered data analysis system that auto-detects game type and recommends visualizations.

## Features
- [x] Schema analyzer with 30+ semantic types
- [x] Game type auto-detection (puzzle, idle, battle_royale, etc.)
- [x] Chart template matching
- [x] Automatic insight generation
- [x] Suggested metrics based on data

## Files
```
src/ai/
├── SchemaAnalyzer.ts    # Column type detection
├── GameTypeDetector.ts  # Weighted game classification
├── ChartSelector.ts     # Template matching
├── InsightGenerator.ts  # Auto insights
├── DataAnalyst.ts       # Main orchestrator
└── index.ts             # Exports
```

## Technical Details

### Semantic Types Detected
- User: `user_id`, `session_id`, `cohort`, `segment`
- Metrics: `revenue`, `price`, `quantity`, `arpu`, `ltv`
- Gameplay: `level`, `score`, `xp`, `rank`
- Platform: `country`, `platform`, `device`, `version`
- Funnel: `funnel_step`, `conversion`
- Quality: `error_type`, `error_message`

### Game Type Detection
Weighted scoring based on column combinations:
- **Puzzle**: level + score + funnel_step
- **Idle**: currency + quantity + xp
- **Battle Royale**: rank + session_id + item_id
- **Match3 Meta**: level + item_id + revenue
- **Gacha RPG**: item_id + revenue + rank

### Usage
```typescript
import { dataAnalyst } from './ai';

const result = await dataAnalyst.analyze(schema, data);
// result.detectedGameType → 'puzzle'
// result.chartRecommendations → [...]
// result.insights → [...]
```
