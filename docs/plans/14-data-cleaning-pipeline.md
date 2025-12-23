# F014 - Data Cleaning Pipeline

**Status:** ✅ Completed  
**Priority:** High  
**Effort:** Large

## Overview
AI-driven data cleaning pipeline with smart sampling and automatic issue detection.

## Flow
```
Raw Data → Sample → AI Analyze → Clean → Validate → Dashboard
```

## Features
- [x] Smart sampling (6 strategies)
- [x] Issue detection (9 types)
- [x] Cleaning actions (12 methods)
- [x] Quality scoring (0-100)
- [x] Pipeline orchestrator

## Files
```
src/ai/
├── DataSampler.ts  # Sampling strategies
├── DataCleaner.ts  # Issue detection & cleaning
└── DataPipeline.ts # Main orchestrator
```

## Sampling Strategies
- `random` - Shuffle and take N
- `head` - First N rows
- `tail` - Last N rows
- `systematic` - Every Nth row
- `stratified` - Maintain column distribution
- `smart` - 20% head + 70% random + 10% tail

## Issue Types
- `missing_values` - Null, empty
- `invalid_type` - Wrong data type
- `outlier` - Statistical outlier
- `duplicate` - Duplicate rows
- `whitespace` - Leading/trailing spaces
- `inconsistent_format` - Date formats
- `invalid_range` - Out of range
- `encoding_error` - Character issues
- `special_chars` - Unexpected chars

## Cleaning Actions
- `remove_rows` - Delete affected
- `fill_null` / `fill_mean` / `fill_median` / `fill_mode`
- `trim_whitespace`
- `lowercase` / `uppercase` / `titlecase`
- `parse_date` / `parse_number`
- `cap_outliers`
- `remove_duplicates`
- `regex_replace`

## Usage
```typescript
import { dataPipeline } from './ai';

const result = await dataPipeline.run(data, {
    sampleSize: 500,
    autoClean: true,
    approvedCleaningActions: 'all'
});
```
