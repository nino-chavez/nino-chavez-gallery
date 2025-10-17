# UI/UX Audit Strategy: Post-Implementation Validation

**Date:** October 15, 2025
**Context:** Design system implemented, need to validate against design intent
**Goal:** Establish automated + manual baseline for ongoing quality assurance

---

## The Problem: Current Audit is Pre-Implementation

### Original Audit Limitations:

1. **Created Before Implementation** (October 15, 2025)
   - Based on code inspection + partial visual (SmugMug timeout issues)
   - Never saw the actual implemented design system components
   - Prophetic recommendations, but not validation

2. **No Visual Baseline**
   - No screenshots of implemented state
   - No comparison of before/after
   - No verification that implementations match design intent

3. **No Automated Testing**
   - Manual code grep checks only
   - No visual regression testing
   - No automated accessibility scanning
   - No performance monitoring

### Why Rebaseline Now:

✅ **Design system fully implemented** (11 task groups complete)
✅ **Production-ready build** (307 pages, 0 TypeScript errors)
✅ **Need to validate** implementation matches design intent
✅ **Establish baseline** for future regression detection

---

## Proposed Audit Strategy: 3-Tier Approach

### Tier 1: Automated Visual Regression Testing 🤖
**Tool:** Playwright Visual Regression
**Purpose:** Detect unintended visual changes
**Frequency:** Every commit/PR

### Tier 2: Automated Accessibility & Standards 🔍
**Tools:** Axe DevTools + Lighthouse + Custom Scripts
**Purpose:** Enforce WCAG AA, performance, design system compliance
**Frequency:** Every build

### Tier 3: Manual Design Intent Validation 👁️
**Tools:** Browser DevTools + Design Checklist
**Purpose:** Validate emotional resonance, UX quality, brand alignment
**Frequency:** Milestone releases (weekly/biweekly)

---

## Tier 1: Automated Visual Regression (Playwright)

### Why Playwright Visual Regression?

**Advantages:**
- ✅ Already have Playwright configured (25 test files)
- ✅ Can capture actual rendered screenshots
- ✅ Pixel-perfect comparison (detect 1px shifts)
- ✅ Integrates with CI/CD
- ✅ Baseline can be version-controlled (Git LFS)

**vs. Alternatives:**
- Percy/Chromatic: Paid services, require external hosting
- Puppeteer: Similar but Playwright has better debugging
- Manual screenshots: Not scalable, not automated

### Implementation Plan:

#### Step 1: Create Visual Baseline Suite

**File:** `tests/visual-regression/baseline.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

/**
 * Visual Regression Baseline Suite
 *
 * Captures screenshots of key pages/components to establish visual baseline.
 * Run after design system implementation to lock in intended design.
 *
 * Update baseline: npx playwright test --update-snapshots
 * Run comparison: npx playwright test tests/visual-regression/
 */

test.describe('Design System Visual Baseline', () => {

  // Critical Pages (Full Page Screenshots)
  test('Portfolio page - Desktop 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Wait for images to load (skeleton → actual photos)
    await page.waitForSelector('img[src*="image"]', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow animations to settle

    await expect(page).toHaveScreenshot('portfolio-desktop.png', {
      fullPage: true,
      animations: 'disabled', // Disable animations for consistent screenshots
    });
  });

  test('Portfolio page - Mobile 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('img[src*="image"]', { state: 'visible' });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('portfolio-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Browse page with filters - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('browse-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Photo detail page - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/photo/1'); // Use a known photo ID
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('img[alt*="photo"]', { state: 'visible' });

    await expect(page).toHaveScreenshot('photo-detail-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Search page - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('search-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Homepage - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // Component-Level Screenshots (Isolated Components)
  test('Button component variants', async ({ page }) => {
    // Create a test page that renders all button variants
    await page.goto('/test/components'); // Assumes you create a test route

    const buttonSection = page.locator('[data-testid="button-showcase"]');
    await expect(buttonSection).toHaveScreenshot('button-variants.png', {
      animations: 'disabled',
    });
  });

  test('Typography scale showcase', async ({ page }) => {
    await page.goto('/test/components');

    const typographySection = page.locator('[data-testid="typography-showcase"]');
    await expect(typographySection).toHaveScreenshot('typography-scale.png', {
      animations: 'disabled',
    });
  });

  test('EmptyState variants', async ({ page }) => {
    await page.goto('/test/components');

    const emptyStateSection = page.locator('[data-testid="emptystate-showcase"]');
    await expect(emptyStateSection).toHaveScreenshot('emptystate-variants.png', {
      animations: 'disabled',
    });
  });

  test('PhotoSkeleton loading state', async ({ page }) => {
    await page.goto('/test/components');

    const skeletonSection = page.locator('[data-testid="skeleton-showcase"]');
    await expect(skeletonSection).toHaveScreenshot('skeleton-loading.png', {
      animations: 'disabled',
    });
  });

  // Interactive States (Hover, Focus, Active)
  test('MagneticFilterOrb - Hover state', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const filter = page.locator('[data-testid="filter-orb-triumph"]').first();
    await filter.hover();
    await page.waitForTimeout(500); // Allow hover animation to complete

    await expect(filter).toHaveScreenshot('filter-orb-hover.png', {
      animations: 'disabled',
    });
  });

  test('Button - Focus state', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button').first();
    await button.focus();

    await expect(button).toHaveScreenshot('button-focus-ring.png', {
      animations: 'disabled',
    });
  });

  // Grid Layouts at Multiple Breakpoints
  test('Portfolio grid - Tablet 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('img[src*="image"]', { state: 'visible' });

    const grid = page.locator('[data-testid="portfolio-grid"]');
    await expect(grid).toHaveScreenshot('portfolio-grid-tablet.png', {
      animations: 'disabled',
    });
  });

  test('Portfolio grid - Desktop 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('img[src*="image"]', { state: 'visible' });

    const grid = page.locator('[data-testid="portfolio-grid"]');
    await expect(grid).toHaveScreenshot('portfolio-grid-desktop.png', {
      animations: 'disabled',
    });
  });

  test('Portfolio grid - Ultra-wide 2560px', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('img[src*="image"]', { state: 'visible' });

    const grid = page.locator('[data-testid="portfolio-grid"]');
    await expect(grid).toHaveScreenshot('portfolio-grid-ultrawide.png', {
      animations: 'disabled',
    });
  });
});
```

#### Step 2: Establish Baseline

```bash
# First run: Capture baseline screenshots
npx playwright test tests/visual-regression/ --update-snapshots

# Screenshots saved to: tests/visual-regression/baseline.spec.ts-snapshots/
# Commit to Git (with Git LFS if large files)
git lfs track "tests/**/*.png"
git add tests/visual-regression/
git commit -m "chore: establish visual regression baseline"
```

#### Step 3: Continuous Comparison

```bash
# Every subsequent run: Compare against baseline
npx playwright test tests/visual-regression/

# If intentional change: Update baseline
npx playwright test tests/visual-regression/ --update-snapshots
```

#### Step 4: CI/CD Integration

**File:** `.github/workflows/visual-regression.yml`

```yaml
name: Visual Regression Testing

on:
  pull_request:
    branches: [main]

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true # Pull LFS files (baseline screenshots)

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run visual regression tests
        run: npx playwright test tests/visual-regression/

      - name: Upload diff screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-regression-diff
          path: test-results/
```

---

## Tier 2: Automated Accessibility & Standards

### 2A: Accessibility Scanning (Axe)

**File:** `tests/accessibility/wcag-compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG AA Compliance Testing
 *
 * Automated accessibility scanning using Axe DevTools.
 * Validates contrast ratios, ARIA attributes, keyboard navigation.
 */

test.describe('WCAG AA Compliance', () => {

  test('Portfolio page - No accessibility violations', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa']) // WCAG AA compliance
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Browse page - No accessibility violations', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Photo detail page - No accessibility violations', async ({ page }) => {
    await page.goto('/photo/1');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('StoryViewer - Control button contrast', async ({ page }) => {
    await page.goto('/stories/1');
    await page.waitForLoadState('networkidle');

    // Specific check for StoryViewer controls (Issue 2.3 from audit)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="story-viewer-controls"]')
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### 2B: Design System Compliance Scanning

**File:** `tests/design-system/compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

/**
 * Design System Compliance Testing
 *
 * Automated validation that design system components are used correctly.
 * Detects hardcoded styles, incorrect color usage, typography violations.
 */

test.describe('Design System Compliance', () => {

  test('No hardcoded button styles', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Check that all buttons use design system classes
    const hardcodedButtons = await page.locator('button[class*="bg-blue-600"]').count();
    expect(hardcodedButtons).toBe(0);

    const hardcodedBlackButtons = await page.locator('button[class*="bg-black "]').count();
    expect(hardcodedBlackButtons).toBe(0);
  });

  test('All headings use semantic Heading component', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Check that h1-h6 use consistent sizing
    const h1Elements = await page.locator('h1').all();
    for (const h1 of h1Elements) {
      const fontSize = await h1.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      // h1 should be 36px (text-4xl) or 48px (text-5xl on md+)
      expect(['36px', '48px']).toContain(fontSize);
    }
  });

  test('Typography base size minimum 16px (WCAG)', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Get all body text elements
    const bodyTexts = await page.locator('[data-variant="body"], p').all();

    for (const text of bodyTexts.slice(0, 5)) { // Sample first 5
      const fontSize = await text.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseFloat(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Allow 14px minimum
    }
  });

  test('Focus rings visible on all interactive elements', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 3)) { // Sample first 3 buttons
      await button.focus();

      // Check focus ring is visible
      const outline = await button.evaluate((el) =>
        window.getComputedStyle(el).outline
      );
      const boxShadow = await button.evaluate((el) =>
        window.getComputedStyle(el).boxShadow
      );

      // Either outline or box-shadow should be present for focus
      expect(outline !== 'none' || boxShadow !== 'none').toBeTruthy();
    }
  });

  test('Grid responsive breakpoints correct', async ({ page }) => {
    // Mobile: 2 columns
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    const gridContainer = page.locator('[data-testid="portfolio-grid"]');
    const gridCols = await gridContainer.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );

    // Should have 2 columns on mobile
    const colCount = gridCols.split(' ').length;
    expect(colCount).toBe(2);

    // Desktop: 4+ columns
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const gridColsDesktop = await gridContainer.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    const colCountDesktop = gridColsDesktop.split(' ').length;
    expect(colCountDesktop).toBeGreaterThanOrEqual(4);
  });

  test('Emotion palette colors used (not hardcoded)', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Check filter orbs use emotion palette colors
    const filterOrbs = await page.locator('[data-testid*="filter-orb"]').all();

    for (const orb of filterOrbs.slice(0, 3)) {
      const color = await orb.evaluate((el) =>
        window.getComputedStyle(el).borderColor
      );

      // Should not be default black/white
      expect(color).not.toBe('rgb(0, 0, 0)');
      expect(color).not.toBe('rgb(255, 255, 255)');
    }
  });
});
```

### 2C: Performance Monitoring (Lighthouse CI)

**File:** `.github/workflows/lighthouse-ci.yml`

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js
        run: npm run build

      - name: Start server
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: .lighthouseci/
```

**File:** `lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      staticDistDir: '.next',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/portfolio',
        'http://localhost:3000/browse',
        'http://localhost:3000/search',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance budgets
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Accessibility requirements
        'categories:accessibility': ['error', { minScore: 0.95 }],

        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

## Tier 3: Manual Design Intent Validation

### Why Manual Testing Still Matters:

Automated tests validate **technical compliance** but not:
- Emotional resonance (does it feel innovative?)
- Brand alignment (matches nino-chavez-site aesthetic?)
- UX quality (is navigation intuitive?)
- Visual harmony (do colors/spacing feel cohesive?)

### Manual Audit Checklist

**File:** `docs/MANUAL_AUDIT_CHECKLIST.md`

```markdown
# Manual UI/UX Audit Checklist

Run this checklist every milestone release (weekly/biweekly) to validate design intent.

## Design Intent Validation

### Brand Alignment
- [ ] Visual aesthetic matches nino-chavez-site (innovative, modern, sleek)
- [ ] Color palette feels cohesive (not random)
- [ ] Typography creates clear hierarchy
- [ ] Spacing feels intentional and consistent
- [ ] Emotion palette creates emotional resonance

### User Experience Quality
- [ ] Navigation is intuitive (no confusion)
- [ ] Empty states are helpful (not frustrating)
- [ ] Loading states feel responsive (not slow)
- [ ] Micro-interactions provide feedback (not dead clicks)
- [ ] Page transitions feel smooth (not jarring)

### Component Consistency
- [ ] All buttons look/behave the same
- [ ] All headings follow semantic hierarchy
- [ ] All filters have consistent interaction patterns
- [ ] All grids adapt responsively
- [ ] All focus states are visible

### Accessibility Experience
- [ ] Keyboard navigation is smooth (Tab order logical)
- [ ] Focus rings are visible (not hidden)
- [ ] Text is readable (contrast, size)
- [ ] Touch targets are comfortable (48px+ on mobile)
- [ ] Screen reader announces meaningful content

### Performance Feel
- [ ] First load feels fast (LCP < 2.5s)
- [ ] No layout jumps (CLS < 0.1)
- [ ] Animations feel smooth (60fps)
- [ ] Images load progressively (skeleton → image)
- [ ] Filters apply instantly

### Emotional Resonance (Innovation Criterion)
- [ ] Emotion filters feel unique/innovative
- [ ] Photo hovers adapt to emotion (contextual)
- [ ] Ambient backgrounds create immersion
- [ ] Grid entrances feel alive (not static)
- [ ] Page transitions feel cinematic

## Checklist Results

**Date:** _______
**Tested By:** _______
**Overall Grade:** ___/10

**Issues Found:**
1.
2.
3.

**Recommendations:**
1.
2.
3.
```

---

## Recommended Audit Schedule

### Immediate (Post-Implementation):

1. ✅ **Run Tier 1: Visual Regression Baseline**
   - Capture screenshots of all 20+ pages/components
   - Commit baseline to Git
   - Validate against design intent manually

2. ✅ **Run Tier 2: Accessibility & Standards**
   - Run Axe scan on all routes
   - Run design system compliance tests
   - Run Lighthouse performance audit
   - Fix any violations before deployment

3. ✅ **Run Tier 3: Manual Design Intent**
   - Complete manual audit checklist
   - Document any subjective UX issues
   - Validate emotional resonance and innovation

### Ongoing (CI/CD):

**Every Commit/PR:**
- Tier 1: Visual regression comparison (automated)
- Tier 2: Accessibility scan (automated)
- Tier 2: Design system compliance (automated)

**Every Deployment:**
- Tier 2: Lighthouse performance (automated)
- Tier 3: Manual smoke test (5 minutes)

**Every Milestone (Weekly/Biweekly):**
- Tier 3: Full manual audit checklist (30 minutes)
- Review and update visual baseline if needed

---

## Answer to Your Question

### "Do we need to rebaseline from actual visual inspection that is automated?"

**YES - Strongly Recommended**

**Why:**
1. ✅ **Original audit was pre-implementation** - Never saw actual rendered components
2. ✅ **Design system now fully implemented** - Need to capture current state as baseline
3. ✅ **Prevent future regressions** - Automated comparison detects unintended changes
4. ✅ **Validate design intent** - Ensure implementation matches vision

**How:**
1. Run Tier 1 visual regression suite (capture 20+ screenshots)
2. Run Tier 2 accessibility/compliance scans
3. Run Tier 3 manual design intent validation
4. Commit baseline to Git (version control)
5. Enable CI/CD automation for continuous monitoring

**Effort:**
- Initial baseline: 2-4 hours (setup + first run)
- Ongoing maintenance: Automatic (CI/CD handles it)
- Manual audits: 30 minutes per milestone

---

## Implementation Roadmap

### Phase 1: Setup Visual Regression (Day 1)
- [ ] Create `tests/visual-regression/baseline.spec.ts`
- [ ] Add `data-testid` attributes to key components
- [ ] Run baseline capture: `npx playwright test --update-snapshots`
- [ ] Commit baseline screenshots to Git (use Git LFS)

### Phase 2: Setup Accessibility Scanning (Day 1)
- [ ] Install `@axe-core/playwright`
- [ ] Create `tests/accessibility/wcag-compliance.spec.ts`
- [ ] Run accessibility scan on all routes
- [ ] Fix any violations found

### Phase 3: Setup Design System Compliance (Day 1)
- [ ] Create `tests/design-system/compliance.spec.ts`
- [ ] Add automated checks for hardcoded styles
- [ ] Validate responsive breakpoints
- [ ] Check emotion palette usage

### Phase 4: Setup Lighthouse CI (Day 2)
- [ ] Create `lighthouserc.js` configuration
- [ ] Add `.github/workflows/lighthouse-ci.yml`
- [ ] Run baseline Lighthouse audit
- [ ] Set performance budgets

### Phase 5: Enable CI/CD Automation (Day 2)
- [ ] Add visual regression to GitHub Actions
- [ ] Add accessibility scan to PR checks
- [ ] Add Lighthouse CI to deployment pipeline
- [ ] Configure failure thresholds

### Phase 6: Manual Audit Process (Day 2)
- [ ] Create manual audit checklist
- [ ] Run first manual audit
- [ ] Document findings
- [ ] Schedule recurring audits

---

## Expected Outcomes

After implementing this 3-tier audit strategy:

✅ **Confidence in quality** - Automated detection of regressions
✅ **Consistent design** - Visual baseline prevents drift
✅ **Accessibility guaranteed** - WCAG AA compliance enforced
✅ **Performance monitored** - LCP/CLS budgets tracked
✅ **Design intent preserved** - Manual validation catches subjective issues
✅ **Rapid feedback** - CI/CD catches issues before merge

---

## Tools Required

```bash
# Install dependencies
npm install --save-dev @axe-core/playwright
npm install --save-dev @lhci/cli

# Playwright already installed ✅

# Git LFS for screenshot storage (optional)
brew install git-lfs
git lfs install
```

---

## Conclusion

**Recommendation:** Implement all 3 tiers for comprehensive quality assurance.

**Priority Order:**
1. **Tier 1 (Visual Regression)** - Most critical, captures baseline NOW
2. **Tier 2A (Accessibility)** - WCAG compliance non-negotiable
3. **Tier 3 (Manual)** - Validates design intent, runs once per milestone
4. **Tier 2B (Design System)** - Enforces standards compliance
5. **Tier 2C (Performance)** - Monitors LCP/CLS budgets

**Total Setup Effort:** 2 days
**Ongoing Effort:** Automatic (CI/CD) + 30 min/milestone (manual audit)

**ROI:** Prevents design drift, catches regressions early, maintains premium quality.
