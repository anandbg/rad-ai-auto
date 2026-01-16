import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Database column to frontend key mapping
interface DbPreferences {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_template_id: string | null;
  default_brand_template_id: string | null;
  yolo_mode_enabled: boolean;
  keyboard_shortcuts_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTemplate: string | null;
  autoSave: boolean; // Maps to keyboard_shortcuts_enabled
  yoloMode: boolean;
  onboardingCompleted: boolean;
}

// Default preferences (returned when no DB row exists)
const DEFAULT_PREFERENCES: ApiPreferences = {
  theme: 'system',
  defaultTemplate: null,
  autoSave: true,
  yoloMode: false,
  onboardingCompleted: false,
};

// Convert DB row to API format
function dbToApi(row: DbPreferences): ApiPreferences {
  return {
    theme: row.theme,
    defaultTemplate: row.default_template_id,
    autoSave: row.keyboard_shortcuts_enabled,
    yoloMode: row.yolo_mode_enabled,
    onboardingCompleted: row.onboarding_completed,
  };
}

// GET /api/preferences - Fetch user preferences
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to access preferences.',
        },
        { status: 401 }
      );
    }

    // Query user_preferences table
    const { data: preferences, error: dbError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      // This is expected when no preferences row exists yet
      console.error('Error fetching preferences:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return preferences (or defaults if no row exists)
    if (!preferences) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_PREFERENCES,
      });
    }

    return NextResponse.json({
      success: true,
      data: dbToApi(preferences as DbPreferences),
    });
  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to update preferences.',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as Partial<ApiPreferences>;

    // Build the update object (only include provided fields)
    const updateData: Record<string, unknown> = {
      user_id: user.id,
    };

    if (body.theme !== undefined) {
      // Validate theme value
      if (!['light', 'dark', 'system'].includes(body.theme)) {
        return NextResponse.json(
          { error: 'Invalid theme value. Must be light, dark, or system.' },
          { status: 400 }
        );
      }
      updateData.theme = body.theme;
    }

    if (body.defaultTemplate !== undefined) {
      updateData.default_template_id = body.defaultTemplate;
    }

    if (body.autoSave !== undefined) {
      updateData.keyboard_shortcuts_enabled = body.autoSave;
    }

    if (body.yoloMode !== undefined) {
      updateData.yolo_mode_enabled = body.yoloMode;
    }

    if (body.onboardingCompleted !== undefined) {
      updateData.onboarding_completed = body.onboardingCompleted;
    }

    // UPSERT: insert if not exists, update if exists
    const { data: preferences, error: upsertError } = await supabase
      .from('user_preferences')
      .upsert(updateData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting preferences:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dbToApi(preferences as DbPreferences),
    });
  } catch (error) {
    console.error('Error in preferences PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
