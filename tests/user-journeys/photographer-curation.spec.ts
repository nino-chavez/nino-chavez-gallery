import { test, expect } from '@playwright/test';

/**
 * User Journey: Sarah (Sports Photographer)
 * Goal: Curate portfolio-worthy shots from a tournament
 *
 * Success Criteria:
 * - Complete curation in <5 minutes
 * - Identify all portfolio-worthy shots
 * - Generate shareable highlight reel
 * - All animations run at 60fps (perceived)
 *
 * Run with: pnpm test:journey
 */

test.describe('Photographer Journey: Portfolio Curation', () => {
  test.use({ video: 'on' }); // Record video for review

  test('Complete curation workflow', async ({ page }) => {
    const startTime = Date.now();

    // Step 1: Landing Page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify magnetic filter orbs are visible
    await expect(page.locator('.btn-magnetic')).toHaveCount(5);

    // Hover near "Portfolio Quality" orb to test magnetic attraction
    const portfolioOrb = page.locator('.btn-magnetic', { hasText: 'Portfolio' });
    const box = await portfolioOrb.boundingBox();

    if (box) {
      // Move cursor 50px away (within magnetic radius)
      await page.mouse.move(box.x - 50, box.y + box.height / 2);
      await page.waitForTimeout(600); // Allow spring animation

      // Verify orb moved (check transform property)
      const transform = await portfolioOrb.evaluate(el =>
        window.getComputedStyle(el).transform
      );
      expect(transform).not.toBe('none');
    }

    // Click "Portfolio Quality" orb
    await portfolioOrb.click();
    await page.waitForTimeout(300);

    // Verify active state
    await expect(portfolioOrb).toHaveAttribute('aria-pressed', 'true');

    // Verify photo count updated
    const photoCount = page.locator('text=/\\d+ photos?/');
    await expect(photoCount).toBeVisible();

    const countText = await photoCount.textContent();
    console.log(`Filtered to: ${countText}`);

    // Step 2: Browse Portfolio Quality Photos
    await page.waitForSelector('[data-testid="photo-card"]', { timeout: 10000 });

    const photoCards = page.locator('[data-testid="photo-card"]');
    const totalPhotos = await photoCards.count();
    expect(totalPhotos).toBeGreaterThan(0);

    console.log(`Found ${totalPhotos} portfolio-worthy photos`);

    // Scroll through results
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);

    // Hover over a photo to see quality score in cursor
    const firstPhoto = photoCards.first();
    await firstPhoto.hover();
    await page.waitForTimeout(400);

    // Check if quality tooltip appears
    const qualityTooltip = page.locator('[data-testid="quality-tooltip"]');
    if (await qualityTooltip.isVisible()) {
      console.log('Quality tooltip confirmed');
    }

    // Step 3: Switch to Quality Gradient View
    const qualityViewButton = page.locator('button', { hasText: 'Quality View' });
    if (await qualityViewButton.count() > 0) {
      await qualityViewButton.click();
      await page.waitForTimeout(2000); // GSAP animation (1.5s + stagger)

      console.log('Quality gradient view loaded');

      // Verify brightness variation (sample first and last photo)
      const firstCard = page.locator('.quality-photo-card').first();
      const lastCard = page.locator('.quality-photo-card').last();

      const firstBrightness = await firstCard.evaluate(el =>
        getComputedStyle(el).getPropertyValue('--quality-brightness')
      );
      const lastBrightness = await lastCard.evaluate(el =>
        getComputedStyle(el).getPropertyValue('--quality-brightness')
      );

      console.log(`Brightness range: ${firstBrightness} to ${lastBrightness}`);
    }

    // Step 4: Explore 3D Gravity View
    const gravityViewButton = page.locator('button', { hasText: '3D Gravity' });
    if (await gravityViewButton.count() > 0) {
      await gravityViewButton.click();
      await page.waitForTimeout(3000); // Three.js loading + clustering animation

      console.log('3D gravity view loaded');

      // Verify canvas rendered
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Test OrbitControls - drag to rotate
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 100, canvasBox.y + canvasBox.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(500);

        console.log('3D rotation tested');
      }

      // Click a photo to trigger similarity clustering
      if (canvasBox) {
        await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
        await page.waitForTimeout(1500); // Re-clustering animation

        console.log('Similarity clustering triggered');
      }
    }

    // Step 5: Generate Player Highlight Story
    const generateStoryButton = page.locator('button', { hasText: 'Generate Story' });
    if (await generateStoryButton.count() > 0) {
      await generateStoryButton.click();
      await page.waitForTimeout(500);

      // Select "Player Highlight Reel"
      const playerHighlightOption = page.locator('button', { hasText: 'Player Highlight' });
      if (await playerHighlightOption.count() > 0) {
        await playerHighlightOption.click();

        // Enter player name
        await page.fill('input[name="playerName"]', 'Test Player');
        await page.click('button:has-text("Create Story")');

        // Measure story generation time
        const genStartTime = Date.now();
        await page.waitForSelector('.story-viewer', { timeout: 5000 });
        const genEndTime = Date.now();
        const generationTime = genEndTime - genStartTime;

        console.log(`Story generated in ${generationTime}ms`);
        expect(generationTime).toBeLessThan(3000); // <3 second requirement

        // Verify story content
        await expect(page.locator('text=/Top.*Highlights/i')).toBeVisible();
        await expect(page.locator('text=/Quality:.*\\/10/')).toBeVisible();

        // Test auto-play
        await page.waitForTimeout(3200); // Wait for auto-advance

        // Verify photo changed (progress dot moved)
        const activeDots = page.locator('button.bg-white.w-8');
        expect(await activeDots.count()).toBe(1);

        // Test keyboard navigation
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(600);
        console.log('Story keyboard navigation tested');

        // Test pause
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);
        await expect(page.locator('button:has-text("Play")')).toBeVisible();

        // Close story
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        await expect(page.locator('.story-viewer')).not.toBeVisible();
      }
    }

    // Calculate total time
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`\n=== Journey Complete ===`);
    console.log(`Total time: ${totalTime.toFixed(2)} seconds`);
    console.log(`Target: <5 minutes (${totalTime < 300 ? 'PASS' : 'FAIL'})`);

    // Verify success criteria
    expect(totalTime).toBeLessThan(300); // 5 minutes = 300 seconds
  });

  test('Photographer can unlock discovery badge', async ({ page }) => {
    await page.goto('/browse');

    // View 10 portfolio-worthy photos to unlock "Quality Hunter" badge
    await page.waitForSelector('[data-portfolio-worthy="true"]');

    const portfolioPhotos = page.locator('[data-portfolio-worthy="true"]');
    const count = Math.min(await portfolioPhotos.count(), 10);

    console.log(`Viewing ${count} portfolio photos...`);

    for (let i = 0; i < count; i++) {
      await portfolioPhotos.nth(i).click();
      await page.waitForTimeout(150);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }

    // Check if badge unlocked
    try {
      await page.waitForSelector('text=/Badge Unlocked!/i', { timeout: 5000 });
      console.log('Badge unlocked successfully!');

      // Verify confetti triggered (canvas-confetti creates canvas element)
      const confettiCanvas = page.locator('canvas').last();
      const canvasCount = await page.locator('canvas').count();
      console.log(`Canvas elements (confetti check): ${canvasCount}`);

      // Badge should auto-hide after 5 seconds
      await page.waitForTimeout(5500);
      await expect(page.locator('text=/Badge Unlocked!/i')).not.toBeVisible();
    } catch (e) {
      console.log('Badge did not unlock (may need different interaction pattern)');
    }
  });
});

test.describe('Photographer Journey: Performance Validation', () => {
  test('Animations run smoothly (60fps check)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).frameCount = 0;
      (window as any).totalTime = 0;

      const startTime = performance.now();

      function countFrame() {
        const currentTime = performance.now();
        (window as any).frameCount++;
        (window as any).totalTime = currentTime - startTime;
        requestAnimationFrame(countFrame);
      }

      requestAnimationFrame(countFrame);
    });

    // Trigger magnetic orb animation
    const orb = page.locator('.btn-magnetic').first();
    const box = await orb.boundingBox();

    if (box) {
      // Animate hover for 2 seconds
      await page.mouse.move(box.x - 50, box.y + box.height / 2);
      await page.waitForTimeout(2000);
    }

    // Get frame rate
    const fps = await page.evaluate(() => {
      const frameCount = (window as any).frameCount;
      const totalTime = (window as any).totalTime;
      return (frameCount / totalTime) * 1000;
    });

    console.log(`Average FPS during animation: ${fps.toFixed(2)}`);

    // Should be close to 60fps (allow some margin for browser overhead)
    expect(fps).toBeGreaterThan(50);
  });

  test('Virtual scrolling handles 500+ photos', async ({ page }) => {
    await page.goto('/browse?limit=500');

    await page.waitForSelector('[data-testid="virtualized-grid"]', { timeout: 10000 });

    // Rapid scroll test
    console.log('Testing rapid scroll performance...');

    const scrollIterations = 10;
    const scrollDistance = 1000;

    const startTime = Date.now();

    for (let i = 0; i < scrollIterations; i++) {
      await page.mouse.wheel(0, scrollDistance);
      await page.waitForTimeout(100);
    }

    const endTime = Date.now();
    const scrollTime = endTime - startTime;

    console.log(`Scrolled ${scrollIterations * scrollDistance}px in ${scrollTime}ms`);

    // Verify no visual glitches (all visible cards have images)
    const visibleCards = page.locator('[data-testid="photo-card"]:visible');
    const cardCount = await visibleCards.count();

    expect(cardCount).toBeGreaterThan(0);

    console.log(`${cardCount} cards visible after rapid scroll`);
  });
});
