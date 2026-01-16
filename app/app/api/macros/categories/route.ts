import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/macros/categories
 *
 * Retrieves all macro categories for the authenticated user.
 */
export async function GET() {
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

    // Fetch categories for this user
    const { data: categories, error: fetchError } = await supabase
      .from('macro_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching macro categories:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to fetch categories'
        },
        { status: 500 }
      );
    }

    // Format categories for response (map DB columns to frontend fields)
    const formattedCategories = (categories || []).map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
      createdAt: c.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Error in GET /api/macros/categories:', error);
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
 * POST /api/macros/categories
 *
 * Creates a new macro category for the authenticated user.
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

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Name is required'
        },
        { status: 400 }
      );
    }

    // Map frontend fields to DB columns
    const insertData = {
      user_id: user.id,
      name: body.name.trim(),
      parent_id: body.parentId || null,
    };

    // Insert category
    const { data: category, error: insertError } = await supabase
      .from('macro_categories')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating macro category:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to create category'
        },
        { status: 500 }
      );
    }

    // Return created category with frontend field names
    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category.id,
        name: category.name,
        parentId: category.parent_id,
        createdAt: category.created_at,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/macros/categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
