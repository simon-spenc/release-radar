import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: releaseNote, error } = await supabaseAdmin
      .from('release_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Release note not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching release note:', error);
      return NextResponse.json(
        { error: 'Failed to fetch release note', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ releaseNote });
  } catch (error) {
    console.error('Error in release note detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
