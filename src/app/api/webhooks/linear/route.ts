import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { LinearWebhook } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';
import { summarizeLinearTicket } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('linear-signature');
    const body = await request.text();

    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: LinearWebhook = JSON.parse(body);

    // Only process completed issues
    if (payload.type === 'Issue' && payload.data.completedAt) {
      console.log('Processing completed Linear ticket:', payload.data.identifier);

      const ticket = payload.data;

      // Summarize with LLM
      const summary = await summarizeLinearTicket({
        ticketId: ticket.identifier,
        ticketTitle: ticket.title,
        ticketDescription: ticket.description,
      });

      // Store in database
      const { data, error } = await supabaseAdmin
        .from('linear_tickets')
        .insert({
          ticket_id: ticket.identifier,
          ticket_title: ticket.title,
          ticket_url: ticket.url,
          completed_at: ticket.completedAt!,
          llm_summary: summary.summary,
          category: summary.category, // Store the LLM-determined category
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing Linear ticket summary:', error);
        throw error;
      }

      console.log('Linear ticket summary created:', data.id);

      return NextResponse.json({
        success: true,
        message: 'Ticket processed and summary created',
        summary_id: data.id,
      });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error) {
    console.error('Linear webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('LINEAR_WEBHOOK_SECRET not set, skipping verification');
    return true; // Allow in development
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
