# Create a Custom Dashboard

This tutorial guides you through building a personalized dashboard with drag-and-drop widgets, customized KPIs, and charts tailored to your needs.

**Time to complete:** 15 minutes

## Prerequisites

- Game Insights running locally
- At least one dataset uploaded (see [Your First Data Upload](./first-upload.md))

## Overview

The Dashboard Builder lets you create custom views by combining:

- **KPI Cards** - Single metrics with trend indicators
- **Line Charts** - Time-series data visualization
- **Bar Charts** - Category comparisons
- **Pie Charts** - Distribution views
- **Tables** - Detailed data grids
- **Funnels** - Conversion flow visualization
- **Cohort Heatmaps** - Retention analysis
- **Text Blocks** - Notes and labels

## Step 1: Open the Dashboard Builder

1. Navigate to `http://localhost:5173/dashboard-builder`
2. Or click **Dashboard Builder** in the left sidebar

**What you should see:**

The Dashboard Builder page with:
- A header showing "Dashboard Builder"
- A sidebar listing existing dashboards (including default ones)
- A main canvas area showing the selected dashboard
- Action buttons: "Export", "Edit", "New Dashboard"

## Step 2: Create a New Dashboard

1. Click the **New Dashboard** button (purple button in top right)

**What you should see:**

- A new dashboard appears named "New Dashboard"
- The interface switches to edit mode automatically
- The top buttons change to: "Add Widget", "Preview", "Save"
- An empty canvas with the message "No widgets yet - Click 'Add Widget' to start building"

## Step 3: Add Your First Widget (KPI Card)

Let's start by adding a KPI card to show Daily Active Users.

1. Click the **Add Widget** button
2. A modal appears showing available widget types
3. Click **KPI Card**

**What you should see:**

The widget picker modal closes and:
- A new KPI card appears on the canvas
- The card is selected (highlighted with purple border)
- A configuration panel appears on the right side

### Configure the KPI Card

1. In the right panel, find the **Title** field
2. Change it from "Metric" to `Daily Active Users`
3. Find the **Metric** dropdown
4. Select **DAU** from the options
5. Ensure **Show Trend** toggle is ON

**What you should see:**

The KPI card now displays:
- "Daily Active Users" as the title
- A number (the current DAU value)
- A trend indicator showing percentage change
- Green or red color depending on positive/negative trend

## Step 4: Add a Line Chart

Now let's add a chart showing DAU over time.

1. Click **Add Widget** again
2. Select **Line Chart** from the widget picker

**What you should see:**

A new line chart widget appears below the KPI card.

### Configure the Line Chart

1. Click on the line chart to select it
2. In the configuration panel:
   - Set **Title** to `DAU Trend (14 Days)`
   - Set **Metric** to **DAU**
3. Adjust the **Size**:
   - Set **Width** to `6` (half the grid width)
   - Set **Height** to `2`

**What you should see:**

The chart now shows:
- Your custom title
- DAU data visualized as bars over 14 days
- The chart takes up half the horizontal space

## Step 5: Add More Widgets

Let's build out the dashboard with additional metrics.

### Add Revenue KPI

1. Click **Add Widget** > **KPI Card**
2. Configure:
   - Title: `Revenue (14d)`
   - Metric: **Revenue**
   - Show Trend: ON

### Add Retention KPI

1. Click **Add Widget** > **KPI Card**
2. Configure:
   - Title: `D7 Retention`
   - Metric: **Retention**
   - Show Trend: ON

### Add a Pie Chart

1. Click **Add Widget** > **Pie Chart**
2. Configure:
   - Title: `Revenue Distribution`
   - Width: `3`
   - Height: `2`

### Add a Funnel Widget

1. Click **Add Widget** > **Funnel**
2. Configure:
   - Title: `User Conversion Funnel`
   - Width: `3`
   - Height: `2`

**What you should see:**

Your dashboard now has:
- 3 KPI cards at the top
- 1 line chart and additional visualizations
- Multiple widget types showing different data views

## Step 6: Arrange the Layout

Widgets are arranged in a grid. Let's organize them properly.

### Understanding the Grid

- The dashboard uses a 12-column grid
- Width values (1-12) determine how many columns a widget spans
- Height values determine vertical space

### Recommended Layout

For a balanced dashboard, try this layout:

**Row 1 (KPIs):**
- DAU card: Width 4
- Revenue card: Width 4
- Retention card: Width 4

**Row 2 (Charts):**
- DAU Trend chart: Width 6, Height 2
- Pie chart: Width 6, Height 2

**Row 3:**
- Funnel: Width 6, Height 2
- (Add more widgets as needed)

### Adjusting Widget Sizes

1. Click on a widget to select it
2. In the configuration panel, adjust **Width** and **Height**
3. Widgets automatically reflow to fit

**What you should see:**

A well-organized dashboard with:
- KPIs in a row at the top
- Charts arranged in a logical grid below
- No overlapping widgets

## Step 7: Preview Your Dashboard

Before saving, let's preview how it looks to viewers.

1. Click the **Preview** button in the top right

**What you should see:**

- Edit controls disappear
- Widget selection borders are hidden
- The dashboard appears as end users will see it
- "Edit" and "Export" buttons appear

### Return to Edit Mode

1. Click the **Edit** button to continue editing

## Step 8: Name Your Dashboard

1. While in edit mode, look at the dashboard header
2. The dashboard name appears with the icon
3. To rename, you'll save with a new name

For now, let's proceed to save.

## Step 9: Save Your Dashboard

1. Click the **Save** button (purple button in top right)

**What you should see:**

- A brief saving indicator
- The dashboard appears in the sidebar list
- Edit mode may exit (depending on settings)

### Verify the Save

1. Look at the sidebar dashboard list
2. Your new dashboard should appear
3. Click on it to confirm it loads correctly

## Step 10: Load Your Dashboard Later

Your dashboards are automatically saved and persist between sessions.

### Finding Your Dashboard

1. Navigate to Dashboard Builder
2. Look in the left sidebar
3. Click your dashboard name to load it

### Dashboard List Features

Each dashboard in the list shows:
- Dashboard icon
- Dashboard name
- Number of widgets
- Three-dot menu for actions

### Dashboard Actions Menu

Click the three-dot menu on any dashboard to:
- **Duplicate** - Create a copy
- **Delete** - Remove the dashboard (non-default dashboards only)

## Adding More Widget Types

### Table Widget

Great for showing detailed data:
1. Add Widget > **Table**
2. Shows top items with names, revenue, and sales
3. Useful for product performance or user leaderboards

### Cohort Heatmap

For retention analysis:
1. Add Widget > **Cohort**
2. Shows retention by cohort week and day
3. Colors indicate retention percentage

### Text Widget

For annotations and labels:
1. Add Widget > **Text**
2. Set the **Content** field with your text
3. Useful for section headers or notes

## Deleting Widgets

To remove a widget:

### Method 1: From the Widget
1. In edit mode, hover over the widget
2. Click the red trash icon in the top-right corner

### Method 2: From the Config Panel
1. Select the widget
2. Scroll to the bottom of the config panel
3. Click **Delete Widget**

## Troubleshooting

### Widgets Not Saving

**Problem:** Changes don't persist after refresh.

**Solutions:**
1. Make sure you clicked the **Save** button
2. Check browser console for IndexedDB errors
3. Clear browser storage and try again

### Layout Looks Wrong

**Problem:** Widgets overlap or appear in wrong positions.

**Solutions:**
1. Adjust widget sizes to fit the 12-column grid
2. Make sure total width per row doesn't exceed 12
3. Use Preview mode to check the actual layout

### Widget Shows No Data

**Problem:** A widget displays placeholder or no data.

**Solutions:**
1. Ensure you have uploaded data
2. Check that the metric is available for your data type
3. Some widgets use mock data for demonstration

### Can't Delete Default Dashboard

**Problem:** Delete option is disabled for some dashboards.

**Solution:**
Default dashboards cannot be deleted, but you can:
1. Duplicate the default dashboard
2. Modify the copy
3. Use the copy instead

## Best Practices

### Dashboard Design Tips

1. **Group related metrics** - Put KPIs for the same area together
2. **Use consistent sizing** - Align widgets for a clean look
3. **Limit widgets per dashboard** - 6-8 widgets is usually optimal
4. **Add context** - Use text widgets for explanations
5. **Consider your audience** - Different dashboards for different roles

### Naming Conventions

Use clear, descriptive names:
- "Daily KPIs" - For daily review
- "Monetization Overview" - For revenue focus
- "Retention Deep Dive" - For engagement analysis
- "Executive Summary" - For high-level stakeholders

## Next Steps

Now that you can create custom dashboards:

1. **Export your dashboard** - Click Export to share as PDF or image
2. **Set up alerts** - See [Setting Up Alerts](./setup-alerts.md)
3. **Connect live data** - See [Connect Live Data Source](./connect-live-data.md) for real-time updates
4. **Run experiments** - See [Run Your First A/B Test](./run-ab-test.md)
