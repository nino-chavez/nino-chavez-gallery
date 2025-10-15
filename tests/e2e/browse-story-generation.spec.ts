/**
 * Story Generation Integration Tests for Browse Page
 *
 * Tests the critical workflow:
 * 1. User clicks "Generate Story" button
 * 2. Modal opens with all 6 narrative arc types
 * 3. User selects arc type and generates story
 * 4. API call succeeds and page reloads
 */

import { test, expect } from '@playwright/test';

test.describe('Browse Page - Story Generation Integration', () => {
  /**
   * Test 1: "Generate Story" button is visible in header
   */
  test('should display "Generate Story" button in header', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Verify Generate Story button exists and is visible
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
  });

  /**
   * Test 2: Modal opens when "Generate Story" button is clicked
   */
  test('should open modal when "Generate Story" button clicked', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Click Generate Story button
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await generateButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(500); // Allow for animation

    // Modal should be visible with title
    await expect(page.locator('h2', { hasText: 'Generate Story' })).toBeVisible();
    await expect(page.locator('text=Browse Gallery')).toBeVisible(); // Context name
  });

  /**
   * Test 3: Modal displays all 6 narrative arc types
   */
  test('should display all 6 narrative arc types in modal', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Open modal
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await generateButton.click();
    await page.waitForTimeout(500);

    // Verify all 6 story types are present
    await expect(page.locator('text=Player Highlight Reel')).toBeVisible();
    await expect(page.locator('text=Game-Winning Rally')).toBeVisible();
    await expect(page.locator('text=Season Journey')).toBeVisible();
    await expect(page.locator('text=The Comeback')).toBeVisible();
    await expect(page.locator('text=Technical Excellence')).toBeVisible();
    await expect(page.locator('text=Emotion Spectrum')).toBeVisible();
  });

  /**
   * Test 4: User can select a story type
   */
  test('should allow selecting a story type', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Open modal
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await generateButton.click();
    await page.waitForTimeout(500);

    // Click on Technical Excellence story type
    const excellenceButton = page.locator('button', { hasText: 'Technical Excellence' });
    await excellenceButton.click();

    // Button should have active styling (black background)
    await expect(excellenceButton).toHaveClass(/bg-black/);
  });

  /**
   * Test 5: Modal closes on Cancel button click
   */
  test('should close modal on Cancel button click', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Open modal
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await generateButton.click();
    await page.waitForTimeout(500);

    // Verify modal is open
    await expect(page.locator('h2', { hasText: 'Generate Story' })).toBeVisible();

    // Click Cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Modal should be closed - check that story type buttons are not visible
    await expect(page.locator('text=Player Highlight Reel')).not.toBeVisible();
  });

  /**
   * Test 6: Modal closes on X button click
   */
  test('should close modal on X button click', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Open modal
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await generateButton.click();
    await page.waitForTimeout(500);

    // Click X button (close button with aria-label)
    const closeButton = page.getByRole('button', { name: /close modal/i });
    await closeButton.click();
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(page.locator('text=Player Highlight Reel')).not.toBeVisible();
  });

  /**
   * Test 7: API call is made with browse context (mock response)
   */
  test('should make API call with browse context when generating story', async ({ page }) => {
    // Intercept API calls
    const apiCalls: any[] = [];
    await page.route('/api/stories/generate', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      apiCalls.push(postData);

      // Mock successful response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          story: {
            id: 'story-test-123',
            title: 'Test Story',
            description: 'Test Description',
          },
        }),
      });
    });

    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Open modal
    const generateButton = page.getByRole('button', { name: /generate story/i });
    await generateButton.click();
    await page.waitForTimeout(500);

    // Select Technical Excellence
    const excellenceButton = page.locator('button', { hasText: 'Technical Excellence' });
    await excellenceButton.click();

    // Click Generate Story button in modal
    const modalGenerateButton = page.locator('.p-6 button', { hasText: 'Generate Story' });
    await modalGenerateButton.click();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify API was called with correct context
    expect(apiCalls.length).toBeGreaterThan(0);
    const apiCall = apiCalls[0];
    expect(apiCall.storyType).toBe('technical-excellence');
    expect(apiCall.context.browseId).toBe('all-photos');
    expect(apiCall.context.browseName).toBe('Browse Gallery');
  });
});
