import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for UX Visual Testing
 *
 * Tests verify:
 * - Portfolio page loads and displays correctly
 * - SWR caching works (instant navigation)
 * - Next.js Image optimization active
 * - Interactive features (filters, view modes)
 * - Performance characteristics
 */
export default defineConfig({
  testDir: './tests',

  // Run tests in parallel with controlled worker count
  fullyParallel: true,

  // Worker configuration optimized for M3 Max with multiple dev environments
  // M3 Max has 14-16 cores, reserve ~50% for other apps (7-8 workers)
  workers: process.env.CI ? 4 : 6,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests twice on CI, once locally
  retries: process.env.CI ? 2 : 1,

  // Test timeout - increased for resource-constrained scenarios
  timeout: 45000,

  // Global timeout to prevent hung test suites
  globalTimeout: 600000, // 10 minutes

  // Maximum failures before stopping (fail fast)
  maxFailures: process.env.CI ? undefined : 5,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',

    // Take screenshots on failure
    screenshot: 'only-on-failure',

    // Record video only on first retry (saves disk I/O and memory)
    video: 'retain-on-failure',

    // Trace on first retry (reduces memory overhead)
    trace: 'on-first-retry',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Navigation timeout for slower systems under load
    navigationTimeout: 30000,

    // Action timeout
    actionTimeout: 15000,

    // Reduce memory pressure by limiting parallel navigations
    launchOptions: {
      // Limit memory per browser instance
      args: [
        '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm for shared memory
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox', // Reduces isolation overhead
      ],
    },
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Dev server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse existing server in development
    timeout: 120000,
    // Only start server if not already running (prevents conflicts)
    ignoreHTTPSErrors: true,
  },

  // Output configuration
  outputDir: 'test-results',

  // Metadata
  metadata: {
    optimizedFor: 'M3 Max with parallel development environments',
    workerAllocation: 'Conservative (50% of cores)',
    memoryStrategy: 'Shared memory disabled, /tmp usage enabled',
  },
});
