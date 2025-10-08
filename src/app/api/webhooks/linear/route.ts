import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { LinearWebhook } from '@/types';

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
      // TODO: Process ticket and create summary
      console.log('Processing completed Linear ticket:', payload.data.identifier);

      // This will be implemented in the next phase
      return NextResponse.json({
        success: true,
        message: 'Ticket queued for processing'
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
