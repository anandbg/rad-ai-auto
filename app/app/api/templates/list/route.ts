import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // Fetch personal templates for this user
    const { data: personalTemplates, error: personalError } = await supabase
      .from('templates_personal')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (personalError) {
      console.error('Error fetching personal templates:', personalError);
    }

    // Fetch published global templates
    const { data: globalTemplates, error: globalError } = await supabase
      .from('templates_global')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (globalError) {
      console.error('Error fetching global templates:', globalError);
    }

    // Get user profile for role info
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Format templates for response
    const formattedTemplates = [
      ...(personalTemplates || []).map(t => ({
        id: t.id,
        name: t.name,
        modality: t.modality,
        bodyPart: t.body_part,
        description: t.description,
        isGlobal: false,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
      ...(globalTemplates || []).map(t => ({
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

    return NextResponse.json({
      success: true,
      data: formattedTemplates,
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
