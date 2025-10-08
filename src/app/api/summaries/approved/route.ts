import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch approved PR summaries (doc info now stored directly on PRs)
    const { data: prSummaries, error: prError } = await supabaseAdmin
      .from('pr_summaries')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (prError) throw prError;

    // Fetch approved Linear tickets (doc info now stored directly on tickets)
    const { data: linearTickets, error: ticketError } = await supabaseAdmin
      .from('linear_tickets')
      .select('*')
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
