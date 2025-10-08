import Anthropic from '@anthropic-ai/sdk';
import { retryWithBackoff } from './retry';

// Lazy initialization to ensure API key is loaded
let anthropic: Anthropic | null = null;

function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

export interface PRSummaryRequest {
  prNumber: number;
  prTitle: string;
  prDescription: string | null;
  diff: string;
  filesChanged: string[];
  additions: number;
  deletions: number;
  repository: string;
}

export interface PRSummaryResponse {
  summary: string;
  suggestedDocPages: string[];
  category: 'feature' | 'fix' | 'improvement' | 'docs' | 'other';
}

export async function summarizePR(request: PRSummaryRequest): Promise<PRSummaryResponse> {
  const prompt = `You are a technical documentation writer reviewing a GitHub Pull Request.

**PR Details:**
- Repository: ${request.repository}
- PR #${request.prNumber}: ${request.prTitle}
- Files changed: ${request.filesChanged.length} (+${request.additions} -${request.deletions})
- Description: ${request.prDescription || 'N/A'}

**Files Changed:**
${request.filesChanged.slice(0, 20).join('\n')}
${request.filesChanged.length > 20 ? `... and ${request.filesChanged.length - 20} more files` : ''}

**Code Diff (first 3000 characters):**
\`\`\`
${request.diff.slice(0, 3000)}
${request.diff.length > 3000 ? '\n... (truncated)' : ''}
\`\`\`

Please provide:
1. A clear, user-friendly summary (2-3 sentences) of what this PR does from a product/user perspective
2. A list of documentation pages that should be updated (based on the changes)
3. Category: feature, fix, improvement, docs, or other

Return your response in this exact JSON format:
{
  "summary": "User-friendly description here",
  "suggestedDocPages": ["page-slug-1", "page-slug-2"],
  "category": "feature"
}`;

  try {
    return await retryWithBackoff(async () => {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const result = JSON.parse(jsonMatch[0]) as PRSummaryResponse;
      return result;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error) {
    console.error('Error summarizing PR with Claude after retries:', error);

    // Fallback summary
    return {
      summary: `Updated ${request.filesChanged.length} files in ${request.repository}. ${request.prTitle}`,
      suggestedDocPages: [],
      category: 'other',
    };
  }
}

export interface LinearTicketSummaryRequest {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string | null;
}

export interface LinearTicketSummaryResponse {
  summary: string;
  suggestedDocPages: string[];
  category: 'feature' | 'fix' | 'improvement' | 'docs' | 'other';
}

export async function summarizeLinearTicket(
  request: LinearTicketSummaryRequest
): Promise<LinearTicketSummaryResponse> {
  const prompt = `You are a technical documentation writer reviewing a Linear ticket that has been completed.

**Ticket Details:**
- Ticket ID: ${request.ticketId}
- Title: ${request.ticketTitle}
- Description: ${request.ticketDescription || 'N/A'}

Please provide:
1. A clear, user-friendly summary (2-3 sentences) of what this ticket accomplished from a product/user perspective
2. A list of documentation pages that should be updated
3. Category: feature, fix, improvement, docs, or other

Return your response in this exact JSON format:
{
  "summary": "User-friendly description here",
  "suggestedDocPages": ["page-slug-1", "page-slug-2"],
  "category": "feature"
}`;

  try {
    return await retryWithBackoff(async () => {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const result = JSON.parse(jsonMatch[0]) as LinearTicketSummaryResponse;
      return result;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error) {
    console.error('Error summarizing Linear ticket with Claude after retries:', error);

    // Fallback summary
    return {
      summary: `Completed: ${request.ticketTitle}`,
      suggestedDocPages: [],
      category: 'other',
    };
  }
}

export interface DocUpdateRequest {
  summary: string;
  category: 'feature' | 'fix' | 'improvement' | 'docs' | 'other';
  existingContent: string;
  docPath: string;
}

export interface DocUpdateResponse {
  updatedContent: string;
  changeRationale: string;
}

/**
 * Generate documentation updates based on approved PR/ticket summary
 */
export async function generateDocUpdate(
  request: DocUpdateRequest
): Promise<DocUpdateResponse> {
  const prompt = `You are a technical documentation writer. You need to update a Markdoc documentation page based on a recently approved change.

**Change Summary:**
${request.summary}

**Change Category:** ${request.category}

**Documentation Page:** ${request.docPath}

**Existing Content:**
\`\`\`markdown
${request.existingContent}
\`\`\`

Please update the documentation to reflect this change. Your updated documentation should:
1. Integrate the new information naturally into the existing content
2. Maintain the existing Markdoc frontmatter (title, description)
3. Keep the same overall structure and tone
4. Add new sections only if necessary
5. Update existing sections if the change affects them
6. Ensure the content is clear and user-friendly

Return your response in this exact JSON format:
{
  "updatedContent": "Full updated Markdoc content here (including frontmatter)",
  "changeRationale": "Brief explanation of what sections were updated and why"
}`;

  try {
    return await retryWithBackoff(async () => {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const result = JSON.parse(jsonMatch[0]) as DocUpdateResponse;
      return result;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error) {
    console.error('Error generating doc update with Claude after retries:', error);
    throw error;
  }
}

export interface ReleaseNotesRequest {
  weekStart: string;
  weekEnd: string;
  features: Array<{ title: string; summary: string; docLinks: string[] }>;
  fixes: Array<{ title: string; summary: string; docLinks: string[] }>;
  improvements: Array<{ title: string; summary: string; docLinks: string[] }>;
  docs: Array<{ title: string; summary: string; docLinks: string[] }>;
}

export interface ReleaseNotesResponse {
  emailCopy: string;
  subject: string;
}

/**
 * Generate release notes email copy using LLM
 */
export async function generateReleaseNotes(
  request: ReleaseNotesRequest
): Promise<ReleaseNotesResponse> {
  const prompt = `You are a technical marketing copywriter creating a weekly release notes email for a product's customers.

**Week:** ${request.weekStart} - ${request.weekEnd}

**Features (${request.features.length}):**
${request.features.map(f => `- ${f.title}: ${f.summary}`).join('\n') || 'None'}

**Bug Fixes (${request.fixes.length}):**
${request.fixes.map(f => `- ${f.title}: ${f.summary}`).join('\n') || 'None'}

**Improvements (${request.improvements.length}):**
${request.improvements.map(i => `- ${i.title}: ${i.summary}`).join('\n') || 'None'}

**Documentation Updates (${request.docs.length}):**
${request.docs.map(d => `- ${d.title}: ${d.summary}`).join('\n') || 'None'}

Create an engaging email for customers with:
1. Catchy subject line
2. Brief executive summary (2-3 sentences)
3. Categorized updates with user-friendly descriptions
4. Professional but friendly tone
5. Markdown format ready for HubSpot

Return your response in this exact JSON format:
{
  "subject": "Email subject line here",
  "emailCopy": "Full markdown email content here"
}`;

  try {
    return await retryWithBackoff(async () => {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const result = JSON.parse(jsonMatch[0]) as ReleaseNotesResponse;
      return result;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error) {
    console.error('Error generating release notes with Claude after retries:', error);
    throw error;
  }
}
