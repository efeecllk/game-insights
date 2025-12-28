---
sidebar_position: 6
title: Alert System
description: Configure intelligent alerts for metrics monitoring and anomaly detection
---

# Alert System

The Alert System provides intelligent monitoring of your game metrics with automatic notifications when important conditions are detected.

## Overview

Alerts automatically monitor your metrics and notify you when:

- **Thresholds are crossed** - DAU drops below target
- **Anomalies are detected** - Unusual revenue patterns
- **Predictions trigger** - Churn risk increases
- **Opportunities arise** - High-intent users identified

## Alert Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Threshold** | Value crosses defined limit | Revenue < $1000/day |
| **Anomaly** | Unusual pattern detected | DAU spike/drop |
| **Prediction** | AI forecast triggers | Churn risk >60% |
| **Opportunity** | Growth signal identified | Conversion opportunity |

## Severity Levels

| Level | Use Case | Notification |
|-------|----------|--------------|
| **Critical** | Emergencies | All channels, immediate |
| **High** | Significant issues | Email + Slack |
| **Medium** | Attention needed | Email |
| **Low** | Informational | In-app only |

## Creating Alert Rules

1. Navigate to **Predictions** page
2. Click **Create Rule** or **+ New Alert**
3. Configure the rule:
   - **Name** - Descriptive title
   - **Type** - Threshold, anomaly, or prediction
   - **Metric** - What to monitor
   - **Condition** - When to trigger
   - **Severity** - How urgent
   - **Channels** - Where to notify

## Delivery Channels

### In-App
- Real-time notification bell
- Alert history
- Click-to-navigate

### Email
- Configurable minimum severity
- Daily digests available
- Rich HTML format

### Slack
- Webhook integration
- Channel-specific routing
- Action buttons

### Discord
- Webhook support
- Formatted embeds
- Server/channel targeting

### Custom Webhook
- JSON payload
- HMAC signature
- Retry logic

## Smart Features

### Auto-Adjust Threshold
Thresholds adapt to trends automatically:
- If DAU grows 20%, threshold adjusts proportionally
- Prevents false positives during growth periods

### Day-of-Week Awareness
Account for weekly patterns:
- Weekend metrics differ from weekdays
- Separate thresholds per day

### Cooldown Period
Prevent alert fatigue:
- Minimum time between repeated alerts
- Configurable per rule

## Snooze Functionality

Temporarily silence alerts:
- **1 hour** - Quick maintenance
- **4 hours** - Extended debugging
- **24 hours** - Known event
- **Custom** - Specific end time

## Alert History

Track all alerts for auditing:
- View past alerts
- See resolution status
- Export for reporting

## Best Practices

1. **Start with critical metrics** - DAU, Revenue, Retention
2. **Use appropriate severity** - Reserve Critical for emergencies
3. **Set reasonable cooldowns** - Prevent notification fatigue
4. **Enable smart features** - Auto-adjust and day-awareness

## Related

- [Anomaly Detection](/docs/ai-analytics/anomaly-detection)
- [AI Recommendations](/docs/ai-analytics/recommendations)
- [Setting Up Alerts Tutorial](/docs/cookbook/setup-alerts)
