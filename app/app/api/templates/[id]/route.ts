import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { templateFormSchema, formatZodErrors } from '@/lib/validation/template-schema';

/**
 * GET /api/templates/[id]
 *
 * Retrieves a template by ID.
 * Checks personal templates first, then global templates (published only).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    // First, try to find in personal templates (user's own)
    const { data: personalTemplate, error: personalError } = await supabase
      .from('templates_personal')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (personalTemplate && !personalError) {
      return NextResponse.json({
        success: true,
        data: {
          id: personalTemplate.id,
          name: personalTemplate.name,
          modality: personalTemplate.modality,
          bodyPart: personalTemplate.body_part,
          description: personalTemplate.description,
          content: personalTemplate.content,
          isGlobal: false,
          originGlobalId: personalTemplate.origin_global_id,
          createdAt: personalTemplate.created_at,
          updatedAt: personalTemplate.updated_at
        }
      });
    }

    // If not found in personal, check global templates (published only)
    const { data: globalTemplate, error: globalError } = await supabase
      .from('templates_global')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (globalTemplate && !globalError) {
      return NextResponse.json({
        success: true,
        data: {
          id: globalTemplate.id,
          name: globalTemplate.name,
          modality: globalTemplate.modality,
          bodyPart: globalTemplate.body_part,
          description: globalTemplate.description,
          content: globalTemplate.content,
          isGlobal: true,
          createdAt: globalTemplate.created_at,
          updatedAt: globalTemplate.updated_at
        }
      });
    }

    // Template not found
    return NextResponse.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Template not found'
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in GET /api/templates/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/templates/[id]
 *
 * Updates a personal template owned by the authenticated user.
 * Cannot update global templates (RLS enforces this).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

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

    // Validate using Zod schema
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
    const updateData = {
      name: result.data.name,
      modality: result.data.modality,
      body_part: result.data.bodyPart,
      description: result.data.description,
      content: {
        sections: result.data.sections || [],
        rawContent: result.data.content || ''
      }
    };

    // Update template (RLS ensures user can only update their own)
    const { data: template, error: updateError } = await supabase
      .from('templates_personal')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !template) {
      // Check if template exists but user doesn't own it
      const { data: exists } = await supabase
        .from('templates_personal')
        .select('id')
        .eq('id', id)
        .single();

      if (exists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You do not have permission to update this template'
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Template not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
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
    });
  } catch (error) {
    console.error('Error in PUT /api/templates/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 *
 * Deletes a personal template owned by the authenticated user.
 * Cannot delete global templates (RLS enforces this).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    // Delete template (RLS ensures user can only delete their own)
    const { error: deleteError, count } = await supabase
      .from('templates_personal')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting template:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to delete template'
        },
        { status: 500 }
      );
    }

    // Check if any rows were affected
    if (count === 0) {
      // Check if template exists but user doesn't own it
      const { data: exists } = await supabase
        .from('templates_personal')
        .select('id')
        .eq('id', id)
        .single();

      if (exists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You do not have permission to delete this template'
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Template not found'
        },
        { status: 404 }
      );
    }

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/templates/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
