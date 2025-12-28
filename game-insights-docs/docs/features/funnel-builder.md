---
sidebar_position: 2
title: Custom Funnel Builder
description: Create, edit, and manage custom conversion funnels with drag-and-drop step management
---

# Custom Funnel Builder

The Funnel Builder (`/funnel-builder`) allows you to create custom conversion funnels tailored to your specific analytics needs. Build multi-step funnels, configure events, and track results in real-time.

## Overview

The Funnel Builder provides:

- **Visual Step Editor** - Drag-and-drop funnel step management
- **Event Library** - 20+ common game events to choose from
- **Funnel Management** - Create, duplicate, and organize funnels
- **Real-time Results** - See conversion metrics as you build
- **Persistence** - All funnels saved to IndexedDB

## Creating a New Funnel

### Step 1: Open the Builder

1. Navigate to **Funnels > Funnel Builder** in the sidebar
2. Click the **"+ New Funnel"** button in the top right

### Step 2: Name Your Funnel

Enter a descriptive name for your funnel:

```
Examples:
- "New User Onboarding"
- "Premium Subscription Flow"
- "Tutorial to Level 10"
- "In-App Purchase Journey"
```

### Step 3: Add Funnel Steps

New funnels start with two default steps. Click **"+ Add Step"** to add more:

```tsx
// Example funnel structure
{
  name: "New User Onboarding",
  steps: [
    { name: "App Open", event: "app_open" },
    { name: "Tutorial Start", event: "tutorial_start" },
    { name: "Tutorial Complete", event: "tutorial_complete" },
    { name: "Level 5", event: "level_complete" },
    { name: "First Purchase", event: "purchase_complete" }
  ]
}
```

### Step 4: Configure Each Step

For each step, configure:

| Field | Description |
|-------|-------------|
| **Step Name** | Display name shown in the funnel visualization |
| **Event** | The analytics event that triggers this step |

### Step 5: Save Your Funnel

Click the **"Save"** button to persist your funnel. It will appear in your funnel list.

## Available Events

The Funnel Builder includes common game analytics events:

### Lifecycle Events
| Event | Description |
|-------|-------------|
| `app_open` | User opens the application |
| `session_start` | New session begins |

### Onboarding Events
| Event | Description |
|-------|-------------|
| `tutorial_start` | Tutorial begins |
| `tutorial_complete` | Tutorial finished |
| `registration` | Account created |

### Gameplay Events
| Event | Description |
|-------|-------------|
| `level_start` | Level begins |
| `level_complete` | Level finished successfully |
| `level_fail` | Level failed |

### Monetization Events
| Event | Description |
|-------|-------------|
| `purchase_start` | Checkout initiated |
| `purchase_complete` | Purchase successful |
| `ad_request` | Ad requested |
| `ad_impression` | Ad displayed |
| `ad_click` | Ad clicked |

### Social Events
| Event | Description |
|-------|-------------|
| `share` | Content shared |
| `invite_send` | Invitation sent |
| `invite_accept` | Invitation accepted |

### Progression Events
| Event | Description |
|-------|-------------|
| `achievement_unlock` | Achievement earned |

### Economy Events
| Event | Description |
|-------|-------------|
| `item_acquire` | Item obtained |
| `item_use` | Item consumed |
| `currency_earn` | Currency gained |
| `currency_spend` | Currency spent |

## Editing Existing Funnels

### Enter Edit Mode

1. Select a funnel from the left sidebar
2. Click the **"Edit"** button in the header
3. The funnel enters edit mode with editable fields

### Modify Step Names

Click on any step name field to edit it:

```
Before: "Step 1"
After:  "Tutorial Introduction"
```

### Change Step Events

Use the dropdown to select a different event for any step:

```tsx
// Before
{ name: "First Action", event: "app_open" }

// After
{ name: "First Action", event: "tutorial_start" }
```

### Reorder Steps

Steps display with a grip handle for drag-and-drop reordering (coming in a future update). Currently, step order is determined by the order they were added.

### Delete Steps

Click the trash icon to remove a step. Note: Funnels must have at least 2 steps.

### Save or Cancel

- **Save** - Persist all changes
- **Cancel** - Discard changes and exit edit mode

## Saving and Managing Funnels

### Funnel Persistence

All funnels are automatically saved to IndexedDB with the following data:

```tsx
interface Funnel {
  id: string;              // Unique identifier
  name: string;            // Display name
  description?: string;    // Optional description
  icon?: string;           // Emoji icon
  steps: FunnelStep[];     // Array of steps
  conversionWindow: number; // Hours
  countingMethod: 'unique' | 'totals';
  createdAt: string;
  updatedAt: string;
}
```

### Funnel List

The left sidebar shows all your funnels with:

- Funnel icon and name
- Step count
- Selection highlighting
- Quick action menu

### Quick Actions

Click the three-dot menu on any funnel for:

| Action | Description |
|--------|-------------|
| **Duplicate** | Create a copy with "(Copy)" suffix |
| **Delete** | Remove the funnel permanently |

## Funnel Metrics

When viewing a funnel (not in edit mode), you'll see calculated metrics:

### Step-by-Step Results

Each step displays:

```
Step Name          Users        Conversion    Dropoff
─────────────────────────────────────────────────────
App Open           12,500       100.0%        -
Tutorial Start      9,800        78.4%       -21.6%
Tutorial Complete   7,200        57.6%       -26.5%
Level 5             4,500        36.0%       -37.5%
First Purchase        890         7.1%       -80.2%
```

### Summary Cards

Three summary metrics appear below the funnel:

| Metric | Description |
|--------|-------------|
| **Overall Conversion** | Percentage completing all steps |
| **Total Users** | Users at the funnel entry point |
| **Median Time** | Average time to complete funnel |

## Sample Funnels

Game Insights includes three pre-built sample funnels:

### 1. New User Onboarding

```
App Open → Tutorial Started → Tutorial Completed →
First Level Complete → First Purchase
```
- **Window:** 7 days
- **Counting:** Unique users

### 2. Purchase Funnel

```
Store Opened → Product Viewed → Checkout Started → Purchase Completed
```
- **Window:** 1 hour
- **Counting:** Total events

### 3. Level Progression

```
Level 1 → Level 5 → Level 10 → Level 25 → Level 50
```
- **Window:** 30 days
- **Counting:** Unique users

## Advanced Configuration

### Conversion Window

Set how long users have to complete the funnel:

| Window | Use Case |
|--------|----------|
| 1 hour | Short purchase flows |
| 24 hours | Daily engagement funnels |
| 7 days | Onboarding funnels |
| 30 days | Long-term progression |

### Counting Method

Choose how users are counted:

| Method | Description |
|--------|-------------|
| **Unique** | Count each user once per step |
| **Totals** | Count all event occurrences |

## Best Practices

### Funnel Design

1. **Start broad, end specific** - Begin with high-volume events
2. **Limit to 5-7 steps** - Too many steps reduces clarity
3. **Use sequential events** - Steps should follow logical order
4. **Name clearly** - Use descriptive, action-oriented names

### Analysis Tips

1. **Compare similar funnels** - A/B test different paths
2. **Segment by user properties** - Analyze by platform, country, etc.
3. **Track over time** - Monitor trends after game updates
4. **Focus on biggest drops** - Prioritize high-impact optimizations

### Common Patterns

**Onboarding Funnel:**
```
Install → Tutorial → First Session → Day 2 Return → Week 1 Active
```

**Purchase Funnel:**
```
Store View → Product Select → Add to Cart → Checkout → Purchase
```

**Engagement Funnel:**
```
Login → Core Action → Social Action → Daily Complete → Premium Convert
```

## Integration with AI Features

Funnels integrate with Game Insights AI features:

- **Predictions** - Forecast future conversion rates
- **Anomaly Detection** - Alert on unusual drop-offs
- **Insights** - AI-generated optimization suggestions
- **A/B Testing** - Test funnel variations

## Troubleshooting

### Funnel Not Saving

1. Check that the funnel has a name
2. Ensure at least 2 steps exist
3. Verify browser has IndexedDB support
4. Check console for errors

### Results Not Updating

1. Click outside the funnel to deselect
2. Re-select the funnel to refresh
3. Check that data is uploaded

### Missing Events

If an event doesn't appear in the dropdown:
1. Events are pre-defined in the system
2. Custom events require code modification
3. Contact support for custom event requests

## Related Documentation

- [Funnel Analysis](/docs/features/funnels) - View pre-built funnels
- [A/B Testing](/docs/features/ab-testing) - Test funnel variations
- [Predictions](/docs/ai-analytics/predictions) - Forecast conversions
