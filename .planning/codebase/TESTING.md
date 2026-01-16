# Testing Patterns

**Analysis Date:** 2026-01-16

## Test Framework

**Unit Testing:**
- Vitest 1.6.0
- Config: `app/vitest.config.ts`

**E2E Testing:**
- Playwright 1.56.1
- Config: `app/playwright.config.ts`

**Run Commands:**
```bash
pnpm test              # Run unit tests once
pnpm test:watch        # Run unit tests in watch mode
pnpm test:coverage     # Run unit tests with coverage report
pnpm test:e2e          # Run E2E tests (headless)
pnpm test:e2e:ui       # Run E2E tests with Playwright UI
pnpm test:e2e:headed   # Run E2E tests in headed mode
```

## Test File Organization

**Location:**
- Unit tests: `app/tests/` directory (separate from source)
- E2E tests: `app/tests/e2e/` directory
- Setup file: `app/tests/setup.ts`

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Structure:**
```
app/
├── tests/
│   ├── setup.ts           # Vitest setup (globals, mocks)
│   └── e2e/
│       └── auth.spec.ts   # E2E test suites
```

## Vitest Configuration

**Config file:** `app/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**', 'types/**', 'components/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
```

**Key settings:**
- Environment: `jsdom` for DOM simulation
- Globals: `true` (no need to import `describe`, `it`, `expect`)
- Path alias: `@` maps to project root
- Coverage: V8 provider, covers `lib/`, `types/`, `components/`

## Test Setup

**Setup file:** `app/tests/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

**Included mocks:**
- `window.matchMedia` - For responsive/media query tests
- `ResizeObserver` - For components using resize observation
- `IntersectionObserver` - For lazy loading/visibility tests
- `@testing-library/jest-dom` matchers for DOM assertions

## Playwright Configuration

**Config file:** `app/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

**Key settings:**
- Test ID attribute: `data-testid` (use in components)
- Browser coverage: Chrome, Firefox, Safari (desktop + mobile)
- Artifacts: Screenshots on failure, video retained on failure, traces on retry
- Dev server: Auto-starts `pnpm dev` for tests

## E2E Test Structure

**Suite Organization:**

```typescript
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
});
```

**Test ID Convention:**
- Format: `E2E-XXX` where XXX is sequential number
- Include in test name: `test('E2E-001: description', ...)`

**Patterns:**
- Use `test.describe()` for grouping related tests
- Use role-based selectors when possible: `getByRole('button', { name: /sign in/i })`
- Use label selectors for form fields: `getByLabel(/email/i)`
- Use regex for flexible text matching: `/sign in/i`
- Use `data-testid` for elements without accessible names

## Mocking

**Vitest Mocking:**
```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();

// Mock implementation
vi.fn().mockImplementation(() => ({ ... }));

// Mock return value
vi.fn().mockReturnValue(value);
```

**What to Mock:**
- Browser APIs not available in jsdom (`matchMedia`, `ResizeObserver`, `IntersectionObserver`)
- External services (Supabase, Stripe) in unit tests
- `window.location` for navigation tests
- `localStorage`/`sessionStorage` when needed

**What NOT to Mock:**
- React components under test
- Utility functions (test them directly)
- DOM interactions (use Testing Library)

## Test Data and Test IDs

**Test ID Usage in Components:**

```tsx
// Component code
<button data-testid="mobile-menu-button">Menu</button>
<button data-testid="user-menu-trigger">Profile</button>
<button data-testid="yolo-mode-toggle">Toggle</button>
<span data-testid="reports-count">{count}</span>
```

**Selecting by Test ID in Playwright:**
```typescript
await page.getByTestId('mobile-menu-button').click();
await expect(page.getByTestId('reports-count')).toHaveText('5 / 10');
```

**Fixture/Factory Pattern:**
- Not yet established in codebase
- Recommend: Create `tests/fixtures/` for reusable test data
- Recommend: Create factory functions for complex objects

## Coverage

**Requirements:** Not formally enforced

**Coverage Configuration:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**', 'types/**', 'components/**'],
}
```

**View Coverage:**
```bash
pnpm test:coverage
# Opens HTML report at coverage/index.html
```

**Covered directories:**
- `lib/**` - Hooks, utilities, validation
- `types/**` - Type definitions (compile-time)
- `components/**` - UI components

## Test Types

**Unit Tests:**
- Test utility functions, hooks, and components in isolation
- Use jsdom environment for React components
- Mock external dependencies

**Integration Tests:**
- Test component interactions with context providers
- Test form submissions and state changes
- Currently minimal coverage

**E2E Tests:**
- Test complete user flows through the browser
- Cover authentication, navigation, form submissions
- Run against actual dev server

**Current E2E Coverage:**
- Authentication flow (`tests/e2e/auth.spec.ts`)
  - Redirect unauthenticated users
  - Login form display and validation
  - Signup form display
  - OAuth button presence

## Common Patterns

**Async Testing (Playwright):**
```typescript
test('async operation', async ({ page }) => {
  await page.goto('/page');

  // Wait for element
  await expect(page.getByRole('heading')).toBeVisible();

  // Wait for navigation
  await expect(page).toHaveURL(/\/expected-path/);

  // Wait for network idle
  await page.waitForLoadState('networkidle');
});
```

**Form Testing (Playwright):**
```typescript
test('form submission', async ({ page }) => {
  await page.goto('/login');

  // Fill form
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('password123');

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Verify result
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Error Testing (Playwright):**
```typescript
test('validation errors', async ({ page }) => {
  await page.goto('/login');

  // Submit empty form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Verify error messages
  await expect(page.getByText(/email.*required/i)).toBeVisible();
  await expect(page.getByText(/password.*required/i)).toBeVisible();
});
```

**Accessibility Testing:**
```typescript
// Use role-based selectors
await page.getByRole('button', { name: /sign in/i });
await page.getByRole('heading', { name: /welcome/i });
await page.getByRole('link', { name: /forgot password/i });

// Verify ARIA attributes
await expect(page.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
```

## Adding New Tests

**Unit Test:**
1. Create `tests/{feature}.test.ts`
2. Import from `vitest` (globals enabled)
3. Import Testing Library for React components
4. Mock external dependencies

**E2E Test:**
1. Add to existing spec file or create `tests/e2e/{feature}.spec.ts`
2. Use `E2E-XXX` naming convention
3. Prefer accessible selectors over test IDs
4. Add `data-testid` to components for complex elements

**Test ID Guideline:**
- Add `data-testid` when:
  - Element lacks accessible name/role
  - Need stable selector for dynamic content
  - Testing specific implementation detail

---

*Testing analysis: 2026-01-16*
