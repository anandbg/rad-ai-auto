import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/macros
 *
 * Retrieves all macros for the authenticated user.
 * Includes category information.
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

    // Fetch macros for this user
    const { data: macros, error: fetchError } = await supabase
      .from('transcription_macros')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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
      data: formattedMacros
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
