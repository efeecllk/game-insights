/**
 * Basic App E2E Tests
 * Phase 7: Testing & Quality Assurance
 */

import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
    test('should load the overview page', async ({ page }) => {
        await page.goto('/');

        // Check that the page loaded
        await expect(page).toHaveTitle(/Game Insights/i);

        // Check that the sidebar is visible
        await expect(page.locator('text=Overview').first()).toBeVisible();
    });

    test('should navigate to Games page', async ({ page }) => {
        await page.goto('/');

        // Click on Games in sidebar
        await page.click('text=Games');

        // Wait for navigation
        await expect(page).toHaveURL('/games');

        // Check page content
        await expect(page.locator('h1:has-text("Games")')).toBeVisible();
    });

    test('should navigate to Dashboards page', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Dashboards');

        await expect(page).toHaveURL('/dashboards');
        await expect(page.locator('h1:has-text("Dashboard Builder")')).toBeVisible();
    });

    test('should navigate to A/B Testing page', async ({ page }) => {
        await page.goto('/');

        await page.click('text=A/B Testing');

        await expect(page).toHaveURL('/ab-testing');
        await expect(page.locator('h1:has-text("A/B Testing")')).toBeVisible();
    });

    test('should navigate to Funnel Builder page', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Funnel Builder');

        await expect(page).toHaveURL('/funnel-builder');
        await expect(page.locator('h1:has-text("Funnel Builder")')).toBeVisible();
    });
});

test.describe('Game Selector', () => {
    test('should display game types', async ({ page }) => {
        await page.goto('/');

        // Check that game selector is visible
        await expect(page.locator('text=Puzzle').first()).toBeVisible();
    });

    test('should switch game types', async ({ page }) => {
        await page.goto('/');

        // Click on Idle game type
        await page.click('button:has-text("Idle")');

        // Check that the page updates
        await expect(page.locator('h1:has-text("Idle")')).toBeVisible();
    });
});

test.describe('Dashboard Builder', () => {
    test('should display dashboard list', async ({ page }) => {
        await page.goto('/dashboards');

        // Wait for loading
        await page.waitForSelector('text=Your Dashboards', { timeout: 10000 });

        // Check that dashboard list is visible
        await expect(page.locator('text=Your Dashboards')).toBeVisible();
    });

    test('should create new dashboard', async ({ page }) => {
        await page.goto('/dashboards');

        // Click new dashboard button
        await page.click('button:has-text("New Dashboard")');

        // Check that edit mode is activated
        await expect(page.locator('button:has-text("Save")')).toBeVisible();
    });
});

test.describe('Games Management', () => {
    test('should display game list', async ({ page }) => {
        await page.goto('/games');

        // Wait for page load
        await page.waitForSelector('h1:has-text("Games")', { timeout: 10000 });

        // Check stats are visible
        await expect(page.locator('text=Total Games')).toBeVisible();
    });

    test('should open add game modal', async ({ page }) => {
        await page.goto('/games');

        // Click add game button
        await page.click('button:has-text("Add Game")');

        // Check modal is open
        await expect(page.locator('text=Game Name')).toBeVisible();
    });
});

test.describe('A/B Testing', () => {
    test('should display experiments', async ({ page }) => {
        await page.goto('/ab-testing');

        // Wait for page load
        await page.waitForSelector('h1:has-text("A/B Testing")', { timeout: 10000 });

        // Check that experiments section is visible
        await expect(page.locator('text=Experiments').first()).toBeVisible();
    });

    test('should open create experiment modal', async ({ page }) => {
        await page.goto('/ab-testing');

        // Click create experiment button
        await page.click('button:has-text("New Experiment")');

        // Check modal is open
        await expect(page.locator('text=Create Experiment')).toBeVisible();
    });
});

test.describe('Funnel Builder', () => {
    test('should display funnel list', async ({ page }) => {
        await page.goto('/funnel-builder');

        // Wait for page load
        await page.waitForSelector('h1:has-text("Funnel Builder")', { timeout: 10000 });

        // Check that funnel list is visible
        await expect(page.locator('text=Your Funnels')).toBeVisible();
    });

    test('should open new funnel modal', async ({ page }) => {
        await page.goto('/funnel-builder');

        // Click new funnel button
        await page.click('button:has-text("New Funnel")');

        // Check modal is open
        await expect(page.locator('text=Funnel Name')).toBeVisible();
    });
});

test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/');

        // Page should still load
        await expect(page).toHaveTitle(/Game Insights/i);
    });

    test('should be responsive on tablet', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto('/');

        // Page should still load
        await expect(page).toHaveTitle(/Game Insights/i);
    });
});
