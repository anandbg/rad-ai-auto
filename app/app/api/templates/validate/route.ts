import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { templateFormSchema, formatZodErrors } from '@/lib/validation/template-schema';

/**
 * POST /api/templates/validate
 *
 * Server-side validation endpoint for templates.
 * Uses the SAME Zod schema as the client-side form validation to ensure consistency.
 *
 * This endpoint:
 * 1. Requires authentication
 * 2. Validates the template data using Zod schema
 * 3. Returns validation errors in the same format as client-side
 */
export async function POST(request: NextRequest) {
  // Check authentication using Supabase
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in to access this resource.'
      },
      { status: 401 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid Request',
        message: 'Request body must be valid JSON'
      },
      { status: 400 }
    );
  }

  // Validate using the SAME Zod schema as client-side
  const result = templateFormSchema.safeParse(body);

  if (!result.success) {
    // Return validation errors in the same format as client-side
    const errors = formatZodErrors(result.error);

    return NextResponse.json(
      {
        success: false,
        error: 'Validation Error',
        message: 'Template data failed validation',
        validationErrors: errors,
        // Include raw Zod errors for debugging
        zodErrors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      },
      { status: 400 }
    );
  }

  // Validation passed
  return NextResponse.json({
    success: true,
    message: 'Template data is valid',
    data: result.data
  });
}
