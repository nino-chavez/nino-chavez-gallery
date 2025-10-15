import { test, expect } from '@playwright/test';

/**
 * Phase 1: Foundation & Core UX - Visual Verification Tests
 *
 * These tests validate:
 * - Motion Token System (emotion colors, spring animations)
 * - Magnetic Filter Orbs (physics-based attraction)
 * - Quality Gradient Grid (GSAP brightness/blur animations)
 *
 * Run with: pnpm test:visual
 * Update snapshots: pnpm test:visual:update
 */

test.describe('Phase 1: Foundation & Core UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test('1.1 Magnetic Filter Orbs - Initial State', async ({ page }) => {
    // Wait for magnetic orbs to render
    await page.waitForSelector('.btn-magnetic', { timeout: 5000 });

    // Take screenshot of filter bar
    const filterBar = page.locator('.magnetic-filter-bar');
    await expect(filterBar).toHaveScreenshot('magnetic-orbs-initial.png', {
      animations: 'disabled',
    });
  });

  test('1.2 Magnetic Filter Orbs - Hover Attraction', async ({ page }) => {
    await page.waitForSelector('.btn-magnetic');

    // Get first magnetic orb position
    const orb = page.locator('.btn-magnetic').first();
    const box = await orb.boundingBox();

    if (box) {
      // Move cursor 50px to the left (within 100px magnetic radius)
      await page.mouse.move(box.x - 50, box.y + box.height / 2);

      // Wait for spring animation to settle
      await page.waitForTimeout(600);

      // Screenshot showing orb moved toward cursor
      await expect(page.locator('.magnetic-filter-bar')).toHaveScreenshot(
        'magnetic-orb-attraction.png'
      );
    }
  });

  test('1.3 Magnetic Filter Orbs - Active State', async ({ page }) => {
    await page.waitForSelector('.btn-magnetic');

    // Click "Portfolio Quality" orb
    const portfolioOrb = page.locator('.btn-magnetic', { hasText: 'Portfolio' });
    await portfolioOrb.click();

    // Wait for active state animation
    await page.waitForTimeout(300);

    // Verify visual change (black background)
    await expect(page.locator('.magnetic-filter-bar')).toHaveScreenshot(
      'magnetic-orb-active.png',
      { animations: 'disabled' }
    );

    // Verify photo count updated
    const photoCount = page.locator('.magnetic-filter-bar').locator('text=/\\d+ photos?/');
    await expect(photoCount).toBeVisible();
  });

  test('1.4 Quality Gradient Grid - GSAP Animation', async ({ page }) => {
    // Navigate to portfolio view with quality gradient
    await page.goto('/portfolio?view=quality');

    await page.waitForSelector('.quality-photo-card', { timeout: 10000 });

    // Wait for GSAP animation to complete (1.5s duration + 0.02s stagger * cards)
    await page.waitForTimeout(2500);

    // Take full page screenshot showing brightness variation
    await expect(page).toHaveScreenshot('quality-gradient-grid.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('1.5 Quality Gradient - Hover State', async ({ page }) => {
    await page.goto('/portfolio?view=quality');
    await page.waitForSelector('.quality-photo-card');
    await page.waitForTimeout(2000);

    // Hover over first photo card
    const photoCard = page.locator('.quality-photo-card').first();
    await photoCard.hover();
    await page.waitForTimeout(400);

    // Screenshot showing portfolio badge on hover
    await expect(photoCard).toHaveScreenshot('quality-gradient-hover.png');
  });

  test('1.6 Emotion Color Palette - Validation', async ({ page }) => {
    // Navigate to page with emotion indicators
    await page.goto('/album/test-album');

    await page.waitForSelector('[data-testid="photo-card"]', { timeout: 10000 });

    // Find photo cards with emotion metadata
    const emotionBadges = page.locator('[data-emotion]');

    if (await emotionBadges.count() > 0) {
      // Screenshot showing emotion color coding
      await expect(page.locator('.photo-grid').first()).toHaveScreenshot(
        'emotion-palette.png',
        { animations: 'disabled' }
      );
    }
  });

  test('1.7 Virtual Scrolling - Performance', async ({ page }) => {
    await page.goto('/browse?limit=500');

    // Wait for virtualized grid to render
    await page.waitForSelector('[data-testid="virtualized-grid"]', { timeout: 10000 });

    // Scroll rapidly
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(500);

    // Screenshot showing smooth scroll state
    await expect(page).toHaveScreenshot('virtual-scroll-state.png');

    // Verify no visual glitches (empty rows, flashing)
    const visibleCards = page.locator('[data-testid="photo-card"]:visible');
    expect(await visibleCards.count()).toBeGreaterThan(0);
  });
});

test.describe('Phase 1: Accessibility & Keyboard Navigation', () => {
  test('1.8 Magnetic Orbs - Keyboard Navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.btn-magnetic');

    // Tab to first magnetic orb
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Assuming some elements before orbs

    // Take screenshot showing focus state
    await expect(page.locator('.magnetic-filter-bar')).toHaveScreenshot(
      'magnetic-orb-focus.png',
      { animations: 'disabled' }
    );

    // Activate with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify activation
    const activeOrb = page.locator('.btn-magnetic[aria-pressed="true"]');
    await expect(activeOrb).toBeVisible();
  });

  test('1.9 Screen Reader - Aria Labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.btn-magnetic');

    // Verify aria-labels exist
    const orbWithLabel = page.locator('.btn-magnetic[aria-label*="Filter"]').first();
    await expect(orbWithLabel).toBeVisible();

    // Verify aria-pressed state
    await orbWithLabel.click();
    await expect(orbWithLabel).toHaveAttribute('aria-pressed', 'true');
  });
});
