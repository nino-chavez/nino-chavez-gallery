/**
 * Mobile/Tablet Screenshot Capture
 */

import { chromium } from '@playwright/test';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'audit');

async function main() {
  const browser = await chromium.launch({ headless: true });

  // MOBILE CAPTURES
  console.log('\n📱 MOBILE VIEWPORT CAPTURES');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone 13 Pro
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();

  try {
    // Homepage mobile
    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-mobile-homepage.png'),
      fullPage: true,
    });
    console.log('✅ Mobile homepage captured');

    // Portfolio mobile
    await mobilePage.goto(`${BASE_URL}/portfolio`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-mobile-portfolio.png'),
      fullPage: true,
    });
    console.log('✅ Mobile portfolio captured');

    // Browse mobile
    await mobilePage.goto(`${BASE_URL}/browse`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-mobile-browse.png'),
      fullPage: true,
    });
    console.log('✅ Mobile browse captured');

    // Search mobile
    await mobilePage.goto(`${BASE_URL}/search`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-mobile-search.png'),
      fullPage: true,
    });
    console.log('✅ Mobile search captured');

  } finally {
    await mobileContext.close();
  }

  // TABLET CAPTURES
  console.log('\n📱 TABLET VIEWPORT CAPTURES');
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 }, // iPad
    deviceScaleFactor: 2,
  });
  const tabletPage = await tabletContext.newPage();

  try {
    // Homepage tablet
    await tabletPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await tabletPage.waitForTimeout(3000);
    await tabletPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-tablet-homepage.png'),
      fullPage: true,
    });
    console.log('✅ Tablet homepage captured');

    // Portfolio tablet
    await tabletPage.goto(`${BASE_URL}/portfolio`, { waitUntil: 'domcontentloaded' });
    await tabletPage.waitForTimeout(3000);
    await tabletPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-tablet-portfolio.png'),
      fullPage: true,
    });
    console.log('✅ Tablet portfolio captured');

    // Browse tablet
    await tabletPage.goto(`${BASE_URL}/browse`, { waitUntil: 'domcontentloaded' });
    await tabletPage.waitForTimeout(3000);
    await tabletPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'audit-tablet-browse.png'),
      fullPage: true,
    });
    console.log('✅ Tablet browse captured');

  } finally {
    await tabletContext.close();
  }

  // PHOTO DETAIL (try multiple routes)
  console.log('\n📷 PHOTO DETAIL CAPTURES');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const desktopPage = await desktopContext.newPage();

  try {
    // Try to find a photo link from portfolio
    await desktopPage.goto(`${BASE_URL}/portfolio`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(3000);

    const photoLink = await desktopPage.locator('a[href*="/photo/"]').first();
    const photoHref = await photoLink.getAttribute('href');

    if (photoHref) {
      console.log(`Found photo link: ${photoHref}`);
      await desktopPage.goto(`${BASE_URL}${photoHref}`, { waitUntil: 'domcontentloaded' });
      await desktopPage.waitForTimeout(3000);
      await desktopPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'audit-photo-detail-full.png'),
        fullPage: true,
      });
      console.log('✅ Photo detail (full page) captured');

      await desktopPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'audit-photo-detail-hero.png'),
        fullPage: false,
      });
      console.log('✅ Photo detail (hero) captured');
    } else {
      console.warn('⚠️ No photo links found');
    }

    // Try album view
    const albumLink = await desktopPage.locator('a[href*="/album/"]').first();
    const albumHref = await albumLink.getAttribute('href');

    if (albumHref) {
      console.log(`Found album link: ${albumHref}`);
      await desktopPage.goto(`${BASE_URL}${albumHref}`, { waitUntil: 'domcontentloaded' });
      await desktopPage.waitForTimeout(3000);
      await desktopPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'audit-album-view.png'),
        fullPage: true,
      });
      console.log('✅ Album view captured');
    }

  } catch (error) {
    console.error('Error capturing photo/album:', error);
  } finally {
    await desktopContext.close();
  }

  await browser.close();
  console.log('\n✨ Mobile/Tablet screenshot capture complete!');
}

main().catch(console.error);
