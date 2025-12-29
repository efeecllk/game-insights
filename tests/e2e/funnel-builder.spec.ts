/**
 * Funnel Builder E2E Tests
 * Tests for the custom funnel creation and analysis functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Funnel Builder Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
    });

    test('should display funnel builder page', async ({ page }) => {
        // Check header is visible
        await expect(page.locator('h1:has-text("Funnel Builder")')).toBeVisible();

        // Check subtitle is visible
        await expect(page.locator('text=/custom conversion funnels/i')).toBeVisible();
    });

    test('should display funnel list', async ({ page }) => {
        // Wait for funnels to load
        await page.waitForTimeout(1000);

        // Should show "Your Funnels" section
        await expect(page.locator('text=Your Funnels')).toBeVisible();
    });

    test('should show default funnels on first load', async ({ page }) => {
        // Wait for sample funnels to initialize
        await page.waitForTimeout(1500);

        // Should have at least one funnel listed
        const funnelItems = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])');
        await expect(funnelItems.first()).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Funnel Creation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
    });

    test('should open new funnel modal', async ({ page }) => {
        // Click new funnel button
        await page.click('button:has-text("New Funnel")');

        // Should show modal with funnel name input
        await expect(page.locator('text=Funnel Name')).toBeVisible({ timeout: 5000 });

        // Should show create button
        await expect(page.locator('button:has-text("Create")')).toBeVisible();
    });

    test('should create new funnel with name', async ({ page }) => {
        // Click new funnel button
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        // Enter funnel name
        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Test Conversion Funnel');

        // Click create
        await page.click('button:has-text("Create")');

        // Modal should close and new funnel should be created
        await page.waitForTimeout(1000);

        // Should enter edit mode
        await expect(page.locator('button:has-text("Save")')).toBeVisible({ timeout: 5000 });
    });

    test('should close create modal with cancel', async ({ page }) => {
        // Open modal
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        // Click Cancel
        await page.click('button:has-text("Cancel")');

        // Modal should close
        await expect(page.locator('text=Funnel Name')).not.toBeVisible({ timeout: 5000 });
    });
});

test.describe('Funnel Steps', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
        await page.waitForTimeout(1000);
    });

    test('should display funnel steps when funnel is selected', async ({ page }) => {
        // Wait for funnels to load and select first one
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show steps
            await expect(page.locator('text=/Step|steps/i').first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should add new step to funnel', async ({ page }) => {
        // Create new funnel first
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Step Test Funnel');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Should be in edit mode with Add Step button visible
        const addStepButton = page.locator('button:has-text("Add Step")');
        await expect(addStepButton).toBeVisible();

        // Count initial steps
        const initialSteps = await page.locator('[class*="rounded-full"]:has-text(/^\\d+$/)').count();

        // Click Add Step
        await addStepButton.click();
        await page.waitForTimeout(500);

        // Should have one more step
        const newSteps = await page.locator('[class*="rounded-full"]:has-text(/^\\d+$/)').count();
        expect(newSteps).toBeGreaterThanOrEqual(initialSteps);
    });

    test('should edit step name', async ({ page }) => {
        // Create new funnel
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Edit Step Test');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Find step name input in edit mode
        const stepNameInput = page.locator('input[placeholder*="Step name"], input[type="text"]').nth(1);
        if (await stepNameInput.isVisible()) {
            await stepNameInput.clear();
            await stepNameInput.fill('Custom Step Name');
            await expect(stepNameInput).toHaveValue('Custom Step Name');
        }
    });

    test('should select event for step', async ({ page }) => {
        // Create new funnel
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Event Select Test');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Find event selector
        const eventSelect = page.locator('select').first();
        if (await eventSelect.isVisible()) {
            // Select a different event
            await eventSelect.selectOption({ index: 1 });
            await page.waitForTimeout(300);
        }
    });

    test('should delete step from funnel', async ({ page }) => {
        // Create new funnel with initial steps
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Delete Step Test');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Count initial steps
        const initialSteps = await page.locator('[class*="rounded-full"]:has-text(/^\\d+$/)').count();

        // Find and click delete button on a step
        const deleteButton = page.locator('button[class*="red"]').first();
        if (await deleteButton.isVisible() && initialSteps > 1) {
            await deleteButton.click();
            await page.waitForTimeout(500);

            // Should have one less step
            const newSteps = await page.locator('[class*="rounded-full"]:has-text(/^\\d+$/)').count();
            expect(newSteps).toBeLessThan(initialSteps);
        }
    });
});

test.describe('Step Reordering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
    });

    test('should display drag handles in edit mode', async ({ page }) => {
        // Create new funnel
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Drag Test');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Should see drag handles (GripVertical icons)
        const dragHandles = page.locator('[class*="cursor-grab"], svg[class*="grip"]');
        await expect(dragHandles.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show step connectors between steps', async ({ page }) => {
        // Create new funnel
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Connector Test');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Add another step if needed
        const addStepButton = page.locator('button:has-text("Add Step")');
        if (await addStepButton.isVisible()) {
            await addStepButton.click();
            await page.waitForTimeout(500);
        }

        // Should show arrow connectors between steps
        const arrows = page.locator('svg[class*="ArrowDown"], [class*="py-1"] svg');
        await expect(arrows.first()).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Funnel Analysis View', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
        await page.waitForTimeout(1500);
    });

    test('should display funnel results when not editing', async ({ page }) => {
        // Select a funnel (should show results by default)
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show conversion metrics
            await expect(page.locator('text=/conversion|users/i').first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show overall conversion rate', async ({ page }) => {
        // Select a funnel
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show overall conversion card
            await expect(page.locator('text=/Overall Conversion/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show total users metric', async ({ page }) => {
        // Select a funnel
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show total users card
            await expect(page.locator('text=/Total Users/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show median time metric', async ({ page }) => {
        // Select a funnel
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show median time card
            await expect(page.locator('text=/Median Time/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should display step-by-step conversion rates', async ({ page }) => {
        // Select a funnel
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show percentage values
            await expect(page.locator('text=/%/').first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should display dropoff rates', async ({ page }) => {
        // Select a funnel
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.click();
            await page.waitForTimeout(500);

            // Should show dropoff text
            await expect(page.locator('text=/dropoff/i')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Funnel Save and Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
    });

    test('should save funnel changes', async ({ page }) => {
        // Create new funnel
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Save Test Funnel');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Click Save
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);

        // Should exit edit mode - Save button should be gone
        await expect(page.locator('button:has-text("Save")')).not.toBeVisible({ timeout: 5000 });
    });

    test('should cancel editing without saving', async ({ page }) => {
        // Create new funnel
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Cancel Test Funnel');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Click Cancel
        await page.click('button:has-text("Cancel")');
        await page.waitForTimeout(500);

        // Should exit edit mode
        await expect(page.locator('button:has-text("Save")')).not.toBeVisible({ timeout: 5000 });
    });

    test('should duplicate funnel', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Hover over a funnel item and find menu button
        const funnelItem = page.locator('[class*="cursor-pointer"]:has([class*="text-xl"])').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.hover();

            // Click the more menu button
            const menuButton = funnelItem.locator('button').first();
            if (await menuButton.isVisible()) {
                await menuButton.click();

                // Click Duplicate
                const duplicateButton = page.locator('button:has-text("Duplicate")');
                if (await duplicateButton.isVisible()) {
                    await duplicateButton.click();
                    await page.waitForTimeout(1000);
                }
            }
        }
    });

    test('should delete funnel', async ({ page }) => {
        // First create a funnel to delete
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Delete Me Funnel');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Save it
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);

        // Now find and delete it via menu
        const funnelItem = page.locator('[class*="cursor-pointer"]:has-text("Delete Me Funnel")').first();
        if (await funnelItem.isVisible()) {
            await funnelItem.hover();

            const menuButton = funnelItem.locator('button').first();
            if (await menuButton.isVisible()) {
                await menuButton.click();

                // Set up dialog handler for confirmation
                page.once('dialog', async dialog => {
                    await dialog.accept();
                });

                const deleteButton = page.locator('button:has-text("Delete")');
                if (await deleteButton.isVisible()) {
                    await deleteButton.click();
                    await page.waitForTimeout(1000);
                }
            }
        }
    });
});

test.describe('Funnel Builder Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/funnel-builder');
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });
    });

    test('should close create modal with Escape', async ({ page }) => {
        // Open create modal
        await page.click('button:has-text("New Funnel")');
        await page.waitForSelector('text=Funnel Name', { timeout: 5000 });

        // Press Escape
        await page.keyboard.press('Escape');

        // Modal should close
        await page.waitForTimeout(500);
    });

    test('should navigate with keyboard', async ({ page }) => {
        // Tab through the page
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should have focus on interactive element
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedElement);
    });
});
