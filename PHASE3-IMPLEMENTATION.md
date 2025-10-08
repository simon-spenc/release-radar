# Phase 3 Implementation: Automated Documentation Updates

## Overview

Phase 3 has been implemented, enabling automatic documentation updates for approved PR summaries and Linear tickets. When a change is approved in the dashboard, you can now click a button to automatically:

1. Create a new branch in the docs repository
2. Use Claude Sonnet 4.5 to generate documentation updates
3. Apply updates to relevant Markdoc files
4. Create a PR in the docs repository for review

## Architecture

### New Components

1. **GitHub Service Extensions** (`src/lib/github-service.ts`)
   - `getDefaultBranchSHA()` - Get the SHA of the default branch
   - `createBranch()` - Create a new branch
   - `getFileContent()` - Fetch file content from repository
   - `updateFile()` - Update or create files
   - `createPullRequest()` - Create a PR

2. **LLM Service Extensions** (`src/lib/llm-service.ts`)
   - `generateDocUpdate()` - Generate documentation updates using Claude Sonnet 4.5
   - Takes existing Markdoc content and approved summary
   - Returns updated content with rationale

3. **Documentation Update Service** (`src/lib/doc-update-service.ts`)
   - `processDocUpdateForPR()` - Process doc updates for PR summaries
   - `processDocUpdateForLinear()` - Process doc updates for Linear tickets
   - Orchestrates the entire workflow:
     - Fetches approved summary from database
     - Creates branch in docs repo
     - Generates updated content with LLM
     - Creates PR in docs repo
     - Records release entry in database

4. **API Endpoint** (`src/app/api/docs/update/route.ts`)
   - `POST /api/docs/update` - Trigger documentation update
   - Accepts: `{ type: 'pr' | 'linear', id: string }`
   - Returns: `{ docPrUrl, docPrNumber, filesUpdated, branchName }`

5. **Dashboard Updates** (`src/app/dashboard/approved/page.tsx`)
   - Added "Update Docs" button for items without doc PRs
   - Shows loading state while creating PR
   - Displays toast notifications for success/errors
   - Automatically refreshes to show new doc PR link

## How It Works

### Workflow

```
1. User approves PR/ticket in dashboard
2. Appears in "Approved Changes" page
3. User clicks "Update Docs" button
   ↓
4. POST /api/docs/update { type, id }
   ↓
5. Fetch approved summary from database
   ↓
6. Get suggested doc pages (or use defaults)
   ↓
7. Create new branch in docs repo
   ↓
8. For each doc page:
   - Fetch existing content
   - Call Claude to generate updates
   - Apply updates to branch
   ↓
9. Create PR in docs repo
   ↓
10. Create release entry in database
   ↓
11. Return doc PR URL to user
```

### Example Flow

1. **PR merged** → GitHub webhook → Summarized by Claude → Stored as "pending"
2. **Business owner approves** → Shows in "Approved Changes"
3. **Click "Update Docs"** →
   - Creates branch: `docs-update-pr-123`
   - Updates: `app/docs/api/page.md`
   - Creates PR: "docs: Update for PR #123"
   - Shows link to doc PR

## Environment Variables

Required environment variables (already in `.env.example`):

```env
# Docs repository configuration
DOCS_REPO_OWNER=simon-spenc
DOCS_REPO_NAME=release-radar-docs

# GitHub token needs write access to docs repo
GITHUB_TOKEN=ghp_...
```

## Database Schema

Uses existing `release_entries` table to track doc updates:

```sql
CREATE TABLE release_entries (
  id UUID PRIMARY KEY,
  pr_summary_id UUID REFERENCES pr_summaries(id),
  linear_ticket_id UUID REFERENCES linear_tickets(id),
  release_week DATE,
  doc_pages_updated JSONB, -- [{ path, url, change_type }]
  doc_pr_url TEXT,
  doc_pr_merged BOOLEAN DEFAULT FALSE
);
```

## LLM Prompts

### Documentation Update Prompt

The prompt instructs Claude to:
1. Integrate new information naturally
2. Maintain existing frontmatter
3. Keep structure and tone consistent
4. Add sections only if necessary
5. Update existing sections as needed

Returns:
- `updatedContent` - Full Markdoc file with updates
- `changeRationale` - Explanation of changes made

## Usage

### Manual Trigger from Dashboard

1. Navigate to `/dashboard/approved`
2. Find an approved item without a doc PR
3. Click "Update Docs" button
4. Wait for confirmation toast
5. Click "Doc PR" link to review changes
6. Merge the doc PR when ready

### API Usage

```bash
curl -X POST http://localhost:3000/api/docs/update \
  -H "Content-Type: application/json" \
  -d '{"type": "pr", "id": "uuid-here"}'
```

Response:
```json
{
  "success": true,
  "docPrUrl": "https://github.com/simon-spenc/release-radar-docs/pull/123",
  "docPrNumber": 123,
  "filesUpdated": ["app/docs/api/page.md"],
  "branchName": "docs-update-pr-456"
}
```

## Error Handling

- **LLM failures**: Retries with exponential backoff (3 attempts)
- **GitHub API errors**: Propagates to user with error message
- **Missing files**: Continues with other files, reports which succeeded
- **No files updated**: Returns error if all files fail

## Future Enhancements

1. **Doc PR merge webhook** - Automatically mark `doc_pr_merged: true`
2. **Suggested pages intelligence** - Better LLM suggestions for which pages to update
3. **Diff preview** - Show doc changes before creating PR
4. **Batch updates** - Update docs for multiple items at once
5. **Auto-merge** - Optionally auto-merge doc PRs with low confidence threshold
6. **Multi-file support** - Create multiple commits for complex updates

## Testing

To test the full workflow:

1. Merge a test PR in your project
2. Webhook creates pending summary
3. Approve in dashboard
4. Click "Update Docs"
5. Verify PR created in `release-radar-docs`
6. Review and merge doc PR

## Notes

- Doc pages default to `app/docs/api/page.md` if no suggestions
- Branch names: `docs-update-pr-{number}` or `docs-update-{type}-{timestamp}`
- Release week calculated as Monday of current week
- All operations use retry logic for resilience
- Claude Sonnet 4.5 used for doc generation (latest model)

## Deployment

Before deploying:

1. Ensure `DOCS_REPO_OWNER` and `DOCS_REPO_NAME` are set in Vercel
2. Verify `GITHUB_TOKEN` has write access to docs repo
3. Test in staging environment first
4. Monitor LLM token usage for cost optimization

## Status

✅ **Phase 3 Complete** - Automated documentation updates implemented and ready to test!

Next: Phase 4 - Weekly release notes email generation
