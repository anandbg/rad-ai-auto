import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for clone request
const cloneRequestSchema = z.object({
  globalTemplateId: z.string().uuid('Invalid template ID'),
  name: z.string().min(1).max(100).optional()
});

/**
 * POST /api/templates/clone
 *
 * Clones a published global template to the user's personal collection.
 * Allows customization of the cloned template name.
 */
export async function POST(request: NextRequest) {
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

    // Validate request
    const result = cloneRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid clone request',
          zodErrors: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        },
        { status: 400 }
      );
    }

    const { globalTemplateId, name: customName } = result.data;

    // Fetch the global template (must be published)
    const { data: globalTemplate, error: fetchError } = await supabase
      .from('templates_global')
      .select('*')
      .eq('id', globalTemplateId)
      .eq('is_published', true)
      .single();

    if (fetchError || !globalTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Global template not found or not published'
        },
        { status: 404 }
      );
    }

    // Create personal template from global
    const clonedTemplate = {
      user_id: user.id,
      origin_global_id: globalTemplate.id,
      name: customName || `${globalTemplate.name} (Copy)`,
      modality: globalTemplate.modality,
      body_part: globalTemplate.body_part,
      description: globalTemplate.description,
      content: globalTemplate.content,
      tags: globalTemplate.tags || []
    };

    // Insert into personal templates
    const { data: newTemplate, error: insertError } = await supabase
      .from('templates_personal')
      .insert(clonedTemplate)
      .select()
      .single();

    if (insertError) {
      console.error('Error cloning template:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to clone template'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Template cloned successfully',
        data: {
          id: newTemplate.id,
          name: newTemplate.name,
          modality: newTemplate.modality,
          bodyPart: newTemplate.body_part,
          description: newTemplate.description,
          content: newTemplate.content,
          isGlobal: false,
          originGlobalId: newTemplate.origin_global_id,
          createdAt: newTemplate.created_at,
          updatedAt: newTemplate.updated_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/templates/clone:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
