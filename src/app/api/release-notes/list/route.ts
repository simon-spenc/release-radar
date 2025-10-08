import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: releaseNotes, error } = await supabaseAdmin
      .from('release_notes')
      .select('*')
      .order('week_starting', { ascending: false });

    if (error) {
      console.error('Error fetching release notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch release notes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ releaseNotes });
  } catch (error) {
    console.error('Error in release notes list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
