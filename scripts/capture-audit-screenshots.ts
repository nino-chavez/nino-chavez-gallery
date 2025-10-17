/**
 * UI/UX Audit Screenshot Capture Script
 *
 * Captures comprehensive screenshots of all key user flows
 * for visual design audit and innovation opportunities analysis.
 */

import { chromium, Browser, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'audit');
const VIEWPORT = { width: 1920, height: 1080 };

interface ScreenshotCapture {
  name: string;
  path: string;
  url: string;
  description: string;
  observations: string[];
}

const captures: ScreenshotCapture[] = [];

async function captureScreenshot(
  page: Page,
  name: string,
  url: string,
  description: string,
  options: { fullPage?: boolean; waitFor?: number } = {}
): Promise<void> {
  console.log(`📸 Capturing: ${name}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for additional time if specified
    if (options.waitFor) {
      await page.waitForTimeout(options.waitFor);
    } else {
      await page.waitForTimeout(2000); // Default wait
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage || false,
      timeout: 30000,
    });

    const observations = await analyzeVisualConsistency(page);

    captures.push({
      name,
      path: screenshotPath,
      url,
      description,
      observations,
    });

    console.log(`✅ Saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`❌ Failed to capture ${name}:`, error instanceof Error ? error.message : error);
  }
}

async function captureWithInteraction(
  page: Page,
  name: string,
  url: string,
  description: string,
  interaction: (page: Page) => Promise<void>,
  options: { fullPage?: boolean; waitFor?: number } = {}
): Promise<void> {
  console.log(`📸 Capturing with interaction: ${name}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Let page settle

    await interaction(page);

    if (options.waitFor) {
      await page.waitForTimeout(options.waitFor);
    } else {
      await page.waitForTimeout(1000);
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage || false,
      timeout: 30000,
    });

    const observations = await analyzeVisualConsistency(page);

    captures.push({
      name,
      path: screenshotPath,
      url,
      description,
      observations,
    });

    console.log(`✅ Saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`❌ Failed to capture ${name}:`, error instanceof Error ? error.message : error);
  }
}

async function analyzeVisualConsistency(page: Page): Promise<string[]> {
  const observations: string[] = [];

  try {
    // Check for basic accessibility
    const hasMainLandmark = await page.locator('main').count() > 0;
    if (!hasMainLandmark) {
      observations.push('⚠️ No <main> landmark found');
    }

    // Check for heading structure
    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      observations.push('⚠️ No H1 heading found');
    } else if (h1Count > 1) {
      observations.push(`⚠️ Multiple H1 headings found (${h1Count})`);
    }

    // Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      observations.push(`⚠️ ${imagesWithoutAlt} images without alt text`);
    }
  } catch (error) {
    // Silent fail on analysis errors
  }

  return observations;
}

async function main() {
  console.log('🎬 Starting UI/UX Audit Screenshot Capture\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}`);
  console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}\n`);

  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-gpu', '--disable-software-rasterizer'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1, // Standard display
  });
  const page = await context.newPage();

  try {
    // 1. HOMEPAGE / ENTRY EXPERIENCE
    console.log('\n📍 HOMEPAGE / ENTRY EXPERIENCE');
    await captureScreenshot(
      page,
      'audit-homepage-initial',
      BASE_URL,
      'Homepage initial load state',
      { fullPage: true, waitFor: 3000 }
    );

    // 2. PORTFOLIO GRID VIEW
    console.log('\n📍 PORTFOLIO GRID VIEW');
    await captureScreenshot(
      page,
      'audit-portfolio-default',
      `${BASE_URL}/portfolio`,
      'Portfolio grid default view',
      { fullPage: true, waitFor: 3000 }
    );

    // Portfolio with filters (if filter button exists)
    await captureWithInteraction(
      page,
      'audit-portfolio-filters-expanded',
      `${BASE_URL}/portfolio`,
      'Portfolio grid with filters panel expanded',
      async (page) => {
        const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters"), [aria-label*="filter" i]').first();
        const filterButtonExists = await filterButton.count() > 0;
        if (filterButtonExists) {
          await filterButton.click();
          await page.waitForTimeout(500);
        }
      },
      { fullPage: true, waitFor: 1000 }
    );

    // Portfolio hover state
    await captureWithInteraction(
      page,
      'audit-portfolio-hover-state',
      `${BASE_URL}/portfolio`,
      'Portfolio grid item hover state',
      async (page) => {
        const firstImage = page.locator('img').first();
        const imageExists = await firstImage.count() > 0;
        if (imageExists) {
          await firstImage.hover();
          await page.waitForTimeout(500);
        }
      },
      { fullPage: false, waitFor: 500 }
    );

    // 3. BROWSE PAGE
    console.log('\n📍 BROWSE PAGE');
    await captureScreenshot(
      page,
      'audit-browse-grid',
      `${BASE_URL}/browse`,
      'Browse page grid layout',
      { fullPage: true, waitFor: 3000 }
    );

    // Browse with filter interactions
    await captureWithInteraction(
      page,
      'audit-browse-filters-active',
      `${BASE_URL}/browse`,
      'Browse page with filter interactions',
      async (page) => {
        // Try to click any filter button/chip
        const filterChip = page.locator('[role="button"]:has-text("attack"), [role="button"]:has-text("block"), button:has-text("High")').first();
        const chipExists = await filterChip.count() > 0;
        if (chipExists) {
          await filterChip.click();
          await page.waitForTimeout(500);
        }
      },
      { fullPage: true, waitFor: 1000 }
    );

    // 4. PHOTO DETAIL VIEW
    console.log('\n📍 PHOTO DETAIL VIEW');

    // First, get a photo ID from the portfolio/browse page
    await page.goto(`${BASE_URL}/portfolio`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const photoLinks = page.locator('a[href^="/photo/"]');
    const photoLinkCount = await photoLinks.count();

    if (photoLinkCount > 0) {
      const firstPhotoLink = await photoLinks.first().getAttribute('href');
      if (firstPhotoLink) {
        await captureScreenshot(
          page,
          'audit-photo-detail-full',
          `${BASE_URL}${firstPhotoLink}`,
          'Photo detail view with metadata',
          { fullPage: true, waitFor: 3000 }
        );

        // Capture viewport-only version for hero section
        await captureScreenshot(
          page,
          'audit-photo-detail-hero',
          `${BASE_URL}${firstPhotoLink}`,
          'Photo detail hero section',
          { fullPage: false, waitFor: 2000 }
        );
      }
    } else {
      console.warn('⚠️ No photo links found, skipping photo detail screenshots');
    }

    // 5. STORY VIEWER
    console.log('\n📍 STORY VIEWER');

    // Try to find a story link
    await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const storyLinks = page.locator('a[href^="/stories/"]');
    const storyLinkCount = await storyLinks.count();

    if (storyLinkCount > 0) {
      const firstStoryLink = await storyLinks.first().getAttribute('href');
      if (firstStoryLink) {
        await captureScreenshot(
          page,
          'audit-story-viewer-interface',
          `${BASE_URL}${firstStoryLink}`,
          'Story viewer interface with timeline',
          { fullPage: true, waitFor: 3000 }
        );

        // Capture viewport version for story header
        await captureScreenshot(
          page,
          'audit-story-viewer-hero',
          `${BASE_URL}${firstStoryLink}`,
          'Story viewer hero section',
          { fullPage: false, waitFor: 2000 }
        );
      }
    } else {
      console.warn('⚠️ No story links found, trying direct story URL');
      // Try a common story ID
      await captureScreenshot(
        page,
        'audit-story-viewer-interface',
        `${BASE_URL}/stories/1`,
        'Story viewer interface (fallback ID)',
        { fullPage: true, waitFor: 3000 }
      );
    }

    // 6. SEARCH EXPERIENCE
    console.log('\n📍 SEARCH EXPERIENCE');
    await captureScreenshot(
      page,
      'audit-search-interface',
      `${BASE_URL}/search`,
      'Search interface default state',
      { fullPage: true, waitFor: 3000 }
    );

    // Search with query
    await captureWithInteraction(
      page,
      'audit-search-results',
      `${BASE_URL}/search`,
      'Search results view',
      async (page) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        const inputExists = await searchInput.count() > 0;
        if (inputExists) {
          await searchInput.fill('attack');
          await page.waitForTimeout(1500); // Wait for results
        }
      },
      { fullPage: true, waitFor: 1500 }
    );

    // 7. ALBUM VIEW (if exists)
    console.log('\n📍 ALBUM VIEW');
    const albumLinks = page.locator('a[href^="/album/"]');
    const albumLinkCount = await albumLinks.count();

    if (albumLinkCount > 0) {
      const firstAlbumLink = await albumLinks.first().getAttribute('href');
      if (firstAlbumLink) {
        await captureScreenshot(
          page,
          'audit-album-view',
          `${BASE_URL}${firstAlbumLink}`,
          'Album view with photos',
          { fullPage: true, waitFor: 3000 }
        );
      }
    }

    // 8. MOBILE VIEWPORT CAPTURES
    console.log('\n📱 MOBILE VIEWPORT CAPTURES');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13 Pro

    await captureScreenshot(
      page,
      'audit-mobile-homepage',
      BASE_URL,
      'Homepage mobile view',
      { fullPage: true, waitFor: 3000 }
    );

    await captureScreenshot(
      page,
      'audit-mobile-portfolio',
      `${BASE_URL}/portfolio`,
      'Portfolio mobile view',
      { fullPage: true, waitFor: 3000 }
    );

    await captureScreenshot(
      page,
      'audit-mobile-browse',
      `${BASE_URL}/browse`,
      'Browse page mobile view',
      { fullPage: true, waitFor: 3000 }
    );

    // 9. TABLET VIEWPORT CAPTURES
    console.log('\n📱 TABLET VIEWPORT CAPTURES');
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await captureScreenshot(
      page,
      'audit-tablet-homepage',
      BASE_URL,
      'Homepage tablet view',
      { fullPage: true, waitFor: 3000 }
    );

    await captureScreenshot(
      page,
      'audit-tablet-portfolio',
      `${BASE_URL}/portfolio`,
      'Portfolio tablet view',
      { fullPage: true, waitFor: 3000 }
    );

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n\n📊 CAPTURE REPORT\n');
  console.log('═'.repeat(80));
  console.log(`Total Screenshots Captured: ${captures.length}`);
  console.log('═'.repeat(80) + '\n');

  captures.forEach((capture, index) => {
    console.log(`${index + 1}. ${capture.name}`);
    console.log(`   URL: ${capture.url}`);
    console.log(`   Description: ${capture.description}`);
    console.log(`   Path: ${capture.path}`);
    if (capture.observations.length > 0) {
      console.log(`   Observations:`);
      capture.observations.forEach(obs => console.log(`     ${obs}`));
    }
    console.log('');
  });

  // Save report as JSON
  const reportPath = path.join(SCREENSHOT_DIR, 'capture-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(captures, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);

  // Generate markdown report
  const markdownReport = generateMarkdownReport(captures);
  const markdownPath = path.join(SCREENSHOT_DIR, 'AUDIT_REPORT.md');
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`📝 Markdown report saved to: ${markdownPath}\n`);

  console.log('✨ Screenshot capture complete!');
}

function generateMarkdownReport(captures: ScreenshotCapture[]): string {
  let markdown = '# UI/UX Audit Screenshot Report\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Total Screenshots:** ${captures.length}\n`;
  markdown += `**Viewport Sizes:**\n`;
  markdown += `- Desktop: 1920x1080\n`;
  markdown += `- Mobile: 375x812 (iPhone 13 Pro)\n`;
  markdown += `- Tablet: 768x1024 (iPad)\n\n`;

  markdown += '## Screenshots\n\n';

  captures.forEach((capture, index) => {
    markdown += `### ${index + 1}. ${capture.name}\n\n`;
    markdown += `- **URL:** ${capture.url}\n`;
    markdown += `- **Description:** ${capture.description}\n`;
    markdown += `- **File:** \`${path.basename(capture.path)}\`\n`;

    if (capture.observations.length > 0) {
      markdown += '\n**Observations:**\n';
      capture.observations.forEach(obs => {
        markdown += `- ${obs}\n`;
      });
    }

    markdown += `\n![${capture.name}](${path.basename(capture.path)})\n\n`;
    markdown += '---\n\n';
  });

  markdown += '## Initial Visual Audit Checklist\n\n';
  markdown += '### Visual Consistency\n\n';
  markdown += '- [ ] Typography hierarchy consistent across pages\n';
  markdown += '- [ ] Color palette consistent\n';
  markdown += '- [ ] Spacing/padding consistent\n';
  markdown += '- [ ] Component styling consistent\n';
  markdown += '- [ ] Animation timing consistent\n\n';

  markdown += '### Polish Level\n\n';
  markdown += '- [ ] Loading states present\n';
  markdown += '- [ ] Empty states present\n';
  markdown += '- [ ] Error states present\n';
  markdown += '- [ ] Hover/focus states polished\n';
  markdown += '- [ ] Micro-interactions present\n';
  markdown += '- [ ] Smooth transitions\n\n';

  markdown += '### UX Friction Points\n\n';
  markdown += '- [ ] Navigation clarity\n';
  markdown += '- [ ] Call-to-action visibility\n';
  markdown += '- [ ] Filter discoverability\n';
  markdown += '- [ ] Search functionality clarity\n';
  markdown += '- [ ] Mobile usability\n';
  markdown += '- [ ] Information hierarchy\n\n';

  markdown += '### Accessibility\n\n';
  markdown += '- [ ] Semantic HTML structure\n';
  markdown += '- [ ] ARIA labels present\n';
  markdown += '- [ ] Keyboard navigation\n';
  markdown += '- [ ] Focus indicators\n';
  markdown += '- [ ] Alt text on images\n';
  markdown += '- [ ] Color contrast compliance\n\n';

  markdown += '### Performance Indicators\n\n';
  markdown += '- [ ] Image optimization visible\n';
  markdown += '- [ ] Lazy loading implemented\n';
  markdown += '- [ ] Skeleton loaders present\n';
  markdown += '- [ ] Virtual scrolling for large lists\n';
  markdown += '- [ ] No visible layout shifts\n\n';

  markdown += '## Key Innovation Opportunities\n\n';
  markdown += '### Microinteractions\n';
  markdown += '- [ ] Button hover states\n';
  markdown += '- [ ] Card hover effects\n';
  markdown += '- [ ] Loading animations\n';
  markdown += '- [ ] Success/error feedback\n';
  markdown += '- [ ] Gesture-based interactions\n\n';

  markdown += '### Visual Delight\n';
  markdown += '- [ ] Subtle animations\n';
  markdown += '- [ ] Progressive disclosure\n';
  markdown += '- [ ] Contextual feedback\n';
  markdown += '- [ ] Personality in UI\n';
  markdown += '- [ ] Surprise & delight moments\n\n';

  markdown += '### Information Architecture\n';
  markdown += '- [ ] Clear navigation hierarchy\n';
  markdown += '- [ ] Content grouping\n';
  markdown += '- [ ] Visual flow\n';
  markdown += '- [ ] Wayfinding elements\n';
  markdown += '- [ ] Breadcrumbs/context\n\n';

  return markdown;
}

main().catch(console.error);
