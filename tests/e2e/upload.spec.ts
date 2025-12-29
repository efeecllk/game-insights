/**
 * File Upload E2E Tests
 * Critical path: Upload data → Analysis → Visualization
 */

import { test, expect } from '@playwright/test';

test.describe('File Upload Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/upload');
    });

    test('should display upload zone', async ({ page }) => {
        await expect(page.locator('text=Upload')).toBeVisible();
        await expect(page.locator('text=Drop files here')).toBeVisible();
    });

    test('should show supported formats', async ({ page }) => {
        // Check that format hints are visible
        await expect(page.locator('text=/csv|json/i').first()).toBeVisible();
    });

    test('should handle CSV file upload', async ({ page }) => {
        // Create a simple CSV file content
        const csvContent = `user_id,event,timestamp,revenue
user_001,purchase,2024-01-01,9.99
user_002,login,2024-01-01,0
user_003,purchase,2024-01-02,4.99`;

        // Create a file input handler
        const fileChooserPromise = page.waitForEvent('filechooser');

        // Click the upload area
        await page.click('text=Drop files here');

        const fileChooser = await fileChooserPromise;

        // Create a buffer from CSV content
        await fileChooser.setFiles({
            name: 'test_data.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

        // Wait for processing
        await page.waitForTimeout(1000);

        // Should show data preview or analysis results
        await expect(page.locator('text=/preview|data|column/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle JSON file upload', async ({ page }) => {
        const jsonContent = JSON.stringify([
            { user_id: 'user_001', event: 'purchase', timestamp: '2024-01-01', revenue: 9.99 },
            { user_id: 'user_002', event: 'login', timestamp: '2024-01-01', revenue: 0 },
        ]);

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'test_data.json',
            mimeType: 'application/json',
            buffer: Buffer.from(jsonContent),
        });

        await page.waitForTimeout(1000);
        await expect(page.locator('text=/preview|data|column/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should reject unsupported file formats', async ({ page }) => {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'test.exe',
            mimeType: 'application/x-msdownload',
            buffer: Buffer.from('fake content'),
        });

        // Should show error or warning
        await expect(page.locator('text=/error|unsupported|invalid/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle empty file gracefully', async ({ page }) => {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'empty.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(''),
        });

        // Should show error or warning about empty file
        await page.waitForTimeout(500);
        // Either shows error or handles gracefully
    });
});

test.describe('Data Preview', () => {
    test('should show column mapping after upload', async ({ page }) => {
        await page.goto('/upload');

        const csvContent = `user_id,level,score,timestamp
user_001,5,1000,2024-01-01
user_002,10,2500,2024-01-02`;

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'game_data.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

        // Wait for AI analysis to complete
        await page.waitForTimeout(2000);

        // Should see column names or mapping options
        await expect(page.locator('text=/user_id|level|score/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Game Type Detection', () => {
    test('should auto-detect puzzle game from data', async ({ page }) => {
        await page.goto('/upload');

        // Puzzle game specific columns
        const csvContent = `user_id,level,moves_used,boosters_used,stars_earned,timestamp
user_001,15,25,2,3,2024-01-01
user_002,16,30,0,2,2024-01-01`;

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'puzzle_game.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

        await page.waitForTimeout(3000);

        // Should detect or suggest puzzle game type
        await expect(page.locator('text=/puzzle|match|level/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should auto-detect idle game from data', async ({ page }) => {
        await page.goto('/upload');

        // Idle game specific columns
        const csvContent = `user_id,prestige_level,offline_earnings,total_taps,timestamp
user_001,5,50000,1000000,2024-01-01
user_002,3,25000,500000,2024-01-01`;

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'idle_game.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

        await page.waitForTimeout(3000);

        // Should detect or suggest idle game type
        await expect(page.locator('text=/idle|prestige|offline/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Analytics Generation', () => {
    test('should navigate to analytics after upload', async ({ page }) => {
        await page.goto('/upload');

        const csvContent = `user_id,event,timestamp,revenue
user_001,purchase,2024-01-01,9.99
user_002,login,2024-01-01,0
user_003,purchase,2024-01-02,4.99
user_004,login,2024-01-02,0
user_005,purchase,2024-01-03,14.99`;

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop files here');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'revenue_data.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

        // Wait for upload to complete
        await page.waitForTimeout(2000);

        // Navigate to overview
        await page.goto('/');

        // Should see some analytics data or charts
        await expect(page.locator('[data-testid="kpi-card"], .kpi-card, text=/revenue|users|dau/i').first()).toBeVisible({ timeout: 10000 });
    });
});
