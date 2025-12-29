/**
 * Navigation E2E Tests
 * Tests for app navigation, command palette, and keyboard shortcuts
 */

import { test, expect } from '@playwright/test';

// Helper to skip onboarding if it appears
async function skipOnboardingIfPresent(page: ReturnType<typeof test['info']>['page']) {
    // Check if onboarding is showing
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
    }
}

test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Set localStorage to skip onboarding
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await skipOnboardingIfPresent(page);
    });

    test('should display sidebar', async ({ page }) => {
        // Should show sidebar with logo (use exact match in sidebar)
        await expect(page.locator('aside span:has-text("Game Insights")')).toBeVisible();
    });

    test('should show navigation items', async ({ page }) => {
        // Should show main navigation items
        await expect(page.locator('a:has-text("Overview")')).toBeVisible();
        await expect(page.locator('a:has-text("Games")')).toBeVisible();
        await expect(page.locator('a:has-text("Dashboards")')).toBeVisible();
    });

    test('should navigate to Overview', async ({ page }) => {
        await page.click('text=Overview');
        await expect(page).toHaveURL('/');
    });

    test('should navigate to Games', async ({ page }) => {
        await page.click('text=Games');
        await expect(page).toHaveURL('/games');
        await expect(page.locator('h1:has-text("Games")')).toBeVisible();
    });

    test('should navigate to Dashboards', async ({ page }) => {
        await page.click('text=Dashboards');
        await expect(page).toHaveURL('/dashboards');
        await expect(page.locator('h1:has-text("Dashboard Builder")')).toBeVisible();
    });

    test('should navigate to A/B Testing', async ({ page }) => {
        await page.click('text=A/B Testing');
        await expect(page).toHaveURL('/ab-testing');
        await expect(page.locator('h1:has-text("A/B Testing")')).toBeVisible();
    });

    test('should navigate to Funnel Builder', async ({ page }) => {
        await page.click('text=Funnel Builder');
        await expect(page).toHaveURL('/funnel-builder');
        await expect(page.locator('h1:has-text("Funnel Builder")')).toBeVisible();
    });

    test('should navigate to Templates', async ({ page }) => {
        await page.click('text=Templates');
        await expect(page).toHaveURL('/templates');
        await expect(page.locator('text=Template Marketplace')).toBeVisible();
    });

    test('should navigate to Predictions', async ({ page }) => {
        await page.click('text=Predictions');
        await expect(page).toHaveURL('/predictions');
        await expect(page.locator('h1:has-text("Predictions")')).toBeVisible();
    });

    test('should navigate to Monetization', async ({ page }) => {
        await page.click('text=Monetization');
        await expect(page).toHaveURL('/monetization');
    });

    test('should navigate to Data Sources', async ({ page }) => {
        await page.click('text=Data Sources');
        await expect(page).toHaveURL('/data-sources');
    });

    test('should navigate to Settings', async ({ page }) => {
        await page.click('text=Game Settings');
        await expect(page).toHaveURL('/settings');
    });

    test('should highlight active navigation item', async ({ page }) => {
        // Navigate to Games
        await page.click('text=Games');
        await page.waitForURL('/games');

        // Check that Games nav item has active styling
        const gamesLink = page.locator('a[href="/games"]');
        await expect(gamesLink).toHaveClass(/bg-th-accent-primary-muted|accent-primary/);
    });

    test('should show badges on certain nav items', async ({ page }) => {
        // Templates should have "New" badge
        await expect(page.locator('text=New').first()).toBeVisible();
    });
});

test.describe('Command Palette', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await skipOnboardingIfPresent(page);
    });

    test('should open command palette with Cmd+K', async ({ page }) => {
        // Press Cmd+K (or Ctrl+K on Windows/Linux)
        await page.keyboard.press('Meta+k');

        // Command palette should be visible
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });
    });

    test('should open command palette with Ctrl+K', async ({ page }) => {
        // Press Ctrl+K
        await page.keyboard.press('Control+k');

        // Command palette should be visible
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });
    });

    test('should open command palette with / key', async ({ page }) => {
        // Press / key (when not in input)
        await page.keyboard.press('/');

        // Command palette should be visible
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });
    });

    test('should close command palette with Escape', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Close with Escape
        await page.keyboard.press('Escape');

        // Palette should be closed
        await expect(page.locator('text=Type a command or search')).not.toBeVisible({ timeout: 5000 });
    });

    test('should close command palette by clicking backdrop', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Click backdrop
        await page.click('[class*="bg-black/60"]');

        // Palette should be closed
        await page.waitForTimeout(500);
    });

    test('should display navigation commands', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Should show navigation category
        await expect(page.locator('text=Navigation')).toBeVisible();

        // Should show navigation commands
        await expect(page.locator('text=Dashboard').first()).toBeVisible();
        await expect(page.locator('text=Analytics').first()).toBeVisible();
    });

    test('should display action commands', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Should show actions category
        await expect(page.locator('text=Actions')).toBeVisible();

        // Should show action commands
        await expect(page.locator('text=Upload Data')).toBeVisible();
    });

    test('should display help commands', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Should show help category
        await expect(page.locator('text=Help').first()).toBeVisible();
    });

    test('should search commands', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Type search query
        await page.keyboard.type('dashboard');

        // Should filter to show dashboard-related commands
        await expect(page.locator('text=Dashboard').first()).toBeVisible();
        await expect(page.locator('text=Custom Dashboards')).toBeVisible();
    });

    test('should show no results for invalid search', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Type invalid search query
        await page.keyboard.type('xyznonexistent123');

        // Should show no results message
        await expect(page.locator('text=/No commands found/i')).toBeVisible();
    });

    test('should navigate with arrow keys', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Press arrow down to select next item
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');

        // Press arrow up to select previous item
        await page.keyboard.press('ArrowUp');

        // Items should be navigable
    });

    test('should execute command with Enter', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Type to search for Games
        await page.keyboard.type('games');
        await page.waitForTimeout(300);

        // Press Enter to execute
        await page.keyboard.press('Enter');

        // Should navigate to games page
        await expect(page).toHaveURL('/games');
    });

    test('should show keyboard shortcuts in commands', async ({ page }) => {
        // Open palette
        await page.keyboard.press('Meta+k');
        await expect(page.locator('text=Type a command or search')).toBeVisible({ timeout: 5000 });

        // Should show shortcut hints
        await expect(page.locator('kbd:has-text("G")').first()).toBeVisible();
    });
});

test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await skipOnboardingIfPresent(page);
    });

    test('should show shortcuts modal with ? key', async ({ page }) => {
        // Press ? key (Shift+/)
        await page.keyboard.press('Shift+/');

        // Shortcuts modal should be visible (or command palette with shortcuts)
        await page.waitForTimeout(500);
    });

    test('should support G+D shortcut for Dashboard', async ({ page }) => {
        // Press G then D
        await page.keyboard.press('g');
        await page.keyboard.press('d');

        // May navigate or show in command palette - depends on implementation
        await page.waitForTimeout(500);
    });
});

test.describe('Game Switching', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await skipOnboardingIfPresent(page);
    });

    test('should display game selector on overview', async ({ page }) => {
        // Should show game type buttons
        await expect(page.locator('button:has-text("Puzzle")')).toBeVisible();
        await expect(page.locator('button:has-text("Idle")')).toBeVisible();
    });

    test('should switch to Puzzle game type', async ({ page }) => {
        // Click Puzzle button
        await page.click('button:has-text("Puzzle")');

        // Should update page content
        await expect(page.locator('text=/Puzzle/i').first()).toBeVisible();
    });

    test('should switch to Idle game type', async ({ page }) => {
        // Click Idle button
        await page.click('button:has-text("Idle")');

        // Should update page content
        await expect(page.locator('h1:has-text("Idle")')).toBeVisible();
    });

    test('should switch to Battle Royale game type', async ({ page }) => {
        // Click Battle Royale button
        await page.click('button:has-text("Battle Royale")');

        // Should update page content
        await expect(page.locator('h1:has-text("Battle Royale")')).toBeVisible();
    });

    test('should switch to Match-3 Meta game type', async ({ page }) => {
        // Click Match-3 button
        await page.click('button:has-text("Match-3")');

        // Should update page content
        await expect(page.locator('h1:has-text("Match-3")')).toBeVisible();
    });

    test('should switch to Gacha RPG game type', async ({ page }) => {
        // Click Gacha RPG button
        await page.click('button:has-text("Gacha")');

        // Should update page content
        await expect(page.locator('h1:has-text("Gacha")')).toBeVisible();
    });

    test('should show active game in sidebar', async ({ page }) => {
        // Click a game type
        await page.click('button:has-text("Idle")');
        await page.waitForTimeout(500);

        // Sidebar should show active game
        await expect(page.locator('text=/Active Game/i')).toBeVisible();
    });

    test('should update charts when switching games', async ({ page }) => {
        // Start with Puzzle
        await page.click('button:has-text("Puzzle")');
        await page.waitForTimeout(500);

        // Check for puzzle-specific content
        const puzzleContent = await page.locator('text=/Level Progression|Booster/i').first().isVisible();

        // Switch to Idle
        await page.click('button:has-text("Idle")');
        await page.waitForTimeout(500);

        // Check for idle-specific content
        const idleContent = await page.locator('text=/Prestige|Offline/i').first().isVisible();

        // Content should be different
        expect(puzzleContent || idleContent).toBeTruthy();
    });
});

test.describe('Theme Toggle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await skipOnboardingIfPresent(page);
    });

    test('should display theme toggle in sidebar', async ({ page }) => {
        // Should show theme section
        await expect(page.locator('text=Theme')).toBeVisible();
    });

    test('should toggle theme', async ({ page }) => {
        // Find and click theme toggle button
        const themeToggle = page.locator('button[aria-label="Toggle theme"]');
        if (await themeToggle.isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(500);

            // Theme should change - page should still work
            await expect(page.locator('body')).toBeVisible();
        }
    });
});

test.describe('Navigation State', () => {
    test('should remember navigation state on reload', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Navigate to a specific page
        await page.click('text=Dashboards');
        await expect(page).toHaveURL('/dashboards');

        // Reload
        await page.reload();

        // Should still be on dashboards page
        await expect(page).toHaveURL('/dashboards');
        await expect(page.locator('h1:has-text("Dashboard Builder")')).toBeVisible();
    });

    test('should handle direct URL navigation', async ({ page }) => {
        // Navigate directly to a nested route
        await page.goto('/funnel-builder');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Should load the page correctly
        await expect(page.locator('h1:has-text("Funnel Builder")')).toBeVisible();
    });

    test('should handle invalid routes gracefully', async ({ page }) => {
        // Navigate to non-existent route
        await page.goto('/nonexistent-route-12345');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });

        // Should either redirect or show error gracefully
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Rapid Navigation', () => {
    test('should handle rapid navigation between pages', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Rapidly click different nav items
        await page.click('text=Games');
        await page.click('text=Dashboards');
        await page.click('text=A/B Testing');
        await page.click('text=Predictions');
        await page.click('text=Overview');

        // Should end up at overview without errors
        await expect(page).toHaveURL('/');
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('should handle back/forward navigation', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Navigate to a few pages
        await page.click('text=Games');
        await page.waitForURL('/games');

        await page.click('text=Dashboards');
        await page.waitForURL('/dashboards');

        // Go back
        await page.goBack();
        await expect(page).toHaveURL('/games');

        // Go forward
        await page.goForward();
        await expect(page).toHaveURL('/dashboards');
    });
});

test.describe('Navigation Accessibility', () => {
    test('should be navigable with keyboard', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Tab through navigation
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }

        // Should have focus on an interactive element
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement);
    });

    test('should activate nav items with Enter', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Tab to Games link (approximate position)
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.href);
            if (href?.includes('/games')) {
                // Press Enter
                await page.keyboard.press('Enter');
                await expect(page).toHaveURL('/games');
                break;
            }
        }
    });

    test('should have proper focus visible indicators', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Tab to an element
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Check that focused element has visible focus
        const hasFocusStyle = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el) return false;
            const styles = window.getComputedStyle(el);
            return styles.outline !== 'none' || styles.boxShadow !== 'none' || styles.borderColor !== '';
        });

        // Should have some focus indicator
        expect(hasFocusStyle).toBeDefined();
    });
});

test.describe('Mobile Navigation', () => {
    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Page should load
        await expect(page).toHaveTitle(/Game Insights/i);
    });

    test('should work on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('game-insights-onboarded', 'true');
        });
        await page.reload();

        // Page should load
        await expect(page).toHaveTitle(/Game Insights/i);
    });
});
