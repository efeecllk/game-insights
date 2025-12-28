---
sidebar_position: 2
title: Uploading Data
description: Step-by-step guide to uploading game analytics data to Game Insights
---

# Uploading Data

Game Insights makes it easy to get your game data into the system. Whether you're dragging a CSV file or pasting data from your clipboard, the upload wizard guides you through the process with intelligent defaults and real-time validation.

## Quick Upload Methods

### Drag and Drop

The fastest way to upload data:

1. Open Game Insights
2. Drag your file anywhere onto the window
3. Drop to start the upload wizard

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────────┐                      │
│                    │   📁 Drop your   │                      │
│                    │   file here      │                      │
│                    └─────────────────┘                      │
│                                                             │
│              Supported: CSV, Excel, JSON, SQLite            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Click to Browse

Alternatively, click the upload area to open your file browser:

1. Navigate to **Data** in the sidebar
2. Click **Upload Dataset**
3. Select your file from the browser dialog

### Clipboard Paste

For quick data entry or copying from spreadsheets:

1. Copy data from Excel, Google Sheets, or any tabular source
2. Click in the upload area
3. Press `Ctrl+V` (Windows) or `Cmd+V` (Mac)
4. Game Insights automatically detects the format

:::tip Pro Tip
Clipboard paste works great for quick testing. Copy a few rows from your analytics dashboard to see how Game Insights analyzes your data structure.
:::

## The Upload Wizard

The multi-step upload wizard ensures your data is properly configured before analysis.

### Step 1: File Selection

Select or drop your data file. Game Insights immediately:

- Validates the file format
- Checks file size (up to 500MB for browser uploads)
- Begins preliminary parsing

```tsx
// Supported file types
const SUPPORTED_FORMATS = [
  '.csv',      // Comma-separated values
  '.xlsx',     // Excel workbook
  '.xls',      // Legacy Excel
  '.json',     // JSON array or object
  '.sqlite',   // SQLite database
  '.db'        // SQLite database (alt extension)
];
```

### Step 2: Preview and Configuration

After file selection, you'll see a preview of your data:

| Preview Element | Description |
|-----------------|-------------|
| **First 100 rows** | Scrollable data preview |
| **Column headers** | Auto-detected or first row |
| **Data types** | Inferred types (string, number, date) |
| **Row count** | Total rows in the file |

#### Configuration Options

```yaml
Parse Options:
  delimiter: auto          # auto, comma, tab, semicolon, pipe
  encoding: UTF-8          # UTF-8, ASCII, ISO-8859-1
  headerRow: 1             # Row number containing headers
  skipRows: 0              # Rows to skip at beginning
  dateFormat: auto         # auto, ISO, US, EU, custom

Advanced:
  trimWhitespace: true     # Remove leading/trailing spaces
  ignoreEmptyRows: true    # Skip rows with no data
  maxRows: null            # Limit rows (null = all)
```

### Step 3: Column Detection and Mapping

This is where Game Insights' AI shines. The **Schema Analyzer** automatically detects semantic column types:

#### Detected Column Types

Game Insights recognizes 40+ column types:

| Category | Column Types |
|----------|--------------|
| **Identifiers** | `user_id`, `session_id`, `device_id`, `install_id` |
| **Temporal** | `timestamp`, `date`, `datetime`, `install_date`, `event_time` |
| **User Attributes** | `country`, `language`, `platform`, `app_version`, `os_version` |
| **Engagement** | `session_duration`, `session_count`, `days_active`, `last_login` |
| **Progression** | `level`, `xp`, `rank`, `chapter`, `stage` |
| **Monetization** | `revenue`, `purchases`, `iap_count`, `ad_views`, `ltv` |
| **Game-Specific** | `character`, `weapon`, `booster_used`, `prestige_count` |
| **Experimental** | `ab_group`, `variant`, `experiment_id`, `cohort` |

#### Column Mapping Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Column Mapping                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Source Column      Detected Type         Confidence    Override        │
│  ─────────────      ─────────────         ──────────    ────────        │
│  player_id          user_id               98%           [▼ user_id   ]  │
│  event_ts           timestamp             95%           [▼ timestamp ]  │
│  country_code       country               92%           [▼ country   ]  │
│  current_level      level                 88%           [▼ level     ]  │
│  total_spent        revenue               85%           [▼ revenue   ]  │
│  mystery_col        unknown               45%           [▼ Select... ]  │
│                                                                         │
│  [Auto-map All]                          [Reset to Defaults]            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Manual Override

If automatic detection isn't accurate:

1. Click the dropdown next to any column
2. Select the correct semantic type
3. Or choose "Custom" to define your own

```typescript
// Example: Manual column mapping
const columnMapping = {
  'player_id': { type: 'user_id', confidence: 1.0 },
  'event_ts': { type: 'timestamp', format: 'ISO' },
  'mystery_col': { type: 'custom', customName: 'guild_id' }
};
```

### Step 4: Validation and Quality Check

Before finalizing, Game Insights validates your data:

#### Validation Checks

| Check | Description | Severity |
|-------|-------------|----------|
| **Required columns** | user_id and timestamp present | Error |
| **Data types** | Values match detected types | Warning |
| **Null values** | Percentage of missing data | Info |
| **Duplicates** | Duplicate row detection | Warning |
| **Date range** | Timestamps within expected range | Info |
| **Value ranges** | Numeric outliers identified | Info |

#### Validation Report

```
┌─────────────────────────────────────────────────────────────┐
│ Validation Report                          Score: 87/100   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✓ Required columns present                                  │
│ ✓ 50,000 rows parsed successfully                           │
│ ⚠ 2.3% null values in 'country' column                      │
│ ⚠ 156 duplicate user_id entries detected                    │
│ ℹ Date range: 2024-01-01 to 2024-03-15                      │
│ ℹ 3 potential outliers in 'revenue' column                  │
│                                                             │
│ [View Details]                    [Proceed Anyway]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Confirmation and Processing

Once validated, confirm your upload:

1. Review the summary
2. Name your dataset (auto-suggested based on filename)
3. Add optional tags for organization
4. Click **Process Dataset**

```typescript
// Upload configuration summary
const uploadConfig = {
  file: 'game_events_march_2024.csv',
  name: 'March 2024 Events',
  rows: 50000,
  columns: 12,
  detectedGameType: 'puzzle',
  tags: ['production', 'march-2024'],
  qualityScore: 87
};
```

## Processing Pipeline

After confirmation, your data goes through the AI pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Processing...                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [████████░░░░░░░░░░░░] 40%                                         │
│                                                                     │
│  ✓ Parsing complete                                                 │
│  ✓ Schema analysis complete                                         │
│  → Detecting game type...                                           │
│  ○ Generating quality report                                        │
│  ○ Selecting visualizations                                         │
│  ○ Building initial dashboard                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Processing Steps

1. **Parsing** - Convert file format to internal structure
2. **Sampling** - Smart sampling for datasets >10,000 rows
3. **Schema Analysis** - Deep semantic column detection
4. **Game Type Detection** - Classify game category
5. **Quality Report** - Generate data quality scores
6. **Chart Selection** - Recommend appropriate visualizations
7. **Insight Generation** - Create initial AI recommendations

## Advanced Upload Options

### Batch Upload

Upload multiple files at once:

```typescript
// Drag multiple files to upload in batch
const files = [
  'january_events.csv',
  'february_events.csv',
  'march_events.csv'
];

// Options for batch processing
const batchOptions = {
  mergeStrategy: 'append',      // 'append' | 'separate' | 'merge'
  commonSchema: true,           // Enforce same schema across files
  deduplication: 'latest'       // How to handle duplicates
};
```

### URL Import

Import data directly from a URL:

1. Click **Import from URL**
2. Enter the URL (must return CSV, JSON, or Excel)
3. Configure authentication if needed

```typescript
const urlImport = {
  url: 'https://api.example.com/export/events.csv',
  auth: {
    type: 'bearer',
    token: 'your-api-token'
  },
  refresh: 'manual'  // or 'hourly', 'daily'
};
```

### Sample Data

Don't have data yet? Use our sample datasets:

| Sample | Description | Rows | Game Type |
|--------|-------------|------|-----------|
| **Puzzle Game** | Match-3 puzzle with levels | 10,000 | puzzle |
| **Idle Clicker** | Prestige-based idle game | 8,000 | idle |
| **Battle Royale** | Shooter with rankings | 15,000 | battle_royale |
| **Match-3 Meta** | Story-driven puzzle | 12,000 | match3_meta |
| **Gacha RPG** | Character collection RPG | 20,000 | gacha_rpg |

Click **Load Sample Data** and select a game type to explore.

## Troubleshooting

### Common Issues

#### File Too Large

**Problem**: Browser upload limited to 500MB

**Solutions**:
- Use a database connection instead ([PostgreSQL](/docs/data-management/sources/postgresql))
- Split file into smaller chunks
- Filter to relevant date range before upload

#### Encoding Issues

**Problem**: Special characters appear corrupted

**Solution**:
1. Open file in text editor
2. Save as UTF-8 encoding
3. Re-upload

#### Wrong Delimiter Detected

**Problem**: Columns not splitting correctly

**Solution**:
1. In Step 2, manually select the delimiter
2. Use "Custom" option for unusual delimiters

#### Headers Not Detected

**Problem**: First row treated as data

**Solution**:
1. In Step 2, check "First row is header"
2. Or specify header row number

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_FORMAT` | Unsupported file type | Use CSV, Excel, JSON, or SQLite |
| `PARSE_ERROR` | Malformed data | Check file for corruption |
| `NO_COLUMNS` | Empty file | Verify file has data |
| `MISSING_REQUIRED` | No user_id or timestamp | Add required columns |

## Best Practices

### Before Upload

1. **Clean headers** - Use snake_case, avoid special characters
2. **Consistent dates** - Use ISO format (YYYY-MM-DD) when possible
3. **Remove sensitive data** - Strip PII before upload
4. **Sample first** - Test with small subset before full upload

### Naming Conventions

```
Recommended column names:

user_id          # Not: userId, player, user
timestamp        # Not: ts, time, date_time
session_id       # Not: session, sessionID
level            # Not: current_level, player_level
revenue          # Not: spend, iap_revenue, money
```

### Data Quality

- Aim for &lt;5% null values in key columns
- Remove obvious test accounts before upload
- Ensure timestamps are in a consistent timezone

## Next Steps

- [Supported Formats Reference](/docs/data-management/supported-formats)
- [Understanding Data Quality](/docs/data-management/data-quality)
- [Connect a Live Data Source](/docs/data-management/sources/postgresql)
