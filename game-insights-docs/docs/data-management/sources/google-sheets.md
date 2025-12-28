---
sidebar_position: 2
title: Google Sheets Integration
description: Connect Google Sheets to Game Insights for real-time data synchronization
---

# Google Sheets Integration

Connect your Google Sheets data to Game Insights for collaborative data management and real-time synchronization.

## Overview

| Feature | Details |
|---------|---------|
| **Authentication** | OAuth 2.0 |
| **Sync Options** | Manual, Scheduled, Real-time |
| **Max Rows** | 10 million cells per spreadsheet |
| **Best For** | Collaborative data, manual updates, small-medium datasets |

## Setup

### Prerequisites

1. A Google Cloud Project with Sheets API enabled
2. OAuth 2.0 credentials configured
3. Access to the Google Sheet you want to connect

### Creating OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google Sheets API
4. Configure OAuth consent screen
5. Create OAuth 2.0 Client ID credentials

### Connection Code

```typescript
import { GoogleSheetsAdapter } from '@/adapters/GoogleSheetsAdapter';

const adapter = new GoogleSheetsAdapter({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI
});

// Authenticate
await adapter.authenticate();

// Connect to spreadsheet
await adapter.connect({
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  range: 'Sheet1!A1:Z1000'
});

// Fetch data
const schema = await adapter.fetchSchema();
const data = await adapter.fetchData();
```

## Finding Spreadsheet ID

The spreadsheet ID is in the URL:

```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                      └──────────────── Spreadsheet ID ────────────────┘
```

## Sync Options

### Manual Sync

Fetch data on demand:

```typescript
await adapter.connect({
  spreadsheetId: 'your-id',
  syncMode: 'manual'
});

const data = await adapter.fetchData();
```

### Scheduled Sync

Automatically sync at intervals:

```typescript
await adapter.connect({
  spreadsheetId: 'your-id',
  syncMode: 'scheduled',
  syncInterval: 15 // minutes
});

adapter.on('sync', (data) => {
  updateDashboard(data);
});

adapter.startScheduledSync();
```

## Best Practices

1. **Use read-only scope** when possible
2. **Organize data** with headers in row 1
3. **Keep sheets focused** - one data type per sheet
4. **Use consistent formats** for dates and numbers

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth popup blocked | Allow popups for the domain |
| Access denied | Ensure sheet is shared with authenticated user |
| Rate limit exceeded | Reduce sync frequency |

## Related

- [File Adapter](/docs/data-management/sources/file-adapter)
- [PostgreSQL Connection](/docs/data-management/sources/postgresql)
- [Data Quality](/docs/data-management/data-quality)
