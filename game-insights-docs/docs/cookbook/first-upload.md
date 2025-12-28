# Your First Data Upload

This tutorial walks you through uploading game analytics data to Game Insights, from preparing your file to viewing your first insights.

**Time to complete:** 10 minutes

## Prerequisites

- Game Insights running locally (`npm run dev`)
- A CSV, JSON, or Excel file with game data (or use the provided sample data)

## Step 1: Prepare Your Data

Before uploading, ensure your data file meets these requirements:

### Supported Formats

- **CSV** - Comma-separated values (recommended)
- **JSON** - Array of objects or newline-delimited JSON
- **Excel** - `.xlsx` or `.xls` files
- **TSV** - Tab-separated values

### Recommended Columns

While Game Insights can work with any data, it works best when your data includes some of these columns:

| Column Type | Example Names | Purpose |
|-------------|---------------|---------|
| User ID | `user_id`, `player_id`, `uid` | Track individual players |
| Timestamp | `created_at`, `timestamp`, `date` | Time-series analysis |
| Event Type | `event`, `action`, `event_type` | Categorize player actions |
| Revenue | `revenue`, `amount`, `purchase_amount` | Monetization tracking |
| Level | `level`, `stage`, `chapter` | Progression analysis |

### Sample Data Structure

Here's an example of well-structured game data:

```csv
user_id,event_type,timestamp,level,revenue,session_id
u_001,game_start,2024-01-15T10:30:00Z,1,0,s_100
u_001,level_complete,2024-01-15T10:35:00Z,1,0,s_100
u_001,purchase,2024-01-15T10:36:00Z,2,4.99,s_100
u_002,game_start,2024-01-15T11:00:00Z,1,0,s_101
```

## Step 2: Navigate to Upload Page

1. Open your browser to `http://localhost:5173`
2. Click **Upload** in the left sidebar
3. You should see the Upload Data page with a drag-and-drop zone

**What you should see:**

The page displays:
- A large drop zone with "Drag and drop your files here"
- Supported format icons (CSV, JSON, Excel)
- A "Browse" button as an alternative to drag-and-drop

## Step 3: Upload Your File

### Option A: Drag and Drop

1. Open your file explorer/finder
2. Locate your data file
3. Drag the file onto the drop zone
4. Release when you see the drop zone highlight

### Option B: Browse for File

1. Click the **Browse** button in the center of the drop zone
2. Navigate to your file in the file picker
3. Select the file and click **Open**

**What you should see:**

After selecting a file:
- A loading spinner appears briefly
- The page transitions to the **Preview** step
- You see a progress indicator showing "Step 2: Preview"

## Step 4: Preview Your Data

The preview screen shows you:

1. **File Information**
   - File name
   - Number of rows detected
   - Detected template (if recognized)

2. **Data Table Preview**
   - First 10-20 rows of your data
   - Column headers
   - Sample values

3. **Template Detection** (if applicable)
   - If your data matches a known format, you'll see a purple banner:
   - "Detected: [Template Name] - We recognized this format and will apply optimized column mappings."

**What you should see:**

A card showing your data in table format with columns and sample rows.

### Verify Your Data

Take a moment to check:
- Are all columns showing correctly?
- Do the data types look right (numbers as numbers, dates as dates)?
- Is the data what you expected?

If something looks wrong:
1. Click **Start Over** to return to upload
2. Check your file for formatting issues
3. Try again

## Step 5: Run Analysis

1. Review the preview to confirm your data looks correct
2. Click the **Continue to Analysis** button (purple button on the right)

**What you should see:**

The page shows an "Analyzing your data" screen with:
- A pulsing sparkle icon
- Message: "Using AI to understand your column structure..." (if API key configured)
- Or: "Using pattern matching to detect columns..." (if no API key)
- Your file name and row count

### Analysis Process

The analysis takes 5-30 seconds depending on:
- File size
- Whether you have an OpenAI API key configured
- Network speed (if using AI analysis)

## Step 6: Review Column Mappings

After analysis completes, you see the Review screen showing:

1. **Game Type Detection**
   - Detected game type (e.g., "puzzle game", "gacha RPG")
   - Number of columns detected
   - Data quality score (percentage)

2. **Column Mapping Table**
   Each column shows:
   - Original column name
   - Detected role (user_id, timestamp, revenue, etc.)
   - Data type (string, number, date)
   - Confidence indicator

**What you should see:**

A summary card showing:
- "Detected: [game type] game"
- "[N] columns - Data quality: [X]%"

Below that, a table with all your columns and their detected roles.

### Adjusting Mappings

If a column was misidentified:

1. Find the column in the mapping table
2. Click the **Role** dropdown for that column
3. Select the correct role from the list
4. The mapping updates immediately

Common role options:
- `user_id` - Unique player identifier
- `timestamp` - When the event occurred
- `event_type` - What action was taken
- `revenue` - Money amount
- `level` - Game level or stage
- `session_id` - Play session identifier
- `custom` - For columns that don't fit standard roles

## Step 7: Confirm and Save

1. Review all column mappings one final time
2. Click the **Confirm & Save** button

**What you should see:**

A success screen showing:
- Green checkmark icon
- "Data Ready!"
- "Your data has been processed and is ready for AI analysis."

## Step 8: View Your Analytics

1. Click **View Analytics** to go to the Analytics page
2. Alternatively, click **Upload Another** to add more data

**What you should see on the Analytics page:**

- **KPI Cards** - Key metrics like DAU, retention, revenue
- **Charts** - Visualizations based on your game type
- **Insights Panel** - AI-generated observations about your data

## Troubleshooting

### File Won't Upload

**Problem:** Nothing happens when you drop or select a file.

**Solutions:**
1. Check file size - files over 50MB may take longer
2. Verify the file extension is supported (.csv, .json, .xlsx)
3. Try a different browser
4. Check browser console for errors (F12 > Console)

### "Failed to parse file" Error

**Problem:** The file uploads but parsing fails.

**Solutions:**
1. Open your CSV in a text editor and check for:
   - Proper comma separation
   - Consistent column counts per row
   - Valid UTF-8 encoding
2. For JSON files, validate the JSON structure at jsonlint.com
3. Remove any special characters in column headers

### Wrong Columns Detected

**Problem:** The analyzer misidentified your columns.

**Solutions:**
1. Use the dropdown menus on the Review screen to correct mappings
2. Consider adding an OpenAI API key in Settings for better detection
3. Rename columns in your source file to match standard names (user_id, timestamp, etc.)

### Analysis Takes Too Long

**Problem:** The analysis spinner runs for more than 2 minutes.

**Solutions:**
1. For very large files (100K+ rows), analysis may take longer
2. Try with a smaller sample of your data first
3. Check your network connection if using AI analysis
4. Refresh the page and try again

### No Insights Generated

**Problem:** The Analytics page shows no insights.

**Solutions:**
1. Ensure your data has enough rows (at least 100 recommended)
2. Verify timestamp columns are properly detected
3. Check that user_id column was identified
4. Wait a few seconds - insights generate asynchronously

## Next Steps

Now that you've uploaded your first dataset:

1. **Explore the Overview** - See your key metrics at a glance
2. **Try the Monetization page** - Dive into revenue analytics
3. **Build a Custom Dashboard** - See [Create a Custom Dashboard](./custom-dashboard.md)
4. **Connect Live Data** - See [Connect Live Data Source](./connect-live-data.md)

## Tips for Better Analysis

1. **Include timestamps** - Time-series data enables trend analysis
2. **Use consistent user IDs** - Enables cohort and retention analysis
3. **Tag revenue events** - Allows monetization insights
4. **Include session markers** - Helps with engagement analysis
5. **Clean your data first** - Remove test users and invalid entries
