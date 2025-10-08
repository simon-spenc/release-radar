import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch pending PR summaries
    const { data: prSummaries, error: prError } = await supabaseAdmin
      .from('pr_summaries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (prError) throw prError;

    // Fetch pending Linear tickets
    const { data: linearTickets, error: ticketError } = await supabaseAdmin
      .from('linear_tickets')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (ticketError) throw ticketError;

    return NextResponse.json({
      prSummaries: prSummaries || [],
      linearTickets: linearTickets || [],
    });
  } catch (error) {
    console.error('Error fetching pending summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending summaries' },
      { status: 500 }
    );
  }
}
