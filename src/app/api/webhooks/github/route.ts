import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { GitHubPRWebhook } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';
import { getPRDiff } from '@/lib/github-service';
import { summarizePR } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: GitHubPRWebhook = JSON.parse(body);

    // Only process merged PRs
    if (payload.action === 'closed' && payload.pull_request.merged_at) {
      console.log('Processing merged PR:', payload.pull_request.number);

      const pr = payload.pull_request;
      const [owner, repo] = payload.repository.full_name.split('/');

      // Fetch PR diff from GitHub
      const { diff, files } = await getPRDiff(owner, repo, pr.number);

      // Summarize with LLM
      const summary = await summarizePR({
        prNumber: pr.number,
        prTitle: pr.title,
        prDescription: pr.body,
        diff,
        filesChanged: files.map((f) => f.filename),
        additions: pr.additions,
        deletions: pr.deletions,
        repository: payload.repository.full_name,
      });

      // Store in database
      const { data, error } = await supabaseAdmin
        .from('pr_summaries')
        .insert({
          pr_number: pr.number,
          pr_title: pr.title,
          pr_url: pr.html_url,
          repository: payload.repository.full_name,
          merged_at: pr.merged_at!,
          author: pr.user.login,
          code_changes: {
            files_changed: pr.changed_files,
            additions: pr.additions,
            deletions: pr.deletions,
            files: files.map((f) => f.filename),
            category: summary.category, // Store the LLM-determined category
          },
          llm_summary: summary.summary,
          original_description: pr.body,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing PR summary:', error);
        throw error;
      }

      console.log('PR summary created:', data.id);

      return NextResponse.json({
        success: true,
        message: 'PR processed and summary created',
        summary_id: data.id,
      });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not set, skipping verification');
    return true; // Allow in development
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
