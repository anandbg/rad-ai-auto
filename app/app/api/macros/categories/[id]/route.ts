import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * DELETE /api/macros/categories/[id]
 *
 * Deletes a macro category owned by the authenticated user.
 * Note: DB has ON DELETE SET NULL for macros referencing this category,
 * so macros in this category will have their category_id set to null.
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

    // First check if category exists and belongs to user
    const { data: existing } = await supabase
      .from('macro_categories')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Category not found'
        },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to delete this category'
        },
        { status: 403 }
      );
    }

    // Delete category (DB will SET NULL on macros referencing this category)
    const { error: deleteError } = await supabase
      .from('macro_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting macro category:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to delete category'
        },
        { status: 500 }
      );
    }

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/macros/categories/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
