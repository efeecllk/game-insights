---
sidebar_position: 3
title: Supported Formats
description: Complete reference for all data formats supported by Game Insights
---

# Supported Data Formats

Game Insights supports a wide variety of data formats to accommodate different workflows and data sources. This guide covers each format in detail, including requirements, limitations, and best practices.

## Format Overview

| Format | Extension | Max Size | Streaming | Best For |
|--------|-----------|----------|-----------|----------|
| [CSV](#csv-files) | `.csv` | 500MB | Yes | Universal compatibility |
| [Excel](#excel-xlsx) | `.xlsx`, `.xls` | 100MB | No | Spreadsheet users |
| [JSON](#json) | `.json` | 200MB | Yes | API exports, nested data |
| [SQLite](#sqlite-databases) | `.sqlite`, `.db` | 1GB | Yes | Offline databases |
| [Clipboard](#clipboard-paste) | N/A | 10MB | No | Quick testing |
| [URL Import](#url-imports) | N/A | 500MB | Yes | Remote data |

## CSV Files

CSV (Comma-Separated Values) is the most universally supported format and recommended for most use cases.

### Requirements

```csv
user_id,timestamp,event_type,level,revenue
u001,2024-03-15T10:30:00Z,level_complete,5,0
u001,2024-03-15T10:35:00Z,purchase,5,4.99
u002,2024-03-15T11:00:00Z,session_start,1,0
```

### Specifications

| Attribute | Supported Values | Default |
|-----------|------------------|---------|
| **Encoding** | UTF-8, UTF-16, ASCII, ISO-8859-1 | UTF-8 |
| **Delimiter** | Comma, Tab, Semicolon, Pipe, Custom | Auto-detect |
| **Line endings** | CRLF, LF, CR | Auto-detect |
| **Quote character** | Double quote, Single quote | Double quote |
| **Escape character** | Backslash, Double quote | Double quote |
| **Header row** | Yes, No | Auto-detect |

### Configuration Options

```typescript
interface CSVOptions {
  delimiter?: ',' | '\t' | ';' | '|' | string;
  encoding?: 'utf-8' | 'utf-16' | 'ascii' | 'iso-8859-1';
  hasHeader?: boolean;
  skipRows?: number;
  maxRows?: number;
  dateFormat?: string;
  nullValues?: string[];  // e.g., ['NA', 'null', '']
  trimWhitespace?: boolean;
}
```

### Handling Special Cases

#### Quoted Fields

Fields containing delimiters or newlines should be quoted:

```csv
user_id,message,timestamp
u001,"Hello, world!",2024-03-15
u002,"Line 1
Line 2",2024-03-16
```

#### Escaped Quotes

Double quotes within quoted fields are escaped by doubling:

```csv
user_id,note,timestamp
u001,"User said ""Hello""",2024-03-15
```

#### Large Files

For CSV files >100MB, Game Insights uses streaming parsing:

```typescript
// Streaming is automatic for large files
const result = await parseCSV(largeFile, {
  streaming: true,
  chunkSize: 1000000,  // 1MB chunks
  onProgress: (percent) => console.log(`${percent}% complete`)
});
```

### Best Practices

- Use UTF-8 encoding for international characters
- Include a header row with descriptive column names
- Use ISO 8601 date format (`YYYY-MM-DDTHH:mm:ssZ`)
- Avoid trailing commas
- Keep column count consistent across all rows

## Excel (.xlsx)

Excel workbooks provide a familiar format for spreadsheet users.

### Requirements

- Excel 2007 or newer format (`.xlsx`)
- Legacy `.xls` supported but not recommended
- First sheet used by default (configurable)
- Header row expected in first row

### Example Structure

```
┌────────────────────────────────────────────────────────────────┐
│ Sheet1: Player Events                                          │
├──────────┬─────────────────────┬────────────┬───────┬─────────┤
│ user_id  │ timestamp           │ event      │ level │ revenue │
├──────────┼─────────────────────┼────────────┼───────┼─────────┤
│ u001     │ 2024-03-15 10:30:00 │ level_up   │ 5     │ 0       │
│ u001     │ 2024-03-15 10:35:00 │ purchase   │ 5     │ 4.99    │
│ u002     │ 2024-03-15 11:00:00 │ session    │ 1     │ 0       │
└──────────┴─────────────────────┴────────────┴───────┴─────────┘
```

### Configuration Options

```typescript
interface ExcelOptions {
  sheet?: string | number;     // Sheet name or index (0-based)
  headerRow?: number;          // Row containing headers (1-based)
  dataStartRow?: number;       // First data row (1-based)
  columns?: string[];          // Specific columns to import
  dateMode?: 'excel' | 'iso';  // How to interpret dates
}
```

### Multi-Sheet Workbooks

When a workbook contains multiple sheets:

```typescript
// Import specific sheet
const data = await importExcel(file, { sheet: 'Events' });

// Import all sheets as separate datasets
const datasets = await importExcelAllSheets(file);
// Returns: { 'Events': Dataset, 'Users': Dataset, 'Purchases': Dataset }
```

### Excel-Specific Features

| Feature | Support | Notes |
|---------|---------|-------|
| Formulas | Values only | Calculated values are imported |
| Formatting | Ignored | Colors, fonts not imported |
| Merged cells | Partial | First cell value used |
| Named ranges | Yes | Can reference by name |
| Tables | Yes | Structured tables supported |
| Pivot tables | No | Export to regular range first |

### Limitations

- Maximum 100MB file size (Excel files are larger than CSV)
- Password-protected files not supported
- Macros are ignored
- Charts and images are ignored

## JSON

JSON format is ideal for nested data structures and API exports.

### Supported Structures

#### Array of Objects (Recommended)

```json
[
  {
    "user_id": "u001",
    "timestamp": "2024-03-15T10:30:00Z",
    "event": "level_complete",
    "properties": {
      "level": 5,
      "time_spent": 120
    }
  },
  {
    "user_id": "u001",
    "timestamp": "2024-03-15T10:35:00Z",
    "event": "purchase",
    "properties": {
      "item": "gem_pack",
      "revenue": 4.99
    }
  }
]
```

#### Object with Data Array

```json
{
  "data": [
    { "user_id": "u001", "level": 5 },
    { "user_id": "u002", "level": 3 }
  ],
  "metadata": {
    "exported_at": "2024-03-15",
    "total_rows": 2
  }
}
```

#### Newline-Delimited JSON (NDJSON)

```json
{"user_id": "u001", "event": "login"}
{"user_id": "u002", "event": "login"}
{"user_id": "u001", "event": "purchase"}
```

### Configuration Options

```typescript
interface JSONOptions {
  format?: 'array' | 'object' | 'ndjson';
  dataPath?: string;           // JSON path to data array
  flatten?: boolean;           // Flatten nested objects
  flattenSeparator?: string;   // Separator for flattened keys
  arrayHandling?: 'stringify' | 'first' | 'expand';
}
```

### Nested Object Handling

Game Insights can flatten nested objects:

```json
// Original
{
  "user_id": "u001",
  "properties": {
    "level": 5,
    "region": "US"
  }
}

// Flattened (flattenSeparator: '_')
{
  "user_id": "u001",
  "properties_level": 5,
  "properties_region": "US"
}
```

### Streaming Large JSON

For large JSON files, use NDJSON format or streaming:

```typescript
const result = await parseJSON(largeFile, {
  streaming: true,
  format: 'ndjson'
});
```

## SQLite Databases

SQLite databases provide efficient storage for larger datasets with query capabilities.

### Requirements

- SQLite 3.x format
- Single table or specify table name
- Standard data types

### Supported Data Types

| SQLite Type | Game Insights Type |
|-------------|-------------------|
| INTEGER | number |
| REAL | number |
| TEXT | string |
| BLOB | ignored |
| DATETIME | timestamp |
| DATE | date |

### Configuration Options

```typescript
interface SQLiteOptions {
  table?: string;         // Table name (auto-detects if single table)
  query?: string;         // Custom SQL query
  limit?: number;         // Max rows to import
}
```

### Using Custom Queries

```typescript
// Import with custom SQL
const data = await importSQLite(file, {
  query: `
    SELECT
      user_id,
      timestamp,
      event_type,
      JSON_EXTRACT(properties, '$.level') as level
    FROM events
    WHERE timestamp > '2024-01-01'
    ORDER BY timestamp
  `
});
```

### Multi-Table Support

```typescript
// List available tables
const tables = await getSQLiteTables(file);
// Returns: ['events', 'users', 'purchases']

// Import specific table
const events = await importSQLite(file, { table: 'events' });
```

### Best Practices

- Index frequently queried columns
- Use appropriate data types
- Consider WAL mode for concurrent access
- Vacuum database before export for smaller files

## Clipboard Paste

Paste data directly from spreadsheets or text for quick testing.

### Supported Sources

- Excel (copy cells)
- Google Sheets
- Numbers (Mac)
- Any tab-separated text

### How to Use

1. Copy cells from your spreadsheet
2. Click in the upload area
3. Press `Ctrl+V` / `Cmd+V`
4. Data is parsed automatically

### Format Detection

Game Insights auto-detects:

- Tab-separated values (from spreadsheets)
- Comma-separated values
- JSON arrays

### Limitations

- 10MB maximum
- Browser memory constraints
- Headers expected in first row

## URL Imports

Import data directly from remote URLs.

### Supported URL Types

| Type | Example | Auth Support |
|------|---------|--------------|
| Direct file | `https://example.com/data.csv` | Basic, Bearer |
| API endpoint | `https://api.example.com/export` | Bearer, API Key |
| Cloud storage | `https://storage.example.com/bucket/file.csv` | Signed URLs |

### Configuration

```typescript
interface URLImportOptions {
  url: string;
  format?: 'csv' | 'json' | 'xlsx';  // Auto-detect if not specified
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;  // For API key
  };
  headers?: Record<string, string>;
  refresh?: 'manual' | 'hourly' | 'daily';
}
```

### Examples

#### Public URL

```typescript
await importFromURL({
  url: 'https://example.com/public-data.csv'
});
```

#### Authenticated API

```typescript
await importFromURL({
  url: 'https://api.analytics.com/export',
  format: 'json',
  auth: {
    type: 'bearer',
    token: 'your-api-token'
  }
});
```

#### Auto-Refreshing

```typescript
await importFromURL({
  url: 'https://api.example.com/daily-export.csv',
  refresh: 'daily',
  auth: {
    type: 'api-key',
    token: 'your-key',
    headerName: 'X-API-Key'
  }
});
```

### CORS Considerations

:::warning CORS Restrictions
Browser security policies may block cross-origin requests. For restricted URLs:
1. Use a CORS proxy
2. Download file manually and upload
3. Use server-side import via database adapter
:::

## Format Comparison

### When to Use Each Format

| Scenario | Recommended Format | Reason |
|----------|-------------------|--------|
| Universal export | CSV | Maximum compatibility |
| Non-technical users | Excel | Familiar interface |
| API integration | JSON | Native structure |
| Large local data | SQLite | Efficient queries |
| Quick testing | Clipboard | Fastest method |
| Automated imports | URL | Scheduled refresh |

### Performance Comparison

| Format | Parse Speed | Memory Usage | Best Size Range |
|--------|-------------|--------------|-----------------|
| CSV | Fast | Low | Any |
| Excel | Medium | High | &lt;50MB |
| JSON | Fast | Medium | &lt;100MB |
| SQLite | Very Fast | Low | Any |
| NDJSON | Very Fast | Very Low | Large files |

## Data Type Mapping

How different formats map to Game Insights internal types:

| Source Type | Internal Type | Notes |
|-------------|---------------|-------|
| String | `string` | Default for text |
| Number | `number` | Integers and floats |
| Boolean | `boolean` | true/false/1/0 |
| Date | `date` | Date only |
| DateTime | `timestamp` | Full timestamp |
| ISO 8601 | `timestamp` | Auto-detected |
| Unix timestamp | `timestamp` | Seconds or milliseconds |
| JSON object | `string` | Stringify or flatten |
| Array | `string` | Stringify or expand |
| Null/Empty | `null` | Handled per column config |

## Troubleshooting

### Common Issues by Format

#### CSV
- **Wrong delimiter**: Manually specify in upload wizard
- **Encoding issues**: Save as UTF-8
- **Missing values**: Configure null value strings

#### Excel
- **Formula errors**: Check formulas calculate correctly
- **Merged cells**: Unmerge before export
- **Date formatting**: Use consistent date format

#### JSON
- **Invalid JSON**: Validate with JSON linter
- **Deep nesting**: Enable flatten option
- **Arrays**: Configure array handling strategy

#### SQLite
- **Locked database**: Close other connections
- **Corrupt database**: Run PRAGMA integrity_check

## Next Steps

- [Upload your first dataset](/docs/data-management/uploading-data)
- [Understand data quality features](/docs/data-management/data-quality)
- [Connect a live database](/docs/data-management/sources/postgresql)
