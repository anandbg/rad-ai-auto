import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface AdminStats {
  users: {
    total: number;
    admins: number;
    radiologists: number;
    newThisMonth: number;
  };
  usage: {
    totalReports: number;
    reportsThisMonth: number;
    totalTranscriptions: number;
    transcriptionsThisMonth: number;
  };
  subscriptions: {
    free: number;
    plus: number;
    pro: number;
    activeCount: number;
  };
  templates: {
    globalPublished: number;
    globalDraft: number;
    personalTotal: number;
  };
}

function getStartOfMonth(): string {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return startOfMonth.toISOString();
}

export async function GET() {
  try {
    // Check authentication using Supabase
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Return 401 if not authenticated
    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to access this resource.'
        },
        { status: 401 }
      );
    }

    // Get the current user's profile to check role
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        {
          error: 'Profile not found',
          message: 'User profile could not be loaded.'
        },
        { status: 404 }
      );
    }

    // Return 403 if user is not an admin
    if (currentProfile.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Access denied. Admin role required to access this resource.'
        },
        { status: 403 }
      );
    }

    const startOfMonth = getStartOfMonth();

    // Fetch all statistics in parallel
    const [
      profilesResult,
      profilesThisMonthResult,
      reportsResult,
      reportsThisMonthResult,
      transcriptionsResult,
      transcriptionsThisMonthResult,
      subscriptionsResult,
      activeSubscriptionsResult,
      globalTemplatesPublishedResult,
      globalTemplatesDraftResult,
      personalTemplatesResult,
    ] = await Promise.all([
      // User stats
      supabase.from('profiles').select('role'),
      supabase.from('profiles').select('user_id').gte('created_at', startOfMonth),

      // Usage stats - reports
      supabase.from('report_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('report_sessions').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),

      // Usage stats - transcriptions (completed only)
      supabase.from('transcribe_sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('transcribe_sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', startOfMonth),

      // Subscription stats by plan
      supabase.from('subscriptions').select('plan'),
      supabase.from('subscriptions').select('user_id', { count: 'exact', head: true }).eq('status', 'active'),

      // Template stats
      supabase.from('templates_global').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('templates_global').select('id', { count: 'exact', head: true }).eq('is_published', false),
      supabase.from('templates_personal').select('id', { count: 'exact', head: true }),
    ]);

    // Calculate user stats
    const profiles = profilesResult.data || [];
    const totalUsers = profiles.length;
    const admins = profiles.filter(p => p.role === 'admin').length;
    const radiologists = profiles.filter(p => p.role === 'radiologist').length;
    const newThisMonth = profilesThisMonthResult.data?.length || 0;

    // Calculate subscription stats by plan
    const subscriptions = subscriptionsResult.data || [];
    const freeCount = subscriptions.filter(s => s.plan === 'free').length;
    const plusCount = subscriptions.filter(s => s.plan === 'plus').length;
    const proCount = subscriptions.filter(s => s.plan === 'pro').length;

    const stats: AdminStats = {
      users: {
        total: totalUsers,
        admins,
        radiologists,
        newThisMonth,
      },
      usage: {
        totalReports: reportsResult.count || 0,
        reportsThisMonth: reportsThisMonthResult.count || 0,
        totalTranscriptions: transcriptionsResult.count || 0,
        transcriptionsThisMonth: transcriptionsThisMonthResult.count || 0,
      },
      subscriptions: {
        free: freeCount,
        plus: plusCount,
        pro: proCount,
        activeCount: activeSubscriptionsResult.count || 0,
      },
      templates: {
        globalPublished: globalTemplatesPublishedResult.count || 0,
        globalDraft: globalTemplatesDraftResult.count || 0,
        personalTotal: personalTemplatesResult.count || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
