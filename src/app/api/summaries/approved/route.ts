import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch approved PR summaries with release entry info
    const { data: prSummaries, error: prError } = await supabaseAdmin
      .from('pr_summaries')
      .select(`
        *,
        release_entries (
          id,
          release_week,
          doc_pr_url,
          doc_pr_merged
        )
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (prError) throw prError;

    // Fetch approved Linear tickets with release entry info
    const { data: linearTickets, error: ticketError } = await supabaseAdmin
      .from('linear_tickets')
      .select(`
        *,
        release_entries (
          id,
          release_week,
          doc_pr_url,
          doc_pr_merged
        )
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (ticketError) throw ticketError;

    return NextResponse.json({
      prSummaries: prSummaries || [],
      linearTickets: linearTickets || [],
    });
  } catch (error) {
    console.error('Error fetching approved summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approved summaries' },
      { status: 500 }
    );
  }
}
