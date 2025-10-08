import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentWeekStart } from '@/lib/release-notes-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week') || getCurrentWeekStart();

    const { data, error } = await supabaseAdmin
      .from('release_notes')
      .select('*')
      .eq('week_starting', weekStart)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay
      throw error;
    }

    if (!data) {
      return NextResponse.json({ releaseNote: null });
    }

    return NextResponse.json({ releaseNote: data });
  } catch (error) {
    console.error('Error fetching release notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch release notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
