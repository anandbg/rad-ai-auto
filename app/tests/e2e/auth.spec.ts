import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('E2E-001: should redirect unauthenticated users to login', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/dashboard');

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-002: should show login form', async ({ page }) => {
    await page.goto('/login');

    // Verify login form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('E2E-003: should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify validation errors
    await expect(page.getByText(/email.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('E2E-004: should show signup form', async ({ page }) => {
    await page.goto('/signup');

    // Verify signup form elements
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible();
  });

  test('E2E-005: should have Google OAuth button', async ({ page }) => {
    await page.goto('/login');

    // Verify Google sign in button
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});
