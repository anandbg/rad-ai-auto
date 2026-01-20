import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createSupabaseServerClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Update profile with acknowledgment timestamp
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ terms_acknowledged_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[Acknowledge Terms] Update failed:', updateError);
    return NextResponse.json(
      { error: 'Failed to save acknowledgment' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
