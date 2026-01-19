import { test, expect, Page } from '@playwright/test';

/**
 * Stripe Checkout E2E Tests
 *
 * These tests verify the full subscription lifecycle:
 * 1. User upgrades from Free to Plus plan
 * 2. Checkout completes successfully via Stripe
 * 3. Webhook updates database
 * 4. User can manage/cancel subscription via Customer Portal
 *
 * Prerequisites:
 * - Dev server running on localhost:3000
 * - Stripe CLI listening: stripe listen --forward-to localhost:3000/api/stripe/webhook
 * - Test user authenticated
 *
 * Note: Use Stripe test card 4242 4242 4242 4242
 */

// Test configuration
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

const STRIPE_TEST_CARD = {
  number: '4242424242424242',
  exp: '12/30',
  cvc: '123',
  name: 'Test User',
};

test.describe('Stripe Subscription Flow', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in order

  let authenticatedPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create a persistent context for authenticated session
    const context = await browser.newContext();
    authenticatedPage = await context.newPage();
  });

  test.afterAll(async () => {
    await authenticatedPage?.context().close();
  });

  test('E2E-STRIPE-001: should display billing page with current plan', async () => {
    // Navigate to login
    await authenticatedPage.goto('/login');

    // Fill login form
    await authenticatedPage.getByLabel(/email/i).fill(TEST_USER.email);
    await authenticatedPage.getByLabel(/password/i).fill(TEST_USER.password);

    // Submit login
    await authenticatedPage.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to workspace
    await authenticatedPage.waitForURL(/\/(workspace|dashboard)/, { timeout: 10000 });

    // Navigate to billing page
    await authenticatedPage.goto('/billing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify billing page elements
    await expect(authenticatedPage.getByRole('heading', { name: /billing/i })).toBeVisible();
    await expect(authenticatedPage.getByText(/current plan/i)).toBeVisible();

    // Capture screenshot
    await authenticatedPage.screenshot({
      path: '../.playwright-mcp/billing-before-upgrade.png',
      fullPage: true,
    });
  });

  test('E2E-STRIPE-002: should initiate checkout for Plus plan', async () => {
    // Ensure we're on billing page
    await authenticatedPage.goto('/billing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find Plus plan card and click Upgrade
    // The Plus plan card has "Recommended" badge and Upgrade button
    const plusCard = authenticatedPage.locator('[class*="border-brand"]').first();
    await expect(plusCard).toBeVisible();

    const upgradeButton = plusCard.getByRole('button', { name: /upgrade/i });
    await expect(upgradeButton).toBeVisible();

    // Click upgrade - this should redirect to Stripe Checkout
    await Promise.all([
      authenticatedPage.waitForURL(/checkout\.stripe\.com/),
      upgradeButton.click(),
    ]);

    // Verify we're on Stripe Checkout
    await expect(authenticatedPage.url()).toContain('checkout.stripe.com');
  });

  test('E2E-STRIPE-003: should complete Stripe Checkout with test card', async () => {
    // We should be on Stripe Checkout page
    await authenticatedPage.waitForLoadState('networkidle');

    // Stripe Checkout uses iframes - need to handle them
    // Wait for the card number field to be ready
    const cardFrame = authenticatedPage.frameLocator('iframe[name*="privateStripeFrame"]').first();

    // Fill card details
    await cardFrame.locator('[placeholder*="1234"]').fill(STRIPE_TEST_CARD.number);
    await cardFrame.locator('[placeholder*="MM"]').fill(STRIPE_TEST_CARD.exp);
    await cardFrame.locator('[placeholder*="CVC"]').fill(STRIPE_TEST_CARD.cvc);

    // Fill name (may not be in iframe)
    const nameField = authenticatedPage.locator('input[name*="name"], input[placeholder*="name"]').first();
    if (await nameField.isVisible()) {
      await nameField.fill(STRIPE_TEST_CARD.name);
    }

    // Click Subscribe/Pay button
    await Promise.all([
      authenticatedPage.waitForURL(/localhost:3000\/billing/),
      authenticatedPage.getByRole('button', { name: /subscribe|pay/i }).click(),
    ]);

    // Wait for webhook to process (give it a few seconds)
    await authenticatedPage.waitForTimeout(3000);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');

    // Capture screenshot of billing page after upgrade
    await authenticatedPage.screenshot({
      path: '../.playwright-mcp/billing-after-upgrade.png',
      fullPage: true,
    });
  });

  test('E2E-STRIPE-004: should show Plus plan as current after upgrade', async () => {
    // Verify billing page shows Plus as current plan
    await authenticatedPage.goto('/billing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for "Plus Plan" text in the Current Plan section
    const currentPlanSection = authenticatedPage.locator('text=Current Plan').locator('..');
    await expect(currentPlanSection.locator('text=Plus')).toBeVisible({ timeout: 10000 });

    // The Plus card's Upgrade button should now say "Current Plan"
    const plusCard = authenticatedPage.locator('[class*="border-brand"]').first();
    await expect(plusCard.getByRole('button', { name: /current plan/i })).toBeVisible();
  });

  test('E2E-STRIPE-005: should open Customer Portal for subscription management', async () => {
    // Ensure we're on billing page
    await authenticatedPage.goto('/billing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Manage Subscription
    await Promise.all([
      authenticatedPage.waitForURL(/billing\.stripe\.com/),
      authenticatedPage.getByRole('button', { name: /manage subscription/i }).click(),
    ]);

    // Verify we're on Stripe Portal
    await expect(authenticatedPage.url()).toContain('billing.stripe.com');

    // Capture screenshot
    await authenticatedPage.screenshot({
      path: '../.playwright-mcp/stripe-customer-portal.png',
      fullPage: true,
    });
  });

  test('E2E-STRIPE-006: should cancel subscription via Customer Portal', async () => {
    // We should be on Stripe Customer Portal
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Cancel plan link
    const cancelLink = authenticatedPage.getByRole('link', { name: /cancel/i }).or(
      authenticatedPage.getByText(/cancel plan/i)
    );
    await cancelLink.click();

    // Wait for confirmation dialog/page
    await authenticatedPage.waitForLoadState('networkidle');

    // Confirm cancellation
    const confirmButton = authenticatedPage.getByRole('button', { name: /cancel.*subscription|confirm/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Wait for cancellation to process
    await authenticatedPage.waitForTimeout(2000);

    // Return to app
    const returnLink = authenticatedPage.getByRole('link', { name: /return|back|done/i });
    if (await returnLink.isVisible()) {
      await returnLink.click();
    } else {
      await authenticatedPage.goto('/billing');
    }

    await authenticatedPage.waitForURL(/localhost:3000\/billing/);
    await authenticatedPage.waitForLoadState('networkidle');

    // Wait for webhook to process
    await authenticatedPage.waitForTimeout(3000);
    await authenticatedPage.reload();

    // Capture screenshot after cancellation
    await authenticatedPage.screenshot({
      path: '../.playwright-mcp/billing-after-cancel.png',
      fullPage: true,
    });
  });

  test('E2E-STRIPE-007: should show Free plan after cancellation', async () => {
    await authenticatedPage.goto('/billing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Wait a bit for database to update via webhook
    await authenticatedPage.waitForTimeout(2000);
    await authenticatedPage.reload();

    // The subscription status should show canceled or free
    // Note: Stripe may show "canceled" status with end date
    const statusText = authenticatedPage.locator('text=canceled').or(
      authenticatedPage.locator('text=Free Plan')
    );
    await expect(statusText).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Stripe Webhook Verification', () => {
  test('E2E-STRIPE-CLI-001: webhook endpoint should be accessible', async ({ request }) => {
    // Test that the webhook endpoint exists (should return 400 without signature)
    const response = await request.post('/api/stripe/webhook', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ type: 'test' }),
    });

    // Should return 400 (missing signature) not 404
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('stripe-signature');
  });
});
