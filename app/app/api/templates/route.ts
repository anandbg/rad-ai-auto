import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { templateFormSchema, formatZodErrors } from '@/lib/validation/template-schema';

/**
 * POST /api/templates
 *
 * Creates a new personal template for the authenticated user.
 * Validates template data using Zod schema before inserting into database.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate using the Zod schema
    const result = templateFormSchema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Template data failed validation',
          validationErrors: errors,
          zodErrors: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        },
        { status: 400 }
      );
    }

    // Map form data to database columns
    const templateData = {
      user_id: user.id,
      name: result.data.name,
      modality: result.data.modality,
      body_part: result.data.bodyPart,
      description: result.data.description,
      content: {
        sections: result.data.sections || [],
        rawContent: result.data.content || ''
      }
    };

    // Insert into templates_personal
    const { data: template, error: insertError } = await supabase
      .from('templates_personal')
      .insert(templateData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating template:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to create template'
        },
        { status: 500 }
      );
    }

    // Format response to match API conventions
    return NextResponse.json(
      {
        success: true,
        message: 'Template created successfully',
        data: {
          id: template.id,
          name: template.name,
          modality: template.modality,
          bodyPart: template.body_part,
          description: template.description,
          content: template.content,
          isGlobal: false,
          createdAt: template.created_at,
          updatedAt: template.updated_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
