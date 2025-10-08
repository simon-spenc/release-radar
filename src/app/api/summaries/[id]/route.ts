import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Database } from '@/types/database';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PRUpdate = Database['public']['Tables']['pr_summaries']['Update'];
type TicketUpdate = Database['public']['Tables']['linear_tickets']['Update'];

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type, status, edited_summary, approved_by } = body;

    if (!type || !['pr', 'ticket'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "pr" or "ticket"' },
        { status: 400 }
      );
    }

    let data, error;

    if (type === 'pr') {
      const updateData: PRUpdate = {};

      if (status) {
        updateData.status = status as 'pending' | 'approved' | 'rejected';
        if (status === 'approved') {
          updateData.approved_at = new Date().toISOString();
          updateData.approved_by = approved_by || 'unknown';
        }
      }

      if (edited_summary !== undefined) {
        updateData.edited_summary = edited_summary;
      }

      // @ts-ignore - Supabase type inference issue
      const result = await supabaseAdmin
        .from('pr_summaries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const updateData: TicketUpdate = {};

      if (status) {
        updateData.status = status as 'pending' | 'approved' | 'rejected';
        if (status === 'approved') {
          updateData.approved_at = new Date().toISOString();
          updateData.approved_by = approved_by || 'unknown';
        }
      }

      if (edited_summary !== undefined) {
        updateData.edited_summary = edited_summary;
      }

      // @ts-ignore - Supabase type inference issue
      const result = await supabaseAdmin
        .from('linear_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    // If approved, create release entry
    if (status === 'approved') {
      const releaseWeek = getWeekStartDate(new Date());
      const entryData: any = {
        release_week: releaseWeek,
      };

      if (type === 'pr') {
        entryData.pr_summary_id = id;
      } else {
        entryData.linear_ticket_id = id;
      }

      await supabaseAdmin.from('release_entries').insert(entryData);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating summary:', error);
    return NextResponse.json(
      { error: 'Failed to update summary' },
      { status: 500 }
    );
  }
}

function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}
