---
sidebar_position: 6
title: Run an A/B Test
description: Create, monitor, and analyze experiments without writing code
---

# Run an A/B Test

Test changes in your game and measure their impact. Game Insights handles the statistics—you make the decisions.

**Time:** 10 minutes to set up, then wait for results

## What You'll Achieve

- Create a controlled experiment
- Monitor results in real-time
- Get a clear winner recommendation
- Make data-driven decisions

## Before You Start

- Your game should be tracking events (sessions, purchases, level completions, etc.)
- Know what you want to test (e.g., new tutorial vs. old tutorial)
- Have a goal metric in mind (e.g., improve Day 1 retention)

---

## Step 1: Create New Experiment

1. Click **A/B Testing** in the left sidebar
2. Click **+ New Experiment**

**What you'll see:** The experiment creation wizard opens

---

## Step 2: Name Your Experiment

1. Enter a clear name (e.g., "Simplified Tutorial Test")
2. Add a description of what you're testing
3. Click **Next**

> **Tip:** Use descriptive names like "Faster Level 1 - March 2024" so you can find it later.

---

## Step 3: Choose Your Metric

1. Select your **Primary Metric** from the dropdown:
   - **D1 Retention** - Do users come back tomorrow?
   - **D7 Retention** - Do users come back next week?
   - **Conversion Rate** - Do users make a purchase?
   - **Session Length** - How long do users play?
   - **Level Completion** - Do users finish more levels?

2. Optionally add **Secondary Metrics** to track additional effects

3. Click **Next**

**What you'll see:** A preview of how results will be displayed

---

## Step 4: Define Your Variants

### Control Group
1. Name it (default: "Control")
2. Describe current behavior: "Original 10-step tutorial"

### Treatment Group
1. Click **+ Add Variant**
2. Name it (e.g., "Simplified")
3. Describe the change: "New 5-step tutorial"

### Traffic Split
1. Use the slider to set traffic allocation
2. Default: 50% Control / 50% Treatment
3. Adjust if needed (e.g., 80/20 for risky changes)

4. Click **Next**

---

## Step 5: Set Duration

1. Choose experiment length:
   - **1 week** - Quick tests, large user base
   - **2 weeks** - Standard recommendation
   - **4 weeks** - Small user base or small expected effect

2. The system shows **estimated sample size** needed

3. Click **Create Experiment**

**What you'll see:**
- Required users per variant (auto-calculated)
- Expected end date
- Statistical power indicator

> **Tip:** The system automatically calculates how many users you need for reliable results. Trust these numbers!

---

## Step 6: Start the Experiment

1. Review your experiment summary
2. Click **Start Experiment**
3. Confirm when prompted

**What you'll see:** Status changes to "Running" with a green indicator

---

## Step 7: Monitor Progress

While the experiment runs, check the dashboard to see:

### Progress Bar
- Shows percentage of required sample size reached
- Example: "2,600 / 5,000 users (52%)"

### Preliminary Results
- Current metrics for each variant
- Trend indicators (↑ or ↓)
- **Note:** These are preliminary—wait for completion!

### Confidence Indicator
- Shows current statistical confidence
- Needs to reach 95%+ for reliable results

> **Important:** Don't stop early just because one variant looks better! Early results often change. Let the experiment run its full duration.

---

## Step 8: Review Final Results

When the experiment completes, you'll see:

### Winner Banner
- Clear indication: "Treatment wins" or "No significant difference"
- Confidence level (e.g., 95% confident)

### Results Summary
| Metric | Control | Treatment | Difference |
|--------|---------|-----------|------------|
| D1 Retention | 40.2% | 43.8% | +9.0% ↑ |

### Recommendation
The system provides a plain-language recommendation:
> "The simplified tutorial increased Day 1 retention by 9%. We recommend rolling out this change to all users."

---

## Step 9: Make Your Decision

1. Click **Complete Experiment**
2. Choose an outcome:
   - **Roll out Treatment** - Apply the winning change to everyone
   - **Keep Control** - Stay with the original
   - **Run Follow-up** - Test further variations

3. Add notes about your decision (for future reference)
4. Click **Confirm**

---

## You're Done!

Your experiment is complete and documented. The decision is recorded for future reference.

---

## Understanding Results

### What "Significant" Means

- **Significant result:** The difference is real, not random chance
- **95% confidence:** Only 5% chance this is a false positive
- **Not significant:** Can't tell if there's a real difference

### Sample Sizes

The system needs enough users to detect real differences:
- **Large effect** (20%+ change): ~500 users per variant
- **Medium effect** (10% change): ~2,000 users per variant
- **Small effect** (5% change): ~8,000 users per variant

### Common Outcomes

| Result | What It Means | What To Do |
|--------|---------------|------------|
| Treatment wins significantly | Change works! | Roll it out |
| No significant difference | Change doesn't matter | Keep original (simpler) |
| Control wins | Change hurt metrics | Don't ship it |
| Inconclusive | Need more data | Extend or restart |

---

## Troubleshooting

### Experiment running too slow

- Check if users are being assigned to both variants
- Verify your game is sending events correctly
- Consider increasing traffic to the experiment

### Results keep fluctuating

- This is normal early on—let it run longer
- Daily and weekly patterns cause variation
- Wait for full duration before deciding

### Unexpected results

- Check if both variants are implemented correctly
- Look for bugs affecting one variant
- Consider external factors (marketing campaigns, holidays)

---

## Best Practices

**Do:**
- Define your goal before starting
- Let experiments run their full duration
- Document why you made each decision
- Run one major test at a time per user group

**Don't:**
- Stop early when you see a "winner"
- Change the experiment while it's running
- Test too many things at once
- Ignore secondary metrics

---

## Next Steps

- [Set Up Alerts](/docs/cookbook/setup-alerts) to get notified when experiments complete
- [Analyze Monetization](/docs/cookbook/analyze-monetization) to test pricing changes
- Read about [A/B Testing Best Practices](/docs/features/ab-testing)
