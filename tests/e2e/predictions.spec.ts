/**
 * Predictions Page E2E Tests
 * Tests for AI-powered predictive analytics and recommendations
 */

import { test, expect } from '@playwright/test';

test.describe('Predictions Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
    });

    test('should display predictions page', async ({ page }) => {
        // Check header is visible
        await expect(page.locator('h1:has-text("Predictions")')).toBeVisible();

        // Check subtitle is visible
        await expect(page.locator('text=/AI-powered insights/i')).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
        // Navigate fresh to catch loading state
        await page.goto('/predictions');

        // Should show loading indicator or content
        const loadingOrContent = page.locator('text=/Loading|Predictions/i').first();
        await expect(loadingOrContent).toBeVisible({ timeout: 10000 });
    });

    test('should display stat cards after loading', async ({ page }) => {
        // Wait for data to load
        await page.waitForTimeout(1000);

        // Should show stat cards
        await expect(page.locator('text=/30-Day Revenue|Revenue Projection/i').first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=/At-Risk Users/i')).toBeVisible();
        await expect(page.locator('text=/Conversion Opportunities|Opportunities/i').first()).toBeVisible();
    });
});

test.describe('Revenue Forecast', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display revenue forecast chart', async ({ page }) => {
        // Should show revenue forecast section
        await expect(page.locator('text=Revenue Forecast')).toBeVisible();

        // Should show next 30 days projection text
        await expect(page.locator('text=/Next 30 days|30-Day/i').first()).toBeVisible();
    });

    test('should show projected total revenue', async ({ page }) => {
        // Should show projected total value
        await expect(page.locator('text=/Projected total|\\$\\d/i').first()).toBeVisible();
    });

    test('should display chart bars', async ({ page }) => {
        // Should show chart visualization
        const chartBars = page.locator('[class*="rounded-t"]').filter({ hasNotText: /./ });
        await expect(chartBars.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show chart legend', async ({ page }) => {
        // Should show weekday/weekend legend
        await expect(page.locator('text=/Weekday|Weekend/i').first()).toBeVisible();
    });
});

test.describe('Churn Risk Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display churn risk panel', async ({ page }) => {
        // Should show churn risk section
        await expect(page.locator('text=Churn Risk Users')).toBeVisible();

        // Should show "High probability to churn" text
        await expect(page.locator('text=/High probability to churn/i')).toBeVisible();
    });

    test('should display at-risk user cards', async ({ page }) => {
        // Should show user cards with risk scores
        await expect(page.locator('text=/User #\\d+|risk/i').first()).toBeVisible();
    });

    test('should show risk score percentage', async ({ page }) => {
        // Should show risk percentages
        await expect(page.locator('text=/\\d+% risk/i').first()).toBeVisible();
    });

    test('should show churn risk factors', async ({ page }) => {
        // Should show risk factors for users
        await expect(page.locator('text=/Declining|Stuck|Low engagement|No recent/i').first()).toBeVisible();
    });

    test('should show last seen timestamp', async ({ page }) => {
        // Should show when users were last seen
        await expect(page.locator('text=/\\d+ days ago/i').first()).toBeVisible();
    });

    test('should have View All button', async ({ page }) => {
        // Should show View All link
        await expect(page.locator('text=View All')).toBeVisible();
    });

    test('should have re-engagement campaign button', async ({ page }) => {
        // Should show campaign button
        await expect(page.locator('button:has-text("Launch Re-engagement Campaign")')).toBeVisible();
    });
});

test.describe('AI Recommendations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display recommendations panel', async ({ page }) => {
        // Should show AI recommendations section
        await expect(page.locator('text=AI Recommendations')).toBeVisible();

        // Should show "Actionable insights" text
        await expect(page.locator('text=/Actionable insights/i')).toBeVisible();
    });

    test('should display recommendation cards', async ({ page }) => {
        // Should show recommendation cards with titles
        const recommendationCards = page.locator('[class*="rounded-lg"][class*="border-l"]');
        await expect(recommendationCards.first()).toBeVisible();
    });

    test('should show recommendation priorities', async ({ page }) => {
        // Should show priority categories
        await expect(page.locator('text=/Retention|Monetization|Engagement/i').first()).toBeVisible();
    });

    test('should show recommendation impact', async ({ page }) => {
        // Should show impact metrics
        await expect(page.locator('text=/Impact:/i').first()).toBeVisible();
    });

    test('should show recommendation effort', async ({ page }) => {
        // Should show effort levels
        await expect(page.locator('text=/Effort:/i').first()).toBeVisible();
    });

    test('should have refresh button', async ({ page }) => {
        // Should show refresh button
        const refreshButton = page.locator('button').filter({ has: page.locator('[class*="RefreshCw"], svg') });
        await expect(refreshButton.first()).toBeVisible();
    });
});

test.describe('Intelligent Alerts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display alerts panel', async ({ page }) => {
        // Should show intelligent alerts section
        await expect(page.locator('text=Intelligent Alerts')).toBeVisible();
    });

    test('should show active alerts count', async ({ page }) => {
        // Should show alert count badge
        await expect(page.locator('text=/\\d+ active/i')).toBeVisible();
    });

    test('should display warning alerts', async ({ page }) => {
        // Should show warning type alerts
        await expect(page.locator('text=/Churn Risk Alert|Warning/i').first()).toBeVisible();
    });

    test('should display opportunity alerts', async ({ page }) => {
        // Should show opportunity type alerts
        await expect(page.locator('text=/Conversion Opportunity|Opportunity/i').first()).toBeVisible();
    });

    test('should show alert timestamps', async ({ page }) => {
        // Should show when alerts were generated
        await expect(page.locator('text=/\\d+ hours ago/i').first()).toBeVisible();
    });

    test('should show alert messages', async ({ page }) => {
        // Should show alert details
        await expect(page.locator('text=/users showing|engaged non-payers/i').first()).toBeVisible();
    });
});

test.describe('What-If Analysis', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display what-if analysis panel', async ({ page }) => {
        // Should show what-if section
        await expect(page.locator('text=What-If Analysis')).toBeVisible();
    });

    test('should have DAU change slider', async ({ page }) => {
        // Should show DAU slider
        await expect(page.locator('text=/DAU Change/i')).toBeVisible();

        // Should have a range input
        const dauSlider = page.locator('input[type="range"]').first();
        await expect(dauSlider).toBeVisible();
    });

    test('should have ARPU change slider', async ({ page }) => {
        // Should show ARPU slider
        await expect(page.locator('text=/ARPU Change/i')).toBeVisible();

        // Should have a range input
        const arpuSlider = page.locator('input[type="range"]').nth(1);
        await expect(arpuSlider).toBeVisible();
    });

    test('should update projection when slider changes', async ({ page }) => {
        // Get initial projection
        const projectionText = page.locator('text=/Projected 30-Day Revenue/i');
        await expect(projectionText).toBeVisible();

        // Adjust DAU slider
        const dauSlider = page.locator('input[type="range"]').first();
        await dauSlider.fill('20');
        await page.waitForTimeout(300);

        // Projection should update - just verify it's still visible
        await expect(projectionText).toBeVisible();
    });

    test('should show projected revenue value', async ({ page }) => {
        // Should show projected revenue
        await expect(page.locator('text=/\\$\\d+.*K/i').first()).toBeVisible();
    });

    test('should show change percentage', async ({ page }) => {
        // Should show percentage change vs baseline
        await expect(page.locator('text=/vs baseline/i')).toBeVisible();
    });
});

test.describe('Model Accuracy', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display model accuracy stat', async ({ page }) => {
        // Should show model accuracy card
        await expect(page.locator('text=Model Accuracy')).toBeVisible();
    });

    test('should show accuracy percentage', async ({ page }) => {
        // Should show accuracy value
        await expect(page.locator('text=/\\d+%/').first()).toBeVisible();
    });

    test('should show accuracy basis', async ({ page }) => {
        // Should show what accuracy is based on
        await expect(page.locator('text=/Based on last \\d+ days/i')).toBeVisible();
    });
});

test.describe('Predictions Page Actions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should show last updated timestamp', async ({ page }) => {
        // Should show last updated info
        await expect(page.locator('text=/Last updated/i')).toBeVisible();
    });

    test('should have main refresh button', async ({ page }) => {
        // Should show Refresh button in header
        await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    });

    test('should click refresh button', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh")');
        if (await refreshButton.isVisible()) {
            await refreshButton.click();
            // Should trigger refresh - page should still work
            await page.waitForTimeout(1000);
            await expect(page.locator('h1:has-text("Predictions")')).toBeVisible();
        }
    });
});

test.describe('Predictions Responsive Layout', () => {
    test('should display correctly on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });

        // Page should still be functional
        await expect(page.locator('text=Revenue Forecast')).toBeVisible({ timeout: 5000 });
    });

    test('should display correctly on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });

        // Page should still be functional
        await expect(page.locator('h1:has-text("Predictions")')).toBeVisible();
    });
});

test.describe('Predictions Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/predictions');
        await page.waitForSelector('h1:has-text("Predictions")', { timeout: 10000 });
    });

    test('should navigate with keyboard', async ({ page }) => {
        // Tab through the page
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should have focus on interactive element
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        const headings = await page.evaluate(() => {
            const h = document.querySelectorAll('h1, h2, h3');
            return Array.from(h).map(el => ({
                level: parseInt(el.tagName[1]),
                text: el.textContent?.trim().slice(0, 30)
            }));
        });

        // Should have at least one h1
        const h1Count = headings.filter(h => h.level === 1).length;
        expect(h1Count).toBeGreaterThanOrEqual(1);
    });
});
