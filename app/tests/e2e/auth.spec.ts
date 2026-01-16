import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('E2E-001: should redirect unauthenticated users to login', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/dashboard');

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-002: should show login form elements', async ({ page }) => {
    await page.goto('/login');

    // Verify login form elements
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Verify navigation links
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await expect(page.getByTestId('forgot-password-link')).toBeVisible();
  });

  test('E2E-003: should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill form with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword123');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify error message appears (Supabase returns auth error)
    // The form uses HTML5 required attributes, so validation happens before submission
    // After submission, Supabase returns an error for invalid credentials
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('E2E-004: should show signup form elements', async ({ page }) => {
    await page.goto('/signup');

    // Verify signup form elements
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
    await expect(page.getByTestId('signup-name-input')).toBeVisible();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();
    await expect(page.getByTestId('signup-password-input')).toBeVisible();
    await expect(page.getByTestId('signup-confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('signup-submit-button')).toBeVisible();

    // Verify navigation links
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('E2E-005: should show password mismatch error on signup', async ({ page }) => {
    await page.goto('/signup');

    // Fill form with mismatched passwords
    await page.getByTestId('signup-name-input').fill('Test User');
    await page.getByTestId('signup-email-input').fill('test@example.com');
    await page.getByTestId('signup-password-input').fill('password123');
    await page.getByTestId('signup-confirm-password-input').fill('differentpassword');

    // Submit the form
    await page.getByTestId('signup-submit-button').click();

    // Verify password mismatch error appears
    await expect(page.getByText(/passwords must match/i)).toBeVisible();
  });

  test('E2E-006: should show forgot password page elements', async ({ page }) => {
    await page.goto('/forgot-password');

    // Verify forgot password form elements
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByTestId('forgot-password-email')).toBeVisible();
    await expect(page.getByTestId('forgot-password-submit')).toBeVisible();

    // Verify Back to Login link works
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('E2E-007: should navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login');

    // Click forgot password link
    await page.getByTestId('forgot-password-link').click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
  });
});
