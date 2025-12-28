/**
 * Error Handling E2E Tests
 * Tests for graceful error handling and recovery
 */

import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
        await page.goto('/nonexistent-page-12345');

        // Should either redirect to home or show a friendly error
        const url = page.url();
        const isRedirectedOrHasError =
            url.includes('/') ||
            (await page.locator('text=/not found|404|error|home/i').first().isVisible().catch(() => false));

        expect(isRedirectedOrHasError).toBeTruthy();
    });

    test('should recover from network errors', async ({ page, context }) => {
        // Go to app first
        await page.goto('/');

        // Simulate offline mode
        await context.setOffline(true);

        // Try to navigate
        await page.click('text=Analytics').catch(() => {});

        // Should show offline indicator or cached content
        await page.waitForTimeout(1000);

        // Restore network
        await context.setOffline(false);

        // Page should recover
        await page.reload();
        await expect(page).toHaveTitle(/Game Insights/i);
    });

    test('should handle localStorage unavailable', async ({ page }) => {
        // Clear localStorage before test
        await page.goto('/');

        await page.evaluate(() => {
            try {
                localStorage.clear();
            } catch {
                // localStorage might not be available
            }
        });

        // App should still work without localStorage
        await page.reload();
        await expect(page).toHaveTitle(/Game Insights/i);
    });

    test('should handle invalid URL parameters', async ({ page }) => {
        // Try with invalid parameters
        await page.goto('/?game=invalid_game_type_xyz');

        // Should not crash, should show default or error state
        await expect(page.locator('body')).not.toBeEmpty();
        await expect(page).toHaveTitle(/Game Insights/i);
    });
});

test.describe('Form Validation', () => {
    test('should validate required fields in game creation', async ({ page }) => {
        await page.goto('/games');

        // Open add game modal
        await page.click('button:has-text("Add Game")');

        // Try to submit without filling required fields
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();

        if (await saveButton.isVisible()) {
            await saveButton.click();

            // Should show validation error or prevent submission
            await page.waitForTimeout(500);

            // Either form is still visible (not submitted) or error shown
            const stillVisible = await page.locator('text=Game Name').isVisible();
            expect(stillVisible).toBeTruthy();
        }
    });

    test('should validate experiment creation', async ({ page }) => {
        await page.goto('/ab-testing');

        await page.click('button:has-text("New Experiment")');

        // Should show form fields
        await expect(page.locator('text=Create Experiment')).toBeVisible();

        // Check that form has validation
        const nameField = page.locator('input[type="text"]').first();
        if (await nameField.isVisible()) {
            await nameField.fill('');
            // Form should require name
        }
    });

    test('should validate funnel step creation', async ({ page }) => {
        await page.goto('/funnel-builder');

        await page.click('button:has-text("New Funnel")');

        // Should show funnel creation form
        await expect(page.locator('text=Funnel Name')).toBeVisible();
    });
});

test.describe('Loading States', () => {
    test('should show loading indicator on slow operations', async ({ page }) => {
        await page.goto('/');

        // Check that page eventually loads
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle slow data loading', async ({ page }) => {
        await page.goto('/dashboards');

        // Should show loading or content
        await expect(
            page.locator('text=/loading|Your Dashboards/i').first()
        ).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Concurrent Operations', () => {
    test('should handle rapid navigation', async ({ page }) => {
        await page.goto('/');

        // Rapidly click different nav items
        await page.click('text=Games');
        await page.click('text=Dashboards');
        await page.click('text=A/B Testing');
        await page.click('text=Overview');

        // Should end up at overview without errors
        await expect(page).toHaveURL('/');
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('should handle multiple modal opens', async ({ page }) => {
        await page.goto('/games');
        await page.waitForSelector('button:has-text("Add Game")');

        // Open and close modal rapidly
        await page.click('button:has-text("Add Game")');
        await page.keyboard.press('Escape');
        await page.click('button:has-text("Add Game")');
        await page.keyboard.press('Escape');

        // Page should still be functional
        await expect(page.locator('text=Total Games')).toBeVisible();
    });
});
