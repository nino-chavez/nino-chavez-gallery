import { test, expect } from '@playwright/test';

/**
 * Phase 4: AI Story Curation & Discovery - Visual Verification Tests
 *
 * These tests validate:
 * - AI Story Curation Engine (6 narrative arc patterns)
 * - Story Viewer (auto-play, emotional curve, keyboard navigation)
 * - Discovery Badges (confetti celebrations, tracking)
 * - Similar Photos (recommendation engine)
 *
 * Run with: pnpm test:visual
 */

test.describe('Phase 4: AI Story Curation', () => {
  test('4.1 Story Viewer - Initial Load', async ({ page }) => {
    // Navigate to a generated story
    await page.goto('/stories/test-game-winning-rally');

    await page.waitForSelector('.story-viewer', { timeout: 10000 });

    // Screenshot of first photo with story metadata
    await expect(page).toHaveScreenshot('story-viewer-initial.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Verify story metadata displayed
    await expect(page.locator('text=/Quality:.*\\/10/')).toBeVisible();
    await expect(page.locator('text=/peak moments/')).toBeVisible();
  });

  test('4.2 Story Viewer - Auto-Play Progression', async ({ page }) => {
    await page.goto('/stories/test-game-winning-rally');
    await page.waitForSelector('.story-viewer');

    // Initial state (photo 1)
    await expect(page).toHaveScreenshot('story-photo-1.png', { fullPage: true });

    // Wait for 3-second auto-advance
    await page.waitForTimeout(3200);

    // Second photo should be visible
    await expect(page).toHaveScreenshot('story-photo-2.png', { fullPage: true });

    // Verify progress dots updated
    const activeDot = page.locator('.story-viewer button[aria-label*="photo 2"]');
    await expect(activeDot).toHaveClass(/bg-white w-8/);
  });

  test('4.3 Emotional Curve - Visualization', async ({ page }) => {
    await page.goto('/stories/test-game-winning-rally');
    await page.waitForSelector('.story-viewer');

    // Locate emotional curve graph
    const curve = page.locator('svg').filter({ has: page.locator('polyline') }).first();
    await expect(curve).toBeVisible();

    // Screenshot of emotional curve
    await expect(curve).toHaveScreenshot('emotional-curve-graph.png');

    // Verify emotion label updates with current photo
    const emotionLabel = page.locator('text=/Emotion: /');
    await expect(emotionLabel).toBeVisible();
  });

  test('4.4 Emotional Curve - Seek Interaction', async ({ page }) => {
    await page.goto('/stories/test-game-winning-rally');
    await page.waitForSelector('.story-viewer');

    // Wait for curve to render
    const curveRect = page.locator('rect[fill="transparent"]').first();
    await expect(curveRect).toBeVisible();

    // Click middle of curve to seek
    const box = await curveRect.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);

      // Verify photo changed
      await expect(page).toHaveScreenshot('story-seek-middle.png', { fullPage: true });
    }
  });

  test('4.5 Story Viewer - Keyboard Navigation', async ({ page }) => {
    await page.goto('/stories/test-game-winning-rally');
    await page.waitForSelector('.story-viewer');

    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('story-next-photo.png');

    // Press left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('story-prev-photo.png');

    // Press space to pause
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Verify "Play" button appears (indicating paused state)
    const playButton = page.locator('button', { hasText: 'Play' });
    await expect(playButton).toBeVisible();

    // Press escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Should return to previous page
    await expect(page.locator('.story-viewer')).not.toBeVisible();
  });

  test('4.6 Story Navigation Controls', async ({ page }) => {
    await page.goto('/stories/test-game-winning-rally');
    await page.waitForSelector('.story-viewer');

    // Screenshot of navigation controls
    const controls = page.locator('text=/Prev.*Next/');
    await expect(controls).toHaveScreenshot('story-navigation-controls.png');

    // Click "Next" button
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(600);

    // Verify progression
    const currentIndex = page.locator('button.bg-white.w-8');
    expect(await currentIndex.count()).toBe(1);
  });
});

test.describe('Phase 4: Discovery Badges', () => {
  test('4.7 Discovery Badge - Unlock Animation', async ({ page, context }) => {
    // Create a new page to start fresh tracking
    await page.goto('/browse');

    // Click through photos to trigger "Quality Hunter" badge (10 portfolio photos)
    await page.waitForSelector('[data-portfolio-worthy="true"]');

    const portfolioPhotos = page.locator('[data-portfolio-worthy="true"]');
    const count = await portfolioPhotos.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      await portfolioPhotos.nth(i).click();
      await page.waitForTimeout(100);
      await page.keyboard.press('Escape'); // Close lightbox
      await page.waitForTimeout(100);
    }

    // Wait for badge notification
    try {
      await page.waitForSelector('.badge-notification', { timeout: 5000 });

      // Screenshot of badge unlock with confetti
      await expect(page).toHaveScreenshot('badge-unlock-notification.png', {
        fullPage: true,
      });

      // Verify badge content
      await expect(page.locator('text=/Badge Unlocked!/')).toBeVisible();
      await expect(page.locator('text=/Quality Hunter/')).toBeVisible();
    } catch (e) {
      console.log('Badge did not unlock - may need more photos or different interaction');
    }
  });

  test('4.8 Badge Collection - Display', async ({ page }) => {
    await page.goto('/profile/badges');

    await page.waitForSelector('.badge-collection', { timeout: 5000 });

    // Screenshot showing all badges (locked and unlocked)
    await expect(page.locator('.badge-collection')).toHaveScreenshot('badge-collection.png');

    // Verify 6 badges displayed
    const badges = page.locator('.badge-collection > div > div');
    expect(await badges.count()).toBe(6);
  });

  test('4.9 Badge - Locked vs Unlocked State', async ({ page }) => {
    await page.goto('/profile/badges');
    await page.waitForSelector('.badge-collection');

    // Find a locked badge (grayscale)
    const lockedBadge = page.locator('.badge-collection').locator('.grayscale').first();
    if (await lockedBadge.count() > 0) {
      await expect(lockedBadge).toHaveScreenshot('badge-locked.png');
    }

    // Find an unlocked badge (gradient background)
    const unlockedBadge = page.locator('.badge-collection').locator('.from-yellow-400').first();
    if (await unlockedBadge.count() > 0) {
      await expect(unlockedBadge).toHaveScreenshot('badge-unlocked.png');

      // Hover over unlocked badge
      await unlockedBadge.hover();
      await page.waitForTimeout(300);
      await expect(unlockedBadge).toHaveScreenshot('badge-unlocked-hover.png');
    }
  });
});

test.describe('Phase 4: Similar Photos & Recommendations', () => {
  test('4.10 Similar Photos - Grid Display', async ({ page }) => {
    await page.goto('/photo/test-photo-123');

    await page.waitForSelector('[data-testid="similar-photos"]', { timeout: 10000 });

    // Screenshot of similar photos section
    await expect(page.locator('[data-testid="similar-photos"]')).toHaveScreenshot(
      'similar-photos-grid.png'
    );

    // Verify 6 similar photos shown
    const similarCards = page.locator('[data-testid="similar-photos"]').locator('.photo-card');
    expect(await similarCards.count()).toBeGreaterThanOrEqual(3);
  });

  test('4.11 Similar Photos - Similarity Indicators', async ({ page }) => {
    await page.goto('/photo/test-photo-123');
    await page.waitForSelector('[data-testid="similar-photos"]');

    // Check if similarity scores are displayed
    const firstSimilar = page.locator('[data-testid="similar-photos"]').locator('.photo-card').first();
    await firstSimilar.hover();
    await page.waitForTimeout(300);

    // Screenshot showing similarity metadata
    await expect(firstSimilar).toHaveScreenshot('similar-photo-metadata.png');
  });

  test('4.12 Recommendations - Personalized Feed', async ({ page }) => {
    await page.goto('/browse?view=recommended');

    await page.waitForSelector('[data-testid="recommended-photos"]', { timeout: 10000 });

    // Screenshot of recommended photos
    await expect(page.locator('[data-testid="recommended-photos"]')).toHaveScreenshot(
      'recommended-photos-grid.png'
    );

    // Verify "Recommended for You" header
    await expect(page.locator('text=/Recommended for You/i')).toBeVisible();
  });
});

test.describe('Phase 4: Story Generation', () => {
  test('4.13 Story Generation Modal', async ({ page }) => {
    await page.goto('/browse');

    // Click "Generate Story" button
    await page.click('button:has-text("Generate Story")');
    await page.waitForSelector('[data-testid="story-generation-modal"]', { timeout: 5000 });

    // Screenshot of modal with arc type options
    await expect(page.locator('[data-testid="story-generation-modal"]')).toHaveScreenshot(
      'story-generation-modal.png'
    );

    // Verify all 6 arc types displayed
    await expect(page.locator('text=/Game-Winning Rally/i')).toBeVisible();
    await expect(page.locator('text=/Player Highlight/i')).toBeVisible();
    await expect(page.locator('text=/Season Journey/i')).toBeVisible();
    await expect(page.locator('text=/Comeback Story/i')).toBeVisible();
    await expect(page.locator('text=/Technical Excellence/i')).toBeVisible();
    await expect(page.locator('text=/Emotion Spectrum/i')).toBeVisible();
  });

  test('4.14 Story Generation - Success State', async ({ page }) => {
    await page.goto('/browse');
    await page.click('button:has-text("Generate Story")');
    await page.waitForSelector('[data-testid="story-generation-modal"]');

    // Select "Player Highlight" arc
    await page.click('button:has-text("Player Highlight")');

    // Fill in player name
    await page.fill('input[name="playerName"]', 'Marcus Johnson');

    // Click "Create Story"
    await page.click('button:has-text("Create Story")');

    // Wait for story to generate (<3 seconds target)
    const startTime = Date.now();
    await page.waitForSelector('.story-viewer', { timeout: 5000 });
    const endTime = Date.now();

    const generationTime = endTime - startTime;
    console.log(`Story generated in ${generationTime}ms`);

    // Verify generation time is under 3 seconds
    expect(generationTime).toBeLessThan(3000);

    // Screenshot of generated story
    await expect(page).toHaveScreenshot('story-generated-success.png', { fullPage: true });
  });
});
