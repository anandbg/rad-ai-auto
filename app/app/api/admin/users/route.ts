import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // Fetch all users from profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Format users for response
    const formattedUsers = (users || []).map(u => ({
      id: u.user_id,
      email: u.email || '',
      name: u.name || '',
      role: u.role || 'radiologist',
      specialty: u.specialty,
      institution: u.institution,
      createdAt: u.created_at,
      lastActive: u.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      totalUsers: formattedUsers.length,
    });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
