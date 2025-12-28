---
sidebar_position: 5
title: Connect Live Data
description: Set up real-time data sync in minutes
---

# Connect Live Data

Connect your game's live data source to see metrics update in real-time. No coding required.

**Time:** 5-10 minutes

## What You'll Achieve

- Real-time dashboard updates as players interact with your game
- Automatic data sync without manual uploads
- Live alerts when metrics change

## Before You Start

You'll need access credentials from one of these providers:
- **Supabase** - Project URL and API key (free tier available)
- **PostgreSQL** - Host, database name, username, password
- **Google Sheets** - Google account with a spreadsheet
- **Custom API** - Your API endpoint URL

---

## Step 1: Open Data Sources

1. Click **Data Sources** in the left sidebar
2. Click the **+ Add Source** button

**What you'll see:** A list of available data source types with icons

---

## Step 2: Choose Your Provider

1. Click your provider's card (e.g., **Supabase**, **PostgreSQL**, **Google Sheets**)
2. The connection form opens

**What you'll see:** A form with fields specific to your provider

---

## Step 3: Enter Your Credentials

### For Supabase

1. Open your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy the **Project URL** → Paste into Game Insights
4. Copy the **anon/public key** → Paste into Game Insights
5. Select your events table from the dropdown

### For PostgreSQL

1. Enter your database **Host** (e.g., `db.example.com`)
2. Enter **Port** (usually `5432`)
3. Enter **Database name**
4. Enter **Username** and **Password**
5. Toggle **SSL** on if required

### For Google Sheets

1. Click **Sign in with Google**
2. Authorize Game Insights to read your sheets
3. Select the spreadsheet from the list
4. Choose the sheet/tab with your data

### For Custom API

1. Enter your **API endpoint URL**
2. Select authentication type (API Key, Bearer Token, or None)
3. Enter credentials if required

---

## Step 4: Test the Connection

1. Click **Test Connection**
2. Wait a few seconds

**What you'll see:**
- ✅ Green checkmark = Connected successfully
- ❌ Red error = Check your credentials and try again

> **Tip:** If connection fails, double-check that your credentials are copied correctly with no extra spaces.

---

## Step 5: Enable Real-Time Sync

1. Toggle **Real-time sync** to ON
2. Set refresh interval (for non-streaming sources):
   - **Every 1 minute** - Most current data
   - **Every 5 minutes** - Balanced (recommended)
   - **Every 15 minutes** - Lower resource usage

**What you'll see:** A "Live" indicator appears next to your data source

---

## Step 6: Save and Verify

1. Click **Save Connection**
2. Return to your dashboard
3. Look for the **Live** badge in the header

**What you'll see:** Your dashboard now shows real-time data with a pulsing "Live" indicator

---

## You're Done!

Your live data connection is active. As new events come in from your game, dashboards update automatically.

### What Happens Now

- **New data appears** within seconds (streaming) or at your refresh interval
- **Alerts trigger** based on your configured rules
- **AI insights update** as patterns emerge in new data

---

## Troubleshooting

### Connection keeps failing

- Verify your credentials are correct
- Check if your database allows external connections
- For PostgreSQL, ensure your IP is whitelisted

### Data not updating

- Check the refresh interval setting
- Verify new data is being written to your source
- Look at the "Last sync" timestamp in Data Sources

### Wrong data showing

- Confirm you selected the correct table/sheet
- Check that column names match expected formats
- Try re-running the schema detection

---

## Next Steps

- [Set Up Alerts](/docs/cookbook/setup-alerts) to get notified of important changes
- [Build a Custom Dashboard](/docs/cookbook/custom-dashboard) for your live data
- [Analyze Monetization](/docs/cookbook/analyze-monetization) with real-time revenue tracking

---

<details>
<summary><strong>Advanced: Custom Integration (for developers)</strong></summary>

If you need programmatic control over the connection, you can use the adapter API:

```typescript
import { SupabaseAdapter } from '@/adapters/SupabaseAdapter';

const adapter = new SupabaseAdapter({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY
});

await adapter.connect({
  table: 'player_events',
  syncMode: 'realtime'
});

adapter.on('insert', (newRow) => {
  console.log('New event:', newRow);
});

await adapter.startRealtime();
```

See the [Adapters API Reference](/docs/api-reference/adapters) for full documentation.

</details>
