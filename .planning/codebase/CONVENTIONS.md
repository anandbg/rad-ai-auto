# Coding Conventions

**Analysis Date:** 2026-01-16

## Naming Patterns

**Files:**
- React components: PascalCase for component files in some cases, but **kebab-case is primary** (e.g., `button.tsx`, `auth-context.tsx`, `use-unsaved-changes.ts`)
- API routes: `route.ts` inside route directories (Next.js App Router convention)
- Hooks: `use-{name}.ts` (kebab-case with `use-` prefix)
- Utilities: kebab-case (e.g., `cn.ts`, `template-schema.ts`)
- Types: kebab-case (e.g., `database.ts`, `index.ts`)

**Functions:**
- camelCase for all functions: `handleSubmit`, `getUsageStats`, `createSupabaseServerClient`
- React hooks: `use` prefix (e.g., `useAuth`, `useUnsavedChanges`, `useCsrf`)
- Event handlers: `handle` prefix (e.g., `handleYoloModeToggle`, `handleStay`, `handleLeave`)
- Async data fetchers: descriptive verbs (e.g., `loadUser`, `updateProfile`, `signOut`)

**Variables:**
- camelCase for all variables: `isLoading`, `pendingNavigation`, `showDialog`
- Boolean variables: `is`, `has`, `show` prefixes (e.g., `isProtectedRoute`, `hasMore`, `showUnauthorizedError`)
- Refs: `{name}Ref` suffix (e.g., `userMenuRef`, `isNavigatingRef`)

**Types:**
- PascalCase for interfaces and types: `AuthUser`, `UseUnsavedChangesOptions`, `ApiResponse`
- Type suffix for context types: `AuthContextType`, `PreferencesContextType`
- Database types match table names in PascalCase: `Profile`, `TemplateGlobal`, `Subscription`

**React Components:**
- PascalCase: `Button`, `Sidebar`, `AuthProvider`
- Use `displayName` for forwardRef components: `Button.displayName = "Button"`

## Code Style

**Formatting:**
- Prettier (configured in `app/.prettierrc`)
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas (ES5)
- 80 character print width
- Tailwind CSS class sorting (prettier-plugin-tailwindcss)

**Linting:**
- ESLint with `eslint-config-next` (Next.js defaults)
- `eslint-config-prettier` to disable conflicting rules

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- No unchecked indexed access (`"noUncheckedIndexedAccess": true`)
- No implicit returns (`"noImplicitReturns": true`)
- No unused locals/parameters (`"noUnusedLocals": true`, `"noUnusedParameters": true`)
- ES2022 target

## Import Organization

**Order:**
1. React and Next.js imports (e.g., `'react'`, `'next/navigation'`)
2. External library imports (e.g., `'@radix-ui/react-dialog'`, `'zod'`)
3. Internal absolute imports using path alias (e.g., `'@/lib/auth/auth-context'`)
4. Relative imports (rare, prefer absolute)

**Path Aliases:**
- `@/*` maps to project root (`./`)
- Usage: `import { cn } from '@/lib/shared/cn'`

**Example:**
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/shared/cn";
import { useAuth } from '@/lib/auth/auth-context';
```

## Error Handling

**API Routes:**
- Always return structured JSON responses with `success`, `error`, `message` fields
- Use appropriate HTTP status codes (400, 401, 403, 404, 500)
- Log errors with context: `console.error('[Component] Error message:', error)`

**Pattern:**
```typescript
try {
  // operation
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  console.error(`[Context] Operation failed: ${errorMessage}`);
  return NextResponse.json(
    { error: 'User-friendly message', message: 'Details' },
    { status: 500 }
  );
}
```

**Client Components:**
- Use try/catch with state for user feedback
- Log errors to console with component context
- Display user-friendly error messages via state

**Pattern:**
```typescript
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error);
  setError('An unexpected error occurred. Please try again.');
} finally {
  setLoading(false);
}
```

## Logging

**Framework:** `console` (no external logging library)

**Patterns:**
- API routes: Prefix with `[Route/Component]` for traceability
- Include event/operation context: `console.log(\`[Stripe Webhook] Verified event: ${event.type}\`)`
- Error logs: Include error message and relevant identifiers
- Security events: Always log authentication failures and validation errors

## Comments

**When to Comment:**
- Complex business logic or non-obvious behavior
- Security-related code (e.g., signature verification)
- TODOs for incomplete implementations
- Function/component documentation for public APIs

**JSDoc/TSDoc:**
- Use for API route handlers to document purpose and behavior
- Include for complex utility functions

**Pattern:**
```typescript
/**
 * POST /api/templates/validate
 *
 * Server-side validation endpoint for templates.
 * Uses the SAME Zod schema as the client-side form validation.
 */
export async function POST(request: NextRequest) { ... }
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract complex logic into separate utility functions
- Page components can be larger but should delegate to hooks and sub-components

**Parameters:**
- Use options objects for functions with multiple parameters:
```typescript
interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
  onConfirmLeave?: () => void;
}
```

**Return Values:**
- Hooks return structured objects with named properties
- API handlers return `NextResponse.json()` with consistent structure
- Use typed return types for complex functions

## Module Design

**Exports:**
- Named exports for utilities and hooks: `export function useAuth() { ... }`
- Default exports for page components: `export default function DashboardPage() { ... }`
- Named exports for UI components: `export const Button = forwardRef(...)`

**Barrel Files:**
- `types/index.ts` re-exports from `database.ts` and adds shared types
- UI components export from individual files (no barrel)

## React Patterns

**Client Components:**
- Mark with `'use client'` directive at top of file
- Use hooks for state management and side effects
- Prefer controlled components for forms

**Server Components:**
- Default for pages when possible (no directive needed)
- Use `async` functions for data fetching

**Context Providers:**
- Located in `lib/{feature}/{feature}-context.tsx`
- Export both hook (`useAuth`) and provider (`AuthProvider`)
- Initialize context with sensible defaults

**Pattern:**
```typescript
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => {},
  updateProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) { ... }
```

## Component Patterns

**Compound Components (Radix UI wrappers):**
```typescript
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = forwardRef<...>(({ className, children, ...props }, ref) => (
  ...
));
DialogContent.displayName = "DialogContent";
```

**Button with variants:**
```typescript
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = { ... };
const sizeStyles: Record<ButtonSize, string> = { ... };
```

## CSS/Tailwind Conventions

**Utility function:**
```typescript
// lib/shared/cn.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Design tokens via CSS variables:**
- Colors: `var(--bg)`, `var(--text-primary)`, `var(--brand)`, etc.
- Mapped in `tailwind.config.ts` to semantic names: `bg-surface`, `text-brand`

**Class organization:**
- Layout/positioning first
- Sizing
- Colors/backgrounds
- Typography
- States (hover, focus)
- Animations

**Accessibility:**
- Minimum 44x44px touch targets for interactive elements
- Focus visible rings: `focus-visible:outline-none focus-visible:ring-2`
- Screen reader text: `<span className="sr-only">...</span>`
- ARIA attributes for interactive elements

## Data Validation

**Schema Location:** `lib/validation/template-schema.ts`

**Pattern (Zod):**
```typescript
export const templateFormSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name must be less than 100 characters'),
  // ...
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;
```

**Shared validation:** Use SAME schema on client and server for consistency.

## Authentication Patterns

**Supabase client creation:**
- Browser: Dynamic import in hooks/components
- Server: `createSupabaseServerClient()` from `lib/supabase/server.ts`

**Auth check in API routes:**
```typescript
const supabase = await createSupabaseServerClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Authentication required.' },
    { status: 401 }
  );
}
```

## Security Conventions

**CSRF Protection:**
- Use `useCsrf` hook for forms
- Validate token server-side before processing

**Environment Variables:**
- Use `getRequiredEnv()` helper that throws if missing
- Prefix public vars with `NEXT_PUBLIC_`

**Secrets:**
- Never commit `.env` files
- Check for placeholder values before processing (e.g., `'your_stripe_webhook_secret'`)

---

*Convention analysis: 2026-01-16*
