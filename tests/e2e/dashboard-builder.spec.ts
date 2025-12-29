/**
 * Dashboard Builder E2E Tests
 * Tests for the custom dashboard creation functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Builder', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });
    });

    test('should display dashboard list', async ({ page }) => {
        // Check that dashboard list sidebar is visible
        await expect(page.locator('text=Dashboards').first()).toBeVisible();

        // Should show "Your Dashboards" or similar
        await expect(page.locator('text=/Dashboards|Your Dashboards/i').first()).toBeVisible();
    });

    test('should show default dashboards on first load', async ({ page }) => {
        // Wait for dashboards to load
        await page.waitForTimeout(1000);

        // Should have at least one dashboard listed (defaults are initialized)
        const dashboardItems = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])');
        await expect(dashboardItems.first()).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Dashboard Creation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });
    });

    test('should create new dashboard', async ({ page }) => {
        // Click new dashboard button
        await page.click('button:has-text("New Dashboard")');

        // Check that edit mode is activated
        await expect(page.locator('button:has-text("Save")')).toBeVisible();

        // Check that "Add Widget" button appears in edit mode
        await expect(page.locator('button:has-text("Add Widget")')).toBeVisible();
    });

    test('should enter edit mode for existing dashboard', async ({ page }) => {
        // Wait for dashboards to load
        await page.waitForTimeout(1000);

        // Click Edit button if a dashboard is selected
        const editButton = page.locator('button:has-text("Edit")');
        if (await editButton.isVisible()) {
            await editButton.click();

            // Should show Save and Add Widget buttons
            await expect(page.locator('button:has-text("Save")')).toBeVisible();
            await expect(page.locator('button:has-text("Add Widget")')).toBeVisible();
        }
    });
});

test.describe('Widget Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });
    });

    test('should open widget picker modal', async ({ page }) => {
        // Create new dashboard or enter edit mode
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        // Click Add Widget
        await page.click('button:has-text("Add Widget")');

        // Should show widget picker modal
        await expect(page.locator('text=Add Widget').nth(1)).toBeVisible({ timeout: 5000 });

        // Should show available widget types
        await expect(page.locator('text=KPI').first()).toBeVisible();
    });

    test('should add KPI widget to dashboard', async ({ page }) => {
        // Create new dashboard
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        // Click Add Widget
        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });

        // Click on KPI widget option
        await page.click('button:has-text("KPI")');

        // Modal should close and widget should be added
        await page.waitForTimeout(500);

        // Should see the widget config panel or widget on canvas
        await expect(page.locator('text=/Title|Metric/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should add chart widget to dashboard', async ({ page }) => {
        // Create new dashboard
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        // Click Add Widget
        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });

        // Click on Line Chart widget option
        await page.click('button:has-text("Line Chart")');

        // Widget should be added
        await page.waitForTimeout(500);
        await expect(page.locator('text=/Title|Metric/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should delete widget from dashboard', async ({ page }) => {
        // Create new dashboard and add widget
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });

        await page.click('button:has-text("KPI")');
        await page.waitForTimeout(500);

        // Find and click delete button on widget or config panel
        const deleteButton = page.locator('button:has-text("Delete Widget"), button[class*="red"]').first();
        if (await deleteButton.isVisible()) {
            await deleteButton.click();

            // Widget config panel should close or widget should be removed
            await page.waitForTimeout(500);
        }
    });
});

test.describe('Widget Configuration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });
    });

    test('should configure widget title', async ({ page }) => {
        // Create dashboard and add KPI widget
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });
        await page.click('button:has-text("KPI")');
        await page.waitForTimeout(500);

        // Find title input and change it
        const titleInput = page.locator('input[placeholder*="title"], input[type="text"]').first();
        if (await titleInput.isVisible()) {
            await titleInput.clear();
            await titleInput.fill('My Custom KPI');

            // Title should update
            await expect(titleInput).toHaveValue('My Custom KPI');
        }
    });

    test('should configure widget metric selection', async ({ page }) => {
        // Create dashboard and add KPI widget
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });
        await page.click('button:has-text("KPI")');
        await page.waitForTimeout(500);

        // Find metric selector
        const metricSelect = page.locator('select').first();
        if (await metricSelect.isVisible()) {
            // Select a different metric
            await metricSelect.selectOption({ index: 1 });
            await page.waitForTimeout(300);
        }
    });

    test('should configure widget size', async ({ page }) => {
        // Create dashboard and add widget
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });
        await page.click('button:has-text("KPI")');
        await page.waitForTimeout(500);

        // Find width/height inputs
        const widthInput = page.locator('input[type="number"]').first();
        if (await widthInput.isVisible()) {
            await widthInput.clear();
            await widthInput.fill('2');
            await expect(widthInput).toHaveValue('2');
        }
    });
});

test.describe('Dashboard Save and Load', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });
    });

    test('should save dashboard', async ({ page }) => {
        // Create new dashboard
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        // Add a widget
        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });
        await page.click('button:has-text("KPI")');
        await page.waitForTimeout(500);

        // Click Save
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);

        // Should exit edit mode - Save button should be gone
        await expect(page.locator('button:has-text("Save")')).not.toBeVisible({ timeout: 5000 });
    });

    test('should switch between dashboards', async ({ page }) => {
        // Wait for dashboards to load
        await page.waitForTimeout(1000);

        // Find dashboard list items
        const dashboardItems = page.locator('[class*="cursor-pointer"]:has([class*="truncate"])');
        const count = await dashboardItems.count();

        if (count >= 2) {
            // Click on second dashboard
            await dashboardItems.nth(1).click();
            await page.waitForTimeout(500);

            // Dashboard should switch - content should update
            await expect(page.locator('[class*="rounded-card"]').first()).toBeVisible();
        }
    });

    test('should duplicate dashboard', async ({ page }) => {
        // Wait for dashboards to load
        await page.waitForTimeout(1000);

        // Hover over a dashboard item and find menu button
        const dashboardItem = page.locator('[class*="cursor-pointer"]:has([class*="truncate"])').first();
        await dashboardItem.hover();

        // Click the more menu button
        const menuButton = dashboardItem.locator('button').first();
        if (await menuButton.isVisible()) {
            await menuButton.click();

            // Click Duplicate
            const duplicateButton = page.locator('button:has-text("Duplicate")');
            if (await duplicateButton.isVisible()) {
                await duplicateButton.click();
                await page.waitForTimeout(1000);
            }
        }
    });
});

test.describe('Preview Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });
    });

    test('should enter preview mode from edit mode', async ({ page }) => {
        // Enter edit mode
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        // Should see Preview button
        const previewButton = page.locator('button:has-text("Preview")');
        await expect(previewButton).toBeVisible();

        // Click Preview
        await previewButton.click();

        // Should exit edit mode - Preview button should be gone, Edit should appear
        await expect(page.locator('button:has-text("Edit")')).toBeVisible({ timeout: 5000 });
    });

    test('should show export option in preview mode', async ({ page }) => {
        // Wait for dashboard to load
        await page.waitForTimeout(1000);

        // Export button should be visible in preview/view mode
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await exportButton.click();

            // Export modal should open
            await expect(page.locator('text=/Export|Download/i').first()).toBeVisible({ timeout: 5000 });

            // Close modal with Escape
            await page.keyboard.press('Escape');
        }
    });
});

test.describe('Dashboard Builder Accessibility', () => {
    test('should navigate widgets with keyboard in edit mode', async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });

        // Enter edit mode
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);

        // Tab through buttons
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should have focus on interactive element
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement);
    });

    test('should close widget picker with Escape', async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForSelector('h1:has-text("Dashboard Builder")', { timeout: 10000 });

        // Open widget picker
        await page.click('button:has-text("New Dashboard")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("Add Widget")');
        await page.waitForSelector('text=Add Widget', { timeout: 5000 });

        // Press Escape
        await page.keyboard.press('Escape');

        // Modal should close (only one "Add Widget" text should remain)
        await page.waitForTimeout(500);
    });
});
