/**
 * Automated Screenshot Capture Script
 *
 * Uses Playwright to capture all 14 workflow screenshots for the landing page carousel.
 * Run with: pnpm capture-screenshots
 *
 * Prerequisites:
 * - Dev server running on http://localhost:3000 (pnpm dev)
 * - Test user credentials or public pages accessible
 */

import { chromium, type Page, type Browser } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Screenshot configuration matching demo-animation.tsx
interface ScreenshotConfig {
  id: string;
  filename: string;
  description: string;
  captureSteps: (page: Page) => Promise<void>;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'demo-screenshots');
const VIEWPORT = { width: 1920, height: 1080 };

// Test credentials - update these for your environment
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

const screenshotConfigs: ScreenshotConfig[] = [
  {
    id: '1',
    filename: '1-transcribe home',
    description: 'Transcribe home (empty state)',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // Ensure transcript panel is visible and empty
      await page.waitForTimeout(500);
    },
  },
  {
    id: '2',
    filename: '2-file upload',
    description: 'File upload dialog',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // Click upload button to open file dialog
      // Note: Can't capture native file dialog, capture the state with button highlighted
      const uploadBtn = page.locator('button:has-text("Upload")');
      if (await uploadBtn.isVisible()) {
        await uploadBtn.hover();
      }
      await page.waitForTimeout(300);
    },
  },
  {
    id: '3',
    filename: '3-recording in progress',
    description: 'Recording in progress',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // Click start recording to show recording state
      const recordBtn = page.locator('button:has-text("Start Recording")');
      if (await recordBtn.isVisible()) {
        await recordBtn.click();
        await page.waitForTimeout(1000);
      }
    },
  },
  {
    id: '4',
    filename: '4-transribing',
    description: 'Transcribing (processing state)',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // This state is transient - may need to mock or use existing screenshot
      await page.waitForTimeout(500);
    },
  },
  {
    id: '5',
    filename: '5-select template',
    description: 'Select template prompt',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // Navigate to report tab/panel
      const reportTab = page.locator('text=Report').first();
      if (await reportTab.isVisible()) {
        await reportTab.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: '6',
    filename: '6-choose template',
    description: 'Template selection modal',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // Open template selection modal
      const selectTemplateBtn = page.locator('button:has-text("Select Template")');
      if (await selectTemplateBtn.isVisible()) {
        await selectTemplateBtn.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: '7',
    filename: '7-ready to generate',
    description: 'Ready to generate',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // State with transcript and template selected
      await page.waitForTimeout(500);
    },
  },
  {
    id: '8',
    filename: '8-generating report',
    description: 'Generating report (loading state)',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // This state is transient - may need to mock
      await page.waitForTimeout(500);
    },
  },
  {
    id: '9',
    filename: '9-generated report',
    description: 'Generated report',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      // State with completed report
      await page.waitForTimeout(500);
    },
  },
  {
    id: '10',
    filename: '10-templates library',
    description: 'Templates library',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/templates`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    },
  },
  {
    id: '11',
    filename: '11-create template',
    description: 'Create template (clone pathway)',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/templates?clone=true`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    },
  },
  {
    id: '12',
    filename: '12-create template from blank using AI',
    description: 'Create template (blank + AI)',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/templates`);
      await page.waitForLoadState('networkidle');
      // Click new template button and select blank
      const newBtn = page.locator('button:has-text("New template")');
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(300);
        // Click blank template option
        const blankOption = page.locator('text=Blank template');
        if (await blankOption.isVisible()) {
          await blankOption.click();
          await page.waitForTimeout(500);
        }
      }
    },
  },
  {
    id: '13',
    filename: '13-macro library',
    description: 'Macro library',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/macros`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    },
  },
  {
    id: '14',
    filename: '14-create marco',
    description: 'Create macro modal',
    captureSteps: async (page) => {
      await page.goto(`${BASE_URL}/macros`);
      await page.waitForLoadState('networkidle');
      // Click new macro button
      const newBtn = page.locator('button:has-text("New macro")');
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(500);
      }
    },
  },
];

async function login(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if already logged in (redirected to dashboard)
    if (page.url().includes('/dashboard')) {
      console.log('Already logged in');
      return true;
    }

    // Fill login form
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);

      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      return page.url().includes('/dashboard');
    }

    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

async function captureScreenshot(
  page: Page,
  config: ScreenshotConfig
): Promise<string> {
  console.log(`Capturing: ${config.description}...`);

  try {
    await config.captureSteps(page);

    const outputPath = path.join(OUTPUT_DIR, `${config.filename}.png`);
    await page.screenshot({
      path: outputPath,
      fullPage: false,
    });

    console.log(`  Saved: ${config.filename}.png`);
    return outputPath;
  } catch (error) {
    console.error(`  Failed to capture ${config.filename}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Screenshot Capture Script');
  console.log('========================\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let browser: Browser | null = null;

  try {
    // Launch browser
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Attempt login
    console.log('\nAttempting login...');
    const loggedIn = await login(page);

    if (!loggedIn) {
      console.log('Login failed or not required. Proceeding with captures...');
      console.log('Note: Some screenshots may not capture correctly without authentication.\n');
    } else {
      console.log('Login successful!\n');
    }

    // Capture each screenshot
    console.log('Capturing screenshots...\n');
    const capturedFiles: string[] = [];

    for (const config of screenshotConfigs) {
      try {
        const filePath = await captureScreenshot(page, config);
        capturedFiles.push(filePath);
      } catch (error) {
        console.error(`Skipping ${config.filename} due to error`);
      }
    }

    console.log('\n========================');
    console.log(`Captured ${capturedFiles.length}/${screenshotConfigs.length} screenshots`);
    console.log(`Output: ${OUTPUT_DIR}`);

    // List files
    console.log('\nFiles created:');
    for (const file of capturedFiles) {
      const stat = fs.statSync(file);
      const sizeKB = (stat.size / 1024).toFixed(1);
      console.log(`  ${path.basename(file)} (${sizeKB} KB)`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\nDone! Run image optimization next to convert to WebP.');
}

main();
