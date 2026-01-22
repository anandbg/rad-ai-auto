import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/macros
 *
 * Retrieves macros for the authenticated user with pagination support.
 *
 * Query params:
 * - limit: number (default 100, max 200)
 * - offset: number (default 0)
 * - category: string (optional category_id filter)
 * - active: 'true' | 'false' (optional active status filter)
 */
export async function GET(request: NextRequest) {
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

    // Parse pagination and filter params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const categoryId = searchParams.get('category');
    const activeFilter = searchParams.get('active');

    // Build query with filters
    let query = supabase
      .from('transcription_macros')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply optional filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (activeFilter === 'true') {
      query = query.eq('is_active', true);
    } else if (activeFilter === 'false') {
      query = query.eq('is_active', false);
    }

    // Apply pagination and ordering
    const { data: macros, error: fetchError, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Error fetching macros:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to fetch macros'
        },
        { status: 500 }
      );
    }

    // Format macros for response (map DB columns to frontend fields)
    const formattedMacros = (macros || []).map(m => ({
      id: m.id,
      name: m.name,
      replacementText: m.replacement_text,
      isActive: m.is_active,
      isGlobal: m.is_global,
      isSmartMacro: m.is_smart,
      contextExpansions: m.smart_context,
      categoryId: m.category_id,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMacros,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/macros:', error);
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
 * POST /api/macros
 *
 * Creates a new macro for the authenticated user.
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

    if (!body.replacementText || typeof body.replacementText !== 'string' || !body.replacementText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Replacement text is required'
        },
        { status: 400 }
      );
    }

    // Map frontend fields to DB columns
    const insertData = {
      user_id: user.id,
      name: body.name.trim().toLowerCase(),
      replacement_text: body.replacementText.trim(),
      is_active: body.isActive !== false, // Default to true
      is_smart: body.isSmartMacro === true,
      smart_context: body.contextExpansions || null,
      category_id: body.categoryId || null,
    };

    // Insert macro
    const { data: macro, error: insertError } = await supabase
      .from('transcription_macros')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating macro:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to create macro'
        },
        { status: 500 }
      );
    }

    // Return created macro with frontend field names
    return NextResponse.json({
      success: true,
      message: 'Macro created successfully',
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/macros:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
