# Setting Up Alerts

This tutorial shows you how to create alert rules that notify you when important metrics change, helping you catch issues early and identify opportunities.

**Time to complete:** 15 minutes

## Prerequisites

- Game Insights running locally
- At least one dataset uploaded

## What Are Alerts?

Alerts automatically monitor your metrics and notify you when:

- **Thresholds are crossed** - DAU drops below 1000
- **Anomalies are detected** - Unusual revenue patterns
- **Predictions trigger** - Churn risk increases
- **Opportunities arise** - High-intent users identified

## Alert Types

| Type | Description | Example |
|------|-------------|---------|
| **Threshold** | Metric crosses a defined value | Revenue < $500/day |
| **Anomaly** | AI detects unusual patterns | Unexpected DAU spike |
| **Prediction** | Forecasts indicate concern | 30% churn risk next week |
| **Opportunity** | Positive conditions detected | Many users ready to convert |

## Step 1: Navigate to Predictions Page

Alerts are managed from the Predictions page, which combines forecasting with alerting.

1. Navigate to `http://localhost:5173/predictions`
2. Or click **Predictions** in the left sidebar

**What you should see:**

The Predictions page with:
- Forecast charts and predictions
- An alerts section or tab
- Stats showing active alerts

## Step 2: Understanding Default Rules

Game Insights comes with pre-configured alert rules:

| Rule Name | Metric | Condition | Severity |
|-----------|--------|-----------|----------|
| DAU Drop | `dau` | -20% change | High |
| Revenue Anomaly | `revenue` | -30% change | Critical |
| High Churn Risk | `churn_risk_users` | > 100 users | High |
| Retention Drop | `d7_retention` | < 10% | High |
| Conversion Opportunity | `high_intent_non_payers` | > 50 users | Low |

These rules are enabled by default and can be customized or disabled.

## Step 3: Create Your First Alert Rule

Let's create a custom alert for monitoring daily active users.

### Access Alert Rules

1. Look for an **Alerts** or **Rules** tab/section on the Predictions page
2. Click to view existing rules
3. Click **Create Rule** or **New Alert Rule**

### Configure the Rule

Fill in the alert rule form:

**Basic Information:**
1. **Name**: Enter `Low DAU Warning`
2. **Description**: Enter `Alert when DAU falls below target`

**Condition Settings:**
3. **Metric**: Select `DAU` from the dropdown
4. **Condition**: Select `Less than` (or `lt`)
5. **Threshold**: Enter `500`

**Alert Settings:**
6. **Severity**: Select `High`
7. **Channels**: Check `In-App` and optionally `Email`

**Smart Features (Optional):**
8. **Auto-adjust threshold**: Enable to let the system learn normal patterns
9. **Day-of-week aware**: Enable if your metrics vary by day
10. **Cooldown**: Set to `60` minutes (won't re-alert within this period)

### Save the Rule

1. Click **Create Rule** or **Save**

**What you should see:**

- The new rule appears in the rules list
- Status shows as "Enabled"
- The rule is now actively monitoring

## Step 4: Create a Percentage Change Alert

Percentage-based alerts catch relative changes rather than absolute values.

1. Click **Create Rule** again
2. Configure:
   - **Name**: `Revenue Spike Alert`
   - **Description**: `Detect unusual revenue increases`
   - **Metric**: `Revenue`
   - **Condition**: `Change greater than` (`change_gt`)
   - **Threshold**: `50` (50% increase)
   - **Time Window**: `1440` minutes (24 hours)
   - **Severity**: `Medium`
   - **Channels**: `In-App`

3. Click **Save**

**What you should see:**

This rule will fire when revenue increases more than 50% compared to the previous day, which might indicate:
- A successful promotion
- A viral moment
- A bug giving away currency

## Step 5: Configure Delivery Channels

Alerts can be delivered through multiple channels. Let's configure them.

### In-App Notifications

Always enabled by default:
- Alerts appear in the app's notification area
- Badge counts show active alerts
- Click to view and acknowledge

### Email Notifications

To enable email alerts:

1. Go to **Settings** > **Alerts** (or find alert preferences)
2. Enter your **Email Address**
3. Set **Minimum Severity for Email** (recommended: High)
4. Save preferences

### Slack Integration

To send alerts to Slack:

1. Create a Slack webhook URL:
   - Go to your Slack workspace settings
   - Apps > Incoming Webhooks
   - Create a new webhook for your channel
   - Copy the webhook URL

2. In Game Insights:
   - Go to Alert Preferences
   - Paste the webhook URL in **Slack Webhook**
   - Save

3. Test the integration:
   - Trigger a test alert
   - Check your Slack channel

### Discord Integration

Similar to Slack:

1. Create a Discord webhook:
   - Server Settings > Integrations > Webhooks
   - Create webhook, copy URL

2. In Game Insights:
   - Add URL to **Discord Webhook** field
   - Save

### Custom Webhook

For advanced integrations:

1. Set up an endpoint that accepts POST requests
2. Add the URL to **Custom Webhook**
3. Alerts will POST JSON payloads to your endpoint

Webhook payload format:
```json
{
  "id": "alert_123",
  "type": "threshold",
  "severity": "high",
  "title": "Low DAU Warning Alert",
  "message": "DAU is 450 (threshold: 500)",
  "metric": "dau",
  "value": 450,
  "timestamp": "2024-01-15T10:30:00Z",
  "recommendations": [
    "Check for technical issues",
    "Review recent app updates"
  ]
}
```

## Step 6: Test Your Alerts

Let's verify alerts are working correctly.

### Manual Testing

1. Create a test rule with an easily triggered condition:
   - Metric: Any metric
   - Condition: Greater than
   - Threshold: `0` (will always trigger)
   - Cooldown: `1` minute

2. Wait for the next evaluation cycle

3. Check for the alert in:
   - In-app notifications
   - Configured channels

4. Delete the test rule when done

### Checking Alert History

1. Navigate to the Alerts section
2. Look for **Alert History** or **Recent Alerts**
3. You should see all triggered alerts with:
   - Timestamp
   - Severity indicator
   - Alert title and message
   - Status (Active, Acknowledged, Resolved)

## Step 7: Manage Alert History

When alerts trigger, you need to manage them.

### Acknowledging Alerts

When you've seen an alert:

1. Find the alert in the list
2. Click **Acknowledge** or the checkmark icon

**What happens:**
- Status changes to "Acknowledged"
- Timestamp records when you acknowledged
- Alert stops appearing as "new"

### Resolving Alerts

When you've addressed the issue:

1. Find the acknowledged alert
2. Click **Resolve**
3. Optionally add a note about actions taken

**What happens:**
- Status changes to "Resolved"
- Resolution timestamp recorded
- Alert moves to history

### Snoozing Alerts

To temporarily silence an alert:

1. Click **Snooze** on the alert
2. Select duration (1 hour, 4 hours, 24 hours)

**What happens:**
- Status changes to "Snoozed"
- Alert won't re-notify until snooze expires
- Useful during known maintenance or events

## Step 8: Configure Alert Preferences

Fine-tune how alerts behave globally.

### Access Preferences

1. Look for **Alert Settings** or **Preferences**
2. Or go to Settings > Alerts

### Available Settings

**Global Controls:**
- **Alerts Enabled**: Master on/off switch
- **Quiet Hours**: Set times when alerts are silenced
  - Start: `22` (10 PM)
  - End: `8` (8 AM)

**Digest Mode:**
- **Enable Digest**: Bundle low-priority alerts
- **Digest Frequency**: Hourly or Daily
- Reduces notification fatigue

**Severity Filters:**
- **Minimum Severity (In-App)**: Low/Medium/High/Critical
- **Minimum Severity (Email)**: Low/Medium/High/Critical
- Higher setting = fewer notifications

### Save Preferences

Click **Save** to apply your preferences.

## Troubleshooting

### Alerts Not Triggering

**Problem:** You expect an alert but it doesn't fire.

**Solutions:**
1. Check if the rule is **Enabled**
2. Verify the **Cooldown** hasn't blocked it
3. Confirm the **Condition** and **Threshold** are correct
4. Check if **Quiet Hours** are active
5. Review the metric value - is it actually crossing the threshold?

### Too Many Alerts

**Problem:** You're getting overwhelmed with notifications.

**Solutions:**
1. Increase **Cooldown** periods
2. Raise **Threshold** values
3. Enable **Digest Mode**
4. Increase **Minimum Severity** for channels
5. Disable low-priority rules

### Alerts Not Delivered to Email/Slack

**Problem:** In-app works but external channels don't.

**Solutions:**
1. Verify webhook URLs are correct
2. Check for typos in email address
3. Test webhooks with curl or Postman
4. Review Slack/Discord channel permissions
5. Check if the alert severity meets channel minimums

### Alert Shows Wrong Value

**Problem:** The metric value in the alert seems incorrect.

**Solutions:**
1. Alerts use the latest data at evaluation time
2. Check if data sync is up to date
3. Verify the metric calculation is correct
4. Review time windows on percentage-based rules

## Best Practices

### Rule Design

1. **Start with critical metrics** - DAU, Revenue, Retention
2. **Set appropriate thresholds** - Based on historical data
3. **Use severity wisely** - Reserve Critical for true emergencies
4. **Enable auto-adjust** - For metrics with natural variation
5. **Consider day-of-week** - Weekend traffic often differs

### Alert Hygiene

1. **Review rules monthly** - Remove outdated ones
2. **Acknowledge promptly** - Keep the queue clean
3. **Document resolutions** - Learn from past alerts
4. **Tune thresholds** - Based on false positive rate
5. **Balance coverage** - Not too few, not too many

### Channel Strategy

| Severity | Recommended Channels |
|----------|---------------------|
| Low | In-App only |
| Medium | In-App + Digest |
| High | In-App + Email |
| Critical | In-App + Email + Slack |

## Alert Rule Examples

### Retention Monitoring

```
Name: D1 Retention Warning
Metric: d1_retention
Condition: Less than
Threshold: 0.30 (30%)
Severity: High
Channels: In-App, Email
```

### Revenue Target

```
Name: Daily Revenue Target
Metric: daily_revenue
Condition: Less than
Threshold: 1000
Severity: Medium
Channels: In-App
```

### Whale Activity

```
Name: Whale Drop-off
Metric: whale_active_count
Condition: Change less than
Threshold: -10 (10% decrease)
Time Window: 1440 (daily)
Severity: Critical
```

### Growth Opportunity

```
Name: Viral Potential
Metric: share_rate
Condition: Greater than
Threshold: 0.15 (15%)
Severity: Low
Channels: In-App
```

## Next Steps

Now that you have alerts configured:

1. **Connect live data** - Real-time alerts need real-time data. See [Connect Live Data Source](./connect-live-data.md)
2. **Analyze trends** - Use alerts as starting points for deeper analysis
3. **Run experiments** - Test changes when alerts suggest issues. See [Run Your First A/B Test](./run-ab-test.md)
4. **Build dashboards** - Create views for your monitored metrics. See [Create a Custom Dashboard](./custom-dashboard.md)
