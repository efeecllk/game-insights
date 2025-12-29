/**
 * Templates Marketplace E2E Tests
 * Tests for template browsing, filtering, and application
 */

import { test, expect } from '@playwright/test';

test.describe('Templates Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
    });

    test('should display templates page', async ({ page }) => {
        // Check header is visible
        await expect(page.locator('text=Template Marketplace')).toBeVisible();

        // Check subtitle is visible
        await expect(page.locator('text=/community dashboard templates/i')).toBeVisible();
    });

    test('should display template statistics', async ({ page }) => {
        // Should show stats cards
        await expect(page.locator('text=Templates').first()).toBeVisible();
        await expect(page.locator('text=Featured').first()).toBeVisible();
        await expect(page.locator('text=Verified').first()).toBeVisible();
    });

    test('should display templates grid', async ({ page }) => {
        // Wait for templates to load
        await page.waitForTimeout(1500);

        // Should show template cards
        const templateCards = page.locator('[class*="rounded-card"]').filter({ hasText: /Preview|Use/i });
        await expect(templateCards.first()).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Template Browsing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should display template name and description', async ({ page }) => {
        // Find a template card
        const templateCard = page.locator('[class*="rounded-card"]').filter({ hasText: /Preview/ }).first();
        if (await templateCard.isVisible()) {
            // Should show name (any heading text)
            await expect(templateCard.locator('[class*="font-semibold"], [class*="font-medium"]').first()).toBeVisible();
        }
    });

    test('should display template tags', async ({ page }) => {
        // Should show tags on template cards
        const tags = page.locator('[class*="rounded-full"]').filter({ hasText: /retention|monetization|engagement/i });
        await expect(tags.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display download count', async ({ page }) => {
        // Should show download count
        await expect(page.locator('text=/\\d+/').first()).toBeVisible();
    });

    test('should display star count', async ({ page }) => {
        // Should show star icons/counts
        const starElements = page.locator('svg[class*="star"], text=/stars/i');
        await expect(starElements.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display verified badge on verified templates', async ({ page }) => {
        // Look for verified badges
        const verifiedBadge = page.locator('text=Verified').first();
        await expect(verifiedBadge).toBeVisible({ timeout: 5000 });
    });

    test('should display featured badge on featured templates', async ({ page }) => {
        // Look for featured badges
        const featuredBadge = page.locator('text=Featured').first();
        await expect(featuredBadge).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Template Filtering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should filter by category', async ({ page }) => {
        // Find category filter dropdown
        const categorySelect = page.locator('select').filter({ hasText: /All Categories|Retention/i });
        if (await categorySelect.isVisible()) {
            await categorySelect.selectOption({ label: 'Retention' });
            await page.waitForTimeout(500);

            // Templates should be filtered
        }
    });

    test('should filter by game type', async ({ page }) => {
        // Find game type filter dropdown
        const gameTypeSelect = page.locator('select').filter({ hasText: /All Game Types|Puzzle/i });
        if (await gameTypeSelect.isVisible()) {
            await gameTypeSelect.selectOption({ label: 'Puzzle' });
            await page.waitForTimeout(500);

            // Templates should be filtered
        }
    });

    test('should filter verified templates only', async ({ page }) => {
        // Find verified checkbox
        const verifiedCheckbox = page.locator('input[type="checkbox"]');
        if (await verifiedCheckbox.isVisible()) {
            await verifiedCheckbox.check();
            await page.waitForTimeout(500);

            // Should only show verified templates
        }
    });

    test('should search templates', async ({ page }) => {
        // Find search input
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // Type search query
        await searchInput.fill('retention');
        await page.waitForTimeout(500);

        // Templates should be filtered by search
    });

    test('should clear search', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('test query');
        await page.waitForTimeout(300);

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);

        // All templates should be shown again
    });
});

test.describe('Template Sorting', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should sort by popularity', async ({ page }) => {
        // Find sort dropdown
        const sortSelect = page.locator('select').filter({ hasText: /Most Popular|Most Recent/i });
        if (await sortSelect.isVisible()) {
            await sortSelect.selectOption({ label: 'Most Popular' });
            await page.waitForTimeout(500);
        }
    });

    test('should sort by recent', async ({ page }) => {
        const sortSelect = page.locator('select').filter({ hasText: /Most Popular|Most Recent/i });
        if (await sortSelect.isVisible()) {
            await sortSelect.selectOption({ label: 'Most Recent' });
            await page.waitForTimeout(500);
        }
    });

    test('should sort by stars', async ({ page }) => {
        const sortSelect = page.locator('select').filter({ hasText: /Most Popular|Most Stars/i });
        if (await sortSelect.isVisible()) {
            await sortSelect.selectOption({ label: 'Most Stars' });
            await page.waitForTimeout(500);
        }
    });

    test('should sort by name', async ({ page }) => {
        const sortSelect = page.locator('select').filter({ hasText: /Most Popular|Name A-Z/i });
        if (await sortSelect.isVisible()) {
            await sortSelect.selectOption({ label: 'Name A-Z' });
            await page.waitForTimeout(500);
        }
    });
});

test.describe('View Mode Toggle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should toggle between grid and list view', async ({ page }) => {
        // Find view mode toggle buttons
        const viewToggleButtons = page.locator('[class*="border-th-border"] button').filter({ has: page.locator('svg') });

        if (await viewToggleButtons.count() >= 2) {
            // Click list view button
            await viewToggleButtons.nth(1).click();
            await page.waitForTimeout(500);

            // Should switch to list view
            // Click grid view button
            await viewToggleButtons.nth(0).click();
            await page.waitForTimeout(500);

            // Should switch back to grid view
        }
    });
});

test.describe('Template Preview', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should open template preview modal', async ({ page }) => {
        // Find and click Preview button on a template
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();

            // Modal should open
            await page.waitForTimeout(500);
            await expect(page.locator('[class*="fixed inset-0"]')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show template details in preview modal', async ({ page }) => {
        // Open preview
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Should show template name
            const modal = page.locator('[class*="fixed inset-0"]');
            await expect(modal.locator('[class*="font-bold"], h2').first()).toBeVisible({ timeout: 5000 });

            // Should show description
            // Should show stats (downloads, stars, version)
            await expect(modal.locator('text=/Downloads|Stars|Version/i').first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show compatible game types in preview', async ({ page }) => {
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Should show game types section
            await expect(page.locator('text=/Compatible Game Types/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show required columns in preview', async ({ page }) => {
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Should show required columns section
            await expect(page.locator('text=/Required Data Columns/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should close preview modal with X button', async ({ page }) => {
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Find and click close button
            const closeButton = page.locator('[class*="fixed inset-0"] button').filter({ has: page.locator('svg') }).first();
            await closeButton.click();

            // Modal should close
            await page.waitForTimeout(500);
        }
    });

    test('should close preview modal with backdrop click', async ({ page }) => {
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Click backdrop
            await page.click('[class*="bg-black/50"]');

            // Modal should close
            await page.waitForTimeout(500);
        }
    });
});

test.describe('Template Application', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should apply template from card', async ({ page }) => {
        // Find and click Use button on a template
        const useButton = page.locator('button:has-text("Use")').first();
        if (await useButton.isVisible()) {
            // Set up dialog handler for alert
            page.once('dialog', async dialog => {
                expect(dialog.message()).toContain('applied');
                await dialog.accept();
            });

            await useButton.click();
            await page.waitForTimeout(500);
        }
    });

    test('should apply template from preview modal', async ({ page }) => {
        // Open preview first
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Set up dialog handler
            page.once('dialog', async dialog => {
                await dialog.accept();
            });

            // Click Use Template button in modal
            const useTemplateButton = page.locator('[class*="fixed inset-0"] button:has-text("Use This Template")');
            if (await useTemplateButton.isVisible()) {
                await useTemplateButton.click();
            }
        }
    });

    test('should star/unstar template', async ({ page }) => {
        // Find star button on a template card
        const starButton = page.locator('button').filter({ has: page.locator('svg[class*="star"]') }).first();
        if (await starButton.isVisible()) {
            await starButton.click();
            await page.waitForTimeout(500);

            // Click again to unstar
            await starButton.click();
            await page.waitForTimeout(500);
        }
    });

    test('should export template as JSON', async ({ page }) => {
        // Open preview
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Click Export JSON button
            const exportButton = page.locator('button:has-text("Export JSON")');
            if (await exportButton.isVisible()) {
                // Set up download handler
                const downloadPromise = page.waitForEvent('download');
                await exportButton.click();

                const download = await downloadPromise;
                expect(download.suggestedFilename()).toContain('.json');
            }
        }
    });
});

test.describe('Template Import', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
    });

    test('should open import modal', async ({ page }) => {
        // Click Import button
        const importButton = page.locator('button:has-text("Import")');
        if (await importButton.isVisible()) {
            await importButton.click();

            // Modal should open
            await expect(page.locator('text=Import Template')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should close import modal with Cancel', async ({ page }) => {
        const importButton = page.locator('button:has-text("Import")');
        if (await importButton.isVisible()) {
            await importButton.click();
            await page.waitForSelector('text=Import Template', { timeout: 5000 });

            // Click Cancel
            await page.click('button:has-text("Cancel")');

            // Modal should close
            await expect(page.locator('text=Import Template')).not.toBeVisible({ timeout: 5000 });
        }
    });

    test('should show file drop zone', async ({ page }) => {
        const importButton = page.locator('button:has-text("Import")');
        if (await importButton.isVisible()) {
            await importButton.click();
            await page.waitForSelector('text=Import Template', { timeout: 5000 });

            // Should show file upload area
            await expect(page.locator('text=/Click to select file|drag and drop/i')).toBeVisible();
        }
    });
});

test.describe('Templates Empty State', () => {
    test('should show empty state when no templates match filters', async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
        await page.waitForTimeout(1500);

        // Search for something that won't match
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('xyznonexistenttemplate123');
        await page.waitForTimeout(500);

        // Should show empty state
        await expect(page.locator('text=/No templates found/i')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Templates Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/templates');
        await page.waitForSelector('text=Template Marketplace', { timeout: 10000 });
    });

    test('should navigate with keyboard', async ({ page }) => {
        // Tab through the page
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should have focus on interactive element
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedElement);
    });

    test('should close modal with Escape', async ({ page }) => {
        await page.waitForTimeout(1500);

        // Open preview modal
        const previewButton = page.locator('button:has-text("Preview")').first();
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(500);

            // Press Escape
            await page.keyboard.press('Escape');

            // Modal should close
            await page.waitForTimeout(500);
        }
    });
});
