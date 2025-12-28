---
sidebar_position: 1
title: File Adapter
description: Upload files directly to Game Insights using the File Adapter
---

# File Adapter

The File Adapter is the simplest way to get data into Game Insights. It supports drag-and-drop uploads, handles multiple file formats, and processes data entirely in your browser for maximum privacy.

## Overview

| Feature | Details |
|---------|---------|
| **Supported Formats** | CSV, Excel (.xlsx, .xls), JSON, SQLite |
| **Max File Size** | 500MB |
| **Processing** | Client-side (browser) |
| **Refresh** | Manual re-upload |
| **Best For** | One-time analysis, historical data |

## Setup

The File Adapter requires no configuration - it works out of the box.

### Quick Start

1. Open Game Insights
2. Navigate to **Data Sources** or the main dashboard
3. Drag your file onto the upload area
4. Follow the upload wizard

```typescript
// Programmatic usage
import { FileAdapter } from '@/adapters/FileAdapter';

const adapter = new FileAdapter();

// Connect by selecting a file
const file = document.getElementById('file-input').files[0];
await adapter.connect({ file });

// Fetch the schema
const schema = await adapter.fetchSchema();

// Fetch the data
const data = await adapter.fetchData();
```

## Connection

### Drag and Drop

The simplest method:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ┌─────────────────────────────────────────────────┐     │
│     │                                                 │     │
│     │            📁 Drag files here                   │     │
│     │                                                 │     │
│     │         or click to browse                      │     │
│     │                                                 │     │
│     │   Supports: CSV, Excel, JSON, SQLite            │     │
│     │                                                 │     │
│     └─────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### File Input

For programmatic control:

```tsx
import { useState } from 'react';
import { FileAdapter } from '@/adapters/FileAdapter';

function FileUploader() {
  const [adapter] = useState(() => new FileAdapter());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await adapter.connect({ file });
    const schema = await adapter.fetchSchema();
    const data = await adapter.fetchData();

    console.log('Columns:', schema.columns);
    console.log('Rows:', data.length);
  };

  return (
    <input
      type="file"
      accept=".csv,.xlsx,.xls,.json,.sqlite,.db"
      onChange={handleFileSelect}
    />
  );
}
```

### URL Import

Import files from remote URLs:

```typescript
const adapter = new FileAdapter();

await adapter.connect({
  url: 'https://example.com/data/events.csv',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

## Configuration

### FileAdapter Options

```typescript
interface FileAdapterOptions {
  // File source
  file?: File;
  url?: string;

  // Parse options
  format?: 'auto' | 'csv' | 'json' | 'xlsx' | 'sqlite';
  encoding?: string;

  // CSV specific
  delimiter?: string;
  hasHeader?: boolean;
  skipRows?: number;

  // Excel specific
  sheet?: string | number;

  // SQLite specific
  table?: string;
  query?: string;

  // Performance
  maxRows?: number;
  sampleSize?: number;
  streaming?: boolean;
}
```

### Example Configurations

#### CSV with Custom Delimiter

```typescript
await adapter.connect({
  file: myFile,
  format: 'csv',
  delimiter: ';',
  encoding: 'utf-8',
  hasHeader: true
});
```

#### Excel Specific Sheet

```typescript
await adapter.connect({
  file: excelFile,
  format: 'xlsx',
  sheet: 'Player Events',  // or sheet: 1 for second sheet
  hasHeader: true
});
```

#### SQLite with Custom Query

```typescript
await adapter.connect({
  file: sqliteFile,
  format: 'sqlite',
  query: `
    SELECT
      user_id,
      timestamp,
      event_type,
      json_extract(properties, '$.level') as level
    FROM events
    WHERE timestamp > datetime('now', '-30 days')
  `
});
```

## Sync Strategies

The File Adapter supports manual sync only - data is loaded when you upload a file.

### Re-uploading Data

To update your data:

1. Navigate to **Data Sources**
2. Find your dataset
3. Click **Replace Data**
4. Upload the new file

```typescript
// Programmatic re-sync
const newFile = document.getElementById('file-input').files[0];
await adapter.connect({ file: newFile });
await adapter.fetchData();
```

### Appending Data

To add new data to an existing dataset:

```typescript
import { mergeDatasets } from '@/lib/dataUtils';

// Load new file
const newAdapter = new FileAdapter();
await newAdapter.connect({ file: newFile });
const newData = await newAdapter.fetchData();

// Merge with existing
const merged = mergeDatasets({
  existing: currentDataset,
  new: newData,
  strategy: 'append',
  deduplication: {
    key: ['user_id', 'timestamp'],
    keep: 'latest'
  }
});
```

## Examples

### Basic CSV Upload

```typescript
import { FileAdapter } from '@/adapters/FileAdapter';
import { DataPipeline } from '@/ai/DataPipeline';

async function processCSV(file: File) {
  // Create adapter and connect
  const adapter = new FileAdapter();
  await adapter.connect({ file });

  // Get schema and data
  const schema = await adapter.fetchSchema();
  const data = await adapter.fetchData();

  // Run through AI pipeline
  const pipeline = new DataPipeline();
  const analysis = await pipeline.analyze({
    columns: schema.columns,
    rows: data
  });

  return {
    data,
    schema,
    analysis,
    gameType: analysis.gameType,
    qualityScore: analysis.quality.score
  };
}
```

### Excel Multi-Sheet Processing

```typescript
async function processExcelWorkbook(file: File) {
  const adapter = new FileAdapter();

  // Get available sheets
  await adapter.connect({ file, format: 'xlsx' });
  const workbook = await adapter.getWorkbookInfo();

  console.log('Available sheets:', workbook.sheets);
  // ['Events', 'Users', 'Purchases']

  // Process each sheet
  const datasets = {};
  for (const sheetName of workbook.sheets) {
    await adapter.connect({ file, format: 'xlsx', sheet: sheetName });
    datasets[sheetName] = await adapter.fetchData();
  }

  return datasets;
}
```

### Large File with Streaming

```typescript
async function processLargeFile(file: File) {
  const adapter = new FileAdapter();

  await adapter.connect({
    file,
    streaming: true,
    sampleSize: 10000  // For preview
  });

  // Get schema from sample
  const schema = await adapter.fetchSchema();

  // Stream full data with progress
  let processedRows = 0;
  await adapter.fetchData({
    onProgress: (progress) => {
      console.log(`Processed: ${progress.rows} rows (${progress.percent}%)`);
      processedRows = progress.rows;
    },
    onChunk: (chunk) => {
      // Process chunk of ~1000 rows
      processChunk(chunk);
    }
  });

  console.log(`Total rows processed: ${processedRows}`);
}
```

### JSON with Nested Data

```typescript
async function processNestedJSON(file: File) {
  const adapter = new FileAdapter();

  await adapter.connect({
    file,
    format: 'json',
    // Flatten nested objects
    flatten: true,
    flattenSeparator: '_'
  });

  // Original: { user: { id: '123', profile: { level: 5 } } }
  // Flattened: { user_id: '123', user_profile_level: 5 }

  const data = await adapter.fetchData();
  return data;
}
```

### Batch File Upload

```typescript
async function batchUpload(files: FileList) {
  const results = [];

  for (const file of files) {
    const adapter = new FileAdapter();
    await adapter.connect({ file });

    const schema = await adapter.fetchSchema();
    const data = await adapter.fetchData();

    results.push({
      filename: file.name,
      rows: data.length,
      columns: schema.columns.length,
      data
    });
  }

  // Optionally merge all files
  if (results.every(r => r.columns === results[0].columns)) {
    const merged = results.flatMap(r => r.data);
    return { merged, individual: results };
  }

  return { individual: results };
}
```

## API Reference

### FileAdapter Class

```typescript
class FileAdapter extends BaseAdapter {
  /**
   * Connect to a file source
   */
  async connect(options: FileAdapterOptions): Promise<void>;

  /**
   * Fetch the schema (columns and types)
   */
  async fetchSchema(): Promise<Schema>;

  /**
   * Fetch all data rows
   */
  async fetchData(options?: FetchOptions): Promise<DataRow[]>;

  /**
   * Get workbook info (Excel only)
   */
  async getWorkbookInfo(): Promise<WorkbookInfo>;

  /**
   * Get table list (SQLite only)
   */
  async getTables(): Promise<string[]>;

  /**
   * Disconnect and clean up
   */
  async disconnect(): Promise<void>;
}
```

### Schema Interface

```typescript
interface Schema {
  columns: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'timestamp';
    nullable: boolean;
    semanticType?: string;  // e.g., 'user_id', 'revenue'
  }[];
  rowCount: number;
  source: {
    type: 'file';
    filename: string;
    format: string;
    size: number;
  };
}
```

## Performance Tips

### For Large Files (>100MB)

1. **Enable streaming** - Reduces memory usage
2. **Use sampling for preview** - Load 10K rows first
3. **Filter before upload** - Remove unnecessary columns/rows
4. **Consider SQLite** - More efficient for large datasets

### For Frequent Updates

1. **Batch your updates** - Upload weekly instead of daily
2. **Use incremental loading** - Only upload new data
3. **Consider a database adapter** - PostgreSQL or Supabase for live data

### Memory Management

```typescript
// For very large files, use chunk processing
await adapter.fetchData({
  chunkSize: 5000,
  onChunk: async (chunk, index) => {
    // Process and store each chunk
    await processChunk(chunk);
    // Allow garbage collection between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }
});
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **File too large** | Use streaming or split into smaller files |
| **Wrong encoding** | Try UTF-8 or specify encoding explicitly |
| **Parsing fails** | Verify file isn't corrupted, check format |
| **Missing columns** | Ensure header row is correctly identified |
| **Slow upload** | Reduce file size, enable streaming |

### Error Messages

```typescript
// Common error codes
const errors = {
  FILE_TOO_LARGE: 'File exceeds 500MB limit',
  INVALID_FORMAT: 'Unsupported file format',
  PARSE_ERROR: 'Failed to parse file content',
  ENCODING_ERROR: 'Unable to decode file with specified encoding',
  EMPTY_FILE: 'File contains no data'
};
```

## Next Steps

- [Supported Formats Reference](/docs/data-management/supported-formats)
- [Data Quality Analysis](/docs/data-management/data-quality)
- [Connect Google Sheets](/docs/data-management/sources/google-sheets)
- [Set Up PostgreSQL](/docs/data-management/sources/postgresql)
