import { test, expect } from '@playwright/test';

// Test credentials - uses existing test user
const TEST_EMAIL = 'anandbg@gmail.com';
const TEST_PASSWORD = 'Simple.123';

test.describe('Settings - Report List Style Preferences', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Use id selectors which are more reliable
    await page.locator('#email').fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard to load (successful login)
    await expect(page).toHaveURL(/\/(dashboard|workspace)/, { timeout: 15000 });
  });

  test('E2E-LSP-001: should display Report Formatting section on Settings page', async ({ page }) => {
    await page.goto('/settings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Verify Report Formatting section exists
    await expect(page.getByRole('heading', { name: 'Report Formatting' })).toBeVisible();
    await expect(page.getByText('Customize list styles in generated reports')).toBeVisible();

    // Verify Apply to All dropdown exists
    await expect(page.getByTestId('apply-to-all-select')).toBeVisible();

    // Verify all 5 section dropdowns exist
    await expect(page.getByTestId('list-style-clinicalInfo')).toBeVisible();
    await expect(page.getByTestId('list-style-technique')).toBeVisible();
    await expect(page.getByTestId('list-style-comparison')).toBeVisible();
    await expect(page.getByTestId('list-style-findings')).toBeVisible();
    await expect(page.getByTestId('list-style-impression')).toBeVisible();
  });

  test('E2E-LSP-002: should change individual section list style', async ({ page }) => {
    await page.goto('/settings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Report Formatting' })).toBeVisible();

    // Get the Findings dropdown
    const findingsSelect = page.getByTestId('list-style-findings');

    // Change to Arrow style
    await findingsSelect.selectOption('arrow');

    // Wait for toast notification
    await expect(page.getByText(/Updated Findings list style/i)).toBeVisible({ timeout: 5000 });

    // Verify the selection persisted
    await expect(findingsSelect).toHaveValue('arrow');
  });

  test('E2E-LSP-003: should apply style to all sections', async ({ page }) => {
    await page.goto('/settings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Report Formatting' })).toBeVisible();

    // Apply Dash style to all
    const applyToAllSelect = page.getByTestId('apply-to-all-select');
    await applyToAllSelect.selectOption('dash');

    // Wait for toast notification
    await expect(page.getByText(/Applied Dash style to all sections/i)).toBeVisible({ timeout: 5000 });

    // Verify all 5 dropdowns show Dash
    await expect(page.getByTestId('list-style-clinicalInfo')).toHaveValue('dash');
    await expect(page.getByTestId('list-style-technique')).toHaveValue('dash');
    await expect(page.getByTestId('list-style-comparison')).toHaveValue('dash');
    await expect(page.getByTestId('list-style-findings')).toHaveValue('dash');
    await expect(page.getByTestId('list-style-impression')).toHaveValue('dash');
  });

  test('E2E-LSP-004: should persist preferences after page refresh', async ({ page }) => {
    await page.goto('/settings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Report Formatting' })).toBeVisible();

    // Apply Numbered style to all
    const applyToAllSelect = page.getByTestId('apply-to-all-select');
    await applyToAllSelect.selectOption('numbered');

    // Wait for save to complete
    await expect(page.getByText(/Applied Numbered style to all sections/i)).toBeVisible({ timeout: 5000 });

    // Wait a moment for API save
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();

    // Wait for page to load again
    await expect(page.getByRole('heading', { name: 'Report Formatting' })).toBeVisible();

    // Verify all dropdowns still show Numbered (persisted)
    await expect(page.getByTestId('list-style-clinicalInfo')).toHaveValue('numbered');
    await expect(page.getByTestId('list-style-technique')).toHaveValue('numbered');
    await expect(page.getByTestId('list-style-comparison')).toHaveValue('numbered');
    await expect(page.getByTestId('list-style-findings')).toHaveValue('numbered');
    await expect(page.getByTestId('list-style-impression')).toHaveValue('numbered');
  });

  test('E2E-LSP-005: should show listStylePreferences in debug JSON', async ({ page }) => {
    await page.goto('/settings');

    // Wait for preferences to load
    await expect(page.getByRole('heading', { name: 'Preferences Debug' })).toBeVisible();

    // Get the debug JSON content
    const debugJson = page.getByTestId('preferences-json');
    await expect(debugJson).toBeVisible();

    // Verify listStylePreferences key exists in the JSON
    const jsonText = await debugJson.textContent();
    expect(jsonText).toContain('listStylePreferences');
    expect(jsonText).toContain('clinicalInfo');
    expect(jsonText).toContain('technique');
    expect(jsonText).toContain('comparison');
    expect(jsonText).toContain('findings');
    expect(jsonText).toContain('impression');
  });
});
