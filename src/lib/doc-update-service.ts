import {
  getDefaultBranchSHA,
  createBranch,
  getFileContent,
  updateFile,
  createPullRequest,
} from './github-service';
import { generateDocUpdate } from './llm-service';
import { supabaseAdmin } from './supabase';

const DOCS_REPO_OWNER = process.env.DOCS_REPO_OWNER || 'simon-spenc';
const DOCS_REPO_NAME = process.env.DOCS_REPO_NAME || 'release-radar-docs';

export interface DocUpdateResult {
  docPrUrl: string;
  docPrNumber: number;
  filesUpdated: string[];
  branchName: string;
}

/**
 * Process documentation updates for an approved PR summary
 */
export async function processDocUpdateForPR(prSummaryId: string): Promise<DocUpdateResult> {
  // 1. Fetch the approved PR summary from database
  const { data: prSummary, error } = await supabaseAdmin
    .from('pr_summaries')
    .select('*')
    .eq('id', prSummaryId)
    .eq('status', 'approved')
    .single();

  if (error || !prSummary) {
    throw new Error(`PR summary not found or not approved: ${prSummaryId}`);
  }

  const summary = prSummary.edited_summary || prSummary.llm_summary;
  const suggestedPages = prSummary.code_changes?.suggestedDocPages || [];

  // If no suggested pages, use default pages
  const docPagesToUpdate = suggestedPages.length > 0
    ? suggestedPages
    : ['app/docs/api/page.md'];

  return await processDocUpdate({
    summary,
    category: prSummary.code_changes?.category || 'other',
    docPagesToUpdate,
    prNumber: prSummary.pr_number,
    prTitle: prSummary.pr_title,
    prUrl: prSummary.pr_url,
    sourceType: 'pr',
    sourceId: prSummaryId,
  });
}

/**
 * Process documentation updates for an approved Linear ticket
 */
export async function processDocUpdateForLinear(ticketId: string): Promise<DocUpdateResult> {
  // 1. Fetch the approved Linear ticket from database
  const { data: ticket, error } = await supabaseAdmin
    .from('linear_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('status', 'approved')
    .single();

  if (error || !ticket) {
    throw new Error(`Linear ticket not found or not approved: ${ticketId}`);
  }

  const summary = ticket.edited_summary || ticket.llm_summary;
  const suggestedPages = ticket.suggested_doc_pages || [];

  // If no suggested pages, use default pages
  const docPagesToUpdate = suggestedPages.length > 0
    ? suggestedPages
    : ['app/docs/api/page.md'];

  return await processDocUpdate({
    summary,
    category: 'feature',
    docPagesToUpdate,
    prNumber: null,
    prTitle: ticket.ticket_title,
    prUrl: ticket.ticket_url,
    sourceType: 'linear',
    sourceId: ticketId,
  });
}

interface ProcessDocUpdateParams {
  summary: string;
  category: 'feature' | 'fix' | 'improvement' | 'docs' | 'other';
  docPagesToUpdate: string[];
  prNumber: number | null;
  prTitle: string;
  prUrl: string;
  sourceType: 'pr' | 'linear';
  sourceId: string;
}

async function processDocUpdate(params: ProcessDocUpdateParams): Promise<DocUpdateResult> {
  const {
    summary,
    category,
    docPagesToUpdate,
    prNumber,
    prTitle,
    prUrl,
    sourceType,
    sourceId,
  } = params;

  // 2. Get default branch SHA
  const defaultBranchSHA = await getDefaultBranchSHA(DOCS_REPO_OWNER, DOCS_REPO_NAME);

  // 3. Create a new branch with unique timestamp to avoid conflicts
  const timestamp = Date.now();
  const branchName = prNumber
    ? `docs-update-pr-${prNumber}-${timestamp}`
    : `docs-update-${sourceType}-${timestamp}`;

  await createBranch(DOCS_REPO_OWNER, DOCS_REPO_NAME, branchName, defaultBranchSHA);

  const filesUpdated: string[] = [];

  // 4. For each suggested doc page, generate and apply updates
  for (const docPath of docPagesToUpdate) {
    try {
      // Get existing content
      const { content: existingContent, sha } = await getFileContent(
        DOCS_REPO_OWNER,
        DOCS_REPO_NAME,
        docPath,
        branchName
      );

      // Generate updated content using LLM
      const { updatedContent, changeRationale } = await generateDocUpdate({
        summary,
        category,
        existingContent,
        docPath,
      });

      console.log(`Updating ${docPath}: ${changeRationale}`);

      // Update the file in the new branch
      await updateFile(
        DOCS_REPO_OWNER,
        DOCS_REPO_NAME,
        docPath,
        updatedContent,
        `docs: Update ${docPath} for ${sourceType === 'pr' ? `PR #${prNumber}` : prTitle}`,
        branchName,
        sha
      );

      filesUpdated.push(docPath);
    } catch (error) {
      console.error(`Error updating ${docPath}:`, error);
      // Continue with other files even if one fails
    }
  }

  if (filesUpdated.length === 0) {
    throw new Error('No documentation files were updated');
  }

  // 5. Create a PR in the docs repo
  const prBody = `## Documentation Update

This PR updates documentation based on ${sourceType === 'pr' ? `merged PR #${prNumber}` : 'completed Linear ticket'}.

**Original ${sourceType === 'pr' ? 'PR' : 'Ticket'}:** ${prUrl}

**Summary:**
${summary}

**Files Updated:**
${filesUpdated.map(f => `- ${f}`).join('\n')}

---
🤖 Generated automatically by Release Radar`;

  const { url: docPrUrl, number: docPrNumber } = await createPullRequest(
    DOCS_REPO_OWNER,
    DOCS_REPO_NAME,
    `docs: Update for ${prNumber ? `PR #${prNumber}` : prTitle}`,
    prBody,
    branchName,
    'main' // base branch
  );

  // 6. Create release entry in database
  const releaseEntryData = {
    [sourceType === 'pr' ? 'pr_summary_id' : 'linear_ticket_id']: sourceId,
    release_week: getStartOfWeek(new Date()),
    doc_pages_updated: filesUpdated.map(path => ({
      path,
      url: `https://release-radar-docs.vercel.app/${path.replace('app/', '').replace('/page.md', '')}`,
      change_type: category,
    })),
    doc_pr_url: docPrUrl,
    doc_pr_merged: false,
  };

  const { error: insertError } = await supabaseAdmin
    .from('release_entries')
    .insert(releaseEntryData);

  if (insertError) {
    console.error('Error creating release entry:', insertError);
  }

  return {
    docPrUrl,
    docPrNumber,
    filesUpdated,
    branchName,
  };
}

/**
 * Get the start of the current week (Monday)
 */
function getStartOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}
