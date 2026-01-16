import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * PUT /api/macros/[id]
 *
 * Updates a macro owned by the authenticated user.
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

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            message: 'Name must be a non-empty string'
          },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim().toLowerCase();
    }

    if (body.replacementText !== undefined) {
      if (typeof body.replacementText !== 'string' || !body.replacementText.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            message: 'Replacement text must be a non-empty string'
          },
          { status: 400 }
        );
      }
      updateData.replacement_text = body.replacementText.trim();
    }

    if (body.isActive !== undefined) {
      updateData.is_active = body.isActive === true;
    }

    if (body.isSmartMacro !== undefined) {
      updateData.is_smart = body.isSmartMacro === true;
    }

    if (body.contextExpansions !== undefined) {
      updateData.smart_context = body.contextExpansions;
    }

    if (body.categoryId !== undefined) {
      updateData.category_id = body.categoryId || null;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'No valid fields to update'
        },
        { status: 400 }
      );
    }

    // Update macro (RLS ensures user can only update their own)
    const { data: macro, error: updateError } = await supabase
      .from('transcription_macros')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !macro) {
      // Check if macro exists
      const { data: exists } = await supabase
        .from('transcription_macros')
        .select('id, user_id')
        .eq('id', id)
        .single();

      if (!exists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not Found',
            message: 'Macro not found'
          },
          { status: 404 }
        );
      }

      // Macro exists but user doesn't own it
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to update this macro'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Macro updated successfully',
      data: {
        id: macro.id,
        name: macro.name,
        replacementText: macro.replacement_text,
        isActive: macro.is_active,
        isGlobal: macro.is_global,
        isSmartMacro: macro.is_smart,
        contextExpansions: macro.smart_context,
        categoryId: macro.category_id,
        createdAt: macro.created_at,
        updatedAt: macro.updated_at,
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/macros/[id]:', error);
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
 * DELETE /api/macros/[id]
 *
 * Deletes a macro owned by the authenticated user.
 */
export async function DELETE(
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

    // First check if macro exists and belongs to user
    const { data: existing } = await supabase
      .from('transcription_macros')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Macro not found'
        },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to delete this macro'
        },
        { status: 403 }
      );
    }

    // Delete macro
    const { error: deleteError } = await supabase
      .from('transcription_macros')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting macro:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to delete macro'
        },
        { status: 500 }
      );
    }

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/macros/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
