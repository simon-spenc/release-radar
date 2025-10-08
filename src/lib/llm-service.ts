import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    const message = await anthropic.messages.create({
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

    const result = JSON.parse(jsonMatch[0]) as PRSummaryResponse;
    return result;
  } catch (error) {
    console.error('Error summarizing PR with Claude:', error);

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
    const message = await anthropic.messages.create({
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
  } catch (error) {
    console.error('Error summarizing Linear ticket with Claude:', error);

    // Fallback summary
    return {
      summary: `Completed: ${request.ticketTitle}`,
      suggestedDocPages: [],
      category: 'other',
    };
  }
}
