---
sidebar_position: 4
title: Real-time Monitoring
description: Live dashboard with 3-second updates for new users, active users, revenue, and SDK health
---

# Real-time Monitoring

The Realtime page (`/realtime`) provides live analytics with automatic 3-second updates. Monitor user activity, revenue flow, and SDK health in real-time.

## Overview

Real-time monitoring includes:

- **Live KPI Charts** - Continuously updating metrics
- **3-Second Refresh** - Automatic data updates
- **Live/Pause Toggle** - Control update frequency
- **SDK Status** - Monitor integration health
- **Error Tracking** - Live error event stream

## Live Dashboard

### Accessing Real-time View

1. Navigate to **Realtime** in the sidebar
2. The dashboard loads with live data
3. A green "Live" indicator shows active updates

### Live Indicator

When live mode is active, you'll see:

```
[Live] ● (green pulsing dot)
```

When paused:

```
[Paused] (gray static)
```

## KPI Cards

Six primary metrics are tracked in real-time:

### New Users

```tsx
{
  id: 'newUsers',
  title: 'New Users',
  color: '#8b5cf6',        // Purple
  baseValue: 280,          // Approximate value
  variance: 100            // Random variation
}
```

Tracks new user registrations per update interval.

### Active Users

```tsx
{
  id: 'activeUsers',
  title: 'Active Users',
  color: '#6366f1',        // Indigo
  baseValue: 420,
  variance: 150
}
```

Current users with active sessions.

### Returning Users

```tsx
{
  id: 'returningUsers',
  title: 'Returning Users',
  color: '#06b6d4',        // Cyan
  baseValue: 180,
  variance: 80
}
```

Users who have returned after previous sessions.

### Revenue

```tsx
{
  id: 'revenue',
  title: 'Revenue',
  color: '#10b981',        // Green
  baseValue: 150,
  variance: 100,
  prefix: '$'
}
```

Real-time revenue from purchases and ads.

### Transactions

```tsx
{
  id: 'transactions',
  title: 'Transactions',
  color: '#f59e0b',        // Amber
  baseValue: 28,
  variance: 15
}
```

Number of completed transactions.

### Session Count

```tsx
{
  id: 'sessions',
  title: 'Session Count',
  color: '#ec4899',        // Pink
  baseValue: 850,
  variance: 200
}
```

Total active sessions across all users.

## Chart Visualization

Each KPI displays as a rolling line chart:

### Chart Features

- **20-point window** - Shows last 20 data points
- **Smooth lines** - Cubic interpolation for readability
- **Gradient fill** - Color fades to transparent
- **Time labels** - HH:MM format on x-axis
- **Unique users** - Total count displayed in header

### Reading Live Charts

```
Time    Value   Trend
────────────────────────
14:30   285     ▲ rising
14:33   312     ▲ rising
14:36   298     ▼ falling
14:39   325     ▲ rising
14:42   301     ▼ falling
```

## Update Interval

The dashboard updates every 3 seconds (3000ms):

```tsx
const interval = setInterval(() => {
  // Update timestamps
  const newTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generate new data points
  setChartData(prev => {
    const updated = { ...prev };
    liveCharts.forEach(chart => {
      updated[chart.id] = [
        ...prev[chart.id].slice(1),
        generateLiveData(chart.baseValue, chart.variance)
      ];
    });
    return updated;
  });
}, 3000);
```

## Live/Pause Toggle

Control real-time updates with the toggle button:

### Toggle States

| State | Button | Action |
|-------|--------|--------|
| **Live** | Green with spinning icon | Click to pause |
| **Paused** | Gray with static icon | Click to resume |

### When to Pause

- Analyzing a specific moment
- Taking screenshots
- Reducing browser resource usage
- Presenting to stakeholders

### Keyboard Shortcut

Press `Space` to toggle live/pause (when focused on the page).

## Error Events Chart

A special multi-line chart tracks error severity:

### Error Categories

| Category | Color | Description |
|----------|-------|-------------|
| **Info** | Blue | Informational logs |
| **Warning** | Amber | Non-critical issues |
| **Error** | Red | Errors affecting users |
| **Debug** | Gray | Developer debug logs |

### Stacked Area Display

Errors display as a stacked area chart showing relative proportions:

```
Total errors: 1,250 in window

info:    ████████████████████░░░░░  42%
warning: ████████████░░░░░░░░░░░░░  25%
error:   ██████░░░░░░░░░░░░░░░░░░░  12%
debug:   █████████████████░░░░░░░░  21%
```

## SDK Status Tab

Switch to the SDK Status tab for integration health:

### Health Metrics

#### SDK Health

```
99.9%
Uptime last 24h
```

Shows SDK availability and reliability.

#### Events/min

```
12.4K
Average throughput
```

Event ingestion rate per minute.

#### Latency

```
23ms
P95 response time
```

95th percentile response time for event processing.

### Status Indicators

| Status | Indicator | Meaning |
|--------|-----------|---------|
| Healthy | Green dot | All systems operational |
| Degraded | Yellow dot | Some issues detected |
| Down | Red dot | Service unavailable |

## Rolling Window

Data is displayed in a rolling 20-point window:

```tsx
// Initialize with 20 data points
for (let i = 19; i >= 0; i--) {
  const time = new Date(Date.now() - i * 3000);
  // Generate historical data
}

// On each update, shift window
setTimestamps(prev => [...prev.slice(1), newTime]);
setChartData(prev => {
  // Remove oldest, add newest
  return [...prev.slice(1), newValue];
});
```

This creates a smooth scrolling effect as new data arrives.

## Performance Considerations

### Browser Resources

Real-time updates consume resources. Best practices:

1. **Single tab** - Avoid multiple realtime tabs
2. **Pause when idle** - Auto-pause when tab is hidden
3. **Chart optimization** - Canvas rendering for performance

### Memory Management

Charts automatically clean up old data:

```tsx
// Keep only last 20 points
updated[chart.id] = [...prev[chart.id].slice(1), newValue];
```

### Network Usage

Each update fetches minimal data:

- ~500 bytes per update
- 20 updates per minute
- ~10KB per minute total

## Use Cases

### Live Launch Monitoring

During game launches, monitor:

- New user spike
- Server load (session count)
- Error rate
- First purchase conversions

### Event Monitoring

During in-game events:

- Active user increase
- Revenue impact
- Transaction volume
- Error patterns

### Incident Response

When issues occur:

- Error spike detection
- User impact assessment
- Recovery monitoring
- Post-mortem data

## Alerts Integration

Connect real-time data to alerts:

```tsx
// Example alert trigger
if (errorRate > threshold) {
  triggerAlert({
    type: 'error_spike',
    severity: 'high',
    value: errorRate,
    timestamp: Date.now()
  });
}
```

See [Alerts](/docs/features/alerts) for configuration.

## Best Practices

### Monitoring Strategy

1. **Set baselines** - Know normal values
2. **Define thresholds** - When to investigate
3. **Create runbooks** - Response procedures
4. **Review regularly** - Weekly pattern analysis

### Dashboard Organization

1. **Primary metrics** - Most important KPIs first
2. **Related grouping** - Group related charts
3. **Error visibility** - Keep errors prominent
4. **Quick glance** - Design for fast scanning

### Team Coordination

1. **Shared dashboards** - Consistent views
2. **Alert routing** - Right person notified
3. **Escalation paths** - Clear ownership
4. **Documentation** - Metric definitions

## Troubleshooting

### Charts Not Updating

1. Check if "Paused" is active
2. Verify browser tab is focused
3. Check network connection
4. Clear browser cache

### High Latency

1. Reduce open tabs
2. Check network speed
3. Verify server status
4. Try different browser

### Missing Data

1. Check data source connection
2. Verify event tracking setup
3. Review filter settings
4. Check date range

## Related Documentation

- [Alerts](/docs/features/alerts) - Automated notifications
- [Monetization](/docs/features/monetization) - Revenue details
- [A/B Testing](/docs/features/ab-testing) - Live experiment monitoring
