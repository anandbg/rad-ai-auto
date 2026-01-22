import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates/list
 *
 * Retrieves templates for the authenticated user with pagination support.
 *
 * Query params:
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 * - type: 'personal' | 'global' | 'all' (default 'all')
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication using Supabase
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to access this resource.'
        },
        { status: 401 }
      );
    }

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || 'all'; // 'personal' | 'global' | 'all'

    // Get user profile for role info
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Handle type-specific queries with pagination
    if (type === 'personal') {
      const { data, error, count } = await supabase
        .from('templates_personal')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching personal templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
      }

      const formatted = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        modality: t.modality,
        bodyPart: t.body_part,
        description: t.description,
        isGlobal: false,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      return NextResponse.json({
        success: true,
        data: formatted,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0),
        },
        user: {
          id: user.id,
          role: profile?.role || 'radiologist',
        },
      });
    }

    if (type === 'global') {
      const { data, error, count } = await supabase
        .from('templates_global')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching global templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
      }

      const formatted = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        modality: t.modality,
        bodyPart: t.body_part,
        description: t.description,
        isGlobal: true,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      return NextResponse.json({
        success: true,
        data: formatted,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0),
        },
        user: {
          id: user.id,
          role: profile?.role || 'radiologist',
        },
      });
    }

    // Default: return all templates (personal + global) with combined pagination
    // For 'all' type, we fetch both and combine client-side
    // This maintains backward compatibility with existing code
    const [personalResult, globalResult] = await Promise.all([
      supabase
        .from('templates_personal')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('templates_global')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .order('updated_at', { ascending: false }),
    ]);

    if (personalResult.error) {
      console.error('Error fetching personal templates:', personalResult.error);
    }
    if (globalResult.error) {
      console.error('Error fetching global templates:', globalResult.error);
    }

    // Combine and format all templates
    const allTemplates = [
      ...(personalResult.data || []).map(t => ({
        id: t.id,
        name: t.name,
        modality: t.modality,
        bodyPart: t.body_part,
        description: t.description,
        isGlobal: false,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
      ...(globalResult.data || []).map(t => ({
        id: t.id,
        name: t.name,
        modality: t.modality,
        bodyPart: t.body_part,
        description: t.description,
        isGlobal: true,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    ];

    // Sort combined by updatedAt and apply pagination
    allTemplates.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const totalCount = allTemplates.length;
    const paginatedData = allTemplates.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount,
      },
      user: {
        id: user.id,
        role: profile?.role || 'radiologist',
      },
    });
  } catch (error) {
    console.error('Error in templates list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
